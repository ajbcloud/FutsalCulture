import { Router, Request, Response } from 'express';
import { businessSignupTokens, tenants, users } from '@shared/schema';
import { storage } from '../storage';
import { nanoid } from 'nanoid';
import { db } from '../db';
import { eq, and, gt } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

const businessSignupInitSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  orgName: z.string().min(2, "Organization name is required"),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().default("US"),
});

const businessSignupAttachSchema = z.object({
  token: z.string().min(1, "Token is required"),
  clerkUserId: z.string().min(1, "Clerk user ID is required"),
});

function generateTenantCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function generateSubdomain(orgName: string): string {
  return orgName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 45);
}

router.post('/business-signup/init', async (req: Request, res: Response) => {
  try {
    const parseResult = businessSignupInitSchema.safeParse(req.body);
    
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error.errors[0]?.message || 'Invalid input',
      });
    }

    const data = parseResult.data;

    const existingUser = await storage.getUserByEmail(data.email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists. Please sign in instead.',
      });
    }

    let tenantCode = generateTenantCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await storage.getTenantByCode(tenantCode);
      if (!existing) break;
      tenantCode = generateTenantCode();
      attempts++;
    }

    let subdomain = generateSubdomain(data.orgName);
    let subdomainAttempts = 0;
    while (subdomainAttempts < 10) {
      const existing = await storage.getTenantBySubdomain(subdomain);
      if (!existing) break;
      subdomain = `${generateSubdomain(data.orgName)}-${nanoid(4)}`;
      subdomainAttempts++;
    }

    let inviteCode = generateTenantCode();
    let inviteCodeAttempts = 0;
    while (inviteCodeAttempts < 10) {
      const existingInvite = await storage.getTenantByInviteCode(inviteCode);
      if (!existingInvite) break;
      inviteCode = generateTenantCode();
      inviteCodeAttempts++;
    }
    
    let tenant;
    try {
      tenant = await storage.createTenant({
        name: data.orgName,
        subdomain,
        tenantCode,
        inviteCode,
        contactName: `${data.firstName} ${data.lastName}`,
        contactEmail: data.email,
        city: data.city || null,
        state: data.state || null,
        country: data.country || 'US',
        planLevel: 'free',
        billingStatus: 'none',
      });
    } catch (tenantError: any) {
      console.error('Failed to create tenant:', tenantError);
      return res.status(500).json({
        success: false,
        message: 'Failed to create organization. Please try again.',
      });
    }

    if (!tenant) {
      console.error('Failed to create tenant for:', data.orgName);
      return res.status(500).json({
        success: false,
        message: 'Failed to create organization. Please try again.',
      });
    }

    let user;
    try {
      user = await storage.upsertUser({
        email: data.email,
        clerkUserId: null,
        authProvider: 'clerk',
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || null,
        tenantId: tenant.id,
        isAdmin: true,
        role: 'tenant_admin',
        isApproved: true,
        registrationStatus: 'approved',
      });
    } catch (userError: any) {
      console.error('Failed to create user, cleaning up tenant:', userError);
      try {
        await db.delete(tenants).where(eq(tenants.id, tenant.id));
      } catch (cleanupError) {
        console.error('Failed to cleanup tenant after user creation failure:', cleanupError);
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to create user account. Please try again.',
      });
    }

    if (!user) {
      console.error('Failed to create user for:', data.email);
      try {
        await db.delete(tenants).where(eq(tenants.id, tenant.id));
      } catch (cleanupError) {
        console.error('Failed to cleanup tenant after user creation returned null:', cleanupError);
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to create user account. Please try again.',
      });
    }

    const signupToken = nanoid(32);
    
    try {
      await db.insert(businessSignupTokens).values({
        token: signupToken,
        tenantId: tenant.id,
        userId: user.id,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        orgName: data.orgName,
        status: 'pending',
      });
    } catch (tokenError: any) {
      console.error('Failed to create signup token:', tokenError);
      try {
        await db.delete(users).where(eq(users.id, user.id));
        await db.delete(tenants).where(eq(tenants.id, tenant.id));
      } catch (cleanupError) {
        console.error('Failed to cleanup after token creation failure:', cleanupError);
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to initialize signup. Please try again.',
      });
    }

    console.log(`Business signup init successful: ${data.email} -> Tenant: ${tenant.name} (${tenant.id}), Token: ${signupToken.substring(0, 8)}...`);

    return res.status(201).json({
      success: true,
      token: signupToken,
      prefill: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        orgName: data.orgName,
      },
      tenantId: tenant.id,
      userId: user.id,
    });

  } catch (error: any) {
    console.error('Business signup init error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'An unexpected error occurred. Please try again.',
    });
  }
});

router.get('/business-signup/token/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required',
      });
    }

    const [signupToken] = await db.select()
      .from(businessSignupTokens)
      .where(
        and(
          eq(businessSignupTokens.token, token),
          eq(businessSignupTokens.status, 'pending'),
          gt(businessSignupTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!signupToken) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired signup token. Please start the signup process again.',
      });
    }

    return res.json({
      success: true,
      prefill: {
        firstName: signupToken.firstName,
        lastName: signupToken.lastName,
        email: signupToken.email,
        orgName: signupToken.orgName,
      },
    });

  } catch (error: any) {
    console.error('Get signup token error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve signup information.',
    });
  }
});

router.post('/business-signup/attach', async (req: Request, res: Response) => {
  try {
    const parseResult = businessSignupAttachSchema.safeParse(req.body);
    
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error.errors[0]?.message || 'Invalid input',
      });
    }

    const { token, clerkUserId } = parseResult.data;

    const existingClerkUser = await db.select()
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);

    if (existingClerkUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'This account is already linked. Please sign in instead.',
      });
    }

    const result = await db.transaction(async (tx) => {
      const tokenUpdateResult = await tx.update(businessSignupTokens)
        .set({ 
          status: 'attached',
          attachedAt: new Date(),
        })
        .where(
          and(
            eq(businessSignupTokens.token, token),
            eq(businessSignupTokens.status, 'pending'),
            gt(businessSignupTokens.expiresAt, new Date())
          )
        )
        .returning();

      if (tokenUpdateResult.length === 0) {
        throw new Error('TOKEN_INVALID_OR_EXPIRED');
      }

      const signupToken = tokenUpdateResult[0];

      await tx.update(users)
        .set({ 
          clerkUserId: clerkUserId,
          emailVerifiedAt: new Date(),
          verificationStatus: 'verified',
        })
        .where(eq(users.id, signupToken.userId));

      const [user] = await tx.select()
        .from(users)
        .where(eq(users.id, signupToken.userId))
        .limit(1);

      const [tenant] = await tx.select()
        .from(tenants)
        .where(eq(tenants.id, signupToken.tenantId))
        .limit(1);

      return { signupToken, user, tenant };
    });

    const { signupToken, user, tenant } = result;

    console.log(`Business signup attach successful: ${signupToken.email} -> ClerkUser: ${clerkUserId}`);

    return res.json({
      success: true,
      message: 'Account setup complete! Welcome to PlayHQ.',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        tenantId: user.tenantId,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
      },
    });

  } catch (error: any) {
    console.error('Business signup attach error:', error);
    
    if (error.message === 'TOKEN_INVALID_OR_EXPIRED') {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired signup token. Please start the signup process again.',
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Failed to complete account setup. Please try again.',
    });
  }
});

export default router;
