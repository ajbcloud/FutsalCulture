import { Router } from 'express';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { getOrCreateStagingTenant, getStagingTenantId } from '../utils/staging-tenant';
import { z } from 'zod';

const router = Router();

const unaffiliatedSignupSchema = z.object({
  email: z.string().email('Valid email required'),
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  clerkUserId: z.string().min(1, 'Clerk user ID required'),
  role: z.enum(['parent', 'player']).optional().default('parent'),
  dateOfBirth: z.string().optional(),
  phone: z.string().optional(),
});

router.post('/api/auth/unaffiliated-signup', async (req, res) => {
  try {
    const validation = unaffiliatedSignupSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: validation.error.errors 
      });
    }

    const { email, firstName, lastName, clerkUserId, role, dateOfBirth, phone } = validation.data;

    const existingUser = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      const user = existingUser[0];
      if (user.clerkUserId && user.clerkUserId !== clerkUserId) {
        return res.status(409).json({ 
          error: 'Email already registered with a different account' 
        });
      }
      
      const updatedResult = await db.update(users)
        .set({
          clerkUserId,
          authProvider: 'clerk',
          firstName: firstName || user.firstName,
          lastName: lastName || user.lastName,
          phone: phone || user.phone,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id))
        .returning();
      
      console.log(`✅ Linked existing user ${user.id} to Clerk for unaffiliated access`);
      
      return res.json({
        success: true,
        user: {
          id: updatedResult[0].id,
          email: updatedResult[0].email,
          firstName: updatedResult[0].firstName,
          lastName: updatedResult[0].lastName,
          isUnaffiliated: updatedResult[0].isUnaffiliated,
          tenantId: updatedResult[0].tenantId,
        },
        isNewUser: false,
      });
    }

    const stagingTenant = await getOrCreateStagingTenant();

    const newUserResult = await db.insert(users).values({
      email,
      clerkUserId,
      authProvider: 'clerk',
      tenantId: stagingTenant.id,
      isAdmin: false,
      isSuperAdmin: false,
      isApproved: true,
      registrationStatus: 'approved',
      approvedAt: new Date(),
      firstName,
      lastName,
      phone: phone || null,
      role: role as 'parent' | 'player',
      isUnaffiliated: true,
      dateOfBirth: dateOfBirth || null,
    }).returning();

    const newUser = (newUserResult as any[])[0];

    console.log(`✅ Created unaffiliated user:`, {
      id: newUser.id,
      email: newUser.email,
      role,
      tenantId: stagingTenant.id,
    });

    res.status(201).json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        isUnaffiliated: newUser.isUnaffiliated,
        tenantId: newUser.tenantId,
      },
      isNewUser: true,
    });

  } catch (error) {
    console.error('Error during unaffiliated signup:', error);
    res.status(500).json({ 
      error: 'Registration failed. Please try again.' 
    });
  }
});

router.get('/api/auth/check-unaffiliated', async (req, res) => {
  try {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const isUnaffiliated = user.isUnaffiliated === true || 
                           user.tenantId === getStagingTenantId();

    res.json({
      isUnaffiliated,
      tenantId: user.tenantId,
      stagingTenantId: getStagingTenantId(),
    });

  } catch (error) {
    console.error('Error checking unaffiliated status:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

export default router;
