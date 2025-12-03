import { Router } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "../db";
import { tenants, users, emailVerificationTokens, inviteCodes } from "@shared/schema";
import { eq, and, isNull, gt } from "drizzle-orm";
import { sendEmail, initEmail } from "../emailService";

const FROM_EMAIL = 'noreply@playhq.app';

export const authVerificationRouter = Router();

// Auth verification routes are now working correctly

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
    // Generate base subdomain from organization name
    const baseSubdomain = organization_name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 45); // Leave room for -## suffix

    // Find unique subdomain by appending numbers if needed
    let subdomain = baseSubdomain;
    let counter = 1;
    while (await db.query.tenants.findFirst({ where: eq(tenants.subdomain, subdomain) })) {
      subdomain = `${baseSubdomain}-${counter}`;
      counter++;
    }

    // Create tenant
    const [tenant] = await db.insert(tenants).values({
      name: organization_name,
      subdomain: subdomain,
      city: city || null,
      state: state || null,
      country: country || null,
      contactName: contact_name,
      contactEmail: email.toLowerCase(),
      inviteCode: subdomain.toUpperCase(), // Legacy field - use subdomain as invite code
      planLevel: "free", // Always start new tenants on free plan
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

    // Create subscription record (free plan) - CRITICAL for webhook upgrades
    const { subscriptions, tenantPlanAssignments } = await import('@shared/schema');
    await db.insert(subscriptions).values({
      tenantId: tenant.id,
      planKey: "free",
      status: "inactive"
    });

    // Create tenant plan assignment (free plan) - CRITICAL for feature access
    await db.insert(tenantPlanAssignments).values({
      tenantId: tenant.id,
      planCode: "free",
      since: new Date(),
      until: null
    });

    // Create default invite code using the subdomain
    await db.insert(inviteCodes).values({
      tenantId: tenant.id,
      code: subdomain.toUpperCase(),
      codeType: "invite",
      description: "Default organization invite code",
      isDefault: true,
      isActive: true,
    });

    // Create verification token
    const { raw, hash } = newToken();
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 48); // 48 hours
    await db.insert(emailVerificationTokens).values({
      userId: user.id,
      tokenHash: hash,
      expiresAt: expires,
    });

    // Send verification email  
    // For production, use playhq.app. For development, use replit dev URL
    const app_url = process.env.NODE_ENV === 'production' 
      ? 'https://playhq.app' 
      : (process.env.REPLIT_APP_URL || 'https://8726fb33-956e-4063-81a8-0b67be518e51-00-1v16mgios7gh8.riker.replit.dev');
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
      from: FROM_EMAIL,
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
      // Removed subdomain uniqueness error - now handled automatically
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
    // Check platform policies for tenant approval
    const { getCurrentPolicies } = await import('../controllers/superAdmin/platformSettings');
    const policies = await getCurrentPolicies();
    
    // Determine if auto-approval is enabled
    const autoApprove = policies?.autoApproveTenants ?? true;
    const requireApproval = policies?.requireTenantApproval ?? false;
    
    // Generate base subdomain from organization name
    const baseSubdomain = org_name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 45); // Leave room for -## suffix

    // Find unique subdomain by appending numbers if needed
    let subdomain = baseSubdomain;
    let counter = 1;
    while (await db.query.tenants.findFirst({ where: eq(tenants.subdomain, subdomain) })) {
      subdomain = `${baseSubdomain}-${counter}`;
      counter++;
    }

    // Generate tenant invite code  
    const { generateInviteCode } = await import('../utils/invite-helpers');
    const inviteCode = generateInviteCode();
    
    // Determine initial tenant status based on policies
    const tenantStatus = autoApprove ? 'active' : 'pending';
    const billingStatus = autoApprove ? 'trial' : 'pending_approval';
    
    // Set trial dates if auto-approved
    const now = new Date();
    const trialStartedAt = autoApprove ? now : null;
    const trialEndsAt = autoApprove ? new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) : null; // 14-day trial
    const trialPlan = autoApprove ? 'core' : null; // Use 'core' as trial plan

    // Create tenant with appropriate status
    const [tenant] = await db.insert(tenants).values({
      name: org_name,
      subdomain: subdomain,
      city: city || null,
      state: state || null,
      country: country || null,
      contactName: contact_name,
      contactEmail: contact_email.toLowerCase(),
      inviteCode,
      planLevel: "free", // Base plan level
      status: tenantStatus,
      billingStatus: billingStatus,
      trialStartedAt: trialStartedAt,
      trialEndsAt: trialEndsAt,
      trialPlan: trialPlan as any,
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

    // Create subscription record (free plan) - CRITICAL for webhook upgrades
    const { subscriptions, tenantPlanAssignments } = await import('@shared/schema');
    await db.insert(subscriptions).values({
      tenantId: tenant.id,
      planKey: "free",
      status: "inactive"
    });

    // Create tenant plan assignment (free plan) - CRITICAL for feature access
    await db.insert(tenantPlanAssignments).values({
      tenantId: tenant.id,
      planCode: "free",
      since: new Date(),
      until: null
    });

    // Create default invite code using the subdomain
    await db.insert(inviteCodes).values({
      tenantId: tenant.id,
      code: subdomain.toUpperCase(),
      codeType: "invite",
      description: "Default organization invite code",
      isDefault: true,
      isActive: true,
    });

    // Create verification token
    const { raw, hash } = newToken();
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 48); // 48 hours
    await db.insert(emailVerificationTokens).values({
      userId: user.id,
      tokenHash: hash,
      expiresAt: expires,
    });

    // Send verification email  
    // For production, use playhq.app. For development, use replit dev URL
    const app_url = process.env.NODE_ENV === 'production' 
      ? 'https://playhq.app' 
      : (process.env.REPLIT_APP_URL || 'https://8726fb33-956e-4063-81a8-0b67be518e51-00-1v16mgios7gh8.riker.replit.dev');
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
      from: FROM_EMAIL,
      subject: "Verify your PlayHQ account",
      html,
      text,
    });

    console.log(`✅ Created tenant ${tenant.name} and sent verification email to ${user.email}`);
    
    // Create Clerk organization for this tenant
    try {
      const { createOrganizationForTenant, isClerkEnabled } = await import('../services/clerkOrganizationService');
      if (isClerkEnabled()) {
        await createOrganizationForTenant(tenant.id);
        console.log(`✅ Created Clerk organization for tenant ${tenant.id}`);
      }
    } catch (clerkError) {
      console.error(`⚠️ Failed to create Clerk organization for tenant ${tenant.id}:`, clerkError);
      // Don't fail the signup if Clerk org creation fails
    }
    
    // Send notification to Super Admins if manual approval is required
    if (!autoApprove && requireApproval) {
      const superAdmins = await db.select()
        .from(users)
        .where(eq(users.isSuperAdmin, true));
      
      for (const admin of superAdmins) {
        await sendEmail({
          to: admin.email!,
          from: FROM_EMAIL,
          subject: "New Tenant Requires Approval",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">New Tenant Pending Approval</h2>
              <p>A new organization has signed up and requires approval:</p>
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Organization:</strong> ${org_name}</p>
                <p><strong>Subdomain:</strong> ${subdomain}</p>
                <p><strong>Contact Name:</strong> ${contact_name}</p>
                <p><strong>Contact Email:</strong> ${contact_email}</p>
                <p><strong>Location:</strong> ${city || 'Not specified'}, ${state || ''} ${country || ''}</p>
              </div>
              <p style="margin-top: 20px;">
                <a href="${app_url}/super-admin/tenants?search=${encodeURIComponent(org_name)}" 
                   style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Review Application
                </a>
              </p>
            </div>
          `,
          text: `New tenant ${org_name} requires approval. Visit the Super Admin dashboard to review.`,
        }).catch(err => console.error('Failed to notify super admin:', err));
      }
    }

    const message = autoApprove 
      ? "Organization created successfully. Please check your email to verify and set your password."
      : "Organization registration received. Your application is pending approval. We'll notify you once approved.";

    return res.json({ 
      ok: true,
      message
    });

  } catch (error) {
    console.error("❌ Error creating organization:", error);
    if (error instanceof Error && error.message.includes('unique')) {
      if (error.message.includes('email')) {
        return res.status(400).json({ ok: false, error: "This email is already registered" });
      }
      // Removed subdomain uniqueness error - now handled automatically
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

    console.log(`User ${user.email} verified and password set`);

    return res.json({ 
      ok: true, 
      message: "Password set successfully. Please log in to continue."
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

  const app_url = process.env.NODE_ENV === 'production' 
    ? 'https://playhq.app' 
    : (process.env.REPLIT_APP_URL || 'https://8726fb33-956e-4063-81a8-0b67be518e51-00-1v16mgios7gh8.riker.replit.dev');
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
    from: FROM_EMAIL,
    subject: "Verify your PlayHQ account",
    html,
    text: `Continue your setup: ${link}`,
  });

  console.log(`Resent verification email to ${user.email}`);

  return res.json({ ok: true });
});

// Password reset - for existing users who forgot their password
authVerificationRouter.post("/forgot-password", async (req, res) => {
  const { email } = req.body as { email?: string };
  
  if (!email) {
    return res.json({ ok: true, message: "If an account exists, a reset link has been sent." }); // Don't reveal if email exists
  }

  try {
    const [user] = await db.select()
      .from(users)
      .where(eq(users.email, String(email).toLowerCase()));
    
    if (!user || !user.emailVerifiedAt) {
      return res.json({ ok: true, message: "If an account exists, a reset link has been sent." }); // Don't reveal if email exists or is unverified
    }

    // Create password reset token (reusing email verification token structure)
    const { raw, hash } = newToken();
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours for password reset
    
    await db.insert(emailVerificationTokens).values({
      userId: user.id,
      tokenHash: hash,
      expiresAt: expires,
    });

    const app_url = process.env.NODE_ENV === 'production' 
      ? 'https://playhq.app' 
      : (process.env.REPLIT_APP_URL || 'https://8726fb33-956e-4063-81a8-0b67be518e51-00-1v16mgios7gh8.riker.replit.dev');
    const link = `${app_url}/reset-password?token=${encodeURIComponent(raw)}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Reset Your Password</h1>
        <p>Hi ${user.firstName || 'there'},</p>
        <p>We received a request to reset your password. Click the link below to create a new password:</p>
        <p style="margin: 30px 0;">
          <a href="${link}" style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p style="background: #f3f4f6; padding: 10px; word-break: break-all;">${link}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't request this password reset, you can safely ignore this email.</p>
        <p>Best regards,<br>The PlayHQ Team</p>
      </div>
    `;

    await sendEmail({
      to: user.email!,
      from: FROM_EMAIL,
      subject: "Reset your PlayHQ password",
      html,
      text: `Reset your password: ${link}`,
    });

    console.log(`Password reset email sent to ${user.email}`);

    return res.json({ ok: true, message: "If an account exists, a reset link has been sent." });

  } catch (error) {
    console.error("Password reset error:", error);
    return res.json({ ok: true, message: "If an account exists, a reset link has been sent." }); // Don't reveal errors
  }
});

export default authVerificationRouter;