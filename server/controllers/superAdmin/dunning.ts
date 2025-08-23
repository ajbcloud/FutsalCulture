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
    const dunningEvent = await db.execute(sql`
      select d.*, i.total_cents, i.tenant_id, t.name as tenant_name
      from dunning_events d
      join tenant_invoices i on i.id = d.invoice_id
      join tenants t on t.id = i.tenant_id
      where d.id = ${id}
    `).then((r: any) => r.rows[0]);

    if (!dunningEvent) {
      return res.status(404).json({ message: "Dunning event not found" });
    }

    // Create a new retry attempt
    await db.execute(sql`
      insert into dunning_events (invoice_id, attempt_no, status, reason, created_at)
      values (${dunningEvent.invoice_id}, ${dunningEvent.attempt_no + 1}, 'retrying', 'Manual retry', now())
    `);

    // Update the invoice status to retry_scheduled for now
    await db.execute(sql`
      update dunning_events 
      set status = 'retry_scheduled'
      where id = ${id}
    `);

    res.json({ success: true, message: "Retry scheduled successfully" });
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