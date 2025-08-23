import { Request, Response } from 'express';
import { sql } from 'drizzle-orm';
import { db } from '../../db';
import { pagedRange } from '../../validators/common';

export async function overview(req: Request, res: Response) {
  const { from, to } = pagedRange.pick({from:true, to:true}).parse(req.query);

  const email = await db.execute(sql`
    with e as (
      select * from email_events
      where 1=1
      ${from ? sql`and created_at >= ${new Date(from)}` : sql``}
      ${to   ? sql`and created_at <= ${new Date(to)}`   : sql``}
    )
    select
      sum(case when event='delivered' then 1 else 0 end)::int as delivered,
      sum(case when event in ('bounce','dropped','spamreport') then 1 else 0 end)::int as failed,
      sum(case when event='open' then 1 else 0 end)::int as opens,
      sum(case when event='click' then 1 else 0 end)::int as clicks
    from e
  `).then(r => (r as any).rows[0] || {});

  const sms = await db.execute(sql`
    with s as (
      select * from sms_events
      where 1=1
      ${from ? sql`and created_at >= ${new Date(from)}` : sql``}
      ${to   ? sql`and created_at <= ${new Date(to)}`   : sql``}
    )
    select
      sum(case when event='delivered' then 1 else 0 end)::int as delivered,
      sum(case when event in ('undelivered','failed') then 1 else 0 end)::int as failed
    from s
  `).then(r => (r as any).rows[0] || {});

  // Top templates by volume & bounce
  const templates = await db.execute(sql`
    select template_key, 
      sum(case when event='delivered' then 1 else 0 end)::int as delivered,
      sum(case when event in ('bounce','dropped','spamreport') then 1 else 0 end)::int as failed,
      sum(case when event='open' then 1 else 0 end)::int as opens,
      sum(case when event='click' then 1 else 0 end)::int as clicks
    from email_events
    where template_key is not null
      ${from ? sql`and created_at >= ${new Date(from)}` : sql``}
      ${to   ? sql`and created_at <= ${new Date(to)}`   : sql``}
    group by template_key
    order by delivered desc nulls last
    limit 50
  `).then(r => (r as any).rows);

  res.json({
    email: {
      delivered: Number(email.delivered||0),
      failed: Number(email.failed||0),
      opens: Number(email.opens||0),
      clicks: Number(email.clicks||0),
    },
    sms: {
      delivered: Number(sms.delivered||0),
      failed: Number(sms.failed||0),
    },
    templates
  });
}

export async function series(req: Request, res: Response) {
  const { from, to } = pagedRange.pick({from:true, to:true}).parse(req.query);
  const emailSeries = await db.execute(sql`
    select date_trunc('day', created_at) d,
      sum(case when event='delivered' then 1 else 0 end)::int as delivered,
      sum(case when event in ('bounce','dropped','spamreport') then 1 else 0 end)::int as failed
    from email_events
    where 1=1
      ${from ? sql`and created_at >= ${new Date(from)}` : sql``}
      ${to   ? sql`and created_at <= ${new Date(to)}`   : sql``}
    group by 1 order by 1
  `).then(r => (r as any).rows);
  const smsSeries = await db.execute(sql`
    select date_trunc('day', created_at) d,
      sum(case when event='delivered' then 1 else 0 end)::int as delivered,
      sum(case when event in ('undelivered','failed') then 1 else 0 end)::int as failed
    from sms_events
    where 1=1
      ${from ? sql`and created_at >= ${new Date(from)}` : sql``}
      ${to   ? sql`and created_at <= ${new Date(to)}`   : sql``}
    group by 1 order by 1
  `).then(r => (r as any).rows);
  res.json({ email: emailSeries, sms: smsSeries });
}

export async function events(req: Request, res: Response) {
  const { page, pageSize, from, to } = pagedRange.parse(req.query);
  const offset = (page-1)*pageSize;
  const channel = (req.query.channel || 'email') as 'email'|'sms';
  const table = channel === 'email' ? 'email_events' : 'sms_events';

  const rows = await db.execute(sql`
    select * from ${sql.raw(table)}
    where 1=1
      ${from ? sql`and created_at >= ${new Date(from)}` : sql``}
      ${to   ? sql`and created_at <= ${new Date(to)}`   : sql``}
    order by created_at desc
    limit ${pageSize} offset ${offset}
  `).then(r => (r as any).rows);

  const total = await db.execute(sql`
    select count(*)::int as c from ${sql.raw(table)}
  `).then(r => Number((r as any).rows[0].c));

  res.json({ rows, page, pageSize, totalRows: total });
}