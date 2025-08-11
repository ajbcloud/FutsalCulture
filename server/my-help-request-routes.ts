import { Request, Response, Router } from 'express';
import { db } from './db';
import { helpRequests, users } from '../shared/schema';
import { eq, desc, and } from 'drizzle-orm';
import { isAuthenticated } from './replitAuth';
import { storage } from './storage';

const router = Router();

// GET /api/help/my-requests - Get help requests for current user
router.get('/my-requests', isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    const tenantId = user?.tenantId;
    const userEmail = user?.email;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    if (!userEmail) {
      return res.status(400).json({ error: 'User email is required' });
    }

    // Get help requests submitted by the current user or linked to them
    const requests = await db
      .select({
        id: helpRequests.id,
        firstName: helpRequests.firstName,
        lastName: helpRequests.lastName,
        email: helpRequests.email,
        phone: helpRequests.phone,
        subject: helpRequests.subject,
        category: helpRequests.category,
        priority: helpRequests.priority,
        message: helpRequests.message,
        status: helpRequests.status,
        resolved: helpRequests.resolved,
        resolvedAt: helpRequests.resolvedAt,
        resolutionNote: helpRequests.resolutionNote,
        createdAt: helpRequests.createdAt,
        source: helpRequests.source,
      })
      .from(helpRequests)
      .where(and(
        eq(helpRequests.tenantId, tenantId),
        eq(helpRequests.email, userEmail)
      ))
      .orderBy(desc(helpRequests.createdAt));

    res.json(requests);
  } catch (error) {
    console.error('Error fetching user help requests:', error);
    res.status(500).json({ error: 'Failed to fetch help requests' });
  }
});

// GET /api/help/my-requests/:id - Get specific help request for current user
router.get('/my-requests/:id', isAuthenticated, async (req: any, res: Response) => {
  try {
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    const tenantId = user?.tenantId;
    const userEmail = user?.email;
    const requestId = req.params.id;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    if (!userEmail) {
      return res.status(400).json({ error: 'User email is required' });
    }

    const request = await db
      .select({
        id: helpRequests.id,
        firstName: helpRequests.firstName,
        lastName: helpRequests.lastName,
        email: helpRequests.email,
        phone: helpRequests.phone,
        subject: helpRequests.subject,
        category: helpRequests.category,
        priority: helpRequests.priority,
        message: helpRequests.message,
        status: helpRequests.status,
        resolved: helpRequests.resolved,
        resolvedAt: helpRequests.resolvedAt,
        resolutionNote: helpRequests.resolutionNote,
        createdAt: helpRequests.createdAt,
        source: helpRequests.source,
      })
      .from(helpRequests)
      .where(and(
        eq(helpRequests.id, requestId),
        eq(helpRequests.tenantId, tenantId),
        eq(helpRequests.email, userEmail)
      ))
      .limit(1);

    if (request.length === 0) {
      return res.status(404).json({ error: 'Help request not found or access denied' });
    }

    res.json(request[0]);
  } catch (error) {
    console.error('Error fetching help request:', error);
    res.status(500).json({ error: 'Failed to fetch help request' });
  }
});

export default router;