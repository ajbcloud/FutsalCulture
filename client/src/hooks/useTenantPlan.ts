import { useQuery } from "@tanstack/react-query";
import type { PlanId } from "@/constants/plans";

interface TenantPlanData {
  planId: PlanId;
  billingStatus: 'active' | 'trialing' | 'past_due' | 'cancelled' | 'none';
  renewalDate?: string;
  featureOverrides?: Record<string, any>;
}

export function useTenantPlan() {
  return useQuery<TenantPlanData>({
    queryKey: ['/api/tenant/plan'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useSubscriptionInfo() {
  return useQuery({
    queryKey: ['/api/admin/subscription-info'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}