import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { eq, and, sql } from 'drizzle-orm';
import {
  features,
  planFeatures,
  tenantFeatureOverrides,
  tenantPlanAssignments,
  tenants
} from '../../shared/schema';
import { 
  getCachedCapabilities, 
  setCachedCapabilities, 
  clearCapabilitiesCache as clearCache 
} from '../lib/capabilitiesCache';

// Helper to get tenant capabilities
async function getTenantCapabilities(tenantId: string) {
  // Check cache
  const cached = getCachedCapabilities(tenantId);
  if (cached) {
    return cached;
  }

  // Fetch the tenant's recorded plan level
  const [tenant] = await db
    .select({ planLevel: tenants.planLevel })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  // Get current plan for tenant
  const planAssignment = await db
    .select({
      planCode: tenantPlanAssignments.planCode
    })
    .from(tenantPlanAssignments)
    .where(and(
      eq(tenantPlanAssignments.tenantId, tenantId),
      sql`${tenantPlanAssignments.until} IS NULL OR ${tenantPlanAssignments.until} > NOW()`
    ))
    .orderBy(sql`${tenantPlanAssignments.since} DESC`)
    .limit(1);

  const tenantPlanLevel = tenant?.planLevel || 'free';
  let planCode = planAssignment[0]?.planCode || tenantPlanLevel;

  // If the tenant table has been updated but assignments are stale, realign them
  if (planAssignment[0]?.planCode && tenantPlanLevel && planAssignment[0].planCode !== tenantPlanLevel) {
    await db
      .update(tenantPlanAssignments)
      .set({ until: new Date() })
      .where(and(
        eq(tenantPlanAssignments.tenantId, tenantId),
        sql`${tenantPlanAssignments.until} IS NULL OR ${tenantPlanAssignments.until} > NOW()`
      ));

    await db.insert(tenantPlanAssignments).values({
      tenantId,
      planCode: tenantPlanLevel,
      since: new Date(),
    });

    planCode = tenantPlanLevel;
    clearCache(tenantId);
  } else if (!planAssignment.length && tenantPlanLevel) {
    // If no assignment exists yet, create one based on tenant record
    await db.insert(tenantPlanAssignments).values({
      tenantId,
      planCode: tenantPlanLevel,
      since: new Date(),
    });

    planCode = tenantPlanLevel;
  }

  // Get base features from plan
  const baseFeatures = await db
    .select({
      key: features.key,
      type: features.type,
      enabled: planFeatures.enabled,
      variant: planFeatures.variant,
      limitValue: planFeatures.limitValue
    })
    .from(features)
    .leftJoin(
      planFeatures,
      and(
        eq(planFeatures.planCode, planCode),
        eq(planFeatures.featureKey, features.key)
      )
    )
    .where(eq(features.isActive, true));

  // Get tenant-specific overrides
  const overrides = await db
    .select({
      featureKey: tenantFeatureOverrides.featureKey,
      enabled: tenantFeatureOverrides.enabled,
      variant: tenantFeatureOverrides.variant,
      limitValue: tenantFeatureOverrides.limitValue
    })
    .from(tenantFeatureOverrides)
    .where(and(
      eq(tenantFeatureOverrides.tenantId, tenantId),
      sql`${tenantFeatureOverrides.expiresAt} IS NULL OR ${tenantFeatureOverrides.expiresAt} > NOW()`
    ));

  // Merge base features with overrides
  const capabilities: Record<string, any> = {};
  for (const feature of baseFeatures) {
    const override = overrides.find(o => o.featureKey === feature.key);
    
    let value;
    if (override) {
      if (feature.type === 'boolean') {
        value = override.enabled !== null ? override.enabled : feature.enabled;
      } else if (feature.type === 'enum') {
        value = override.variant || feature.variant;
      } else if (feature.type === 'limit') {
        value = override.limitValue !== null ? override.limitValue : feature.limitValue;
      }
    } else {
      if (feature.type === 'boolean') {
        value = feature.enabled;
      } else if (feature.type === 'enum') {
        value = feature.variant;
      } else if (feature.type === 'limit') {
        value = feature.limitValue;
      }
    }

    capabilities[feature.key] = value;
  }

  const result = {
    planCode,
    capabilities
  };

  // Cache the result
  setCachedCapabilities(tenantId, result);

  return result;
}

// Middleware to require a specific feature
export function requireFeature(featureKey: string, options?: {
  minValue?: number;
  variant?: string | string[];
  message?: string;
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = (req as any).tenantId || (req as any).user?.tenantId;
      
      if (!tenantId) {
        return res.status(403).json({ 
          error: 'Feature access denied',
          featureKey
        });
      }

      const { capabilities } = await getTenantCapabilities(tenantId);
      const value = capabilities[featureKey];

      // Check feature access based on type
      const feature = await db
        .select({ type: features.type })
        .from(features)
        .where(eq(features.key, featureKey))
        .limit(1);

      if (!feature.length) {
        return res.status(500).json({ error: 'Unknown feature' });
      }

      const featureType = feature[0].type;
      let hasAccess = false;

      if (featureType === 'boolean') {
        hasAccess = value === true;
      } else if (featureType === 'enum') {
        if (options?.variant) {
          const allowedVariants = Array.isArray(options.variant) ? options.variant : [options.variant];
          hasAccess = value && allowedVariants.includes(value);
        } else {
          hasAccess = !!value && value !== 'none' && value !== 'off';
        }
      } else if (featureType === 'limit') {
        const limitValue = value || 0;
        hasAccess = options?.minValue ? limitValue >= options.minValue : limitValue > 0;
      }

      if (!hasAccess) {
        return res.status(403).json({ 
          error: options?.message || `This feature requires an upgraded plan`,
          featureKey,
          requiredValue: options?.minValue || options?.variant || true,
          currentValue: value,
          upgradeRequired: true
        });
      }

      // Store capabilities in request for later use
      (req as any).capabilities = capabilities;
      next();
    } catch (error) {
      console.error('Error checking feature access:', error);
      res.status(500).json({ error: 'Failed to verify feature access' });
    }
  };
}

// Helper to check feature without blocking
export async function hasFeature(tenantId: string, featureKey: string, options?: {
  minValue?: number;
  variant?: string | string[];
}): Promise<boolean> {
  try {
    const { capabilities } = await getTenantCapabilities(tenantId);
    const value = capabilities[featureKey];

    // Get feature type
    const feature = await db
      .select({ type: features.type })
      .from(features)
      .where(eq(features.key, featureKey))
      .limit(1);

    if (!feature.length) return false;

    const featureType = feature[0].type;

    if (featureType === 'boolean') {
      return value === true;
    } else if (featureType === 'enum') {
      if (options?.variant) {
        const allowedVariants = Array.isArray(options.variant) ? options.variant : [options.variant];
        return value && allowedVariants.includes(value);
      }
      return !!value && value !== 'none' && value !== 'off';
    } else if (featureType === 'limit') {
      const limitValue = value || 0;
      return options?.minValue ? limitValue >= options.minValue : limitValue > 0;
    }

    return false;
  } catch (error) {
    console.error('Error checking feature:', error);
    return false;
  }
}

// Check current usage against limits
export async function checkLimit(tenantId: string, limitKey: string, currentUsage: number): Promise<{
  allowed: boolean;
  limit: number;
  usage: number;
  remaining: number;
}> {
  try {
    const { capabilities } = await getTenantCapabilities(tenantId);
    const limit = capabilities[limitKey] || 0;
    const allowed = currentUsage < limit;
    
    return {
      allowed,
      limit,
      usage: currentUsage,
      remaining: Math.max(0, limit - currentUsage)
    };
  } catch (error) {
    console.error('Error checking limit:', error);
    return {
      allowed: false,
      limit: 0,
      usage: currentUsage,
      remaining: 0
    };
  }
}

// Middleware to attach capabilities to request
export async function attachCapabilities(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId || (req as any).user?.tenantId;
    
    if (tenantId) {
      const { capabilities } = await getTenantCapabilities(tenantId);
      (req as any).capabilities = capabilities;
    }
    
    next();
  } catch (error) {
    console.error('Error attaching capabilities:', error);
    next(); // Continue even if capabilities can't be loaded
  }
}

// Clear cache (exported for use in other modules)
// Re-export the shared cache clear function
export const clearCapabilitiesCache = clearCache;