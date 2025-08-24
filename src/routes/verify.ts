import express from "express";
import { db } from "../db/index";
import { email_verifications } from "../db/schema/emailVerifications";
import { eq } from "drizzle-orm";

const router = express.Router();

async function markUserVerified(userId: string) {
// This would mark the user as verified in your auth system
// Integrate with your existing user management
console.log("Marking user verified:", userId);
}

router.get("/verify", async (req, res) => {
const token = req.query.token as string;
if (!token) return res.status(400).send("Missing token");
const row = await db.query.email_verifications.findFirst({ where: (t, { eq }) => eq(t.token, token) });
if (!row) return res.status(400).send("Invalid token");
if (row.used_at) return res.status(400).send("Token already used");
if (new Date(row.expires_at) < new Date()) return res.status(400).send("Token expired");
await db.update(email_verifications).set({ used_at: new Date() }).where(eq(email_verifications.id, row.id));
await markUserVerified(row.user_id);
res.redirect("/dashboard");
});

export default router;