import { Request, Response } from 'express';
import { sql } from 'drizzle-orm';
import { db } from '../../db';
import { pagedRange, idParam } from '../../validators/common';

// Overview tiles: success rate, p95 latency, dead letters
export async function overview(req: Request, res: Response) {
  const { from, to } = pagedRange.pick({from:true, to:true}).parse(req.query);

  const byWebhook = await db.execute(sql`
    with attempts as (
      select a.*, e.webhook_id
      from webhook_attempts a join webhook_events e on e.id=a.event_id
      where 1=1
      ${from ? sql`and a.created_at >= ${new Date(from)}` : sql``}
      ${to   ? sql`and a.created_at <= ${new Date(to)}`   : sql``}
    )
    select
      w.id, w.name, w.url, w.enabled,
      coalesce(avg(case when a.status='success' then 1 else 0 end),0)::float as success_rate,
      percentile_disc(0.95) within group (order by a.latency_ms) as p95_latency,
      sum(case when a.status='failed' then 1 else 0 end)::int as failures,
      sum(case when a.status='failed' and a.attempt_no>=3 then 1 else 0 end)::int as dead_letters
    from integration_webhook w
    left join attempts a on a.webhook_id = w.id
    group by w.id
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

  // TODO: sign payload using decrypted secret and POST to w.url (stub success)
  const ok = true; const httpStatus = 200; const latency = 123;

  await db.execute(sql`
    insert into webhook_attempts (event_id, attempt_no, status, http_status, latency_ms, error)
    values (${eventId},
      (select coalesce(max(attempt_no),0)+1 from webhook_attempts where event_id=${eventId}),
      ${ok ? 'success' : 'failed'}, ${httpStatus}, ${latency}, ${ok ? null : 'retry failed'})
  `);
  res.json({ ok, httpStatus, latencyMs: latency });
}