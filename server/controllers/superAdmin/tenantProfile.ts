import { Request, Response } from 'express';
import { sql } from 'drizzle-orm';
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

    const plan = await (req as any).db.execute(sql`
      select p.code, p.name, p.price_cents, p.limits
      from tenant_plan_assignments tpa join plan_catalog p on p.code = tpa.plan_code
      where tpa.tenant_id = ${id} and (tpa.until is null or tpa.until > now())
      order by tpa.since desc limit 1
    `).then((r: any) => r.rows[0] || null);

    const usage = await (req as any).db.execute(sql`
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

    const lastPaid = await (req as any).db.execute(sql`
      select max(paid_at) as last_paid from tenant_invoices where tenant_id=${id} and status='paid'
    `).then((r: any) => r.rows[0]?.last_paid);

    const failedDunning = await (req as any).db.execute(sql`
      select count(*) as c from dunning_events d join tenant_invoices i on i.id = d.invoice_id
      where i.tenant_id=${id} and d.status in ('failed','retrying','retry_scheduled')
    `).then((r: any) => Number(r.rows[0]?.c||0));

    const noPayDays = lastPaid ? Math.floor((Date.now()-new Date(lastPaid).getTime())/86400000) : 999;
    const usagePct = plan?.limits ? Math.min(1,
      ((usage.players / (plan.limits.players||1)) +
       (usage.sessions / (plan.limits.sessions||1)) ) / 2
    ) : 0.3;

    const score = healthScore({usagePct, failedDunning, noPaymentDays: noPayDays});

    // recent invoices
    const invoices = await (req as any).db.execute(sql`
      select id, total_cents, status, due_at, paid_at
      from tenant_invoices where tenant_id=${id}
      order by created_at desc limit 12
    `).then((r: any) => r.rows.map((x:any)=>({ ...x, total: fromCents(Number(x.total_cents||0)) })));

    res.json({
      plan, usage, lastPaidAt:lastPaid, healthScore:score, healthDrivers:{usagePct, failedDunning, noPayDays},
      invoices,
    });
  } catch (error) {
    console.error("Error fetching tenant profile:", error);
    res.status(500).json({ message: "Failed to fetch tenant profile" });
  }
}