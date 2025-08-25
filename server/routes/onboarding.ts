
import express from "express";
import { db } from "../db"; // your db init
import { tenants } from "../db/schema/tenants"; // adjust import paths
import { tenant_users } from "../db/schema/tenantUsers";
import { email_verifications } from "../db/schema/emailVerifications";
import { subscriptions } from "../db/schema/subscriptions";
import Stripe from "stripe";
import { Resend } from "resend";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const resend = new Resend(process.env.RESEND_API_KEY!);

function slugify(n: string){ return n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""); }
function randomToken(len = 48){ const a = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"; return Array.from(crypto.getRandomValues(new Uint8Array(len)), b => a[b % a.length]).join(""); }
function tenantCode(){ const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let c = ""; for(let i=0;i<8;i++) c+= a[Math.floor(Math.random()*a.length)]; return c; }

// POST /api/get-started
router.post("/get-started", async (req, res) => {
  const { org_name, contact_name, contact_email, city, state, country } = req.body || {};
  if (!org_name || !contact_name || !contact_email) return res.status(400).json({ error: "Missing fields" });

  // TODO: look up or create user record by email in your existing users table
  const userId = await ensureUserByEmail(contact_email); // implement in your project

  // unique slug
  const base = slugify(org_name); let slug = base; let i = 1;
  for(;;){ const exists = await db.query.tenants.findFirst({ where: (t,{eq})=> eq(t.slug, slug)}); if(!exists) break; i++; slug = `${base}-${i}`; }

  const code = tenantCode();
  const t = await db.insert(tenants).values({ name: org_name, slug, tenant_code: code, contact_name, contact_email, city, state, country }).returning();
  await db.insert(tenant_users).values({ tenant_id: t[0].id, user_id: userId, role: "tenant_owner" });

  const customer = await stripe.customers.create({ email: contact_email, name: org_name, metadata: { tenant_id: t[0].id } });
  await db.insert(subscriptions).values({ tenant_id: t[0].id, stripe_customer_id: customer.id, plan_key: "free", status: "inactive" });

  const token = randomToken(48); const expires = new Date(Date.now()+1000*60*60*24);
  await db.insert(email_verifications).values({ user_id: userId, email: contact_email, token, expires_at: expires });
  const link = `${process.env.APP_URL || ""}/verify?token=${token}`;
  await resend.emails.send({ from: process.env.EMAIL_FROM!, to: contact_email, subject: "Verify your email • PlayHQ", html: `<p>Welcome to PlayHQ.</p><p><a href="${link}">Verify your email</a></p>` });

  res.json({ ok: true });
});

// GET /api/verify?token=...
router.get("/verify", async (req, res) => {
  const token = String(req.query.token||""); if(!token) return res.status(400).send("Missing token");
  const row = await db.query.email_verifications.findFirst({ where: (t,{eq})=> eq(t.token, token)});
  if(!row) return res.status(400).send("Invalid token");
  if(row.used_at) return res.status(400).send("Already used");
  if(new Date(row.expires_at) < new Date()) return res.status(400).send("Expired");
  await db.update(email_verifications).set({ used_at: new Date() }).where((t,{eq})=> eq(t.id, row.id));
  await markUserVerified(row.user_id); // implement in your project
  res.redirect("/create-password");
});

export default router;
