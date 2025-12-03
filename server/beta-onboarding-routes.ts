import type { Express } from "express";
import { randomToken, slugify, generateTenantCode } from "../shared/utils";
import { 
  tenants, 
  tenantMemberships,
  invites,
  inviteCodes,
  emailVerifications, 
  subscriptions,
  auditEvents,
  insertInviteSchema,
  insertEmailVerificationSchema,
  insertSubscriptionSchema,
  insertAuditEventSchema
} from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { eq, and, isNull, sql } from "drizzle-orm";
import { createOrganizationForTenant, isClerkEnabled } from "./services/clerkOrganizationService";

export function setupBetaOnboardingRoutes(app: Express) {
  
  // Get started - create new tenant/organization
  app.post('/api/beta/get-started', async (req, res) => {
    try {
      const { org_name, contact_name, contact_email, city, state, country } = req.body;
      
      if (!org_name || !contact_name || !contact_email) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Generate unique slug and tenant code
      const baseSlug = slugify(org_name);
      let slug = baseSlug;
      let counter = 1;
      
      while (await db.query.tenants.findFirst({ where: eq(tenants.subdomain, slug) })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      
      const tenantCode = generateTenantCode();

      // Create tenant
      const tenantResult = await db.insert(tenants).values({
        name: org_name,
        subdomain: slug,
        city: city || null,
        state: state || null,
        country: country || "US",
        slug,
        tenantCode,
        contactName: contact_name,
        contactEmail: contact_email,
        inviteCode: slug.toUpperCase(), // Legacy field - use slug as invite code
        planLevel: "free", // Always start new tenants on free plan
      }).returning() as any[];
      const tenant = tenantResult[0];
      if (!tenant) {
        return res.status(500).json({ error: "Failed to create tenant" });
      }

      // Create subscription record (free plan)
      await db.insert(subscriptions).values({
        tenantId: tenant.id,
        planKey: "free",
        status: "inactive"
      });

      // Create tenant plan assignment (free plan) - CRITICAL for feature access
      const { tenantPlanAssignments } = await import('@shared/schema');
      await db.insert(tenantPlanAssignments).values({
        tenantId: tenant.id,
        planCode: "free",
        since: new Date(),
        until: null
      });

      // Create default invite code using the slug
      await db.insert(inviteCodes).values({
        tenantId: tenant.id,
        code: slug.toUpperCase(),
        codeType: "invite",
        description: "Default organization invite code",
        isDefault: true,
        isActive: true,
      });

      // Record audit event
      await db.insert(auditEvents).values({
        tenantId: tenant.id,
        action: "create",
        resourceType: "tenant",
        resourceId: tenant.id,
        details: { slug, org_name }
      });

      // Create Clerk organization for tenant
      if (isClerkEnabled()) {
        try {
          await createOrganizationForTenant(tenant.id);
        } catch (clerkError) {
          console.error(`⚠️ Failed to create Clerk organization for tenant ${tenant.id}:`, clerkError);
        }
      }

      res.json({ 
        success: true, 
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode 
      });

    } catch (error) {
      console.error("Beta get-started error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create club for Clerk-authenticated users
  app.post('/api/beta/clerk-create-club', async (req, res) => {
    try {
      // Verify Clerk authentication
      const { getAuth } = await import('@clerk/express');
      const auth = getAuth(req);
      
      if (!auth || !auth.userId) {
        return res.status(401).json({ error: "Authentication required. Please sign in first." });
      }
      
      const clerk_user_id = auth.userId;
      const { org_name, join_code, contact_name, city, state, country, zip_code, sports } = req.body;
      
      if (!org_name || !contact_name) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Validate join_code if provided
      if (!join_code || typeof join_code !== 'string') {
        return res.status(400).json({ error: "Join code is required" });
      }
      
      const sanitizedCode = join_code.toLowerCase().replace(/[^a-z0-9-]/g, '');
      if (sanitizedCode.length < 3) {
        return res.status(400).json({ error: "Join code must be at least 3 characters" });
      }
      if (sanitizedCode.length > 30) {
        return res.status(400).json({ error: "Join code must be 30 characters or less" });
      }
      if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]{1,2}$/.test(sanitizedCode)) {
        return res.status(400).json({ error: "Join code must start and end with a letter or number" });
      }

      // Check if join code is already taken
      const existingTenant = await db.query.tenants.findFirst({ 
        where: eq(tenants.subdomain, sanitizedCode) 
      });
      if (existingTenant) {
        return res.status(409).json({ 
          error: "This join code is already taken. Please choose a different one.",
          field: "join_code"
        });
      }

      // Get user's email from Clerk
      let userEmail = '';
      if (process.env.CLERK_SECRET_KEY) {
        try {
          const response = await fetch(`https://api.clerk.com/v1/users/${clerk_user_id}`, {
            headers: {
              Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
            },
          });
          if (response.ok) {
            const clerkUser = await response.json();
            userEmail = clerkUser.email_addresses?.[0]?.email_address || '';
          }
        } catch (e) {
          console.error('Error fetching Clerk user:', e);
        }
      }

      // Use the sanitized join_code as both slug and tenantCode
      const slug = sanitizedCode;
      const tenantCode = sanitizedCode;

      // Create tenant
      const tenantResult = await db.insert(tenants).values({
        name: org_name,
        subdomain: slug,
        city: city || null,
        state: state || null,
        country: country || "US",
        slug,
        tenantCode,
        contactName: contact_name,
        contactEmail: userEmail,
        inviteCode: slug.toUpperCase(), // Legacy field - use slug as invite code
        planLevel: "free",
      }).returning() as any[];
      const tenant = tenantResult[0];
      if (!tenant) {
        return res.status(500).json({ error: "Failed to create tenant" });
      }

      // Import required tables
      const { tenantPlanAssignments, users } = await import('@shared/schema');

      // Create plan assignment
      await db.insert(tenantPlanAssignments).values({
        tenantId: tenant.id,
        planCode: "free",
        since: new Date(),
        until: null
      });

      // Create default invite code using the slug
      await db.insert(inviteCodes).values({
        tenantId: tenant.id,
        code: slug.toUpperCase(),
        codeType: "invite",
        description: "Default organization invite code",
        isDefault: true,
        isActive: true,
      });

      // Create or find user with Clerk ID
      let existingUser = await db.query.users.findFirst({
        where: eq(users.clerkUserId, clerk_user_id)
      });

      let currentUser: { id: string; email: string };

      if (!existingUser) {
        // Create new user
        const userResult = await db.insert(users).values({
          tenantId: tenant.id,
          email: userEmail,
          firstName: contact_name.split(' ')[0] || contact_name,
          lastName: contact_name.split(' ').slice(1).join(' ') || '',
          role: 'tenant_admin',
          status: 'active',
          clerkUserId: clerk_user_id,
          emailVerifiedAt: new Date(),
        }).returning() as any[];
        currentUser = userResult[0];
      } else {
        // Update existing user with tenant and admin role
        await db.update(users)
          .set({ 
            tenantId: tenant.id, 
            role: 'tenant_admin',
            status: 'active'
          })
          .where(eq(users.id, existingUser.id));
        currentUser = { id: existingUser.id, email: existingUser.email || userEmail };
      }

      // Create tenant membership
      await db.insert(tenantMemberships).values({
        tenantId: tenant.id,
        userId: currentUser.id,
        role: 'admin',
        status: 'active'
      } as any);

      // Record audit event
      await db.insert(auditEvents).values({
        tenantId: tenant.id,
        userId: currentUser.id,
        action: "create",
        resourceType: "tenant",
        resourceId: tenant.id,
        details: { slug, org_name, clerkUserId: clerk_user_id }
      });

      // Create Clerk organization for tenant and add user as admin
      if (isClerkEnabled()) {
        try {
          const clerkOrg = await createOrganizationForTenant(tenant.id);
          if (clerkOrg) {
            // Add user to the Clerk organization as admin
            const { addMemberToOrganization } = await import('./services/clerkOrganizationService');
            await addMemberToOrganization(clerkOrg.id, clerk_user_id, 'admin');
            console.log(`✅ Added Clerk user ${clerk_user_id} to org ${clerkOrg.id} as admin`);
          }
        } catch (clerkError) {
          console.error(`⚠️ Failed to create Clerk organization for tenant ${tenant.id}:`, clerkError);
        }
      }

      res.json({ 
        success: true, 
        tenantId: tenant.id,
        tenantName: tenant.name,
        tenantCode: tenant.tenantCode,
        userId: currentUser.id
      });

    } catch (error) {
      console.error("Clerk create-club error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Send invitation
  app.post('/api/beta/invites', async (req, res) => {
    try {
      const { tenant_id, email, role, invited_by_user_id } = req.body;
      
      if (!tenant_id || !email || !role) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const token = randomToken(48);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const [invite] = await db.insert(invites).values({
        tenantId: tenant_id,
        email,
        role,
        token,
        expiresAt,
        invitedByUserId: invited_by_user_id || null,
        channel: "email"
      }).returning();

      // Record audit event
      await db.insert(auditEvents).values({
        tenantId: tenant_id,
        action: "create",
        resourceType: "invite",
        resourceId: invite.id,
        details: { email, role }
      });

      res.json({ 
        success: true, 
        inviteId: invite.id,
        token: invite.token 
      });

    } catch (error) {
      console.error("Beta invite error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Accept invitation
  app.post('/api/beta/join-by-token', async (req, res) => {
    try {
      const { token, user_id } = req.body;
      
      if (!token || !user_id) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Find valid invite
      const invite = await db.query.invites.findFirst({
        where: and(
          eq(invites.token, token),
          isNull(invites.usedAt)
        )
      });

      if (!invite) {
        return res.status(400).json({ error: "Invalid or expired invitation" });
      }

      if (new Date() > invite.expiresAt) {
        return res.status(400).json({ error: "Invitation has expired" });
      }

      // Create tenant membership
      await db.insert(tenantMemberships).values({
        tenantId: invite.tenantId,
        userId: user_id,
        role: invite.role as any,
        status: 'active'
      });

      // Mark invite as used
      await db.update(invites)
        .set({ usedAt: new Date() })
        .where(eq(invites.id, invite.id));

      // Record audit event
      await db.insert(auditEvents).values({
        tenantId: invite.tenantId,
        userId: user_id,
        action: "accept",
        resourceType: "invite",
        resourceId: invite.id
      });

      res.json({ success: true, tenantId: invite.tenantId });

    } catch (error) {
      console.error("Beta join-by-token error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Join by tenant code (with age-aware approval logic)
  app.post('/api/beta/join-by-code', async (req, res) => {
    try {
      const { tenant_code, email, role, user_id, date_of_birth, guardian_email } = req.body;
      
      if (!tenant_code || !email || !role || !user_id) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Find tenant by code (case-insensitive)
      const normalizedCode = tenant_code.toLowerCase().trim();
      const tenant = await db.query.tenants.findFirst({
        where: sql`LOWER(${tenants.tenantCode}) = ${normalizedCode}`
      });

      if (!tenant) {
        return res.status(404).json({ error: "Organization not found" });
      }

      // Check if user already a member
      const existingMember = await db.query.tenantMemberships.findFirst({
        where: and(
          eq(tenantMemberships.tenantId, tenant.id),
          eq(tenantMemberships.userId, user_id)
        )
      });

      if (existingMember) {
        return res.status(400).json({ error: "Already a member of this organization" });
      }

      // Get user record
      const { users } = await import('@shared/schema');
      const user = await db.query.users.findFirst({
        where: eq(users.id, user_id)
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Calculate age if dateOfBirth is provided
      let isMinor = false;
      let age = null;
      
      if (date_of_birth) {
        const birthDate = new Date(date_of_birth);
        const today = new Date();
        age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        
        isMinor = age < 18;
        
        // Update user's dateOfBirth
        await db.update(users)
          .set({ dateOfBirth: date_of_birth })
          .where(eq(users.id, user_id));
      }

      // If minor, require approval
      if (isMinor) {
        // Create pending tenant membership
        await db.insert(tenantMemberships).values({
          tenantId: tenant.id,
          userId: user_id,
          role: role as any, // role enum conversion
          status: 'pending'
        });

        // Update user to pending status
        await db.update(users)
          .set({ 
            registrationStatus: 'pending',
            isApproved: false
          })
          .where(eq(users.id, user_id));

        // Create notification for admins
        const { notifications } = await import('@shared/schema');
        await db.insert(notifications).values({
          tenantId: tenant.id,
          type: 'email',
          recipient: 'admins',
          subject: 'Minor Access Request Requires Approval',
          message: `A minor (age ${age}) has requested to join your organization:\n\nName: ${user.firstName} ${user.lastName}\nEmail: ${email}\nRole: ${role}\n\nPlease review and approve this request in the admin panel.`,
          status: 'pending'
        });

        // Notify guardian if email provided
        if (guardian_email) {
          await db.insert(notifications).values({
            tenantId: tenant.id,
            type: 'email',
            recipient: guardian_email,
            subject: 'Minor Access Request Pending Approval',
            message: `${user.firstName} ${user.lastName} (age ${age}) has requested to join ${tenant.name}.\n\nThis request is pending approval from the organization administrators. You will be notified when the request is approved or denied.`,
            status: 'pending'
          });
        }

        // Record audit event
        await db.insert(auditEvents).values({
          tenantId: tenant.id,
          userId: user_id,
          action: "request",
          resourceType: "membership",
          details: { email, role, age, isMinor: true, guardianEmail: guardian_email || null }
        });

        res.json({ 
          success: true, 
          tenantId: tenant.id,
          requiresApproval: true,
          message: "Your request has been submitted for approval. An administrator will review it shortly."
        });

      } else {
        // Adult or no age provided - proceed with normal flow
        // Create active tenant membership
        await db.insert(tenantMemberships).values({
          tenantId: tenant.id,
          userId: user_id,
          role: role as any, // role enum conversion
          status: 'active'
        });

        // Update user to approved if they weren't already
        if (!user.isApproved) {
          await db.update(users)
            .set({ 
              registrationStatus: 'approved',
              isApproved: true,
              approvedAt: new Date()
            })
            .where(eq(users.id, user_id));
        }

        // Record audit event
        await db.insert(auditEvents).values({
          tenantId: tenant.id,
          userId: user_id,
          action: "join",
          resourceType: "membership",
          details: { email, role, age }
        });

        // Add user to tenant's Clerk organization if applicable
        if (tenant.clerkOrganizationId && user.clerkUserId) {
          try {
            const { addMemberToOrganization, isClerkEnabled } = await import('./services/clerkOrganizationService');
            if (isClerkEnabled()) {
              await addMemberToOrganization(
                tenant.clerkOrganizationId, 
                user.clerkUserId,
                role === 'tenant_admin' ? 'admin' : 'basic_member'
              );
              console.log(`✅ Added user ${user.clerkUserId} to Clerk org ${tenant.clerkOrganizationId}`);
            }
          } catch (clerkError) {
            console.error(`⚠️ Failed to add user to Clerk organization:`, clerkError);
            // Don't fail the join if Clerk addition fails
          }
        }

        res.json({ success: true, tenantId: tenant.id });
      }

    } catch (error) {
      console.error("Beta join-by-code error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Join by code for Clerk-authenticated users (no existing PlayHQ user required)
  // This endpoint requires Clerk authentication
  app.post('/api/beta/clerk-join-by-code', async (req, res) => {
    try {
      // Verify Clerk authentication and get the real clerk_user_id from the session
      const { getAuth } = await import('@clerk/express');
      const auth = getAuth(req);
      
      if (!auth || !auth.userId) {
        return res.status(401).json({ error: "Authentication required. Please sign in first." });
      }
      
      // Use the authenticated clerk_user_id from the session, NOT from the request body
      const clerk_user_id = auth.userId;
      
      const { tenant_code, email, first_name, last_name, role = 'parent' } = req.body;
      
      if (!tenant_code) {
        return res.status(400).json({ error: "Missing tenant code" });
      }
      
      // If email not provided, fetch from Clerk
      let userEmail = email;
      if (!userEmail && process.env.CLERK_SECRET_KEY) {
        try {
          const response = await fetch(`https://api.clerk.com/v1/users/${clerk_user_id}`, {
            headers: {
              Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
            },
          });
          if (response.ok) {
            const clerkUser = await response.json();
            userEmail = clerkUser.email_addresses?.[0]?.email_address;
          }
        } catch (e) {
          console.error('Error fetching Clerk user:', e);
        }
      }
      
      if (!userEmail) {
        return res.status(400).json({ error: "Could not determine email address" });
      }

      // Find tenant by code (case-insensitive, try tenantCode first, then inviteCode)
      const normalizedCode = tenant_code.toLowerCase().trim();
      let tenant = await db.query.tenants.findFirst({
        where: sql`LOWER(${tenants.tenantCode}) = ${normalizedCode}`
      });
      
      if (!tenant) {
        tenant = await db.query.tenants.findFirst({
          where: sql`LOWER(${tenants.inviteCode}) = ${normalizedCode}`
        });
      }

      if (!tenant) {
        return res.status(404).json({ error: "Organization not found. Please check your code and try again." });
      }

      // Check if user already exists by clerkUserId
      const { users } = await import('@shared/schema');
      let user = await db.query.users.findFirst({
        where: eq(users.clerkUserId, clerk_user_id)
      });

      // If not, check by email
      if (!user) {
        user = await db.query.users.findFirst({
          where: eq(users.email, userEmail.toLowerCase())
        });
      }

      // Create user if they don't exist
      let currentUser: NonNullable<typeof user>;
      if (!user) {
        const insertResult = await db.insert(users).values({
          email: userEmail.toLowerCase(),
          firstName: first_name || userEmail.split('@')[0],
          lastName: last_name || '',
          clerkUserId: clerk_user_id,
          tenantId: tenant.id,
          role: role as any,
          authProvider: 'clerk',
          verificationStatus: 'verified',
          isApproved: true,
          approvedAt: new Date(),
        }).returning() as any[];
        const newUser = insertResult[0];
        if (!newUser) {
          return res.status(500).json({ error: "Failed to create user" });
        }
        currentUser = newUser;
        console.log(`✅ Created new PlayHQ user for Clerk user ${clerk_user_id}`);
      } else {
        currentUser = user;
        // Update existing user with clerkUserId if not set
        if (!currentUser.clerkUserId) {
          await db.update(users)
            .set({ clerkUserId: clerk_user_id })
            .where(eq(users.id, currentUser.id));
        }
        // Update tenantId if not set
        if (!currentUser.tenantId) {
          await db.update(users)
            .set({ tenantId: tenant.id })
            .where(eq(users.id, currentUser.id));
        }
      }

      // Check if already a member
      const existingMembership = await db.query.tenantMemberships.findFirst({
        where: and(
          eq(tenantMemberships.tenantId, tenant.id),
          eq(tenantMemberships.userId, currentUser.id)
        )
      });

      if (!existingMembership) {
        // Create tenant membership
        await db.insert(tenantMemberships).values({
          tenantId: tenant.id,
          userId: currentUser.id,
          role: role as any,
          status: 'active'
        });
      }

      // Add user to tenant's Clerk organization (create org if needed)
      let finalClerkOrgId: string | null = null;
      try {
        const { addMemberToOrganization, isClerkEnabled, createOrganizationForTenant: createClerkOrg } = await import('./services/clerkOrganizationService');
        if (isClerkEnabled()) {
          let clerkOrgId = tenant.clerkOrganizationId;
          
          // Create Clerk org if tenant doesn't have one yet
          if (!clerkOrgId) {
            console.log(`⚠️ Tenant ${tenant.name} has no Clerk org, creating one...`);
            const createdOrg = await createClerkOrg(tenant.id);
            clerkOrgId = createdOrg?.id || null;
            if (clerkOrgId) {
              console.log(`✅ Created Clerk org ${clerkOrgId} for tenant ${tenant.name}`);
            }
          }
          
          if (clerkOrgId) {
            await addMemberToOrganization(
              clerkOrgId, 
              clerk_user_id,
              role === 'tenant_admin' ? 'admin' : 'basic_member'
            );
            console.log(`✅ Added Clerk user ${clerk_user_id} to org ${clerkOrgId}`);
            finalClerkOrgId = clerkOrgId;
          }
        }
      } catch (clerkError: any) {
        // Ignore "already a member" errors but still capture the orgId
        if (!clerkError.message?.includes('already') && !clerkError.message?.includes('exists')) {
          console.error(`⚠️ Failed to add user to Clerk organization:`, clerkError);
        }
        // Still try to return the org ID even if "already a member"
        finalClerkOrgId = tenant.clerkOrganizationId || null;
      }

      // Record audit event
      await db.insert(auditEvents).values({
        tenantId: tenant.id,
        userId: currentUser.id,
        action: "join",
        resourceType: "membership",
        details: { email: userEmail, role, clerkUserId: clerk_user_id }
      });

      res.json({ 
        success: true, 
        tenantId: tenant.id,
        tenantName: tenant.name,
        userId: currentUser.id,
        clerkOrgId: finalClerkOrgId
      });

    } catch (error) {
      console.error("Clerk join-by-code error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Switch active tenant
  app.post('/api/beta/switch-tenant', async (req, res) => {
    try {
      const { tenant_id, user_id } = req.body;
      
      if (!tenant_id || !user_id) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Verify user is member of tenant
      const membership = await db.query.tenantMemberships.findFirst({
        where: and(
          eq(tenantMemberships.tenantId, tenant_id),
          eq(tenantMemberships.userId, user_id)
        )
      });

      if (!membership) {
        return res.status(403).json({ error: "Not a member of this organization" });
      }

      // In a real implementation, you'd update the user's session here
      // For now, just return success
      res.json({ success: true, activeTenantId: tenant_id });

    } catch (error) {
      console.error("Beta switch-tenant error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get user's tenants
  app.get('/api/beta/user-tenants/:user_id', async (req, res) => {
    try {
      const { user_id } = req.params;
      
      if (!user_id) {
        return res.status(400).json({ error: "Missing user ID" });
      }

      const userTenants = await db.query.tenantMemberships.findMany({
        where: eq(tenantMemberships.userId, user_id)
      });

      // Get tenant details separately
      const tenantsData = await Promise.all(
        userTenants.map(async (ut) => {
          const tenant = await db.query.tenants.findFirst({
            where: eq(tenants.id, ut.tenantId)
          });
          return {
            id: ut.tenantId,
            name: tenant?.name || "Unknown",
            role: ut.role,
            joinedAt: ut.createdAt
          };
        })
      );

      res.json({ 
        success: true, 
        tenants: tenantsData
      });

    } catch (error) {
      console.error("Beta user-tenants error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}