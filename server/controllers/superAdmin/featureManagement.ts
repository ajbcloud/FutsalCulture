import { Request, Response } from 'express';
import { db } from '../../db';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { 
  features, 
  planFeatures, 
  planCatalog,
  featureAuditLog,
  tenants,
  tenantPlanAssignments
} from '../../../shared/schema';

// Get all features for a plan, organized by category
export async function getPlanFeatures(req: Request, res: Response) {
  try {
    const { planCode } = req.params;
    
    // Get plan details
    const plan = await db.select()
      .from(planCatalog)
      .where(eq(planCatalog.code, planCode))
      .limit(1);
    
    if (!plan.length) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Get all active features with their values for this plan
    const result = await db
      .select({
        key: features.key,
        name: features.name,
        category: features.category,
        type: features.type,
        description: features.description,
        optionsJson: features.optionsJson,
        displayOrder: features.displayOrder,
        enabled: planFeatures.enabled,
        variant: planFeatures.variant,
        limitValue: planFeatures.limitValue,
        metadata: planFeatures.metadata,
        updatedAt: planFeatures.updatedAt
      })
      .from(features)
      .leftJoin(
        planFeatures,
        and(
          eq(planFeatures.planCode, planCode),
          eq(planFeatures.featureKey, features.key)
        )
      )
      .where(eq(features.isActive, true))
      .orderBy(features.category, features.displayOrder);

    // Group by category
    const categorized = result.reduce((acc, feature) => {
      if (!acc[feature.category]) {
        acc[feature.category] = [];
      }
      acc[feature.category].push({
        ...feature,
        value: feature.type === 'boolean' ? feature.enabled :
               feature.type === 'enum' ? feature.variant :
               feature.type === 'limit' ? feature.limitValue : null
      });
      return acc;
    }, {} as Record<string, any[]>);

    // Add ETag for caching
    const etag = `"${planCode}-${Date.now()}"`;
    res.setHeader('ETag', etag);
    
    res.json({
      plan: plan[0],
      features: categorized,
      lastModified: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching plan features:', error);
    res.status(500).json({ error: 'Failed to fetch plan features' });
  }
}

// Update a single feature for a plan (autosave)
export async function updatePlanFeature(req: Request, res: Response) {
  try {
    const { planCode, featureKey } = req.params;
    const { enabled, variant, limitValue } = req.body;
    const userId = (req as any).user?.id;

    // Validate feature exists and get its type
    const feature = await db.select()
      .from(features)
      .where(eq(features.key, featureKey))
      .limit(1);
    
    if (!feature.length) {
      return res.status(404).json({ error: 'Feature not found' });
    }

    const featureData = feature[0];
    
    // Validate value based on feature type
    let value: any = {};
    if (featureData.type === 'boolean') {
      if (typeof enabled !== 'boolean') {
        return res.status(400).json({ error: 'Invalid value for boolean feature' });
      }
      value = { enabled };
    } else if (featureData.type === 'enum') {
      if (!variant || (featureData.optionsJson as any)?.values?.indexOf(variant) === -1) {
        return res.status(400).json({ error: 'Invalid variant for enum feature' });
      }
      value = { variant };
    } else if (featureData.type === 'limit') {
      if (typeof limitValue !== 'number' || limitValue < 0) {
        return res.status(400).json({ error: 'Invalid value for limit feature' });
      }
      const options = featureData.optionsJson as any;
      if (options?.max && limitValue > options.max) {
        return res.status(400).json({ error: `Value exceeds maximum of ${options.max}` });
      }
      value = { limitValue };
    }

    // Get current value for audit log
    const currentValue = await db.select()
      .from(planFeatures)
      .where(and(
        eq(planFeatures.planCode, planCode),
        eq(planFeatures.featureKey, featureKey)
      ))
      .limit(1);

    const oldValue = currentValue.length ? {
      enabled: currentValue[0].enabled,
      variant: currentValue[0].variant,
      limitValue: currentValue[0].limitValue
    } : null;

    // Upsert the feature value
    await db.insert(planFeatures)
      .values({
        planCode,
        featureKey,
        ...value,
        updatedBy: userId,
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: [planFeatures.planCode, planFeatures.featureKey],
        set: {
          ...value,
          updatedBy: userId,
          updatedAt: new Date()
        }
      });

    // Log the change
    await db.insert(featureAuditLog).values({
      entityType: 'plan',
      entityId: planCode,
      featureKey,
      oldValue,
      newValue: value,
      changedBy: userId,
      changeReason: req.body.reason,
      ip: req.ip || '',
      userAgent: req.get('user-agent') || ''
    });

    // Get affected tenants count for cache invalidation
    const affectedTenants = await db
      .select({ count: sql`count(*)::int` })
      .from(tenantPlanAssignments)
      .where(and(
        eq(tenantPlanAssignments.planCode, planCode),
        sql`${tenantPlanAssignments.until} IS NULL OR ${tenantPlanAssignments.until} > NOW()`
      ));

    // TODO: Implement cache invalidation here
    // await invalidateCapabilitiesCache(planCode);

    res.json({
      success: true,
      feature: featureKey,
      value,
      affectedTenants: affectedTenants[0]?.count || 0,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating plan feature:', error);
    res.status(500).json({ error: 'Failed to update feature' });
  }
}

// Bulk update features (for copy column, reset to defaults, etc.)
export async function bulkUpdatePlanFeatures(req: Request, res: Response) {
  try {
    const { planCode } = req.params;
    const { features: featureUpdates, sourcePlanCode, reason } = req.body;
    const userId = (req as any).user?.id;

    // If copying from another plan
    if (sourcePlanCode) {
      const sourceFeatures = await db.select()
        .from(planFeatures)
        .where(eq(planFeatures.planCode, sourcePlanCode));
      
      for (const sourceFeature of sourceFeatures) {
        await db.insert(planFeatures)
          .values({
            planCode,
            featureKey: sourceFeature.featureKey,
            enabled: sourceFeature.enabled,
            variant: sourceFeature.variant,
            limitValue: sourceFeature.limitValue,
            metadata: sourceFeature.metadata,
            updatedBy: userId,
            updatedAt: new Date()
          })
          .onConflictDoUpdate({
            target: [planFeatures.planCode, planFeatures.featureKey],
            set: {
              enabled: sourceFeature.enabled,
              variant: sourceFeature.variant,
              limitValue: sourceFeature.limitValue,
              metadata: sourceFeature.metadata,
              updatedBy: userId,
              updatedAt: new Date()
            }
          });
      }
    } 
    // If updating specific features
    else if (featureUpdates && Array.isArray(featureUpdates)) {
      for (const update of featureUpdates) {
        const { featureKey, enabled, variant, limitValue } = update;
        
        await db.insert(planFeatures)
          .values({
            planCode,
            featureKey,
            enabled,
            variant,
            limitValue,
            updatedBy: userId,
            updatedAt: new Date()
          })
          .onConflictDoUpdate({
            target: [planFeatures.planCode, planFeatures.featureKey],
            set: {
              enabled,
              variant,
              limitValue,
              updatedBy: userId,
              updatedAt: new Date()
            }
          });

        // Log each change
        await db.insert(featureAuditLog).values({
          entityType: 'plan',
          entityId: planCode,
          featureKey,
          oldValue: null, // TODO: Fetch old values
          newValue: { enabled, variant, limitValue },
          changedBy: userId,
          changeReason: reason || 'Bulk update',
          ip: req.ip || '',
          userAgent: req.get('user-agent') || ''
        });
      }
    }

    // Get affected tenants count
    const affectedTenants = await db
      .select({ count: sql`count(*)::int` })
      .from(tenantPlanAssignments)
      .where(and(
        eq(tenantPlanAssignments.planCode, planCode),
        sql`${tenantPlanAssignments.until} IS NULL OR ${tenantPlanAssignments.until} > NOW()`
      ));

    res.json({
      success: true,
      updatedCount: featureUpdates?.length || 0,
      affectedTenants: affectedTenants[0]?.count || 0,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error bulk updating features:', error);
    res.status(500).json({ error: 'Failed to bulk update features' });
  }
}

// Get all plans with their feature comparison
export async function getPlansComparison(req: Request, res: Response) {
  try {
    // Get all plans
    const plans = await db.select().from(planCatalog);
    
    // Get all features with their values for each plan
    const allFeatures = await db
      .select({
        planCode: planFeatures.planCode,
        featureKey: features.key,
        featureName: features.name,
        category: features.category,
        type: features.type,
        enabled: planFeatures.enabled,
        variant: planFeatures.variant,
        limitValue: planFeatures.limitValue
      })
      .from(features)
      .leftJoin(planFeatures, eq(planFeatures.featureKey, features.key))
      .where(eq(features.isActive, true))
      .orderBy(features.category, features.displayOrder);

    // Organize data for comparison grid
    const comparison = {};
    for (const feature of allFeatures) {
      if (!comparison[feature.featureKey]) {
        comparison[feature.featureKey] = {
          name: feature.featureName,
          category: feature.category,
          type: feature.type,
          plans: {}
        };
      }
      
      if (feature.planCode) {
        comparison[feature.featureKey].plans[feature.planCode] = {
          enabled: feature.enabled,
          variant: feature.variant,
          limitValue: feature.limitValue
        };
      }
    }

    res.json({
      plans,
      comparison
    });
  } catch (error) {
    console.error('Error fetching plans comparison:', error);
    res.status(500).json({ error: 'Failed to fetch plans comparison' });
  }
}

// Get feature audit history
export async function getFeatureAuditLog(req: Request, res: Response) {
  try {
    const { entityType, entityId, featureKey, limit = 50 } = req.query;
    
    let query = db.select({
      id: featureAuditLog.id,
      entityType: featureAuditLog.entityType,
      entityId: featureAuditLog.entityId,
      featureKey: featureAuditLog.featureKey,
      oldValue: featureAuditLog.oldValue,
      newValue: featureAuditLog.newValue,
      changedBy: featureAuditLog.changedBy,
      changeReason: featureAuditLog.changeReason,
      createdAt: featureAuditLog.createdAt
    })
    .from(featureAuditLog);

    // Apply filters
    const conditions = [];
    if (entityType) conditions.push(eq(featureAuditLog.entityType, entityType as string));
    if (entityId) conditions.push(eq(featureAuditLog.entityId, entityId as string));
    if (featureKey) conditions.push(eq(featureAuditLog.featureKey, featureKey as string));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const logs = await query
      .orderBy(sql`${featureAuditLog.createdAt} DESC`)
      .limit(Number(limit));

    res.json(logs);
  } catch (error) {
    console.error('Error fetching feature audit log:', error);
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
}