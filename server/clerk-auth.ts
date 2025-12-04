import { clerkMiddleware, getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { db } from "./db";
import { tenants, subscriptions, tenantPlanAssignments, users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { slugify, generateTenantCode } from "@shared/utils";
import { nanoid } from "nanoid";

export { clerkMiddleware };

const clerkUserCache = new Map<string, { user: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Auto-create a tenant for a new user signing up
// First user becomes admin of their auto-generated club
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
  
  // Generate unique slug
  let baseSlug = slugify(baseName);
  let slug = baseSlug;
  let counter = 1;
  
  // Ensure slug uniqueness
  while (true) {
    const existingTenant = await db.query.tenants.findFirst({
      where: eq(tenants.slug, slug)
    });
    
    if (!existingTenant) break;
    
    slug = `${baseSlug}-${nanoid(4)}`;
    counter++;
    
    if (counter > 10) {
      // Fallback to fully random slug
      slug = `club-${nanoid(8)}`;
      break;
    }
  }
  
  // Use transaction for atomic creation
  return await db.transaction(async (tx) => {
    // Create tenant with auto-generated name (can be edited later)
    const [tenant] = await tx.insert(tenants).values({
      name: baseName,
      slug: slug,
      subdomain: slug,
      inviteCode: slug,
      contactName: firstName && lastName ? `${firstName} ${lastName}` : null,
      contactEmail: email,
      planLevel: "free",
    }).returning();
    
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
    const [user] = await tx.insert(users).values({
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
    
    return { tenant, user };
  });
}

export async function syncClerkUser(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = getAuth(req);
    
    // Handle cases where auth is null or userId is not present
    if (!auth || !auth.userId) {
      return next();
    }

    const clerkUserId = auth.userId;
    
    // First, check if user exists in our database
    let user = await storage.getUserByClerkId(clerkUserId);
    
    if (user) {
      (req as any).user = user;
      (req as any).userId = user.id;
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

    // Check if user exists by email (for migrating existing users)
    const existingUserByEmail = email ? await storage.getUserByEmail(email) : null;
    
    if (existingUserByEmail) {
      // Link existing user to Clerk
      user = await storage.updateUser(existingUserByEmail.id, {
        clerkUserId,
        authProvider: 'clerk',
        firstName: firstName || existingUserByEmail.firstName,
        lastName: lastName || existingUserByEmail.lastName,
        profileImageUrl: profileImageUrl || existingUserByEmail.profileImageUrl,
      });
      console.log(`Linked existing user ${existingUserByEmail.id} to Clerk user ${clerkUserId}`);
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
