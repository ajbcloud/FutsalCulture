import express from "express";
import Stripe from "stripe";
import { db } from "../db/index";
import { subscriptions } from "../db/schema/subscriptions";
import { requireAuth } from "../middleware/requireAuth";
import { requireTenant, requireRole } from "../middleware/tenantContext";
import { eq } from "drizzle-orm";
import { env } from "../lib/env";

const router = express.Router();
const stripe = new Stripe(env.STRIPE_SECRET_KEY);

router.post("/billing/checkout", requireAuth, requireTenant(), requireRole("tenant_owner"), async (req, res) => {
const { price_id } = req.body;
const sub = await db.query.subscriptions.findFirst({ where: (t, { eq }) => eq(t.tenant_id, req.tenantId!) });
if (!sub?.stripe_customer_id) return res.status(400).json({ error: "Customer not found" });
const session = await stripe.checkout.sessions.create({
mode: "subscription",
customer: sub.stripe_customer_id,
line_items: [{ price: price_id, quantity: 1 }],
success_url: `${env.APP_URL}/billing/success`,
cancel_url: `${env.APP_URL}/billing/cancel`,
metadata: { tenant_id: req.tenantId! }
});
res.json({ url: session.url });
});

export default router;