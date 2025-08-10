import { useQuery } from '@tanstack/react-query';
import { hasFeature, getEnabledFeatures, checkPlanLimits, PLAN_LIMITS, FEATURE_NAMES } from '@shared/feature-flags';
import type { PlanLevel, FeatureKey } from '@shared/schema';
import React from 'react';

// Hook to get current tenant's plan level and features
export function usePlanFeatures() {
  return useQuery({
    queryKey: ['/api/tenant/plan-features'],
    queryFn: async () => {
      const response = await fetch('/api/tenant/plan-features');
      if (!response.ok) throw new Error('Failed to fetch plan features');
      const data = await response.json();
      return data as {
        planLevel: PlanLevel;
        features: Record<FeatureKey, boolean>;
        limits: typeof PLAN_LIMITS[PlanLevel];
        playerCount: number;
      };
    },
  });
}

// Hook to check if a specific feature is available
export function useHasFeature(featureKey: FeatureKey) {
  const { data: planData } = usePlanFeatures();
  
  return {
    hasFeature: planData?.features?.[featureKey] ?? false,
    planLevel: planData?.planLevel ?? 'core',
    isLoading: !planData,
  };
}

// Hook to check multiple features at once
export function useHasFeatures(featureKeys: FeatureKey[]) {
  const { data: planData } = usePlanFeatures();
  
  const results = featureKeys.reduce((acc, key) => {
    acc[key] = planData?.features?.[key] ?? false;
    return acc;
  }, {} as Record<FeatureKey, boolean>);
  
  return {
    features: results,
    planLevel: planData?.planLevel ?? 'core',
    isLoading: !planData,
  };
}

// Hook to check plan limits (e.g., player count)
export function usePlanLimits() {
  const { data: planData } = usePlanFeatures();
  
  if (!planData) {
    return {
      withinLimit: true,
      limit: null,
      percentage: 0,
      isLoading: true,
    };
  }
  
  const limits = checkPlanLimits(planData.planLevel, planData.playerCount);
  
  return {
    ...limits,
    isLoading: false,
    currentCount: planData.playerCount,
    planLevel: planData.planLevel,
  };
}

// Hook to get upgrade benefits for a specific plan
export function useUpgradeBenefits(targetPlan: PlanLevel) {
  const { data: planData } = usePlanFeatures();
  
  if (!planData) return { benefits: [], isLoading: true };
  
  const currentFeatures = getEnabledFeatures(planData.planLevel);
  const targetFeatures = getEnabledFeatures(targetPlan);
  const newFeatures = targetFeatures.filter(feature => !currentFeatures.includes(feature));
  
  return {
    benefits: newFeatures.map(key => ({
      key,
      name: FEATURE_NAMES[key],
      description: FEATURE_NAMES[key],
    })),
    isLoading: false,
    currentPlan: planData.planLevel,
    targetPlan,
  };
}

// Component wrapper for feature-gated content
interface FeatureGuardProps {
  feature: FeatureKey;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function FeatureGuard({ feature, fallback, children }: FeatureGuardProps) {
  const { hasFeature, isLoading } = useHasFeature(feature);
  
  if (isLoading) return null;
  if (!hasFeature) return fallback ?? null;
  
  return React.createElement(React.Fragment, null, children);
}

// Component for upgrade prompts
interface UpgradePromptProps {
  feature: FeatureKey;
  className?: string;
  targetPlan?: PlanLevel;
}

export function UpgradePrompt({ feature, className, targetPlan }: UpgradePromptProps) {
  const featureName = FEATURE_NAMES[feature];
  const { planLevel } = useHasFeature(feature);
  
  const suggestedPlan = targetPlan || (planLevel === 'core' ? 'growth' : 'elite');
  const planName = PLAN_LIMITS[suggestedPlan].name;
  const price = PLAN_LIMITS[suggestedPlan].price;
  
  return React.createElement('div', {
    className: `bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border border-blue-200 dark:border-blue-800 rounded-lg p-4 ${className}`
  }, [
    React.createElement('div', { className: 'flex items-start space-x-3', key: 'content' }, [
      React.createElement('div', { className: 'flex-shrink-0', key: 'icon' },
        React.createElement('svg', {
          className: 'h-5 w-5 text-blue-500',
          fill: 'none',
          viewBox: '0 0 24 24',
          stroke: 'currentColor',
          key: 'svg'
        }, React.createElement('path', {
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          strokeWidth: '2',
          d: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
        }))
      ),
      React.createElement('div', { className: 'flex-1', key: 'text' }, [
        React.createElement('h3', {
          className: 'text-sm font-medium text-gray-900 dark:text-gray-100',
          key: 'title'
        }, 'Upgrade Required'),
        React.createElement('p', {
          className: 'mt-1 text-sm text-gray-600 dark:text-gray-400',
          key: 'description'
        }, [
          React.createElement('strong', { key: 'feature' }, featureName),
          ' is available on the ',
          React.createElement('strong', { key: 'plan' }, planName),
          ' plan starting at ',
          React.createElement('strong', { key: 'price' }, `$${price}/month`),
          '.'
        ]),
        React.createElement('div', { className: 'mt-3', key: 'button-container' },
          React.createElement('a', {
            href: '/admin/billing',
            className: 'inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors',
            'data-testid': 'button-upgrade'
          }, 'Upgrade Now')
        )
      ])
    ])
  ]);
}

// Hook for conditional CSS classes based on plan
export function usePlanStyling() {
  const { data: planData } = usePlanFeatures();
  
  const getPlanColor = (planLevel?: PlanLevel) => {
    switch (planLevel) {
      case 'core': return 'blue';
      case 'growth': return 'green';
      case 'elite': return 'purple';
      default: return 'gray';
    }
  };
  
  return {
    planLevel: planData?.planLevel ?? 'core',
    planColor: getPlanColor(planData?.planLevel),
    planName: planData ? PLAN_LIMITS[planData.planLevel].name : 'Core',
    isLoading: !planData,
  };
}