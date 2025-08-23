import { Request, Response } from 'express';
import { sql } from 'drizzle-orm';
import { db } from '../../db';
import { pagedRange, idParam } from '../../validators/common';

export async function overview(req: Request, res: Response) {
  // MFA adoption and login method mix
  const superAdmins = await db.execute(sql`
    select
      sum(case when role='super_admin' then 1 else 0 end)::int as total,
      sum(case when role='super_admin' and mfa_enabled then 1 else 0 end)::int as with_mfa
    from users
  `).then(r => (r as any).rows[0]);

  const tenantAdmins = await db.execute(sql`
    select
      sum(case when role='tenant_admin' then 1 else 0 end)::int as total,
      sum(case when role='tenant_admin' and mfa_enabled then 1 else 0 end)::int as with_mfa
    from users
  `).then(r => (r as any).rows[0]);

  res.json({
    superAdmins: { total: Number(superAdmins.total||0), withMfa: Number(superAdmins.with_mfa||0) },
    tenantAdmins: { total: Number(tenantAdmins.total||0), withMfa: Number(tenantAdmins.with_mfa||0) },
  });
}

export async function impersonations(req: Request, res: Response) {
  const { page, pageSize, from, to } = pagedRange.parse(req.query);
  const offset = (page-1)*pageSize;

  const rows = await db.execute(sql`
    select e.id, e.super_admin_id, sa.email as super_admin_email,
           e.tenant_id, t.name as tenant_name, e.reason, e.started_at, e.expires_at, e.revoked_at, e.ip
    from impersonation_events e
    left join users sa on sa.id = e.super_admin_id
    left join tenants t on t.id = e.tenant_id
    where 1=1
      ${from ? sql`and e.started_at >= ${new Date(from)}` : sql``}
      ${to   ? sql`and e.started_at <= ${new Date(to)}`   : sql``}
    order by e.started_at desc
    limit ${pageSize} offset ${offset}
  `).then(r => (r as any).rows);

  const total = await db.execute(sql`select count(*)::int as c from impersonation_events`).then(r => Number((r as any).rows[0].c));
  res.json({ rows, page, pageSize, totalRows: total });
}

export async function revokeImpersonation(req: Request, res: Response) {
  const { id } = idParam.parse(req.params);
  await db.execute(sql`
    update impersonation_events set revoked_at = now() where id=${id} and revoked_at is null
  `);
  res.json({ ok:true });
}

export async function auditLogs(req: Request, res: Response) {
  const { page, pageSize, from, to } = pagedRange.parse(req.query);
  const offset = (page-1)*pageSize;
  const rows = await db.execute(sql`
    select id, actor_id, actor_role, section, action, target_id, diff, ip, created_at
    from audit_logs
    where 1=1
      ${from ? sql`and created_at >= ${new Date(from)}` : sql``}
      ${to   ? sql`and created_at <= ${new Date(to)}`   : sql``}
    order by created_at desc
    limit ${pageSize} offset ${offset}
  `).then(r => (r as any).rows);
  const total = await db.execute(sql`select count(*)::int as c from audit_logs`).then(r => Number((r as any).rows[0].c));
  res.json({ rows, page, pageSize, totalRows: total });
}