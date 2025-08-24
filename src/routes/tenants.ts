import express from "express";
import { db } from "../db/index";
import { tenant_users } from "../db/schema/tenantUsers";
import { tenants } from "../db/schema/tenants";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middleware/requireAuth";
import { generateTenantCode } from "../lib/ids";

const router = express.Router();

router.post("/tenants/switch", requireAuth, async (req, res) => {
const { tenant_id } = req.body;
const member = await db.query.tenant_users.findFirst({ where: (t, { eq, and }) => and(eq(t.user_id, req.user!.id), eq(t.tenant_id, tenant_id)) });
if (!member) return res.status(403).json({ error: "Not a member" });
(req.session as any).activeTenantId = tenant_id;
res.json({ ok: true });
});

router.post("/tenant/code/rotate", requireAuth, async (req, res) => {
if (!req.tenantId) return res.status(400).json({ error: "Tenant not selected" });
const newCode = generateTenantCode();
await db.update(tenants).set({ tenant_code: newCode }).where(eq(tenants.id, req.tenantId));
res.json({ code: newCode });
});

export default router;