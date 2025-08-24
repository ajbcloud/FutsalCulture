import express from "express";
import { db } from "../db/index";
import { invites } from "../db/schema/invites";
import { tenants } from "../db/schema/tenants";
import { randomToken } from "../lib/ids";
import { sendInviteEmail } from "../lib/email";
import { requireAuth } from "../middleware/requireAuth";
import { requireTenant, requireRole } from "../middleware/tenantContext";
import { recordAudit } from "../lib/audit";
import { and, eq } from "drizzle-orm";
import { env } from "../lib/env";

const router = express.Router();

async function tenantName(tenantId: string): Promise<string> {
const tenant = await db.query.tenants.findFirst({ where: (t, { eq }) => eq(t.id, tenantId) });
return tenant?.name || "Unknown Tenant";
}

router.post("/invites", requireAuth, requireTenant(), requireRole("tenant_owner", "coach"), async (req, res) => {
const { email, role, channel } = req.body;
if (!email || !role) return res.status(400).json({ error: "Missing fields" });
const token = randomToken(48);
const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
const row = await db.insert(invites).values({ tenant_id: req.tenantId!, email, role, token, expires_at: expires, invited_by_user_id: req.user!.id, channel: channel || "email" }).returning();
const link = `${env.APP_URL}/join?token=${token}`;
await sendInviteEmail(email, link, role, await tenantName(req.tenantId!));
await recordAudit({ event_type: "invite_sent", tenant_id: req.tenantId!, actor_user_id: req.user!.id, target_id: row[0].id, metadata: { email, role } });
res.json({ ok: true });
});

router.post("/invites/resend", requireAuth, requireTenant(), requireRole("tenant_owner", "coach"), async (req, res) => {
const { id } = req.body;
const row = await db.query.invites.findFirst({ where: (t, { eq }) => eq(t.id, id) });
if (!row || row.tenant_id !== req.tenantId) return res.status(404).json({ error: "Not found" });
const link = `${env.APP_URL}/join?token=${row.token}`;
await sendInviteEmail(row.email, link, row.role, await tenantName(req.tenantId!));
res.json({ ok: true });
});

router.post("/invites/revoke", requireAuth, requireTenant(), requireRole("tenant_owner", "coach"), async (req, res) => {
const { id } = req.body;
const row = await db.query.invites.findFirst({ where: (t, { eq }) => eq(t.id, id) });
if (!row || row.tenant_id !== req.tenantId) return res.status(404).json({ error: "Not found" });
await db.update(invites).set({ expires_at: new Date() }).where(eq(invites.id, id));
res.json({ ok: true });
});

export default router;