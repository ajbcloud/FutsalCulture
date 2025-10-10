import { Router } from 'express';
import { sql } from 'drizzle-orm';
import { db } from './db';

const router = Router();

// Get tenant plan information
router.get('/tenant/plan', async (req: any, res) => {
  try {
    const currentUser = req.currentUser;
    if (!currentUser?.tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    // Use raw SQL to avoid Drizzle ORM schema issues
    const result = await db.execute(
      sql`SELECT plan_level, stripe_subscription_id, stripe_customer_id 
          FROM tenants 
          WHERE id = ${currentUser.tenantId} 
          LIMIT 1`
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const tenantData: any = result.rows[0];
    const planId = tenantData.plan_level || 'core';
    const hasActiveSubscription = !!(tenantData.stripe_subscription_id && planId !== 'free');

    res.json({
      planId,
      billingStatus: hasActiveSubscription ? 'active' : 'none',
      renewalDate: hasActiveSubscription ? new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString() : null,
      featureOverrides: {} // For future use
    });
  } catch (error) {
    console.error('Error fetching tenant plan:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;