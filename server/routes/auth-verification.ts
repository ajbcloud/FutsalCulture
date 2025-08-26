import { Router } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "../db";
import { tenants, users, emailVerificationTokens } from "@shared/schema";
import { eq, and, isNull, gt } from "drizzle-orm";
import { sendEmail, initEmail } from "../emailService";

export const authVerificationRouter = Router();

// Debug middleware to track requests
authVerificationRouter.use((req, res, next) => {
  console.log(`🔍 Auth verification route hit: ${req.method} ${req.path}`);
  next();
});

// Utility functions
function newToken() {
  const raw = crypto.randomBytes(32).toString("base64url");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
}

// Client self-signup for admins
authVerificationRouter.post("/signup_client", async (req, res) => {
  const { organization_name, contact_name, email, country, state, city } = req.body;
  
  if (!organization_name || !contact_name || !email) {
    return res.status(400).json({ ok: false, error: "Missing required fields" });
  }

  try {
    // Generate subdomain from organization name
    const subdomain = organization_name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);

    // Create tenant
    const [tenant] = await db.insert(tenants).values({
      name: organization_name,
      subdomain: subdomain,
      city: city || null,
      state: state || null,
      country: country || null,
      contactName: contact_name,
      contactEmail: email.toLowerCase(),
    }).returning();

    // Create user with pending verification status
    const [user] = await db.insert(users).values({
      email: String(email).toLowerCase(),
      firstName: contact_name.split(' ')[0] || contact_name,
      lastName: contact_name.split(' ').slice(1).join(' ') || '',
      role: "tenant_admin",
      isAdmin: true,
      tenantId: tenant.id,
      verificationStatus: "pending_verify",
      authProvider: "local",
    }).returning();

    // Create verification token
    const { raw, hash } = newToken();
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 48); // 48 hours
    await db.insert(emailVerificationTokens).values({
      userId: user.id,
      tokenHash: hash,
      expiresAt: expires,
    });

    // Send verification email
    const app_url = process.env.REPLIT_DOMAINS 
      ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` 
      : 'https://playhq.app';
    const link = `${app_url}/set-password?token=${encodeURIComponent(raw)}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Welcome to PlayHQ!</h1>
        <p>Hi ${contact_name},</p>
        <p>Thank you for creating your organization on PlayHQ. Please click the link below to verify your email and set your password:</p>
        <p style="margin: 30px 0;">
          <a href="${link}" style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Verify Email & Set Password
          </a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p style="background: #f3f4f6; padding: 10px; word-break: break-all;">${link}</p>
        <p>This link will expire in 48 hours.</p>
        <p>If you did not request this, please ignore this email.</p>
        <p>Best regards,<br>The PlayHQ Team</p>
      </div>
    `;
    
    const text = `Hi ${contact_name},

Thank you for creating your organization on PlayHQ. Please click the link below to verify your email and set your password:

${link}

This link will expire in 48 hours.

If you did not request this, please ignore this email.

Best regards,
The PlayHQ Team`;

    await sendEmail({
      to: user.email!,
      from: process.env.EMAIL_FROM_ADDRESS || 'noreply@playhq.app',
      subject: "Verify your PlayHQ account",
      html,
      text,
    });

    console.log(`Created tenant ${tenant.name} and sent verification email to ${user.email}`);

    return res.json({ 
      ok: true,
      message: "Organization created successfully. Please check your email to verify and set your password."
    });

  } catch (error) {
    console.error("Error creating organization:", error);
    if (error instanceof Error && error.message.includes('unique')) {
      if (error.message.includes('email')) {
        return res.status(400).json({ ok: false, error: "This email is already registered" });
      }
      if (error.message.includes('subdomain')) {
        return res.status(400).json({ ok: false, error: "This organization name is too similar to an existing one" });
      }
    }
    return res.status(500).json({ ok: false, error: "Failed to create organization" });
  }
});

// Main signup route (called by GetStarted component)
authVerificationRouter.post("/signup", async (req, res) => {
  console.log('📝 Signup route handler called with data:', req.body);
  
  const { org_name, contact_name, contact_email, country, state, city, plan_key = "free", accept } = req.body;
  
  if (!org_name || !contact_name || !contact_email || !accept) {
    return res.status(400).json({ ok: false, error: "Missing required fields" });
  }

  try {
    // Generate subdomain from organization name
    const subdomain = org_name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);

    // Create tenant
    const [tenant] = await db.insert(tenants).values({
      name: org_name,
      subdomain: subdomain,
      city: city || null,
      state: state || null,
      country: country || null,
      contactName: contact_name,
      contactEmail: contact_email.toLowerCase(),
    }).returning();

    // Create user with pending verification status
    const [user] = await db.insert(users).values({
      email: String(contact_email).toLowerCase(),
      firstName: contact_name.split(' ')[0] || contact_name,
      lastName: contact_name.split(' ').slice(1).join(' ') || '',
      role: "tenant_admin",
      isAdmin: true,
      tenantId: tenant.id,
      verificationStatus: "pending_verify",
      authProvider: "local",
    }).returning();

    // Create verification token
    const { raw, hash } = newToken();
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 48); // 48 hours
    await db.insert(emailVerificationTokens).values({
      userId: user.id,
      tokenHash: hash,
      expiresAt: expires,
    });

    // Send verification email
    const app_url = process.env.REPLIT_DOMAINS 
      ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` 
      : 'https://playhq.app';
    const link = `${app_url}/set-password?token=${encodeURIComponent(raw)}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Welcome to PlayHQ!</h1>
        <p>Hi ${contact_name},</p>
        <p>Thank you for creating your organization on PlayHQ. Please click the link below to verify your email and set your password:</p>
        <p style="margin: 30px 0;">
          <a href="${link}" style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Verify Email & Set Password
          </a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p style="background: #f3f4f6; padding: 10px; word-break: break-all;">${link}</p>
        <p>This link will expire in 48 hours.</p>
        <p>If you did not request this, please ignore this email.</p>
        <p>Best regards,<br>The PlayHQ Team</p>
      </div>
    `;
    
    const text = `Hi ${contact_name},

Thank you for creating your organization on PlayHQ. Please click the link below to verify your email and set your password:

${link}

This link will expire in 48 hours.

If you did not request this, please ignore this email.

Best regards,
The PlayHQ Team`;

    await sendEmail({
      to: user.email!,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@playhq.app',
      subject: "Verify your PlayHQ account",
      html,
      text,
    });

    console.log(`✅ Created tenant ${tenant.name} and sent verification email to ${user.email}`);

    return res.json({ 
      ok: true,
      message: "Organization created successfully. Please check your email to verify and set your password."
    });

  } catch (error) {
    console.error("❌ Error creating organization:", error);
    if (error instanceof Error && error.message.includes('unique')) {
      if (error.message.includes('email')) {
        return res.status(400).json({ ok: false, error: "This email is already registered" });
      }
      if (error.message.includes('subdomain')) {
        return res.status(400).json({ ok: false, error: "This organization name is too similar to an existing one" });
      }
    }
    return res.status(500).json({ ok: false, error: "Failed to create organization" });
  }
});

// Optional: Verify token validity (for pre-checking before showing form)
authVerificationRouter.get("/verify_email", async (req, res) => {
  const token = String(req.query.token || "");
  
  if (!token) {
    return res.status(400).json({ ok: false, error: "Token required" });
  }
  
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  
  const [record] = await db.select()
    .from(emailVerificationTokens)
    .where(
      and(
        eq(emailVerificationTokens.tokenHash, tokenHash),
        isNull(emailVerificationTokens.usedAt),
        gt(emailVerificationTokens.expiresAt, new Date())
      )
    );
    
  if (!record) {
    return res.status(400).json({ ok: false, error: "Invalid or expired token" });
  }
  
  return res.json({ ok: true });
});

// Set first password
authVerificationRouter.post("/set_password", async (req, res) => {
  const { token, password } = req.body as { token: string; password: string };
  
  if (!token || !password) {
    return res.status(400).json({ ok: false, error: "Missing required fields" });
  }
  
  if (password.length < 10) {
    return res.status(400).json({ ok: false, error: "Password must be at least 10 characters" });
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  try {
    // Find valid token
    const [record] = await db.select()
      .from(emailVerificationTokens)
      .where(
        and(
          eq(emailVerificationTokens.tokenHash, tokenHash),
          isNull(emailVerificationTokens.usedAt),
          gt(emailVerificationTokens.expiresAt, new Date())
        )
      );
    
    if (!record) {
      return res.status(400).json({ ok: false, error: "Invalid or expired token" });
    }

    const hash = await bcrypt.hash(password, 12);

    // Update user and mark token as used in a transaction
    await db.transaction(async (tx) => {
      // Update user
      await tx.update(users)
        .set({ 
          passwordHash: hash, 
          verificationStatus: "verified",
          emailVerifiedAt: new Date(),
          status: "active"
        })
        .where(eq(users.id, record.userId));
      
      // Mark token as used
      await tx.update(emailVerificationTokens)
        .set({ usedAt: new Date() })
        .where(eq(emailVerificationTokens.id, record.id));
    });

    // Get the user to set session
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, record.userId));

    if (!user) {
      return res.status(500).json({ ok: false, error: "User not found" });
    }

    // Set session using the same approach as the regular login
    if ((req as any).session) {
      (req as any).session.userId = user.id;
      (req as any).session.user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin,
        tenantId: user.tenantId,
      };
    }

    console.log(`User ${user.email} verified and password set`);

    return res.json({ 
      ok: true, 
      redirect: user.isAdmin ? "/admin" : "/dashboard"
    });

  } catch (error) {
    console.error("Error setting password:", error);
    return res.status(500).json({ ok: false, error: "Failed to set password" });
  }
});

// Resend verification email
authVerificationRouter.post("/resend_verification", async (req, res) => {
  const { email } = req.body as { email?: string };
  
  if (!email) {
    return res.json({ ok: true }); // Don't reveal if email exists
  }

  const [user] = await db.select()
    .from(users)
    .where(eq(users.email, String(email).toLowerCase()));
  
  if (!user || user.emailVerifiedAt) {
    return res.json({ ok: true }); // Don't reveal if email exists or is already verified
  }

  // Create new token
  const { raw, hash } = newToken();
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 48); // 48 hours
  
  await db.insert(emailVerificationTokens).values({
    userId: user.id,
    tokenHash: hash,
    expiresAt: expires,
  });

  const app_url = process.env.REPLIT_DOMAINS 
    ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` 
    : 'https://playhq.app';
  const link = `${app_url}/set-password?token=${encodeURIComponent(raw)}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #2563eb;">Verify Your Email</h1>
      <p>Hi ${user.firstName || 'there'},</p>
      <p>Please click the link below to verify your email and complete your account setup:</p>
      <p style="margin: 30px 0;">
        <a href="${link}" style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Verify & Continue
        </a>
      </p>
      <p>Or copy and paste this link into your browser:</p>
      <p style="background: #f3f4f6; padding: 10px; word-break: break-all;">${link}</p>
      <p>This link will expire in 48 hours.</p>
      <p>Best regards,<br>The PlayHQ Team</p>
    </div>
  `;

  await sendEmail({
    to: user.email!,
    from: process.env.EMAIL_FROM_ADDRESS || 'noreply@playhq.app',
    subject: "Verify your PlayHQ account",
    html,
    text: `Continue your setup: ${link}`,
  });

  console.log(`Resent verification email to ${user.email}`);

  return res.json({ ok: true });
});

export default authVerificationRouter;