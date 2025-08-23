import { Request, Response } from 'express';
import { sql } from 'drizzle-orm';
import { db } from '../../db';
import { pagedRange, idParam } from '../../validators/common';

// Overview tiles: success rate, p95 latency, dead letters
export async function overview(req: Request, res: Response) {
  const { from, to } = pagedRange.pick({from:true, to:true}).parse(req.query);

  // Use materialized stats for better performance
  const byWebhook = await db.execute(sql`
    with stats as (
      select 
        webhook_id,
        sum(attempts) as total_attempts,
        sum(success) as total_success,
        sum(failed) as total_failed,
        avg(p95_latency_ms) as avg_p95_latency
      from webhook_stats_hourly
      where 1=1
      ${from ? sql`and hour >= ${new Date(from)}` : sql`and hour >= now() - interval '7 days'`}
      ${to   ? sql`and hour <= ${new Date(to)}`   : sql``}
      group by webhook_id
    )
    select
      w.id, w.name, w.url, w.enabled,
      coalesce(case when s.total_attempts > 0 then s.total_success::float / s.total_attempts else 0 end, 0) as success_rate,
      coalesce(s.avg_p95_latency, 0)::int as p95_latency,
      coalesce(s.total_failed, 0) as failures,
      -- Dead letters approximation: failed attempts where we likely gave up
      coalesce(s.total_failed / 3, 0)::int as dead_letters
    from integration_webhook w
    left join stats s on s.webhook_id = w.id
    order by w.name
  `).then(r => (r as any).rows);

  res.json({ webhooks: byWebhook });
}

// Events list for a webhook
export async function events(req: Request, res: Response) {
  const { page, pageSize, from, to } = pagedRange.parse(req.query);
  const { id } = idParam.parse(req.params);
  const offset = (page-1)*pageSize;

  const rows = await db.execute(sql`
    select e.id, e.event_type, e.created_at,
           (select count(*) from webhook_attempts a where a.event_id=e.id and a.status='success') as success_count,
           (select count(*) from webhook_attempts a where a.event_id=e.id and a.status='failed') as fail_count
    from webhook_events e
    where e.webhook_id=${id}
      ${from ? sql`and e.created_at >= ${new Date(from)}` : sql``}
      ${to   ? sql`and e.created_at <= ${new Date(to)}`   : sql``}
    order by e.created_at desc
    limit ${pageSize} offset ${offset}
  `).then(r => (r as any).rows);

  const total = await db.execute(sql`
    select count(*)::int as c from webhook_events where webhook_id=${id}
  `).then(r => Number((r as any).rows[0].c));

  res.json({ rows, page, pageSize, totalRows: total });
}

// Attempts for an event + Replay
export async function attempts(req: Request, res: Response) {
  const { page, pageSize } = pagedRange.parse(req.query);
  const eventId = req.params.id;
  const offset = (page-1)*pageSize;
  const rows = await db.execute(sql`
    select id, attempt_no, status, http_status, latency_ms, error, created_at
    from webhook_attempts where event_id=${eventId}
    order by attempt_no asc limit ${pageSize} offset ${offset}
  `).then(r => (r as any).rows);
  const total = await db.execute(sql`
    select count(*)::int as c from webhook_attempts where event_id=${eventId}
  `).then(r => Number((r as any).rows[0].c));
  res.json({ rows, page, pageSize, totalRows: total });
}

// Replay latest failed attempt for an event
export async function replay(req: Request, res: Response) {
  const eventId = req.params.id;
  const event = await db.execute(sql`
    select e.*, w.url, w.signing_secret_enc from webhook_events e
    join integration_webhook w on w.id = e.webhook_id
    where e.id=${eventId}
  `).then(r => (r as any).rows[0]);
  if (!event) return res.status(404).json({ error:'not_found' });

  let ok = false;
  let httpStatus = 500;
  let latency = 0;
  let error = null;

  try {
    const startTime = Date.now();
    
    // Prepare payload 
    const payload = JSON.stringify(event.payload_json || {});
    
    // Sign payload if we have a signing secret
    let signature = '';
    if (event.signing_secret_enc) {
      const { decrypt } = await import('../../lib/kms');
      try {
        const secret = decrypt(event.signing_secret_enc);
        const crypto = await import('crypto');
        signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
      } catch (decryptError) {
        console.warn('Failed to decrypt webhook signing secret:', decryptError);
      }
    }
    
    // Make HTTP POST request
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'FutsalHQ-Webhooks/1.0'
    };
    
    if (signature) {
      headers['X-Signature-SHA256'] = `sha256=${signature}`;
    }
    
    const response = await fetch(event.url, {
      method: 'POST',
      headers,
      body: payload,
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    httpStatus = response.status;
    latency = Date.now() - startTime;
    ok = response.ok;
    
    if (!ok) {
      error = `HTTP ${httpStatus}: ${response.statusText}`;
      const body = await response.text().catch(() => '');
      if (body) error += ` - ${body.substring(0, 200)}`;
    }
    
  } catch (e: any) {
    latency = Date.now() - Date.now();
    error = e.message || 'Request failed';
    if (e.name === 'AbortError') {
      error = 'Request timeout';
      httpStatus = 408;
    }
  }

  // Record the attempt
  await db.execute(sql`
    insert into webhook_attempts (event_id, attempt_no, status, http_status, latency_ms, error)
    values (${eventId},
      (select coalesce(max(attempt_no),0)+1 from webhook_attempts where event_id=${eventId}),
      ${ok ? 'success' : 'failed'}, ${httpStatus}, ${latency}, ${error})
  `);
  
  res.json({ ok, httpStatus, latencyMs: latency, error });
}