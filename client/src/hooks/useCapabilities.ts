import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';

// Type definitions
export type FeatureType = 'boolean' | 'enum' | 'limit';

export interface Capability {
  name: string;
  category: string;
  type: FeatureType;
  value: boolean | string | number | null;
  isOverride: boolean;
}

export interface TenantCapabilities {
  tenantId: string;
  planCode: string;
  capabilities: Record<string, Capability>;
  cachedAt: string;
}

// Custom hook to get tenant capabilities
export function useCapabilities() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<TenantCapabilities>({
    queryKey: ['/api/tenant/capabilities'],
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Helper to check if a feature is enabled
  const hasFeature = useMemo(() => {
    return (featureKey: string, options?: {
      minValue?: number;
      variant?: string | string[];
    }): boolean => {
      if (!data?.capabilities) return false;
      
      const capability = data.capabilities[featureKey];
      if (!capability) return false;

      const { type, value } = capability;

      if (type === 'boolean') {
        return value === true;
      } else if (type === 'enum') {
        if (options?.variant) {
          const allowedVariants = Array.isArray(options.variant) 
            ? options.variant 
            : [options.variant];
          return value !== null && allowedVariants.includes(value as string);
        }
        return !!value && value !== 'none' && value !== 'off';
      } else if (type === 'limit') {
        const limitValue = (value as number) || 0;
        return options?.minValue ? limitValue >= options.minValue : limitValue > 0;
      }

      return false;
    };
  }, [data]);

  // Helper to get feature value
  const getFeatureValue = useMemo(() => {
    return (featureKey: string): any => {
      if (!data?.capabilities) return null;
      return data.capabilities[featureKey]?.value || null;
    };
  }, [data]);

  // Helper to get feature limit
  const getLimit = useMemo(() => {
    return (limitKey: string): number => {
      if (!data?.capabilities) return 0;
      const capability = data.capabilities[limitKey];
      if (capability?.type === 'limit') {
        return (capability.value as number) || 0;
      }
      return 0;
    };
  }, [data]);

  // Helper to check if usage is within limit
  const checkLimit = useMemo(() => {
    return (limitKey: string, currentUsage: number): {
      allowed: boolean;
      limit: number;
      usage: number;
      remaining: number;
      percentUsed: number;
    } => {
      const limit = getLimit(limitKey);
      const allowed = currentUsage < limit || limit === 999999; // 999999 is unlimited
      const remaining = Math.max(0, limit - currentUsage);
      const percentUsed = limit > 0 ? (currentUsage / limit) * 100 : 0;

      return {
        allowed,
        limit,
        usage: currentUsage,
        remaining,
        percentUsed
      };
    };
  }, [getLimit]);

  // Helper to show upgrade prompt
  const { toast } = useToast();
  const showUpgradePrompt = useMemo(() => {
    return (featureKey: string, featureName?: string) => {
      const capability = data?.capabilities?.[featureKey];
      const name = featureName || capability?.name || featureKey;
      
      toast({
        title: "Upgrade Required",
        description: `${name} is not available on your current plan. Please upgrade to access this feature.`,
        variant: "default"
      });
    };
  }, [data, toast]);

  // Invalidate cache when needed
  const invalidateCapabilities = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/tenant/capabilities'] });
  };

  return {
    capabilities: data?.capabilities || {},
    planCode: data?.planCode || 'free',
    isLoading,
    error,
    hasFeature,
    getFeatureValue,
    getLimit,
    checkLimit,
    showUpgradePrompt,
    invalidateCapabilities
  };
}

// Component wrapper for feature gating
interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgrade?: boolean;
  variant?: string | string[];
  minValue?: number;
}

export function FeatureGate({ 
  feature, 
  children, 
  fallback = null,
  showUpgrade = false,
  variant,
  minValue 
}: FeatureGateProps) {
  const { hasFeature, showUpgradePrompt } = useCapabilities();
  
  const isEnabled = hasFeature(feature, { variant, minValue });

  useEffect(() => {
    if (!isEnabled && showUpgrade) {
      showUpgradePrompt(feature);
    }
  }, [isEnabled, showUpgrade, feature, showUpgradePrompt]);

  if (isEnabled) {
    return children as React.ReactElement;
  }

  return (fallback as React.ReactElement) || null;
}

// Hook for checking multiple features at once
export function useFeatures(features: string[]): Record<string, boolean> {
  const { hasFeature } = useCapabilities();
  
  return useMemo(() => {
    return features.reduce((acc, feature) => {
      acc[feature] = hasFeature(feature);
      return acc;
    }, {} as Record<string, boolean>);
  }, [features, hasFeature]);
}

// Hook for plan comparison
export function usePlanComparison() {
  const { data, isLoading, error } = useQuery<{
    plans: any[];
    comparison: Record<string, any>;
  }>({
    queryKey: ['/api/super-admin/plans/comparison'],
    staleTime: 10 * 60 * 1000, // Consider data fresh for 10 minutes
  });

  return {
    plans: data?.plans || [],
    comparison: data?.comparison || {},
    isLoading,
    error
  };
}