import { Request, Response, NextFunction } from 'express';
import { hasFeature } from '../shared/feature-flags';
import { PlanLevel, FeatureKey, FEATURE_KEYS } from '../shared/schema';
import { db } from './db';
import { tenants } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Extend Express Request to include tenant info
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      planLevel?: PlanLevel;
    }
  }
}

// Middleware to load tenant and plan level
export async function loadTenantMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Extract tenant ID from session or request
    const tenantId = (req.session as any)?.user?.tenantId || req.headers['x-tenant-id'] as string;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    // Fetch tenant with plan level
    const tenant = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
    
    if (!tenant.length) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Add to request object
    req.tenantId = tenantId;
    req.planLevel = tenant[0].planLevel || 'core';
    
    next();
  } catch (error) {
    console.error('Error loading tenant:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Middleware to check feature access
export function requireFeature(featureKey: FeatureKey) {
  return (req: Request, res: Response, next: NextFunction) => {
    const planLevel = req.planLevel;
    
    if (!planLevel) {
      return res.status(400).json({ error: 'Plan level not found' });
    }

    if (!hasFeature(planLevel, featureKey)) {
      return res.status(403).json({ 
        error: 'Feature not available on current plan',
        feature: featureKey,
        planLevel,
        upgradeRequired: true
      });
    }

    next();
  };
}

// Middleware to check multiple features (OR logic)
export function requireAnyFeature(featureKeys: FeatureKey[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const planLevel = req.planLevel;
    
    if (!planLevel) {
      return res.status(400).json({ error: 'Plan level not found' });
    }

    const hasAnyFeature = featureKeys.some(key => hasFeature(planLevel, key));
    
    if (!hasAnyFeature) {
      return res.status(403).json({ 
        error: 'None of the required features are available on current plan',
        features: featureKeys,
        planLevel,
        upgradeRequired: true
      });
    }

    next();
  };
}

// Middleware to check all features (AND logic)
export function requireAllFeatures(featureKeys: FeatureKey[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const planLevel = req.planLevel;
    
    if (!planLevel) {
      return res.status(400).json({ error: 'Plan level not found' });
    }

    const missingFeatures = featureKeys.filter(key => !hasFeature(planLevel, key));
    
    if (missingFeatures.length > 0) {
      return res.status(403).json({ 
        error: 'Some required features are not available on current plan',
        missingFeatures,
        planLevel,
        upgradeRequired: true
      });
    }

    next();
  };
}

// Utility function to get plan level for a tenant
export async function getTenantPlanLevel(tenantId: string): Promise<PlanLevel | null> {
  try {
    const tenant = await db.select({ planLevel: tenants.planLevel })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);
    
    return tenant.length > 0 ? tenant[0].planLevel : null;
  } catch (error) {
    console.error('Error getting tenant plan level:', error);
    return null;
  }
}

// Check feature access programmatically
export async function checkFeatureAccess(tenantId: string, featureKey: FeatureKey): Promise<boolean> {
  const planLevel = await getTenantPlanLevel(tenantId);
  if (!planLevel) return false;
  
  return hasFeature(planLevel, featureKey);
}

// Get all feature access for a tenant
export async function getTenantFeatures(tenantId: string): Promise<Record<FeatureKey, boolean> | null> {
  const planLevel = await getTenantPlanLevel(tenantId);
  if (!planLevel) return null;
  
  const features = {} as Record<FeatureKey, boolean>;
  
  // Check all features
  Object.values(FEATURE_KEYS).forEach((key) => {
    features[key as FeatureKey] = hasFeature(planLevel, key as FeatureKey);
  });
  
  return features;
}

// Response helper for feature-gated endpoints
export function createFeatureResponse(req: Request, res: Response, data: any) {
  return res.json({
    ...data,
    planLevel: req.planLevel,
    tenantId: req.tenantId,
  });
}

// Error handler for feature access errors
export function handleFeatureError(error: any, req: Request, res: Response, next: NextFunction) {
  if (error.upgradeRequired) {
    return res.status(403).json({
      error: 'Feature upgrade required',
      currentPlan: req.planLevel,
      featureRequired: error.feature,
      upgradeUrl: '/admin/billing',
    });
  }
  
  next(error);
}