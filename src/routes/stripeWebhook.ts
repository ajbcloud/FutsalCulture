import express from "express";
import Stripe from "stripe";
import { db } from "../db/index";
import { subscriptions } from "../db/schema/subscriptions";
import { eq } from "drizzle-orm";
import { env } from "../lib/env";

const router = express.Router();
const stripe = new Stripe(env.STRIPE_SECRET_KEY);

router.post("/webhooks/stripe", express.raw({ type: "application/json" }), async (req, res) => {
const sig = req.headers["stripe-signature"] as string;
let event: Stripe.Event;
try {
event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);
} catch {
return res.status(400).send("Webhook Error");
}
switch (event.type) {
case "checkout.session.completed": {
const session = event.data.object as Stripe.Checkout.Session;
const subscriptionId = session.subscription as string;
const customerId = session.customer as string;
const tenantId = session.metadata?.tenant_id as string;
await db.update(subscriptions).set({ stripe_subscription_id: subscriptionId, stripe_customer_id: customerId, plan_key: "paid", status: "active" }).where(eq(subscriptions.tenant_id, tenantId));
break;
}
case "customer.subscription.deleted":
case "customer.subscription.paused": {
const sub = event.data.object as Stripe.Subscription;
const tenantId = sub.metadata?.tenant_id as string | undefined;
if (tenantId) {
await db.update(subscriptions).set({ status: "canceled" }).where(eq(subscriptions.tenant_id, tenantId));
}
break;
}
}
res.json({ received: true });
});

export default router;