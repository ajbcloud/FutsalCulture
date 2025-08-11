import { plans } from '../config/plans.config';

export function getPlan(planId: string) {
  return plans.find(p => p.id === planId);
}

export function isFeatureIncluded(planId: string, featureKey: string): boolean {
  const plan = getPlan(planId);
  const feature = plan?.features?.[featureKey];
  return feature?.status === 'included';
}

export function checkFeatureAccess(planId: string, featureKey: string) {
  if (!isFeatureIncluded(planId, featureKey)) {
    return {
      allowed: false,
      error: {
        code: 'plan_required',
        feature: featureKey,
        message: `This feature requires a plan that includes ${featureKey}`,
      },
    };
  }
  return { allowed: true };
}

export function validatePlanAccess(planId: string, requiredFeatures: string[]) {
  for (const feature of requiredFeatures) {
    const result = checkFeatureAccess(planId, feature);
    if (!result.allowed) {
      return result;
    }
  }
  return { allowed: true };
}