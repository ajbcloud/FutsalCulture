import { Request, Response } from 'express';
import { sql } from 'drizzle-orm';
import { db } from '../../db';
import { rangeSchema } from '../../validators/kpi';
import { fromCents } from '../../lib/currency';

export async function list(req: Request, res: Response) {
  try {
    const { page, pageSize, from, to } = rangeSchema.parse(req.query);
    const offset = (page-1)*pageSize;
    const rows = await db.execute(sql`
      select d.id, d.status, d.attempt_no, d.reason, d.created_at,
             i.id as invoice_id, i.tenant_id, t.name as tenant_name, i.total_cents, i.status as invoice_status
      from dunning_events d
      join tenant_invoices i on i.id = d.invoice_id
      join tenants t on t.id = i.tenant_id
      where 1=1
        ${from ? sql` and d.created_at >= ${new Date(from)}` : sql``}
        ${to   ? sql` and d.created_at <= ${new Date(to)}`   : sql``}
      order by d.created_at desc
      limit ${pageSize} offset ${offset}
    `).then((r: any) => r.rows);

    const total = await db.execute(sql`
      select count(*) as c from dunning_events d
      join tenant_invoices i on i.id = d.invoice_id
      where 1=1
        ${from ? sql` and d.created_at >= ${new Date(from)}` : sql``}
        ${to   ? sql` and d.created_at <= ${new Date(to)}`   : sql``}
    `).then((r: any) => Number(r.rows[0]?.c || 0));

    res.json({
      rows: rows.map((r: any) => ({
        ...r,
        total_amount: fromCents(Number(r.total_cents || 0))
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    console.error("Error fetching dunning events:", error);
    res.status(500).json({ message: "Failed to fetch dunning events" });
  }
}

export async function retry(req: Request, res: Response) {
  try {
    const id = req.params.id;
    
    // Get the dunning event and associated invoice  
    const row = await db.execute(sql`
      select i.id, i.tenant_id, i.total_cents from dunning_events d
      join tenant_invoices i on i.id=d.invoice_id where d.id=${id} limit 1
    `).then(r => (r as any).rows[0]);
    
    if (!row) return res.status(404).json({ error:'not_found' });
    
    try {
      // Use Braintree for payment processing
      const bt = await import('../../gateways/braintree');
      
      const r = await bt.chargeInvoice(row.id, row.tenant_id, Number(row.total_cents||0));
      
      await db.execute(sql`
        insert into dunning_events (invoice_id, attempt_no, status, reason)
        values (${row.id}, (select coalesce(max(attempt_no),0)+1 from dunning_events where invoice_id=${row.id}),
          ${r.ok ? 'recovered' : 'failed'}, ${r.status})
      `);
      
      return res.json({ ok:r.ok, gatewayStatus:r.status, transactionId:r.id });
    } catch (e:any) {
      await db.execute(sql`
        insert into dunning_events (invoice_id, attempt_no, status, reason)
        values (${row.id}, (select coalesce(max(attempt_no),0)+1 from dunning_events where invoice_id=${row.id}),
          'failed', ${e.message})
      `);
      return res.status(400).json({ ok:false, error:e.message });
    }
  } catch (error) {
    console.error("Error retrying payment:", error);
    res.status(500).json({ message: "Failed to retry payment" });
  }
}

export async function dashboard(req: Request, res: Response) {
  try {
    const stats = await db.execute(sql`
      select
        sum(case when status = 'failed' then 1 else 0 end) as failed,
        sum(case when status = 'retry_scheduled' then 1 else 0 end) as retry_scheduled,
        sum(case when status = 'retrying' then 1 else 0 end) as retrying,
        sum(case when status = 'recovered' then 1 else 0 end) as recovered,
        sum(case when status = 'uncollectible' then 1 else 0 end) as uncollectible
      from dunning_events
      where created_at >= now() - interval '30 days'
    `).then((r: any) => r.rows[0] || {});

    res.json({
      failed: Number(stats.failed || 0),
      retryScheduled: Number(stats.retry_scheduled || 0), 
      retrying: Number(stats.retrying || 0),
      recovered: Number(stats.recovered || 0),
      uncollectible: Number(stats.uncollectible || 0)
    });
  } catch (error) {
    console.error("Error fetching dunning dashboard:", error);
    res.status(500).json({ message: "Failed to fetch dunning dashboard" });
  }
}