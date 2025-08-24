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

export async function listImpersonationEvents(req: Request, res: Response) {
  const { from, to, tenantId, status, q, limit } = req.query as any;
  const rows = await db.execute(sql`
    select e.id, e.started_at, e.used_at, e.ended_at, e.expires_at, e.reason, e.jti,
           t.id as tenant_id, t.name as tenant_name, sa.id as super_admin_id, sa.email as super_admin_email,
           case
             when e.ended_at is not null then 'ended'
             when e.used_at is not null and e.expires_at < now() then 'expired'
             when e.used_at is not null then 'active'
             else 'issued'
           end as status
    from impersonation_events e
      join tenants t on t.id=e.tenant_id
      join users sa on sa.id=e.super_admin_id
    where 1=1
      ${from ? sql`and e.started_at >= ${new Date(from)}` : sql``}
      ${to ? sql`and e.started_at <= ${new Date(to)}` : sql``}
      ${tenantId ? sql`and e.tenant_id=${tenantId}` : sql``}
      ${status ? sql`and (case when e.ended_at is not null then 'ended'
                                when e.used_at is not null and e.expires_at < now() then 'expired'
                                when e.used_at is not null then 'active'
                                else 'issued' end) = ${status}` : sql``}
      ${q ? sql`and (t.name ilike ${'%'+q+'%'} or sa.email ilike ${'%'+q+'%'} or e.reason ilike ${'%'+q+'%'} )` : sql``}
    order by e.started_at desc
    limit ${Number(limit ?? 50)}
  `).then(r => (r as any).rows);
  res.json({ events: rows });
}

export async function searchAudit(req: Request, res: Response) {
  const { from, to, tenantId, impersonated, impersonatorId, q, limit } = req.query as any;
  const rows = await db.execute(sql`
    select created_at, tenant_id, user_id, section, action, meta,
           is_impersonated, impersonator_id, impersonation_event_id
    from audit_logs
    where 1=1
      ${from ? sql`and created_at >= ${new Date(from)}` : sql``}
      ${to ? sql`and created_at <= ${new Date(to)}` : sql``}
      ${tenantId ? sql`and tenant_id=${tenantId}` : sql``}
      ${impersonated === '1' ? sql`and is_impersonated=true` : sql``}
      ${impersonatorId ? sql`and impersonator_id=${impersonatorId}` : sql``}
      ${q ? sql`and (section ilike ${'%'+q+'%'} or action ilike ${'%'+q+'%'} or meta::text ilike ${'%'+q+'%'} )` : sql``}
    order by created_at desc
    limit ${Number(limit ?? 200)}
  `).then(r => (r as any).rows);
  res.json({ logs: rows });
}

// Legacy function for backwards compatibility
export async function impersonations(req: Request, res: Response) {
  return listImpersonationEvents(req, res);
}

export async function revokeImpersonation(req: Request, res: Response) {
  const { id } = idParam.parse(req.params);
  await db.execute(sql`
    update impersonation_events set ended_at = now() where id=${id} and ended_at is null
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