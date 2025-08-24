import type { Request, Response, NextFunction } from "express";
import { db } from "../db/index";
import { tenant_users } from "../db/schema/tenantUsers";
import { and, eq } from "drizzle-orm";

export async function loadActiveTenant(req: Request, res: Response, next: NextFunction) {
const activeTenantId = (req.session as any)?.activeTenantId as string | undefined;
if (activeTenantId) req.tenantId = activeTenantId;
next();
}

export function requireTenant() {
return async function(req: Request, res: Response, next: NextFunction) {
if (!req.tenantId) return res.status(400).json({ error: "Tenant not selected" });
next();
}
}

export function requireRole(...roles: string[]) {
return async function(req: Request, res: Response, next: NextFunction) {
if (!req.user || !req.tenantId) return res.status(401).json({ error: "Unauthorized" });
const row = await db.query.tenant_users.findFirst({
where: (t, { eq, and }) => and(eq(t.user_id, req.user!.id), eq(t.tenant_id, req.tenantId!))
});
if (!row || !roles.includes(row.role)) return res.status(403).json({ error: "Forbidden" });
next();
}
}