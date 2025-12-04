import { Router } from "express";
import { db } from "../db";
import { tenants, users, tenantPlanAssignments, subscriptions, auditEvents } from "../../shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { slugify } from "../../shared/utils";
import { getAuth } from "@clerk/express";

export const clubAuthRouter = Router();

const clubSignupSchema = z.object({
  org_name: z.string().min(2, "Organization name must be at least 2 characters"),
  contact_name: z.string().min(1, "Contact name is required"),
  contact_email: z.string().email("Valid email is required"),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().default("US"),
});

clubAuthRouter.post("/club-signup", async (req: any, res) => {
  try {
    const auth = getAuth(req);
    
    if (!auth?.userId) {
      return res.status(401).json({ error: "Clerk authentication required" });
    }
    
    const clerkUserId = auth.userId;
    const validatedData = clubSignupSchema.parse(req.body);
    
    // Fetch Clerk user info outside of transaction (external API call)
    let clerkEmail = validatedData.contact_email;
    let clerkFirstName = validatedData.contact_name.split(' ')[0];
    let clerkLastName = validatedData.contact_name.split(' ').slice(1).join(' ') || '';
    
    if (process.env.CLERK_SECRET_KEY) {
      try {
        const response = await fetch(`https://api.clerk.com/v1/users/${clerkUserId}`, {
          headers: {
            Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          },
        });
        
        if (response.ok) {
          const clerkUser = await response.json();
          clerkEmail = clerkUser.email_addresses?.[0]?.email_address || clerkEmail;
          clerkFirstName = clerkUser.first_name || clerkFirstName;
          clerkLastName = clerkUser.last_name || clerkLastName;
        }
      } catch (error) {
        console.error('Error fetching Clerk user:', error);
      }
    }
    
    // Wrap all database operations in a transaction for idempotency
    const result = await db.transaction(async (tx) => {
      // Re-check user inside transaction to prevent race conditions
      const existingUser = await tx.query.users.findFirst({
        where: eq(users.clerkUserId, clerkUserId)
      });
      
      if (existingUser?.tenantId) {
        throw new Error("ALREADY_HAS_CLUB");
      }
      
      // Generate unique slug with collision handling inside transaction
      let baseSlug = slugify(validatedData.org_name);
      let slug = baseSlug;
      let counter = 1;
      
      while (true) {
        const existingTenant = await tx.query.tenants.findFirst({
          where: eq(tenants.slug, slug)
        });
        
        if (!existingTenant) break;
        
        slug = `${baseSlug}-${counter}`;
        counter++;
        
        if (counter > 100) {
          throw new Error("SLUG_EXHAUSTED");
        }
      }
      
      // Create tenant
      const tenantResult = await tx.insert(tenants).values({
        name: validatedData.org_name,
        slug: slug,
        subdomain: slug,
        inviteCode: slug,
        contactName: validatedData.contact_name,
        contactEmail: validatedData.contact_email,
        city: validatedData.city || null,
        state: validatedData.state || null,
        country: validatedData.country,
        planLevel: "free",
      }).returning();
      const tenant = tenantResult[0];
      
      // Create subscription
      await tx.insert(subscriptions).values({
        tenantId: tenant.id,
        planKey: "free",
        status: "inactive"
      });
      
      // Create plan assignment
      await tx.insert(tenantPlanAssignments).values({
        tenantId: tenant.id,
        planCode: "free",
        since: new Date(),
        until: null
      });
      
      // Create or update user
      let user: any;
      
      if (existingUser) {
        const userResult = await tx.update(users)
          .set({
            tenantId: tenant.id,
            isAdmin: true,
            isApproved: true,
            registrationStatus: 'approved',
            approvedAt: new Date(),
            firstName: validatedData.contact_name.split(' ')[0] || existingUser.firstName,
            lastName: validatedData.contact_name.split(' ').slice(1).join(' ') || existingUser.lastName,
          })
          .where(eq(users.id, existingUser.id))
          .returning();
        user = userResult[0];
      } else {
        const userResult = await tx.insert(users).values({
          email: clerkEmail,
          clerkUserId: clerkUserId,
          authProvider: 'clerk',
          tenantId: tenant.id,
          isAdmin: true,
          isApproved: true,
          registrationStatus: 'approved',
          approvedAt: new Date(),
          firstName: clerkFirstName,
          lastName: clerkLastName,
        }).returning();
        user = userResult[0];
      }
      
      // Create audit event
      await tx.insert(auditEvents).values({
        tenantId: tenant.id,
        actorUserId: user.id,
        eventType: "tenant_created",
        metadataJson: { 
          slug, 
          org_name: validatedData.org_name,
          method: "clerk_club_signup"
        }
      });
      
      return { tenant, user, slug };
    });
    
    console.log(`Created club "${result.tenant.name}" (slug: ${result.slug}) for Clerk user ${clerkUserId}`);
    
    res.json({
      success: true,
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
        inviteCode: result.tenant.inviteCode,
      },
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: 'owner',
      }
    });
    
  } catch (error: any) {
    console.error("Club signup error:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Invalid data", 
        details: error.errors 
      });
    }
    
    if (error.message === "ALREADY_HAS_CLUB") {
      return res.status(400).json({ 
        error: "You already have a club. Each account can only create one club." 
      });
    }
    
    if (error.message === "SLUG_EXHAUSTED") {
      return res.status(400).json({ 
        error: "Unable to generate unique slug. Try a different name." 
      });
    }
    
    res.status(500).json({ error: "Failed to create club" });
  }
});

// Validate invite code (public endpoint)
clubAuthRouter.get("/validate-invite-code", async (req, res) => {
  try {
    const code = (req.query.code as string)?.toLowerCase();
    
    if (!code) {
      return res.status(400).json({ valid: false, error: "Code is required" });
    }
    
    // Look up tenant by slug or inviteCode
    const tenant = await db.query.tenants.findFirst({
      where: (tenants, { or, eq }) => or(
        eq(tenants.slug, code),
        eq(tenants.inviteCode, code)
      )
    });
    
    if (!tenant) {
      return res.status(404).json({ valid: false, error: "No club found with that code" });
    }
    
    res.json({
      valid: true,
      clubName: tenant.name,
      slug: tenant.slug,
    });
    
  } catch (error) {
    console.error("Error validating invite code:", error);
    res.status(500).json({ valid: false, error: "Failed to validate code" });
  }
});

// Join club endpoint - links authenticated Clerk user to a tenant
clubAuthRouter.post("/join-club", async (req: any, res) => {
  try {
    const auth = getAuth(req);
    
    if (!auth?.userId) {
      return res.status(401).json({ error: "Clerk authentication required" });
    }
    
    const clerkUserId = auth.userId;
    const { code, role } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: "Invite code is required" });
    }
    
    const validRole = role === 'player' ? 'player' : 'parent';
    
    // Fetch Clerk user info
    let clerkEmail = '';
    let clerkFirstName = '';
    let clerkLastName = '';
    
    if (process.env.CLERK_SECRET_KEY) {
      try {
        const response = await fetch(`https://api.clerk.com/v1/users/${clerkUserId}`, {
          headers: {
            Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          },
        });
        
        if (response.ok) {
          const clerkUser = await response.json();
          clerkEmail = clerkUser.email_addresses?.[0]?.email_address || '';
          clerkFirstName = clerkUser.first_name || '';
          clerkLastName = clerkUser.last_name || '';
        }
      } catch (error) {
        console.error('Error fetching Clerk user:', error);
      }
    }
    
    // Wrap in transaction
    const result = await db.transaction(async (tx) => {
      // Find tenant
      const tenant = await tx.query.tenants.findFirst({
        where: (tenants, { or, eq }) => or(
          eq(tenants.slug, code.toLowerCase()),
          eq(tenants.inviteCode, code.toLowerCase())
        )
      });
      
      if (!tenant) {
        throw new Error("INVALID_CODE");
      }
      
      // Check if user already exists
      const existingUser = await tx.query.users.findFirst({
        where: eq(users.clerkUserId, clerkUserId)
      });
      
      let user: any;
      
      if (existingUser) {
        // User exists - check if already in a tenant
        if (existingUser.tenantId) {
          // Allow multi-tenant membership in the future
          // For now, update their tenant
          if (existingUser.tenantId !== tenant.id) {
            throw new Error("ALREADY_IN_CLUB");
          }
          user = existingUser;
        } else {
          // Update user with tenant
          const userResult = await tx.update(users)
            .set({
              tenantId: tenant.id,
              role: validRole,
              isApproved: false, // Requires admin approval
              registrationStatus: 'pending',
            })
            .where(eq(users.id, existingUser.id))
            .returning();
          user = userResult[0];
        }
      } else {
        // Create new user
        const userResult = await tx.insert(users).values({
          email: clerkEmail,
          clerkUserId: clerkUserId,
          authProvider: 'clerk',
          tenantId: tenant.id,
          role: validRole,
          isApproved: false,
          registrationStatus: 'pending',
          firstName: clerkFirstName,
          lastName: clerkLastName,
        }).returning();
        user = userResult[0];
      }
      
      // Create audit event
      await tx.insert(auditEvents).values({
        tenantId: tenant.id,
        actorUserId: user.id,
        eventType: "user_joined",
        metadataJson: { 
          method: "clerk_join_code",
          role: validRole,
        }
      });
      
      return { tenant, user };
    });
    
    console.log(`User ${clerkUserId} joined club "${result.tenant.name}" as ${validRole}`);
    
    res.json({
      success: true,
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
      },
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
        isApproved: result.user.isApproved,
      },
      requiresApproval: !result.user.isApproved,
    });
    
  } catch (error: any) {
    console.error("Join club error:", error);
    
    if (error.message === "INVALID_CODE") {
      return res.status(404).json({ error: "No club found with that code" });
    }
    
    if (error.message === "ALREADY_IN_CLUB") {
      return res.status(400).json({ error: "You're already a member of a different club" });
    }
    
    res.status(500).json({ error: "Failed to join club" });
  }
});

export default clubAuthRouter;
