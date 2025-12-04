import { useQuery } from "@tanstack/react-query";
import type { PlanId } from "@/constants/plans";

interface TenantInfo {
  // Tenant basic info
  id: string;
  name: string;
  contactName: string;
  contactEmail: string;
  location: {
    city: string | null;
    state: string | null;
    country: string | null;
  };
  
  // Plan information - SINGLE SOURCE OF TRUTH
  planCode: PlanId; // 'free' | 'core' | 'growth' | 'elite'
  planLevel: number; // Numeric representation (0-3)
  planId: PlanId; // Alias for backward compatibility
  
  // Billing information
  billingStatus: 'active' | 'trialing' | 'past_due' | 'cancelled' | 'none';
  renewalDate: string | null;
  paymentCustomerId: string | null;
  paymentSubscriptionId: string | null;
  
  // Trial information
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  
  // Feature overrides for future customization
  featureOverrides?: Record<string, any>;
}

interface TenantPlanData {
  planId: PlanId;
  billingStatus: 'active' | 'trialing' | 'past_due' | 'cancelled' | 'none';
  renewalDate?: string;
  featureOverrides?: Record<string, any>;
}

// Main hook - fetches from /api/tenant/info (SINGLE SOURCE OF TRUTH)
export function useTenantInfo() {
  return useQuery<TenantInfo>({
    queryKey: ['/api/tenant/info'],
    staleTime: 1000 * 30, // 30 seconds for faster updates
    refetchOnWindowFocus: true, // Refetch when tab becomes active
  });
}

// Backward compatibility - wrapper that returns just the plan data
export function useTenantPlan() {
  const { data: tenantInfo, ...rest } = useTenantInfo();
  
  // Extract just the plan-related data for backward compatibility
  const planData = tenantInfo ? {
    planId: tenantInfo.planCode,
    billingStatus: tenantInfo.billingStatus,
    renewalDate: tenantInfo.renewalDate || undefined,
    featureOverrides: tenantInfo.featureOverrides || {}
  } : undefined;

  return {
    ...rest,
    data: planData as TenantPlanData | undefined
  };
}

// Keep useSubscriptionInfo as is for now
export function useSubscriptionInfo() {
  return useQuery({
    queryKey: ['/api/admin/subscription-info'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}