import express from "express";
import Stripe from "stripe";
import { db } from "../db/index";
import { tenants } from "../db/schema/tenants";
import { tenant_users } from "../db/schema/tenantUsers";
import { subscriptions } from "../db/schema/subscriptions";
import { email_verifications } from "../db/schema/emailVerifications";
import { randomToken, slugify, generateTenantCode } from "../lib/ids";
import { sendVerifyEmail } from "../lib/email";
import { recordAudit } from "../lib/audit";
import { env } from "../lib/env";

const stripe = new Stripe(env.STRIPE_SECRET_KEY);
const router = express.Router();

async function uniqueSlug(base: string) {
let candidate = base;
let i = 1;
while (true) {
const found = await db.query.tenants.findFirst({ where: (t, { eq }) => eq(t.slug, candidate) });
if (!found) return candidate;
i += 1;
candidate = `${base}-${i}`;
}
}

async function createUserForEmail(email: string): Promise<string> {
// This would normally create a user in your auth system
// For now, return a mock user ID - integrate with your existing auth
return "mock-user-id-" + Date.now();
}

router.post("/get-started", async (req, res) => {
const { org_name, contact_name, contact_email, city, state, country } = req.body;
if (!org_name || !contact_name || !contact_email) return res.status(400).json({ error: "Missing fields" });
const userId = req.user?.id || await createUserForEmail(contact_email);
const slug = await uniqueSlug(slugify(org_name));
const code = generateTenantCode();
const tenant = await db.insert(tenants).values({ name: org_name, slug, tenant_code: code, contact_name, contact_email, city, state, country }).returning();
await db.insert(tenant_users).values({ tenant_id: tenant[0].id, user_id: userId, role: "tenant_owner" });
const customer = await stripe.customers.create({ email: contact_email, name: org_name, metadata: { tenant_id: tenant[0].id } });
await db.insert(subscriptions).values({ tenant_id: tenant[0].id, stripe_customer_id: customer.id, plan_key: "free", status: "inactive" });
const token = randomToken(48);
const expires = new Date(Date.now() + 1000 * 60 * 60 * 24);
await db.insert(email_verifications).values({ user_id: userId, email: contact_email, token, expires_at: expires });
const link = `${env.APP_URL}/verify?token=${token}`;
await sendVerifyEmail(contact_email, link);
await recordAudit({ event_type: "tenant_created", tenant_id: tenant[0].id, actor_user_id: userId, metadata: { slug } });
res.json({ ok: true });
});

export default router;