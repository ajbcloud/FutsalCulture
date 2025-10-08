import { Request, Response } from 'express';
import { db } from '../../db';
import { eq, and, sql } from 'drizzle-orm';
import { 
  features, 
  planFeatures, 
  tenantFeatureOverrides,
  tenantPlanAssignments,
  tenants,
  subscriptions // Assuming subscriptions table is imported
} from '../../../shared/schema';
import { 
  getCachedCapabilities, 
  setCachedCapabilities, 
  clearCapabilitiesCache as clearCache 
} from '../../lib/capabilitiesCache';

// Get capabilities for a tenant
export async function getTenantCapabilities(req: Request, res: Response) {
  try {
    const tenantId = (req as any).tenantId || (req as any).user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    // Check cache
    const cached = getCachedCapabilities(tenantId);
    if (cached) {
      res.setHeader('X-Cache-Hit', 'true');
      return res.json(cached);
    }

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

    const planCode = planAssignment[0]?.planCode || 'free';

    // Get base features from plan
    const baseFeatures = await db
      .select({
        key: features.key,
        name: features.name,
        category: features.category,
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
        limitValue: tenantFeatureOverrides.limitValue,
        expiresAt: tenantFeatureOverrides.expiresAt
      })
      .from(tenantFeatureOverrides)
      .where(and(
        eq(tenantFeatureOverrides.tenantId, tenantId),
        sql`${tenantFeatureOverrides.expiresAt} IS NULL OR ${tenantFeatureOverrides.expiresAt} > NOW()`
      ));

    // Merge base features with overrides
    const capabilities = {};
    for (const feature of baseFeatures) {
      const override = overrides.find(o => o.featureKey === feature.key);

      let value;
      if (override) {
        // Use override value
        if (feature.type === 'boolean') {
          value = override.enabled !== null ? override.enabled : feature.enabled;
        } else if (feature.type === 'enum') {
          value = override.variant || feature.variant;
        } else if (feature.type === 'limit') {
          value = override.limitValue !== null ? override.limitValue : feature.limitValue;
        }
      } else {
        // Use base value
        if (feature.type === 'boolean') {
          value = feature.enabled;
        } else if (feature.type === 'enum') {
          value = feature.variant;
        } else if (feature.type === 'limit') {
          value = feature.limitValue;
        }
      }

      capabilities[feature.key] = {
        name: feature.name,
        category: feature.category,
        type: feature.type,
        value,
        isOverride: !!override
      };
    }

    const result = {
      tenantId,
      planCode,
      capabilities,
      cachedAt: new Date().toISOString()
    };

    // Cache the result
    setCachedCapabilities(tenantId, result);

    res.setHeader('X-Cache-Hit', 'false');
    res.json(result);
  } catch (error) {
    console.error('Error fetching tenant capabilities:', error);
    res.status(500).json({ error: 'Failed to fetch capabilities' });
  }
}

// Check if a tenant has a specific capability
export async function checkCapability(req: Request, res: Response) {
  try {
    const tenantId = (req as any).tenantId || (req as any).user?.tenantId;
    const { featureKey, minValue } = req.params;

    if (!tenantId || !featureKey) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Get capabilities
    const capabilitiesReq = { ...req, params: {} } as Request;
    const capabilitiesRes = {
      json: (data: any) => data,
      status: () => ({ json: () => null }),
      setHeader: () => null
    } as any;

    const capabilities = await getTenantCapabilities(capabilitiesReq, capabilitiesRes);

    if (!capabilities?.capabilities) {
      return res.json({ hasCapability: false });
    }

    const capability = capabilities.capabilities[featureKey];
    if (!capability) {
      return res.json({ hasCapability: false });
    }

    let hasCapability = false;
    if (capability.type === 'boolean') {
      hasCapability = capability.value === true;
    } else if (capability.type === 'enum') {
      hasCapability = !!capability.value && capability.value !== 'none' && capability.value !== 'off';
    } else if (capability.type === 'limit') {
      const value = capability.value || 0;
      hasCapability = minValue ? value >= Number(minValue) : value > 0;
    }

    res.json({ 
      hasCapability,
      value: capability.value,
      type: capability.type
    });
  } catch (error) {
    console.error('Error checking capability:', error);
    res.status(500).json({ error: 'Failed to check capability' });
  }
}

// Clear cache for a tenant (used after plan changes or overrides)
// Re-export the shared cache clear function
export const clearCapabilitiesCache = clearCache;

// Clear cache for all tenants on a plan (used after plan feature changes)
export async function clearPlanCapabilitiesCache(planCode: string) {
  // Get all tenants on this plan
  const affectedTenants = await db
    .select({
      tenantId: tenantPlanAssignments.tenantId
    })
    .from(tenantPlanAssignments)
    .where(and(
      eq(tenantPlanAssignments.planCode, planCode),
      sql`${tenantPlanAssignments.until} IS NULL OR ${tenantPlanAssignments.until} > NOW()`
    ));

  // Clear cache for each tenant using the shared cache clear function
  for (const { tenantId } of affectedTenants) {
    clearCache(tenantId);
  }
}