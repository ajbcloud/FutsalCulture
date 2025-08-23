import { sql } from 'drizzle-orm';
import { db } from '../db';

export async function rollupUsageForDay(d: Date) {
  console.log(`🔄 Rolling up usage data for ${d.toISOString().split('T')[0]}`);
  
  const day = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  
  try {
    // Rollups: players created, sessions created, emails sent, sms sent, API calls (if logged)
    await db.execute(sql`
      with tenants as (select id from tenants),
      players as (
        select tenant_id, count(*) as c from players 
        where date_trunc('day', created_at) = ${day} 
        group by tenant_id
      ),
      sessions as (
        select tenant_id, count(*) as c from futsal_sessions 
        where date_trunc('day', created_at) = ${day} 
        group by tenant_id
      ),
      emails as (
        select tenant_id, count(*) as c from email_events
        where event='delivered' and date_trunc('day', created_at) = ${day} 
        group by tenant_id
      ),
      sms as (
        select tenant_id, count(*) as c from sms_events
        where event='delivered' and date_trunc('day', created_at) = ${day} 
        group by tenant_id
      )
      insert into tenant_usage_daily (tenant_id, date, counters)
      select t.id, ${day}::date,
        jsonb_build_object(
          'players', coalesce((select c from players where players.tenant_id=t.id),0),
          'sessions', coalesce((select c from sessions where sessions.tenant_id=t.id),0),
          'emails', coalesce((select c from emails where emails.tenant_id=t.id),0),
          'sms', coalesce((select c from sms where sms.tenant_id=t.id),0),
          'api_calls', 0
        )
      from tenants t
      on conflict (tenant_id, date) do update set
        counters = excluded.counters,
        created_at = now()
    `);
    
    console.log(`✅ Usage rollup completed for ${day.toISOString().split('T')[0]}`);
  } catch (error) {
    console.error(`❌ Usage rollup failed for ${day.toISOString().split('T')[0]}:`, error);
    throw error;
  }
}