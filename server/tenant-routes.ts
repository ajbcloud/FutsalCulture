import { Router } from 'express';
import { db } from './db';
import { tenants } from '../shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Get tenant plan information
router.get('/tenant/plan', async (req: any, res) => {
  try {
    const currentUser = req.currentUser;
    if (!currentUser?.tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const tenant = await db.select({
      planLevel: tenants.plan_level,
      stripeSubscriptionId: tenants.stripe_subscription_id,
      stripeCustomerId: tenants.stripe_customer_id
    })
    .from(tenants)
    .where(eq(tenants.id, currentUser.tenantId))
    .limit(1);

    if (!tenant.length) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const tenantData = tenant[0];
    const planId = tenantData.planLevel || 'core';
    const hasActiveSubscription = !!(tenantData.stripeSubscriptionId && planId !== 'free');

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