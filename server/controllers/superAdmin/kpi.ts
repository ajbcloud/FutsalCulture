import { Request, Response } from 'express';
import { sql } from 'drizzle-orm';
import { rangeSchema } from '../../validators/kpi';
import { fromCents } from '../../lib/currency';

// Helper for date predicates
const dtWhere = (col: any, from?: string, to?: string) => sql`
  ${from ? sql`${col} >= ${new Date(from)}` : sql``}
  ${to   ? sql`${from? sql` and `: sql``}${col} <= ${new Date(to)}` : sql``}
`;

export async function companyOverview(req: Request, res: Response) {
  const { from, to } = rangeSchema.pick({from:true, to:true}).parse(req.query);

  try {
    // MRR (sum of current month recurring invoice lines)
    const mrr = await (req as any).db.execute(sql`
      select coalesce(sum(il.amount_cents),0) as cents
      from tenant_invoice_lines il
      join tenant_invoices i on i.id = il.invoice_id
      where i.status in ('open','paid') and il.type = 'recurring'
        ${dtWhere(sql`i.period_start`, from, to)}
    `).then((r: any) => Number(r.rows[0]?.cents || 0));

    // ARR = MRR * 12
    const arr = mrr * 12;

    // Gross retention (GRR) & Net retention (NRR) month-over-month
    const nrrGrr = await (req as any).db.execute(sql`
      with last as (
        select tenant_id, coalesce(sum(total_cents),0) as rev
        from tenant_invoices where status='paid'
          and date_trunc('month', paid_at) = date_trunc('month', now()) - interval '1 month'
        group by tenant_id
      ), curr as (
        select tenant_id, coalesce(sum(total_cents),0) as rev
        from tenant_invoices where status='paid'
          and date_trunc('month', paid_at) = date_trunc('month', now())
        group by tenant_id
      )
      select
        coalesce((select sum(c.rev)::float from curr c join last l using(tenant_id)),0) as curr_from_last,
        coalesce((select sum(l.rev)::float from last l),0) as last_total,
        coalesce((select sum(c.rev)::float from curr c),0) as curr_total
    `).then((r: any) => r.rows[0] || { curr_from_last:0, last_total:0, curr_total:0 });

    const grr = nrrGrr.last_total ? (nrrGrr.curr_from_last / nrrGrr.last_total) : 0;
    const nrr = nrrGrr.last_total ? (nrrGrr.curr_total     / nrrGrr.last_total) : 0;

    // A/R aging buckets on open/uncollectible invoices
    const aging = await (req as any).db.execute(sql`
      select
        sum(case when now()-due_at <= interval '30 days' then total_cents else 0 end) as b0_30,
        sum(case when now()-due_at >  interval '30 days' and now()-due_at <= interval '60 days' then total_cents else 0 end) as b31_60,
        sum(case when now()-due_at >  interval '60 days' and now()-due_at <= interval '90 days' then total_cents else 0 end) as b61_90,
        sum(case when now()-due_at >  interval '90 days' then total_cents else 0 end) as b90p
      from tenant_invoices
      where status in ('open','uncollectible')
    `).then((r: any) => r.rows[0] ?? {});

    // Churn risk candidates: tenants with no paid invoice in 30d or with 2+ failed dunning events
    const churnRisk = await (req as any).db.execute(sql`
      with last_paid as (
        select tenant_id, max(paid_at) as last_paid_at
        from tenant_invoices where status='paid'
        group by tenant_id
      ), failed as (
        select i.tenant_id, count(*) as failures
        from dunning_events d join tenant_invoices i on i.id = d.invoice_id
        where d.status in ('failed','retrying','retry_scheduled')
        group by i.tenant_id
      )
      select t.id, t.name, coalesce(lp.last_paid_at,'1970-01-01') as last_paid_at, coalesce(f.failures,0) as failures
      from tenants t
      left join last_paid lp on lp.tenant_id = t.id
      left join failed f on f.tenant_id = t.id
      where (lp.last_paid_at is null or lp.last_paid_at < now() - interval '30 days')
         or coalesce(f.failures,0) >= 2
      order by lp.last_paid_at nulls first, f.failures desc
      limit 20
    `).then((r: any) => r.rows);

    res.json({
      mrr: fromCents(mrr),
      arr: fromCents(arr),
      nrr: Number(nrr.toFixed(3)),
      grr: Number(grr.toFixed(3)),
      arAging: {
        b0_30: fromCents(Number(aging.b0_30||0)),
        b31_60: fromCents(Number(aging.b31_60||0)),
        b61_90: fromCents(Number(aging.b61_90||0)),
        b90p: fromCents(Number(aging.b90p||0)),
      },
      churnRisk: churnRisk.map((r:any)=>({ tenantId:r.id, tenantName:r.name, lastPaidAt:r.last_paid_at, failures:r.failures })),
    });
  } catch (error) {
    console.error("Error fetching company overview:", error);
    res.status(500).json({ message: "Failed to fetch company overview" });
  }
}

// Series for charts (month granularity)
export async function kpiSeries(req: Request, res: Response) {
  try {
    const { from, to } = rangeSchema.pick({from:true, to:true}).parse(req.query);
    const series = await (req as any).db.execute(sql`
      with inv as (
        select date_trunc('month', paid_at) as m, sum(total_cents) as paid_cents
        from tenant_invoices
        where status='paid' ${dtWhere(sql`paid_at`, from, to)}
        group by 1
      )
      select m, paid_cents from inv order by m asc
    `).then((r: any) => r.rows.map((x:any)=>({ date:x.m, revenue: fromCents(Number(x.paid_cents||0)) })));
    res.json({ series });
  } catch (error) {
    console.error("Error fetching KPI series:", error);
    res.status(500).json({ message: "Failed to fetch KPI series" });
  }
}