import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { tenantPolicies } from "../../shared/db/schema/tenantPolicy";
import { features, planFeatures } from "../../shared/schema";
import { eq } from "drizzle-orm";

/**
 * Age Policy Feature Flags
 * 
 * These middleware functions check if age policy features are enabled
 * for the current tenant based on their plan and feature flags.
 */

export const AGE_POLICY_FEATURES = {
  AGE_GATING: "age_gating_enabled",
  TEEN_SELF_ACCESS: "teen_self_access",
  PARENT_CONSENT: "parent_consent_tracking",
  BIRTHDAY_UPSHIFT: "automatic_birthday_upshift",
  GUARDIAN_MANAGEMENT: "guardian_management",
  CONSENT_FORMS: "digital_consent_forms",
  PLAYER_PORTALS: "player_portal_access"
};

/**
 * Check if a specific age policy feature is enabled for the tenant
 */
export async function hasAgePolicyFeature(tenantId: string, featureKey: string): Promise<boolean> {
  try {
    // Check if the feature exists and is enabled for the tenant's plan
    const result = await db.select()
      .from(features)
      .innerJoin(planFeatures, eq(features.key, planFeatures.featureKey))
      .where(eq(features.key, featureKey))
      .limit(1)
      .execute();
    
    return result.length > 0 && result[0].planFeatures.isEnabled;
  } catch (error) {
    console.error(`Error checking age policy feature ${featureKey}:`, error);
    return false;
  }
}

/**
 * Middleware to require age gating feature
 */
export async function requireAgeGating(req: Request, res: Response, next: NextFunction) {
  const tenantId = req.session?.user?.tenantId || req.body?.tenantId;
  
  if (!tenantId) {
    return res.status(400).json({ error: "Tenant ID required" });
  }
  
  const hasFeature = await hasAgePolicyFeature(tenantId, AGE_POLICY_FEATURES.AGE_GATING);
  
  if (!hasFeature) {
    return res.status(403).json({ 
      error: "Age gating feature not available in your plan",
      featureRequired: AGE_POLICY_FEATURES.AGE_GATING,
      upgradeRequired: true
    });
  }
  
  next();
}

/**
 * Middleware to require teen self-access feature
 */
export async function requireTeenSelfAccess(req: Request, res: Response, next: NextFunction) {
  const tenantId = req.session?.user?.tenantId || req.body?.tenantId;
  
  if (!tenantId) {
    return res.status(400).json({ error: "Tenant ID required" });
  }
  
  const hasFeature = await hasAgePolicyFeature(tenantId, AGE_POLICY_FEATURES.TEEN_SELF_ACCESS);
  
  if (!hasFeature) {
    return res.status(403).json({ 
      error: "Teen self-access feature not available in your plan",
      featureRequired: AGE_POLICY_FEATURES.TEEN_SELF_ACCESS,
      upgradeRequired: true
    });
  }
  
  next();
}

/**
 * Middleware to require consent forms feature
 */
export async function requireConsentForms(req: Request, res: Response, next: NextFunction) {
  const tenantId = req.session?.user?.tenantId || req.body?.tenantId;
  
  if (!tenantId) {
    return res.status(400).json({ error: "Tenant ID required" });
  }
  
  const hasFeature = await hasAgePolicyFeature(tenantId, AGE_POLICY_FEATURES.CONSENT_FORMS);
  
  if (!hasFeature) {
    return res.status(403).json({ 
      error: "Digital consent forms feature not available in your plan",
      featureRequired: AGE_POLICY_FEATURES.CONSENT_FORMS,
      upgradeRequired: true
    });
  }
  
  next();
}

/**
 * Get all enabled age policy features for a tenant
 */
export async function getTenantAgePolicyFeatures(tenantId: string): Promise<string[]> {
  const enabledFeatures: string[] = [];
  
  for (const [key, value] of Object.entries(AGE_POLICY_FEATURES)) {
    if (await hasAgePolicyFeature(tenantId, value)) {
      enabledFeatures.push(value);
    }
  }
  
  return enabledFeatures;
}

/**
 * Check if age policies are enforced for a tenant
 */
export async function isAgePolicyEnforced(tenantId: string): Promise<boolean> {
  try {
    const policy = await db.select()
      .from(tenantPolicies)
      .where(eq(tenantPolicies.tenantId, tenantId))
      .limit(1)
      .execute();
    
    if (policy.length === 0) {
      return false;
    }
    
    // Check if age gating is enabled and the tenant has the feature
    const hasFeature = await hasAgePolicyFeature(tenantId, AGE_POLICY_FEATURES.AGE_GATING);
    
    return policy[0].enforceAgeGating && hasFeature;
  } catch (error) {
    console.error("Error checking age policy enforcement:", error);
    return false;
  }
}