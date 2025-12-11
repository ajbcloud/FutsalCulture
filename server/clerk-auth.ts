import { clerkMiddleware, getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { db } from "./db";
import { tenants, subscriptions, tenantPlanAssignments, users, coachTenantAssignments } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { slugify, generateTenantCode } from "@shared/utils";
import { nanoid } from "nanoid";
import { getOrCreateStagingTenant, getStagingTenantId } from "./utils/staging-tenant";

export { clerkMiddleware };

const clerkUserCache = new Map<string, { user: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Generate a unique tenant name by checking for duplicates and adding a 4-digit suffix if needed
async function generateUniqueTenantName(baseName: string, tx?: any): Promise<string> {
  const dbContext = tx || db;
  
  // Check if the base name already exists
  const existing = await dbContext.select({ name: tenants.name })
    .from(tenants)
    .where(eq(tenants.name, baseName))
    .limit(1);
  
  if (existing.length === 0) {
    // Base name is unique, use it
    return baseName;
  }
  
  // Name exists, need to add a unique suffix
  // Try up to 50 times to find an available name with 4-digit suffix
  for (let i = 0; i < 50; i++) {
    const suffix = Math.floor(1000 + Math.random() * 9000); // 4-digit random number (1000-9999)
    const uniqueName = `${baseName} (${suffix})`;
    
    const check = await dbContext.select({ name: tenants.name })
      .from(tenants)
      .where(eq(tenants.name, uniqueName))
      .limit(1);
    
    if (check.length === 0) {
      return uniqueName;
    }
  }
  
  // Fallback: use nanoid for guaranteed uniqueness
  return `${baseName} (${nanoid(6)})`;
}

// Create a tenant for an existing user who doesn't have one yet
// Updates the existing user to be admin of the new tenant
async function createTenantForExistingUser(
  existingUser: typeof users.$inferSelect,
  userData: {
    clerkUserId: string;
    firstName?: string | null;
    lastName?: string | null;
    profileImageUrl?: string | null;
  }
): Promise<{ tenant: typeof tenants.$inferSelect; user: typeof users.$inferSelect }> {
  const { clerkUserId, firstName, lastName, profileImageUrl } = userData;
  const email = existingUser.email || '';
  
  // Generate a unique tenant name based on name or email
  const baseName = firstName && lastName 
    ? `${firstName}'s Club` 
    : email 
      ? `${email.split('@')[0]}'s Club`
      : `New Club`;
  
  const baseSlug = slugify(baseName);
  
  // Retry loop with increasing entropy for handling unique constraint violations
  const MAX_RETRIES = 10;
  let lastError: any;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      // Generate unique identifiers with increasing entropy per attempt
      let slug: string;
      if (attempt === 0) {
        slug = baseSlug;
      } else if (attempt < 3) {
        slug = `${baseSlug}-${nanoid(4)}`;
      } else if (attempt < 6) {
        slug = `${baseSlug}-${nanoid(8)}`;
      } else {
        slug = `club-${nanoid(12)}`;
      }
      
      const tenantCode = generateTenantCode() + (attempt >= 3 ? nanoid(4) : '');
      const inviteCode = generateTenantCode() + (attempt >= 3 ? nanoid(4) : '');
      
      return await db.transaction(async (tx) => {
        // Generate unique name with suffix if duplicate exists
        const uniqueName = await generateUniqueTenantName(baseName, tx);
        
        // Create tenant with displayName for UI and unique name for DB
        const tenantResult = await tx.insert(tenants).values({
          name: uniqueName, // Unique internal name
          displayName: baseName, // Original user-entered name for display
          slug: slug,
          subdomain: slug,
          tenantCode: tenantCode,
          inviteCode: inviteCode,
          contactName: firstName && lastName ? `${firstName} ${lastName}` : null,
          contactEmail: email,
          planLevel: "free",
        }).returning();
        const tenant = (tenantResult as any[])[0];
        
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
        
        // Update existing user to be admin of this tenant
        const userResult = await tx.update(users)
          .set({
            clerkUserId,
            authProvider: 'clerk',
            tenantId: tenant.id,
            isAdmin: true,
            isApproved: true,
            registrationStatus: 'approved',
            approvedAt: new Date(),
            firstName: firstName || existingUser.firstName,
            lastName: lastName || existingUser.lastName,
            profileImageUrl: profileImageUrl || existingUser.profileImageUrl,
          })
          .where(eq(users.id, existingUser.id))
          .returning();
        const user = (userResult as any[])[0];
        
        return { tenant, user };
      });
    } catch (error: any) {
      lastError = error;
      
      const isUniqueViolation = error?.code === '23505' || 
        error?.message?.includes('unique constraint') ||
        error?.message?.includes('duplicate key');
      
      if (isUniqueViolation && attempt < MAX_RETRIES - 1) {
        console.log(`Tenant creation for existing user attempt ${attempt + 1} failed, retrying...`);
        continue;
      }
      
      throw error;
    }
  }
  
  throw lastError || new Error('Failed to create tenant after maximum retries');
}

// Auto-create a tenant for a new user signing up
// First user becomes admin of their auto-generated club
// Uses retry loop with increasing randomness for concurrent safety
async function autoCreateTenantForUser(userData: {
  email: string;
  clerkUserId: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}): Promise<{ tenant: typeof tenants.$inferSelect; user: typeof users.$inferSelect }> {
  const { email, clerkUserId, firstName, lastName, profileImageUrl } = userData;
  
  // Generate a unique tenant name based on email or name
  const baseName = firstName && lastName 
    ? `${firstName}'s Club` 
    : email 
      ? `${email.split('@')[0]}'s Club`
      : `New Club`;
  
  const baseSlug = slugify(baseName);
  
  // Retry loop with increasing entropy for handling unique constraint violations
  const MAX_RETRIES = 10;
  let lastError: any;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      // Generate unique identifiers with increasing entropy per attempt
      let slug: string;
      if (attempt === 0) {
        slug = baseSlug;
      } else if (attempt < 3) {
        // Early retries: use base slug with small random suffix
        slug = `${baseSlug}-${nanoid(4)}`;
      } else if (attempt < 6) {
        // Medium retries: use base slug with larger random suffix
        slug = `${baseSlug}-${nanoid(8)}`;
      } else {
        // Final retries: use fully random slug to guarantee progress
        slug = `club-${nanoid(12)}`;
      }
      
      // Generate codes with entropy that increases on later retries
      const tenantCode = generateTenantCode() + (attempt >= 3 ? nanoid(4) : '');
      const inviteCode = generateTenantCode() + (attempt >= 3 ? nanoid(4) : '');
      
      // Use transaction for atomic creation with optimistic uniqueness
      return await db.transaction(async (tx) => {
        // Generate unique name with suffix if duplicate exists
        const uniqueName = await generateUniqueTenantName(baseName, tx);
        
        // Create tenant with displayName for UI and unique name for DB
        const tenantResult = await tx.insert(tenants).values({
          name: uniqueName, // Unique internal name
          displayName: baseName, // Original user-entered name for display
          slug: slug,
          subdomain: slug,
          tenantCode: tenantCode,
          inviteCode: inviteCode,
          contactName: firstName && lastName ? `${firstName} ${lastName}` : null,
          contactEmail: email,
          planLevel: "free",
        }).returning();
        const tenant = (tenantResult as any[])[0];
        
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
        
        // Create user as admin of this tenant
        // IMPORTANT: isAdmin=true for tenant creator, isSuperAdmin is NEVER set in code
        const userResult = await tx.insert(users).values({
          email,
          clerkUserId,
          authProvider: 'clerk',
          tenantId: tenant.id,
          isAdmin: true, // First user is admin of their club
          isSuperAdmin: false, // NEVER set to true in code
          isApproved: true,
          registrationStatus: 'approved',
          approvedAt: new Date(),
          firstName: firstName || null,
          lastName: lastName || null,
          profileImageUrl: profileImageUrl || null,
        }).returning();
        const user = (userResult as any[])[0];
        
        return { tenant, user };
      });
    } catch (error: any) {
      lastError = error;
      
      // Check if this is a unique constraint violation (retry with new identifiers)
      const isUniqueViolation = error?.code === '23505' || 
        error?.message?.includes('unique constraint') ||
        error?.message?.includes('duplicate key');
      
      if (isUniqueViolation && attempt < MAX_RETRIES - 1) {
        console.log(`Tenant creation attempt ${attempt + 1} failed due to uniqueness conflict, retrying with higher entropy...`);
        continue;
      }
      
      // Non-retryable error or max retries exceeded
      throw error;
    }
  }
  
  // Should not reach here, but throw last error if we do
  throw lastError || new Error('Failed to create tenant after maximum retries');
}

// Create an unaffiliated user assigned to the staging tenant
// Used when users sign up without joining a specific club
async function createUnaffiliatedUser(userData: {
  email: string;
  clerkUserId: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  role?: 'parent' | 'player';
  dateOfBirth?: string;
}): Promise<{ user: typeof users.$inferSelect }> {
  const { email, clerkUserId, firstName, lastName, profileImageUrl, role, dateOfBirth } = userData;
  
  // Get or create the staging tenant
  const stagingTenant = await getOrCreateStagingTenant();
  
  try {
    // Create user assigned to staging tenant
    const [user] = await db.insert(users).values({
      email,
      clerkUserId,
      authProvider: 'clerk',
      tenantId: stagingTenant.id,
      isAdmin: false, // Unaffiliated users are never admins
      isSuperAdmin: false,
      isApproved: true, // Auto-approve unaffiliated users
      registrationStatus: 'approved',
      approvedAt: new Date(),
      firstName: firstName || null,
      lastName: lastName || null,
      profileImageUrl: profileImageUrl || null,
      role: role || 'parent',
      isUnaffiliated: true, // Mark as unaffiliated user
      dateOfBirth: dateOfBirth || null,
    }).returning();
    
    console.log(`✅ Created unaffiliated user ${user.id} assigned to staging tenant "${stagingTenant.name}"`);
    
    return { user };
  } catch (error: any) {
    // Handle race condition - user was created by another request
    if (error?.code === '23505') {
      // Duplicate key - fetch the existing user
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        console.log(`✅ Found existing unaffiliated user ${existingUser.id} (created by parallel request)`);
        return { user: existingUser };
      }
    }
    throw error;
  }
}

// Check if a user is unaffiliated (in staging tenant)
export function isUserUnaffiliated(user: typeof users.$inferSelect): boolean {
  return user.isUnaffiliated === true || user.tenantId === getStagingTenantId();
}

export async function syncClerkUser(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = getAuth(req);
    
    // Handle cases where auth is null or userId is not present
    if (!auth || !auth.userId) {
      return next();
    }

    const clerkUserId = auth.userId;
    
    // First, check if user exists in our database by Clerk ID
    let user = await storage.getUserByClerkId(clerkUserId);
    
    if (user) {
      // User exists - but check if they need a tenant created
      if (!user.tenantId) {
        // User has no tenant - create one and make them admin
        console.log(`User ${user.id} found but has no tenant - creating one...`);
        const result = await createTenantForExistingUser(user, {
          clerkUserId,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
        });
        user = result.user;
        console.log(`Created tenant "${result.tenant.name}" for existing Clerk user ${user.id} (admin: true)`);
      }
      
      (req as any).user = user;
      (req as any).userId = user.id;
      
      // Load coach permissions if user is an assistant
      if (user.isAssistant && user.tenantId) {
        try {
          const assignment = await db.select().from(coachTenantAssignments)
            .where(
              and(
                eq(coachTenantAssignments.userId, user.id),
                eq(coachTenantAssignments.tenantId, user.tenantId),
                eq(coachTenantAssignments.status, 'active')
              )
            )
            .limit(1);
          
          if (assignment.length > 0) {
            (req as any).user.coachPermissions = {
              canViewPii: assignment[0].canViewPii,
              canManageSessions: assignment[0].canManageSessions,
              canViewAnalytics: assignment[0].canViewAnalytics,
              canViewAttendance: assignment[0].canViewAttendance,
              canTakeAttendance: assignment[0].canTakeAttendance,
              canViewFinancials: assignment[0].canViewFinancials,
              canIssueRefunds: assignment[0].canIssueRefunds,
              canIssueCredits: assignment[0].canIssueCredits,
              canManageDiscounts: assignment[0].canManageDiscounts,
              canAccessAdminPortal: assignment[0].canAccessAdminPortal,
            };
          }
        } catch (err) {
          console.error('Error loading coach permissions:', err);
        }
      }
      
      return next();
    }
    
    // User doesn't exist in our DB, need to fetch from Clerk and create
    if (!process.env.CLERK_SECRET_KEY) {
      console.error('CLERK_SECRET_KEY is not set');
      return next();
    }

    // Check cache first
    const cached = clerkUserCache.get(clerkUserId);
    let clerkUser: any;
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      clerkUser = cached.user;
    } else {
      try {
        const response = await fetch(`https://api.clerk.com/v1/users/${clerkUserId}`, {
          headers: {
            Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          },
        });
        
        if (!response.ok) {
          console.error(`Failed to fetch Clerk user: ${response.status} ${response.statusText}`);
          return next();
        }
        
        clerkUser = await response.json();
        clerkUserCache.set(clerkUserId, { user: clerkUser, timestamp: Date.now() });
      } catch (fetchError) {
        console.error('Error fetching Clerk user:', fetchError);
        return next();
      }
    }

    const email = clerkUser.email_addresses?.[0]?.email_address;
    const firstName = clerkUser.first_name;
    const lastName = clerkUser.last_name;
    const profileImageUrl = clerkUser.image_url;
    
    // Check Clerk user's unsafe_metadata for signup type
    const unsafeMetadata = clerkUser.unsafe_metadata || {};
    const signupType = unsafeMetadata.signupType as string | undefined;
    const role = unsafeMetadata.role as 'parent' | 'player' | undefined;
    const isUnaffiliatedSignup = signupType === 'unaffiliated';
    const isParent2InviteSignup = signupType === 'parent2_invite';
    const isPlayerInviteSignup = signupType === 'player_invite';
    const isCoachInviteSignup = signupType === 'coach_invite';

    // Check if user exists by email (for migrating existing users)
    const existingUserByEmail = email ? await storage.getUserByEmail(email) : null;
    
    if (existingUserByEmail) {
      // Check if existing user already has a tenant
      if (existingUserByEmail.tenantId) {
        // User already has a tenant - just link Clerk account
        user = await storage.updateUser(existingUserByEmail.id, {
          clerkUserId,
          authProvider: 'clerk',
          firstName: firstName || existingUserByEmail.firstName,
          lastName: lastName || existingUserByEmail.lastName,
          profileImageUrl: profileImageUrl || existingUserByEmail.profileImageUrl,
        });
        console.log(`Linked existing user ${existingUserByEmail.id} to Clerk user ${clerkUserId} (already has tenant)`);
      } else if (isUnaffiliatedSignup) {
        // Existing user with no tenant, but this is an unaffiliated signup
        // Assign them to staging tenant instead of creating a new club
        const stagingTenant = await getOrCreateStagingTenant();
        const [updatedUser] = await db.update(users)
          .set({
            clerkUserId,
            authProvider: 'clerk',
            tenantId: stagingTenant.id,
            isAdmin: false,
            isUnaffiliated: true,
            isApproved: true,
            registrationStatus: 'approved',
            approvedAt: new Date(),
            role: role || 'parent',
            firstName: firstName || existingUserByEmail.firstName,
            lastName: lastName || existingUserByEmail.lastName,
            profileImageUrl: profileImageUrl || existingUserByEmail.profileImageUrl,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingUserByEmail.id))
          .returning();
        user = updatedUser;
        console.log(`Linked existing user ${existingUserByEmail.id} to staging tenant as unaffiliated (signupType: unaffiliated)`);
      } else if (isParent2InviteSignup) {
        // Existing user with no tenant signing up via parent2 invite
        // Put them in staging tenant temporarily - join endpoint will update their tenant
        // SECURITY: Explicitly clear all admin flags to prevent privilege escalation
        const stagingTenant = await getOrCreateStagingTenant();
        const [updatedUser] = await db.update(users)
          .set({
            clerkUserId,
            authProvider: 'clerk',
            tenantId: stagingTenant.id,
            isAdmin: false,
            isSuperAdmin: false,
            isAssistant: false,
            isApproved: true,
            registrationStatus: 'approved',
            approvedAt: new Date(),
            role: 'parent',
            firstName: firstName || existingUserByEmail.firstName,
            lastName: lastName || existingUserByEmail.lastName,
            profileImageUrl: profileImageUrl || existingUserByEmail.profileImageUrl,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingUserByEmail.id))
          .returning();
        user = updatedUser;
        console.log(`Linked existing user ${existingUserByEmail.id} to staging tenant for parent2 invite (will be updated by join endpoint)`);
      } else if (isPlayerInviteSignup) {
        // Existing user with no tenant signing up via player invite
        // Put them in staging tenant temporarily - join endpoint will update their tenant
        // SECURITY: Explicitly clear all admin flags to prevent privilege escalation
        const stagingTenant = await getOrCreateStagingTenant();
        const [updatedUser] = await db.update(users)
          .set({
            clerkUserId,
            authProvider: 'clerk',
            tenantId: stagingTenant.id,
            isAdmin: false,
            isSuperAdmin: false,
            isAssistant: false,
            isApproved: true,
            registrationStatus: 'approved',
            approvedAt: new Date(),
            role: 'player',
            firstName: firstName || existingUserByEmail.firstName,
            lastName: lastName || existingUserByEmail.lastName,
            profileImageUrl: profileImageUrl || existingUserByEmail.profileImageUrl,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingUserByEmail.id))
          .returning();
        user = updatedUser;
        console.log(`Linked existing user ${existingUserByEmail.id} to staging tenant for player invite (will be updated by join endpoint)`);
      } else if (isCoachInviteSignup) {
        // Existing user with no tenant signing up via coach invite
        // Put them in staging tenant temporarily - join endpoint will update their tenant
        // SECURITY: Don't set isAssistant here - join endpoint will do it after validating invite code
        const stagingTenant = await getOrCreateStagingTenant();
        const [updatedUser] = await db.update(users)
          .set({
            clerkUserId,
            authProvider: 'clerk',
            tenantId: stagingTenant.id,
            isAdmin: false,
            isSuperAdmin: false,
            isApproved: true,
            registrationStatus: 'approved',
            approvedAt: new Date(),
            role: 'parent',
            firstName: firstName || existingUserByEmail.firstName,
            lastName: lastName || existingUserByEmail.lastName,
            profileImageUrl: profileImageUrl || existingUserByEmail.profileImageUrl,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingUserByEmail.id))
          .returning();
        user = updatedUser;
        console.log(`Linked existing user ${existingUserByEmail.id} to staging tenant for coach invite (will be updated by join endpoint)`);
      } else {
        // Existing user has no tenant - create one and make them admin
        // This handles users who existed but never got a club set up
        const result = await createTenantForExistingUser(existingUserByEmail, {
          clerkUserId,
          firstName: firstName || existingUserByEmail.firstName,
          lastName: lastName || existingUserByEmail.lastName,
          profileImageUrl: profileImageUrl || existingUserByEmail.profileImageUrl,
        });
        user = result.user;
        console.log(`Created tenant "${result.tenant.name}" for existing user ${user.id} (admin: true)`);
      }
    } else if (isUnaffiliatedSignup) {
      // New user with unaffiliated signup - create them in staging tenant
      const result = await createUnaffiliatedUser({
        email,
        clerkUserId,
        firstName,
        lastName,
        profileImageUrl,
        role: role || 'parent',
      });
      user = result.user;
      console.log(`Created unaffiliated user ${user.id} in staging tenant (signupType: unaffiliated, role: ${role || 'parent'})`);
    } else if (isParent2InviteSignup) {
      // New user signing up via parent2 invite
      // Put them in staging tenant temporarily - join endpoint will update their tenant
      const stagingTenant = await getOrCreateStagingTenant();
      try {
        const insertResult = await db.insert(users).values({
          email,
          clerkUserId,
          authProvider: 'clerk',
          tenantId: stagingTenant.id,
          isAdmin: false,
          isSuperAdmin: false,
          isApproved: true,
          registrationStatus: 'approved',
          approvedAt: new Date(),
          firstName: firstName || null,
          lastName: lastName || null,
          profileImageUrl: profileImageUrl || null,
          role: 'parent',
        }).returning();
        user = (insertResult as any[])[0];
        console.log(`Created parent2 invite user ${user.id} in staging tenant (will be updated by join endpoint)`);
      } catch (error: any) {
        // Handle race condition - user was created by another request
        if (error?.code === '23505') {
          const existingUser = await storage.getUserByEmail(email);
          if (existingUser) {
            user = existingUser;
            console.log(`Found existing parent2 invite user ${existingUser.id} (created by parallel request)`);
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      }
    } else if (isPlayerInviteSignup) {
      // New user signing up via player invite
      // Put them in staging tenant temporarily - join endpoint will update their tenant
      const stagingTenant = await getOrCreateStagingTenant();
      try {
        const insertResult = await db.insert(users).values({
          email,
          clerkUserId,
          authProvider: 'clerk',
          tenantId: stagingTenant.id,
          isAdmin: false,
          isSuperAdmin: false,
          isApproved: true,
          registrationStatus: 'approved',
          approvedAt: new Date(),
          firstName: firstName || null,
          lastName: lastName || null,
          profileImageUrl: profileImageUrl || null,
          role: 'player',
        }).returning();
        user = (insertResult as any[])[0];
        console.log(`Created player invite user ${user.id} in staging tenant (will be updated by join endpoint)`);
      } catch (error: any) {
        // Handle race condition - user was created by another request
        if (error?.code === '23505') {
          const existingUser = await storage.getUserByEmail(email);
          if (existingUser) {
            user = existingUser;
            console.log(`Found existing player invite user ${existingUser.id} (created by parallel request)`);
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      }
    } else if (isCoachInviteSignup) {
      // New user signing up via coach invite
      // Put them in staging tenant temporarily - join endpoint will update their tenant
      // SECURITY: Don't set isAssistant here - join endpoint will do it after validating invite code
      const stagingTenant = await getOrCreateStagingTenant();
      try {
        const insertResult = await db.insert(users).values({
          email,
          clerkUserId,
          authProvider: 'clerk',
          tenantId: stagingTenant.id,
          isAdmin: false,
          isSuperAdmin: false,
          isApproved: true,
          registrationStatus: 'approved',
          approvedAt: new Date(),
          firstName: firstName || null,
          lastName: lastName || null,
          profileImageUrl: profileImageUrl || null,
          role: 'adult', // Coaches are adults, not parents (they don't have players by default)
        }).returning();
        user = (insertResult as any[])[0];
        console.log(`Created coach invite user ${user.id} in staging tenant (will be updated by join endpoint)`);
      } catch (error: any) {
        // Handle race condition - user was created by another request
        if (error?.code === '23505') {
          const existingUser = await storage.getUserByEmail(email);
          if (existingUser) {
            user = existingUser;
            console.log(`Found existing coach invite user ${existingUser.id} (created by parallel request)`);
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      }
    } else {
      // Create new user and auto-create their tenant
      // The first user who signs up automatically becomes admin of their own club
      const result = await autoCreateTenantForUser({
        email,
        clerkUserId,
        firstName,
        lastName,
        profileImageUrl,
      });
      user = result.user;
      console.log(`Created new user ${user.id} with auto-generated tenant "${result.tenant.name}" (admin: true)`);
    }

    (req as any).user = user;
    (req as any).userId = user?.id;
    
    // Load coach permissions if user is an assistant
    if (user?.isAssistant && user?.tenantId) {
      try {
        const assignment = await db.select().from(coachTenantAssignments)
          .where(
            and(
              eq(coachTenantAssignments.userId, user.id),
              eq(coachTenantAssignments.tenantId, user.tenantId),
              eq(coachTenantAssignments.status, 'active')
            )
          )
          .limit(1);
        
        if (assignment.length > 0) {
          (req as any).user.coachPermissions = {
            canViewPii: assignment[0].canViewPii,
            canManageSessions: assignment[0].canManageSessions,
            canViewAnalytics: assignment[0].canViewAnalytics,
            canViewAttendance: assignment[0].canViewAttendance,
            canTakeAttendance: assignment[0].canTakeAttendance,
            canViewFinancials: assignment[0].canViewFinancials,
            canIssueRefunds: assignment[0].canIssueRefunds,
            canIssueCredits: assignment[0].canIssueCredits,
            canManageDiscounts: assignment[0].canManageDiscounts,
            canAccessAdminPortal: assignment[0].canAccessAdminPortal,
          };
        }
      } catch (err) {
        console.error('Error loading coach permissions:', err);
      }
    }
    
    next();
  } catch (error) {
    console.error('Error syncing Clerk user:', error);
    next();
  }
}

export function isClerkAuthenticated(req: Request, res: Response, next: NextFunction) {
  const auth = getAuth(req);
  
  if (!auth.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  next();
}

export async function requireClerkAuth(req: Request, res: Response, next: NextFunction) {
  // First, check if user is authenticated via Clerk
  const auth = getAuth(req);
  
  if (auth?.userId) {
    // Clerk authentication - user should be set by syncClerkUser middleware
    const user = (req as any).user;
    if (user) {
      return next();
    }
  }
  
  // Fallback to legacy session authentication for backward compatibility
  const session = (req as any).session;
  if (session?.userId) {
    try {
      const user = await storage.getUser(session.userId);
      if (user) {
        (req as any).user = user;
        (req as any).userId = user.id;
        
        // Load coach permissions if user is an assistant
        if (user.isAssistant && user.tenantId) {
          try {
            const assignment = await db.select().from(coachTenantAssignments)
              .where(
                and(
                  eq(coachTenantAssignments.userId, user.id),
                  eq(coachTenantAssignments.tenantId, user.tenantId),
                  eq(coachTenantAssignments.status, 'active')
                )
              )
              .limit(1);
            
            if (assignment.length > 0) {
              (req as any).user.coachPermissions = {
                canViewPii: assignment[0].canViewPii,
                canManageSessions: assignment[0].canManageSessions,
                canViewAnalytics: assignment[0].canViewAnalytics,
                canViewAttendance: assignment[0].canViewAttendance,
                canTakeAttendance: assignment[0].canTakeAttendance,
                canViewFinancials: assignment[0].canViewFinancials,
                canIssueRefunds: assignment[0].canIssueRefunds,
                canIssueCredits: assignment[0].canIssueCredits,
                canManageDiscounts: assignment[0].canManageDiscounts,
                canAccessAdminPortal: assignment[0].canAccessAdminPortal,
              };
            }
          } catch (err) {
            console.error('Error loading coach permissions:', err);
          }
        }
        
        return next();
      }
    } catch (error) {
      console.error('Error fetching legacy session user:', error);
    }
  }
  
  return res.status(401).json({ message: "Authentication required" });
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  
  if (!user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  if (!user.isAdmin && !user.isSuperAdmin && !user.isAssistant) {
    return res.status(403).json({ message: "Admin access required" });
  }
  
  next();
}

export async function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  
  if (!user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  if (!user.isSuperAdmin) {
    return res.status(403).json({ message: "Super admin access required" });
  }
  
  next();
}
