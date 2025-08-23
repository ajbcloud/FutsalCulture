import { Request, Response } from 'express';
import { sql } from 'drizzle-orm';
import { db } from '../../db';
import { rangeSchema } from '../../validators/kpi';
import { fromCents } from '../../lib/currency';

// naive health score (0-100)
function healthScore(input: {usagePct:number; failedDunning:number; noPaymentDays:number}) {
  let score = 100;
  score -= Math.max(0, 40 - Math.round(input.usagePct*40));             // low usage penalty
  score -= Math.min(30, input.failedDunning*10);                         // each failure -10 up to -30
  score -= Math.min(30, Math.floor(input.noPaymentDays/15)*10);          // -10 per 15 days without payment
  return Math.max(0, Math.min(100, score));
}

export async function profile(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const { from, to } = rangeSchema.pick({from:true, to:true}).parse(req.query);

    const plan = await db.execute(sql`
      select p.code, p.name, p.price_cents, p.limits
      from tenant_plan_assignments tpa join plan_catalog p on p.code = tpa.plan_code
      where tpa.tenant_id = ${id} and (tpa.until is null or tpa.until > now())
      order by tpa.since desc limit 1
    `).then((r: any) => r.rows[0] || null);

    const usage = await db.execute(sql`
      select
        coalesce(sum((counters->>'players')::int),0) as players,
        coalesce(sum((counters->>'sessions')::int),0) as sessions,
        coalesce(sum((counters->>'emails')::int),0) as emails,
        coalesce(sum((counters->>'sms')::int),0) as sms,
        coalesce(sum((counters->>'api_calls')::int),0) as api_calls
      from tenant_usage_daily
      where tenant_id=${id}
        ${from ? sql` and date >= ${new Date(from)}` : sql``}
        ${to   ? sql` and date <= ${new Date(to)}`   : sql``}
    `).then((r: any) => r.rows[0] || {});

    // FEATURE ADOPTION: % of defined key features touched in last 30d
    const FEATURE_KEYS = ['sessions.create','players.invite','payments.collect','reports.download','api.usage'];
    const featureAdoption = await db.execute(sql`
      with recent as (
        select distinct feature_key from feature_adoption_events
        where tenant_id = ${id} and occurred_at >= now() - interval '30 days'
      )
      select count(*)::int as used from recent
    `).then(r => Number((r as any).rows[0]?.used || 0));
    const featurePct = FEATURE_KEYS.length ? featureAdoption / FEATURE_KEYS.length : 0;

    // SUPPORT SLA: average first-response (hrs) and resolution (hrs) last 60d
    const sla = await db.execute(sql`
      select
        avg(extract(epoch from (first_response_at - created_at))/3600.0) as first_resp_hrs,
        avg(extract(epoch from (resolved_at - created_at))/3600.0) as resolution_hrs
      from help_requests
      where tenant_id=${id} and created_at >= now() - interval '60 days'
    `).then(r => (r as any).rows[0] || {});
    const firstResp = Number(sla.first_resp_hrs || 999);
    const resolveHrs = Number(sla.resolution_hrs || 999);

    const lastPaid = await db.execute(sql`
      select max(paid_at) as last_paid from tenant_invoices where tenant_id=${id} and status='paid'
    `).then((r: any) => r.rows[0]?.last_paid);

    const failedDunning = await db.execute(sql`
      select count(*) as c from dunning_events d join tenant_invoices i on i.id = d.invoice_id
      where i.tenant_id=${id} and d.status in ('failed','retrying','retry_scheduled')
    `).then((r: any) => Number(r.rows[0]?.c||0));

    const noPayDays = lastPaid ? Math.floor((Date.now()-new Date(lastPaid).getTime())/86400000) : 999;
    const usagePct = plan?.limits ? Math.min(1,
      ((usage.players / (plan.limits.players||1)) +
       (usage.sessions / (plan.limits.sessions||1)) ) / 2
    ) : 0.3;

    const baseScore = healthScore({usagePct, failedDunning, noPaymentDays: noPayDays});

    // Enhanced Health Score v2 with feature adoption + SLA signals
    const featureScore = Math.round(featurePct * 25); // 0..25
    const slaScore = Math.max(0, 25 - Math.round(Math.min(24, (firstResp/2) + (resolveHrs/8)))); // faster = better (0..25)
    const v2Score = Math.max(0, Math.min(100, baseScore + featureScore + slaScore));

    // recent invoices
    const invoices = await db.execute(sql`
      select id, total_cents, status, due_at, paid_at
      from tenant_invoices where tenant_id=${id}
      order by created_at desc limit 12
    `).then((r: any) => r.rows.map((x:any)=>({ ...x, total: fromCents(Number(x.total_cents||0)) })));

    res.json({
      plan, usage, lastPaidAt:lastPaid, 
      healthScore:baseScore, // keep for backwards compatibility 
      healthScoreV2: v2Score,
      drivers: { usagePct, failedDunning, noPayDays, featurePct, firstRespHrs:firstResp, resolveHrs },
      invoices,
    });
  } catch (error) {
    console.error("Error fetching tenant profile:", error);
    res.status(500).json({ message: "Failed to fetch tenant profile" });
  }
}