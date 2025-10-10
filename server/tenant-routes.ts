import { Router } from 'express';
import { sql, eq } from 'drizzle-orm';
import { db } from './db';
import { tenants } from '../shared/schema';

const router = Router();

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
    
    // Map planLevel to planCode (they're the same in this system)
    // planLevel is the database field, planCode is what the UI expects
    const planCode = tenant.planLevel || 'free';
    
    // Determine billing status
    let billingStatus = tenant.billingStatus || 'none';
    if (!billingStatus || billingStatus === 'none') {
      if (tenant.stripeSubscriptionId && planCode !== 'free') {
        billingStatus = 'active';
      } else if (tenant.trialEndsAt && new Date(tenant.trialEndsAt) > new Date()) {
        billingStatus = 'trialing';
      } else {
        billingStatus = 'none';
      }
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