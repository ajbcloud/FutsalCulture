import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PLANS, type PlanId, type FeatureKey } from "@/constants/plans";
import { FEATURE_LABELS } from "@/constants/features";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface FeatureAvailabilityListProps {
  currentPlan: PlanId;
}

export function FeatureAvailabilityList({ currentPlan }: FeatureAvailabilityListProps) {
  const [upgradeLoading, setUpgradeLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const currentPlanFeatures = PLANS[currentPlan].features;

  const handleUpgradeSubscription = async () => {
    try {
      setUpgradeLoading('upgrade');
      
      const response = await apiRequest('/api/billing/manage-subscription', 'POST');

      if (response.url) {
        window.location.href = response.url;
      } else {
        throw new Error('No manage subscription URL returned');
      }
    } catch (error: any) {
      console.error('Error starting subscription management:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to open subscription management. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUpgradeLoading(null);
    }
  };

  const getFeatureValue = (featureKey: FeatureKey) => {
    const value = currentPlanFeatures[featureKey];
    
    if (featureKey === 'maxPlayers') {
      return value === 'unlimited' ? 'Unlimited players' : `${value} players max`;
    }
    
    if (featureKey === 'advancedAnalytics') {
      if (value === 'advanced') return 'Advanced analytics';
      if (value === 'basic') return 'Basic analytics';
      return false;
    }
    
    return value;
  };

  const isFeatureEnabled = (featureKey: FeatureKey) => {
    const value = currentPlanFeatures[featureKey];
    return !!value;
  };

  const getRequiredPlan = (featureKey: FeatureKey): PlanId | null => {
    const planOrder: PlanId[] = ['free', 'core', 'growth', 'elite'];
    
    for (const planId of planOrder) {
      const planFeatures = PLANS[planId].features;
      if (planFeatures[featureKey]) {
        return planId;
      }
    }
    return null;
  };

  // Group features by category - include ALL plan features
  const featureCategories = {
    'Core Features': ['maxPlayers', 'manualSessions', 'recurringSessions'] as FeatureKey[],
    'Payment & Billing': ['payments', 'revenueAnalytics'] as FeatureKey[],
    'Communication': ['emailNotifications', 'smsNotifications', 'whiteLabelEmail'] as FeatureKey[],
    'Analytics & Automation': ['advancedAnalytics', 'autoPromotion'] as FeatureKey[],
    'Advanced Tools': ['csvImport', 'bulkOps', 'themeCustomization', 'apiAccess'] as FeatureKey[],
    'Player Development': ['playerDevelopment'] as FeatureKey[],
    'Premium Support': ['customFeatureQueue', 'prioritySupport'] as FeatureKey[]
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Feature Availability
            <Info className="h-4 w-4 text-muted-foreground" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(featureCategories).map(([categoryName, features]) => (
              <div key={categoryName}>
                <h4 className="font-medium text-sm text-muted-foreground mb-3">
                  {categoryName}
                </h4>
                <div className="space-y-3">
                  {features.map((featureKey) => {
                    const enabled = isFeatureEnabled(featureKey);
                    const featureInfo = FEATURE_LABELS[featureKey];
                    const value = getFeatureValue(featureKey);
                    const requiredPlan = getRequiredPlan(featureKey);
                    const isLoading = upgradeLoading === featureKey;

                    return (
                      <div key={featureKey} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                        <div className="flex items-center gap-3">
                          {enabled ? (
                            <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                          ) : (
                            <X className="h-5 w-5 text-red-500 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${enabled ? '' : 'text-muted-foreground'}`}>
                                {featureInfo.label}
                              </span>
                              {featureInfo.description && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Info className="h-3 w-3 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">{featureInfo.description}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                            {enabled && typeof value === 'string' && (
                              <p className="text-sm text-muted-foreground mt-1">{value}</p>
                            )}
                          </div>
                        </div>

                        {!enabled && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleUpgradeSubscription}
                            disabled={upgradeLoading === 'upgrade'}
                            className="ml-4"
                            data-testid="button-upgrade-subscription"
                          >
                            {upgradeLoading === 'upgrade' ? 'Loading...' : 'Upgrade Subscription'}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}