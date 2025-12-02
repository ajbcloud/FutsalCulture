import type { Express } from "express";
import { randomToken, slugify, generateTenantCode } from "../shared/utils";
import { 
  tenants, 
  tenantMemberships,
  invites,
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
import { eq, and, isNull } from "drizzle-orm";
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
      const [tenant] = await db.insert(tenants).values({
        name: org_name,
        subdomain: slug,
        city: city || null,
        state: state || null,
        country: country || "US",
        slug,
        tenantCode,
        contactName: contact_name,
        contactEmail: contact_email,
        planLevel: "free", // Always start new tenants on free plan
      }).returning();

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

      // Record audit event
      await db.insert(auditEvents).values({
        tenantId: tenant.id,
        eventType: "tenant_created",
        metadataJson: { slug, org_name }
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
        eventType: "invite_sent",
        targetId: invite.id,
        metadataJson: { email, role }
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
        actorUserId: user_id,
        eventType: "invite_accepted",
        targetId: invite.id
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

      // Find tenant by code
      const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.tenantCode, tenant_code.toUpperCase())
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
          recipientType: 'admins',
          subject: 'Minor Access Request Requires Approval',
          body: `A minor (age ${age}) has requested to join your organization:\n\nName: ${user.firstName} ${user.lastName}\nEmail: ${email}\nRole: ${role}\n\nPlease review and approve this request in the admin panel.`,
          status: 'pending'
        });

        // Notify guardian if email provided
        if (guardian_email) {
          await db.insert(notifications).values({
            tenantId: tenant.id,
            type: 'email',
            recipientEmail: guardian_email,
            recipientType: 'custom',
            subject: 'Minor Access Request Pending Approval',
            body: `${user.firstName} ${user.lastName} (age ${age}) has requested to join ${tenant.name}.\n\nThis request is pending approval from the organization administrators. You will be notified when the request is approved or denied.`,
            status: 'pending'
          });
        }

        // Record audit event
        await db.insert(auditEvents).values({
          tenantId: tenant.id,
          actorUserId: user_id,
          eventType: "join_request_pending",
          metadataJson: { email, role, age, isMinor: true, guardianEmail: guardian_email || null }
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
          actorUserId: user_id,
          eventType: "joined_by_code",
          metadataJson: { email, role, age }
        });

        res.json({ success: true, tenantId: tenant.id });
      }

    } catch (error) {
      console.error("Beta join-by-code error:", error);
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