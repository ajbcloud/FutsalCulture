import { Request, Response, Router } from 'express';
import { db } from './db';
import { featureRequests, users, insertFeatureRequestSchema } from '../shared/schema';
import { eq, desc, and } from 'drizzle-orm';
import { isAuthenticated } from './replitAuth';
import { storage } from './storage';
import { hasFeature } from '@shared/feature-flags';
import { FEATURE_KEYS } from '@shared/feature-flags';

const router = Router();

// GET /api/feature-requests - Get feature requests for tenant (Elite only)
router.get('/', isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    const tenantId = user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }
    
    // Check if tenant has feature request access (available to Core, Growth, and Elite plans)
    const tenant = await storage.getTenant(tenantId);
    if (!tenant || !tenant.planLevel || !hasFeature(tenant.planLevel, FEATURE_KEYS.FEATURE_REQUESTS)) {
      return res.status(403).json({ error: 'Feature request queue requires a paid subscription plan' });
    }

    const requests = await db
      .select({
        id: featureRequests.id,
        title: featureRequests.title,
        description: featureRequests.description,
        status: featureRequests.status,
        statusNotes: featureRequests.statusNotes,
        createdAt: featureRequests.createdAt,
        updatedAt: featureRequests.updatedAt,
        submittedBy: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email
        }
      })
      .from(featureRequests)
      .leftJoin(users, eq(featureRequests.submittedBy, users.id))
      .where(eq(featureRequests.tenantId, tenantId))
      .orderBy(desc(featureRequests.createdAt));

    res.json(requests);
  } catch (error) {
    console.error('Error fetching feature requests:', error);
    res.status(500).json({ error: 'Failed to fetch feature requests' });
  }
});

// POST /api/feature-requests - Create new feature request (Elite only)
router.post('/', isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    const tenantId = user?.tenantId;
    
    if (!tenantId || !userId) {
      return res.status(400).json({ error: 'Tenant ID and User ID are required' });
    }
    
    // Check if tenant has feature request access (available to Core, Growth, and Elite plans)
    const tenant = await storage.getTenant(tenantId);
    if (!tenant || !tenant.planLevel || !hasFeature(tenant.planLevel, FEATURE_KEYS.FEATURE_REQUESTS)) {
      return res.status(403).json({ error: 'Feature request queue requires a paid subscription plan' });
    }

    // Determine priority based on plan level
    let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    if (tenant.planLevel === 'core') {
      priority = 'low';
    } else if (tenant.planLevel === 'growth') {
      priority = 'medium';
    } else if (tenant.planLevel === 'elite') {
      priority = 'high';
    }

    // Validate the request body
    const validatedData = insertFeatureRequestSchema.parse({
      ...req.body,
      tenantId,
      submittedBy: userId,
      priority,
      planLevel: tenant.planLevel,
    });

    const result = await db
      .insert(featureRequests)
      .values(validatedData)
      .returning();

    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Error creating feature request:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid feature request data provided' });
    }
    res.status(500).json({ error: 'Failed to create feature request' });
  }
});

// GET /api/feature-requests/:id - Get specific feature request (Elite only)
router.get('/:id', isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    const tenantId = user?.tenantId;
    const requestId = req.params.id;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const request = await db
      .select({
        id: featureRequests.id,
        title: featureRequests.title,
        description: featureRequests.description,
        status: featureRequests.status,
        statusNotes: featureRequests.statusNotes,
        createdAt: featureRequests.createdAt,
        updatedAt: featureRequests.updatedAt,
        submittedBy: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email
        }
      })
      .from(featureRequests)
      .leftJoin(users, eq(featureRequests.submittedBy, users.id))
      .where(and(
        eq(featureRequests.id, requestId),
        eq(featureRequests.tenantId, tenantId)
      ))
      .limit(1);

    if (request.length === 0) {
      return res.status(404).json({ error: 'Feature request not found' });
    }

    res.json(request[0]);
  } catch (error) {
    console.error('Error fetching feature request:', error);
    res.status(500).json({ error: 'Failed to fetch feature request' });
  }
});

// PATCH /api/feature-requests/:id - Update feature request status (Super Admin only)
router.patch('/:id', isAuthenticated, async (req: any, res: Response) => {
  try {
    const requestId = req.params.id;
    const { status, statusNotes } = req.body;

    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    
    // Only super admins can update feature request status
    if (!user?.isSuperAdmin) {
      return res.status(403).json({ error: 'Only super admins can update feature request status' });
    }

    if (!['received', 'under_review', 'approved', 'in_development', 'released'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await db
      .update(featureRequests)
      .set({
        status,
        statusNotes,
        reviewedBy: userId,
        updatedAt: new Date()
      })
      .where(eq(featureRequests.id, requestId))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: 'Feature request not found' });
    }

    res.json(result[0]);
  } catch (error) {
    console.error('Error updating feature request:', error);
    res.status(500).json({ error: 'Failed to update feature request' });
  }
});

export default router;