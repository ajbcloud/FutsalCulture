import { Router, Request, Response } from 'express';
import { businessSignupSchema, type BusinessSignupResponse, type TenantInsert } from '@shared/schema';
import { storage } from '../storage';
import { nanoid } from 'nanoid';

const router = Router();

async function createClerkUser(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<{ id: string; emailAddress: string } | null> {
  if (!process.env.CLERK_SECRET_KEY) {
    throw new Error('CLERK_SECRET_KEY is not configured');
  }

  const response = await fetch('https://api.clerk.com/v1/users', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email_address: [data.email],
      password: data.password,
      first_name: data.firstName,
      last_name: data.lastName,
      skip_password_checks: false,
      skip_password_requirement: false,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Clerk user creation failed:', error);
    
    if (error.errors?.[0]?.code === 'form_identifier_exists') {
      throw new Error('An account with this email already exists. Please sign in instead.');
    }
    
    throw new Error(error.errors?.[0]?.long_message || 'Failed to create account');
  }

  const clerkUser = await response.json();
  return {
    id: clerkUser.id,
    emailAddress: clerkUser.email_addresses?.[0]?.email_address || data.email,
  };
}

async function sendEmailVerification(clerkUserId: string, emailAddressId?: string): Promise<void> {
  if (!process.env.CLERK_SECRET_KEY) {
    throw new Error('CLERK_SECRET_KEY is not configured');
  }

  if (!emailAddressId) {
    const userResponse = await fetch(`https://api.clerk.com/v1/users/${clerkUserId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user for email verification');
    }

    const user = await userResponse.json();
    emailAddressId = user.email_addresses?.[0]?.id;
  }

  if (!emailAddressId) {
    throw new Error('No email address found for verification');
  }

  const response = await fetch(
    `https://api.clerk.com/v1/email_addresses/${emailAddressId}/prepare_verification`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        strategy: 'email_code',
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    console.error('Email verification preparation failed:', error);
  }
}

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

router.post('/business-signup', async (req: Request, res: Response) => {
  try {
    const parseResult = businessSignupSchema.safeParse(req.body);
    
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error.errors[0]?.message || 'Invalid input',
        requiresEmailVerification: false,
      } as BusinessSignupResponse);
    }

    const data = parseResult.data;

    const existingUser = await storage.getUserByEmail(data.email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists. Please sign in instead.',
        requiresEmailVerification: false,
      } as BusinessSignupResponse);
    }

    let clerkUser: { id: string; emailAddress: string } | null = null;
    try {
      clerkUser = await createClerkUser({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      });
    } catch (clerkError: any) {
      return res.status(400).json({
        success: false,
        message: clerkError.message || 'Failed to create account',
        requiresEmailVerification: false,
      } as BusinessSignupResponse);
    }

    if (!clerkUser) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create account. Please try again.',
        requiresEmailVerification: false,
      } as BusinessSignupResponse);
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
      console.error('Failed to create tenant, attempting Clerk user cleanup:', tenantError);
      try {
        await fetch(`https://api.clerk.com/v1/users/${clerkUser.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}` },
        });
      } catch (cleanupError) {
        console.error('Failed to cleanup Clerk user after tenant creation failure:', cleanupError);
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to create organization. Please try again.',
        requiresEmailVerification: false,
      } as BusinessSignupResponse);
    }

    if (!tenant) {
      console.error('Failed to create tenant for:', data.orgName);
      return res.status(500).json({
        success: false,
        message: 'Failed to create organization. Please try again.',
        requiresEmailVerification: false,
      } as BusinessSignupResponse);
    }

    const user = await storage.upsertUser({
      email: data.email,
      clerkUserId: clerkUser.id,
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

    if (!user) {
      console.error('Failed to create user for:', data.email);
      return res.status(500).json({
        success: false,
        message: 'Failed to create user account. Please try again.',
        requiresEmailVerification: false,
      } as BusinessSignupResponse);
    }

    try {
      await sendEmailVerification(clerkUser.id);
    } catch (verifyError) {
      console.error('Email verification preparation failed:', verifyError);
    }

    console.log(`Business signup successful: ${data.email} -> Tenant: ${tenant.name} (${tenant.id})`);

    return res.status(201).json({
      success: true,
      message: 'Account created! Please check your email to verify your account.',
      userId: user.id,
      tenantId: tenant.id,
      tenantCode: tenant.tenantCode,
      requiresEmailVerification: true,
    } as BusinessSignupResponse);

  } catch (error: any) {
    console.error('Business signup error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'An unexpected error occurred. Please try again.',
      requiresEmailVerification: false,
    } as BusinessSignupResponse);
  }
});

router.post('/resend-verification', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await storage.getUserByEmail(email);
    if (!user || !user.clerkUserId) {
      return res.status(400).json({ success: false, message: 'Account not found' });
    }

    await sendEmailVerification(user.clerkUserId);

    return res.json({ success: true, message: 'Verification email sent' });
  } catch (error: any) {
    console.error('Resend verification error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send verification email' });
  }
});

export default router;
