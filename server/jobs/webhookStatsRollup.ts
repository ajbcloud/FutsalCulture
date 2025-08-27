import { sql } from 'drizzle-orm';
import { db } from '../db';
import cron from 'node-cron';

async function rollupWebhookStats() {
  // Starting hourly webhook stats rollup
  
  try {
    // Calculate stats for the previous hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const hourTrunc = new Date(oneHourAgo);
    hourTrunc.setMinutes(0, 0, 0); // Round down to the hour
    
    await db.execute(sql`
      with stats as (
        select 
          e.webhook_id,
          count(a.id) as attempts,
          sum(case when a.status = 'success' then 1 else 0 end) as success,
          sum(case when a.status = 'failed' then 1 else 0 end) as failed,
          percentile_disc(0.95) within group (order by a.latency_ms) as p95_latency_ms
        from webhook_events e
        left join webhook_attempts a on a.event_id = e.id
        where e.created_at >= ${hourTrunc} 
          and e.created_at < ${new Date(hourTrunc.getTime() + 60 * 60 * 1000)}
        group by e.webhook_id
      )
      insert into webhook_stats_hourly (webhook_id, hour, attempts, success, failed, p95_latency_ms)
      select 
        webhook_id,
        ${hourTrunc},
        attempts::int,
        success::int,
        failed::int,
        p95_latency_ms::int
      from stats
      on conflict (webhook_id, hour) do update set
        attempts = excluded.attempts,
        success = excluded.success,
        failed = excluded.failed,
        p95_latency_ms = excluded.p95_latency_ms,
        created_at = now()
    `);
    
    // Webhook stats rollup completed
  } catch (error) {
    console.error('❌ Webhook stats rollup failed:', error);
  }
}

// Run every hour at minute 5 (e.g., 1:05, 2:05, etc.)
cron.schedule('5 * * * *', rollupWebhookStats);

// Webhook stats rollup scheduler initialized

export { rollupWebhookStats };