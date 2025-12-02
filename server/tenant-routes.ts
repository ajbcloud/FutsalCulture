import { Router } from 'express';
import { sql, eq } from 'drizzle-orm';
import { db } from './db';
import { tenants } from '../shared/schema';

const router = Router();

// Middleware to set currentUser from req.user (set by Clerk sync)
router.use(async (req: any, res, next) => {
  if (req.user?.id) {
    const { storage } = await import('./storage');
    const user = await storage.getUser(req.user.id);
    (req as any).currentUser = user;
  }
  next();
});

// Get comprehensive tenant information - SINGLE SOURCE OF TRUTH
router.get('/tenant/info', async (req: any, res) => {
  try {
    const currentUser = req.currentUser;
    if (!currentUser?.tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    // Get complete tenant information from database
    const result = await db.select({
      id: tenants.id,
      name: tenants.name,
      planLevel: tenants.planLevel,
      billingStatus: tenants.billingStatus,
      stripeCustomerId: tenants.stripeCustomerId,
      stripeSubscriptionId: tenants.stripeSubscriptionId,
      braintreeSubscriptionId: tenants.braintreeSubscriptionId,
      trialStartedAt: tenants.trialStartedAt,
      trialEndsAt: tenants.trialEndsAt,
      city: tenants.city,
      state: tenants.state,
      country: tenants.country,
      contactName: tenants.contactName,
      contactEmail: tenants.contactEmail
    })
    .from(tenants)
    .where(eq(tenants.id, currentUser.tenantId))
    .limit(1);

    if (!result.length) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const tenant = result[0];
    
    // AUTOMATIC ENFORCEMENT: Check if there's an active subscription
    // If no subscription exists, treat the plan as 'free' regardless of database value
    const hasActiveSubscription = !!(tenant.stripeSubscriptionId || tenant.braintreeSubscriptionId);
    const isInActiveTrial = tenant.trialEndsAt && new Date(tenant.trialEndsAt) > new Date();
    
    // Only use the stored plan level if there's an active subscription or active trial
    // Otherwise, enforce 'free' plan
    let planCode: string;
    if (hasActiveSubscription || isInActiveTrial) {
      planCode = tenant.planLevel || 'free';
    } else {
      planCode = 'free'; // No subscription = free plan
    }
    
    // Determine billing status - ALWAYS compute based on current subscription state
    // Ignores stale DB values to ensure consistency with plan enforcement
    let billingStatus: string;
    if (hasActiveSubscription && planCode !== 'free') {
      billingStatus = 'active';
    } else if (isInActiveTrial) {
      billingStatus = 'trialing';
    } else {
      billingStatus = 'none';
    }

    // Calculate renewal date if subscription is active
    let renewalDate = null;
    if (billingStatus === 'active' && tenant.stripeSubscriptionId) {
      // Default to 30 days from now if we don't have actual data
      renewalDate = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString();
    }

    // Map plan levels to numeric representation for compatibility
    const planLevelMap: Record<string, number> = {
      'free': 0,
      'core': 1, 
      'growth': 2,
      'elite': 3
    };

    res.json({
      // Tenant basic info
      id: tenant.id,
      name: tenant.name,
      contactName: tenant.contactName,
      contactEmail: tenant.contactEmail,
      location: {
        city: tenant.city,
        state: tenant.state,
        country: tenant.country
      },
      
      // Plan information - SINGLE SOURCE OF TRUTH
      planCode, // 'free' | 'core' | 'growth' | 'elite'
      planLevel: planLevelMap[planCode] || 0, // Numeric representation
      planId: planCode, // Alias for backward compatibility
      
      // Billing information
      billingStatus, // 'active' | 'trialing' | 'past_due' | 'cancelled' | 'none'
      renewalDate,
      stripeCustomerId: tenant.stripeCustomerId,
      stripeSubscriptionId: tenant.stripeSubscriptionId,
      
      // Trial information
      trialStartedAt: tenant.trialStartedAt?.toISOString() || null,
      trialEndsAt: tenant.trialEndsAt?.toISOString() || null,
      
      // Feature overrides for future customization
      featureOverrides: {}
    });
  } catch (error) {
    console.error('Error fetching tenant info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Legacy endpoint - kept for backward compatibility but uses same logic
router.get('/tenant/plan', async (req: any, res) => {
  try {
    const currentUser = req.currentUser;
    if (!currentUser?.tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    // Use raw SQL to avoid Drizzle ORM schema issues
    const result = await db.execute(
      sql`SELECT plan_level, stripe_subscription_id, braintree_subscription_id, stripe_customer_id, trial_ends_at 
          FROM tenants 
          WHERE id = ${currentUser.tenantId} 
          LIMIT 1`
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const tenantData: any = result.rows[0];
    
    // AUTOMATIC ENFORCEMENT: Check if there's an active subscription
    const hasActiveSubscription = !!(tenantData.stripe_subscription_id || tenantData.braintree_subscription_id);
    const isInActiveTrial = tenantData.trial_ends_at && new Date(tenantData.trial_ends_at) > new Date();
    
    // Only use stored plan level if there's an active subscription or trial
    // Otherwise, enforce 'free' plan
    let planId: string;
    if (hasActiveSubscription || isInActiveTrial) {
      planId = tenantData.plan_level || 'free';
    } else {
      planId = 'free'; // No subscription = free plan
    }

    res.json({
      planId,
      billingStatus: hasActiveSubscription ? 'active' : (isInActiveTrial ? 'trialing' : 'none'),
      renewalDate: hasActiveSubscription ? new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString() : null,
      featureOverrides: {} // For future use
    });
  } catch (error) {
    console.error('Error fetching tenant plan:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;