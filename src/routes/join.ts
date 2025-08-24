import express from "express";
import { db } from "../db/index";
import { invites } from "../db/schema/invites";
import { tenant_users } from "../db/schema/tenantUsers";
import { tenants } from "../db/schema/tenants";
import { and, eq } from "drizzle-orm";
import { recordAudit } from "../lib/audit";

const router = express.Router();

async function ensureUser(email: string, password: string, profile: any): Promise<string> {
// This would create/find user in your auth system
// For now, return a mock user ID - integrate with your existing auth
return "mock-user-id-" + Date.now();
}

async function findTenantByCode(tenantCode: string) {
return await db.query.tenants.findFirst({ where: (t, { eq }) => eq(t.tenant_code, tenantCode) });
}

async function tenantRequiresApproval(tenantId: string): Promise<boolean> {
// Check if tenant requires approval for new joins
return false; // Default to no approval required
}

async function queueJoinRequest(tenantId: string, email: string, role: string) {
// Queue join request for approval
console.log("Join request queued for approval:", { tenantId, email, role });
}

async function parentsJoinPlayerIfNeeded(tenantId: string, parentEmail: string, playerId: string) {
// Handle parent-player linking for minors
console.log("Linking parent to player:", { tenantId, parentEmail, playerId });
}

router.post("/join/by-token", async (req, res) => {
const { token, password, parent_email, profile } = req.body;
const row = await db.query.invites.findFirst({ where: (t, { eq }) => eq(t.token, token) });
if (!row) return res.status(400).json({ error: "Invalid token" });
if (row.used_at) return res.status(400).json({ error: "Already used" });
if (new Date(row.expires_at) < new Date()) return res.status(400).json({ error: "Expired" });
const userId = await ensureUser(row.email, password, profile);
await db.insert(tenant_users).values({ tenant_id: row.tenant_id, user_id: userId, role: row.role });
await db.update(invites).set({ used_at: new Date() }).where(eq(invites.id, row.id));
if (row.role === "player" && parent_email) {
await parentsJoinPlayerIfNeeded(row.tenant_id, parent_email, userId);
}
await recordAudit({ event_type: "invite_accepted", tenant_id: row.tenant_id, actor_user_id: userId, target_id: row.id });
res.json({ ok: true });
});

router.post("/join/by-code", async (req, res) => {
const { tenant_code, email, role, password, profile, parent_email } = req.body;
const tenant = await findTenantByCode(tenant_code);
if (!tenant) return res.status(404).json({ error: "Tenant not found" });
if (await tenantRequiresApproval(tenant.id)) {
await queueJoinRequest(tenant.id, email, role);
return res.json({ ok: true, queued: true });
}
const userId = await ensureUser(email, password, profile);
await db.insert(tenant_users).values({ tenant_id: tenant.id, user_id: userId, role });
if (role === "player" && parent_email) {
await parentsJoinPlayerIfNeeded(tenant.id, parent_email, userId);
}
await recordAudit({ event_type: "joined_by_code", tenant_id: tenant.id, actor_user_id: userId });
res.json({ ok: true });
});

export default router;