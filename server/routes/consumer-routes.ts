import { Router, Request, Response } from 'express';
import { db } from '../db';
import { tenants, users } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';
import { clerkClient, getAuth } from '@clerk/express';

const router = Router();

router.post('/join', async (req: Request, res: Response) => {
  try {
    const auth = getAuth(req);
    const clerkUserId = auth?.userId;
    
    console.log("🔍 Consumer join - auth check:", {
      hasAuth: !!auth,
      userId: clerkUserId,
      authHeader: !!req.headers.authorization,
    });
    
    if (!clerkUserId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const { club_code } = req.body;
    
    if (!club_code || typeof club_code !== 'string') {
      return res.status(400).json({ error: "Club code is required" });
    }
    
    const normalizedCode = club_code.toLowerCase().trim();
    
    const tenant = await db.query.tenants.findFirst({
      where: sql`LOWER(${tenants.slug}) = ${normalizedCode}`
    });
    
    if (!tenant) {
      return res.status(404).json({ error: "Club not found. Please check your code and try again." });
    }
    
    let clerkUser;
    try {
      clerkUser = await clerkClient.users.getUser(clerkUserId);
    } catch (e) {
      console.error('Error fetching Clerk user:', e);
      return res.status(400).json({ error: "Could not verify your account" });
    }
    
    const userEmail = clerkUser.emailAddresses?.[0]?.emailAddress;
    if (!userEmail) {
      return res.status(400).json({ error: "Could not determine email address" });
    }
    
    let user = await db.query.users.findFirst({
      where: eq(users.clerkUserId, clerkUserId)
    });
    
    if (!user) {
      user = await db.query.users.findFirst({
        where: eq(users.email, userEmail.toLowerCase())
      });
    }
    
    if (user) {
      if (user.tenantId && user.tenantId !== tenant.id) {
        return res.status(400).json({ error: "You are already a member of another club. Please contact support to switch clubs." });
      }
      
      if (user.tenantId === tenant.id) {
        return res.status(200).json({ 
          success: true, 
          tenantName: tenant.name,
          alreadyMember: true 
        });
      }
      
      await db.update(users)
        .set({ 
          tenantId: tenant.id,
          clerkUserId: clerkUserId,
        })
        .where(eq(users.id, user.id));
    } else {
      const [newUser] = await db.insert(users).values({
        email: userEmail.toLowerCase(),
        firstName: clerkUser.firstName || '',
        lastName: clerkUser.lastName || '',
        clerkUserId: clerkUserId,
        tenantId: tenant.id,
        role: 'parent',
        authProvider: 'clerk',
        emailVerifiedAt: new Date(),
      }).returning();
      user = newUser;
    }
    
    if (tenant.clerkOrganizationId) {
      try {
        await clerkClient.organizations.createOrganizationMembership({
          organizationId: tenant.clerkOrganizationId,
          userId: clerkUserId,
          role: 'org:member',
        });
        console.log(`✅ Added user ${clerkUserId} to Clerk org ${tenant.clerkOrganizationId}`);
      } catch (clerkOrgError: any) {
        console.warn(`⚠️ Failed to add user to Clerk org (best-effort): ${clerkOrgError.message}`);
      }
    }
    
    console.log(`✅ User ${user.id} joined club ${tenant.name} (${tenant.id})`);
    
    return res.status(200).json({
      success: true,
      tenantName: tenant.name,
      tenantId: tenant.id,
    });
    
  } catch (error) {
    console.error('Error in consumer join:', error);
    return res.status(500).json({ error: "An unexpected error occurred. Please try again." });
  }
});

export default router;
