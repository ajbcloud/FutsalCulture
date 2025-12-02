import { clerkMiddleware, getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

export { clerkMiddleware };

const clerkUserCache = new Map<string, { user: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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
      // Create new user
      user = await storage.upsertUser({
        email,
        clerkUserId,
        authProvider: 'clerk',
        firstName,
        lastName,
        profileImageUrl,
        isApproved: false,
        registrationStatus: 'pending',
      });
      console.log(`Created new user for Clerk user ${clerkUserId}`);
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
