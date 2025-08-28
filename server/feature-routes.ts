import { Router } from 'express';
import { db } from './db';
import { tenants, featureFlags } from '../shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import {
  hasFeature,
  getEnabledFeatures,
  checkPlanLimits,
  PLAN_LIMITS,
  PLAN_FEATURES
} from '../shared/feature-flags';
import {
  loadTenantMiddleware,
  requireFeature,
  getTenantPlanLevel,
  getTenantFeatures
} from './feature-middleware';

const router = Router();

// Apply middleware to get user context
router.use(async (req: any, res, next) => {
  if (req.user?.claims?.sub) {
    const { storage } = await import('./storage');
    const user = await storage.getUser(req.user.claims.sub);
    (req as any).currentUser = user;
  }
  next();
});

// Get current tenant's plan features and limits
router.get('/tenant/plan-features', async (req, res) => {
  try {
    const user = (req as any).currentUser;
    const tenantId = user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    // Get tenant plan level and subscription info
    const tenant = await db.select({
      planLevel: tenants.planLevel,
      stripeSubscriptionId: tenants.stripeSubscriptionId,
      stripeCustomerId: tenants.stripeCustomerId
    })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant.length) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Also check subscriptions table for the most current status
    const { subscriptions } = await import('../shared/schema');
    const subscription = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.tenantId, tenantId))
      .orderBy(sql`${subscriptions.createdAt} DESC`)
      .limit(1);

    // Use subscription plan if active, otherwise fall back to tenant plan level
    let effectivePlanLevel = tenant[0].planLevel || 'free';

    if (subscription.length > 0 && subscription[0].status === 'active') {
      effectivePlanLevel = subscription[0].planKey || effectivePlanLevel;
    }

    // Final fallback to tenant planLevel if subscription exists but is not elite/growth/core
    const actualPlanLevel = effectivePlanLevel;


    // Use actual plan level for paid plans, free for non-subscribed users
    const effectivePlanLevelForFeatures = actualPlanLevel;

    // Import PLAN_FEATURES from shared
    const { PLAN_FEATURES } = await import('../shared/feature-flags');
    const features = PLAN_FEATURES[effectivePlanLevelForFeatures as keyof typeof PLAN_FEATURES] || PLAN_FEATURES.free;

    const limits = PLAN_LIMITS[effectivePlanLevelForFeatures as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;

    // Get current player count for this tenant (only players, not parents)
    const { players } = await import('../shared/schema');

    const playerCountResult = await db.select({ count: players.id })
      .from(players)
      .where(eq(players.tenantId, tenantId));
    const playerCount = playerCountResult.length;

    // User limits should only count players, not parents
    const displayCount = playerCount;

    res.json({
      planLevel: effectivePlanLevelForFeatures,
      features,
      limits,
      playerCount: displayCount,
    });
  } catch (error) {
    console.error('Error fetching plan features:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get feature access for a specific feature
router.get('/tenant/feature/:featureKey', async (req, res) => {
  try {
    const tenantId = (req.session as any)?.user?.tenantId;
    const { featureKey } = req.params;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const planLevel = await getTenantPlanLevel(tenantId);
    if (!planLevel) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const hasAccess = hasFeature(planLevel, featureKey as any);

    res.json({
      featureKey,
      hasAccess,
      planLevel,
    });
  } catch (error) {
    console.error('Error checking feature access:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin route to populate feature flags (development only)
router.post('/admin/populate-feature-flags', async (req, res) => {
  try {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ error: 'Only available in development' });
    }

    // Clear existing feature flags
    await db.delete(featureFlags);

    // Insert feature flags for each plan level
    const flagsToInsert = [];

    for (const [planLevel, features] of Object.entries(PLAN_FEATURES)) {
      for (const [featureKey, enabled] of Object.entries(features)) {
        flagsToInsert.push({
          planLevel: planLevel as any,
          featureKey,
          enabled,
        });
      }
    }

    await db.insert(featureFlags).values(flagsToInsert);

    res.json({
      success: true,
      inserted: flagsToInsert.length,
      message: 'Feature flags populated successfully'
    });
  } catch (error) {
    console.error('Error populating feature flags:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin route to update tenant plan level
router.post('/admin/tenant/:tenantId/plan', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { planLevel } = req.body;

    if (!['core', 'growth', 'elite'].includes(planLevel)) {
      return res.status(400).json({ error: 'Invalid plan level' });
    }

    const updatedTenant = await db.update(tenants)
      .set({ planLevel })
      .where(eq(tenants.id, tenantId))
      .returning();

    if (!updatedTenant.length) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    res.json({
      success: true,
      tenant: updatedTenant[0],
      message: `Plan updated to ${planLevel}`
    });
  } catch (error) {
    console.error('Error updating tenant plan:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get upgrade recommendations
router.get('/tenant/upgrade-recommendations', async (req, res) => {
  try {
    const tenantId = (req.session as any)?.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const planLevel = await getTenantPlanLevel(tenantId);
    if (!planLevel) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const currentFeatures = getEnabledFeatures(planLevel);

    const recommendations = {
      currentPlan: planLevel,
      nextPlan: planLevel === 'core' ? 'growth' as const : planLevel === 'growth' ? 'elite' as const : null,
      upgradeBenefits: [] as string[],
      planLimits: PLAN_LIMITS[planLevel as keyof typeof PLAN_LIMITS],
    };

    if (recommendations.nextPlan) {
      const nextFeatures = getEnabledFeatures(recommendations.nextPlan);
      const newFeatures = nextFeatures.filter(f => !currentFeatures.includes(f));

      recommendations.upgradeBenefits = newFeatures.slice(0, 5); // Top 5 benefits
    }

    res.json(recommendations);
  } catch (error) {
    console.error('Error getting upgrade recommendations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;