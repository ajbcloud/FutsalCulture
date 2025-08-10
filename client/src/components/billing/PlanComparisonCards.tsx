import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Crown } from "lucide-react";
import { PLANS, type PlanId } from "@/constants/plans";
import { FEATURE_LABELS } from "@/constants/features";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PlanComparisonCardsProps {
  currentPlan: PlanId;
}

export function PlanComparisonCards({ currentPlan }: PlanComparisonCardsProps) {
  const [upgradeLoading, setUpgradeLoading] = useState<PlanId | null>(null);
  const { toast } = useToast();

  const handleUpgrade = async (targetPlan: PlanId) => {
    if (targetPlan === currentPlan || targetPlan === 'free') return;

    try {
      setUpgradeLoading(targetPlan);
      
      const response = await apiRequest(`/api/billing/checkout?planId=${targetPlan}`, 'POST');

      if (response.url) {
        window.location.href = response.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: any) {
      console.error('Error starting upgrade:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start upgrade. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUpgradeLoading(null);
    }
  };

  const getPlanOrder = (): PlanId[] => ['free', 'core', 'growth', 'elite'];
  const isCurrentPlan = (planId: PlanId) => planId === currentPlan;
  const canUpgradeTo = (planId: PlanId) => {
    const order = getPlanOrder();
    return order.indexOf(planId) > order.indexOf(currentPlan);
  };

  // Key features to highlight in comparison
  const keyFeatures = [
    'maxPlayers',
    'manualSessions',
    'parentPlayerBooking',
    'emailSmsNotifications',
    'payments', 
    'advancedAnalytics',
    'autoPromotion',
    'themeCustomization',
    'playerDevelopment'
  ] as const;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {getPlanOrder().map((planId) => {
        const plan = PLANS[planId];
        const isCurrent = isCurrentPlan(planId);
        const canUpgrade = canUpgradeTo(planId);
        const isLoading = upgradeLoading === planId;

        return (
          <Card key={planId} className={`relative ${isCurrent ? 'ring-2 ring-primary' : ''}`}>
            {planId === 'growth' && (
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                <Badge variant="default" className="bg-gradient-to-r from-yellow-400 to-yellow-600">
                  <Crown className="h-3 w-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
            )}
            
            {isCurrent && (
              <div className="absolute -top-2 right-2">
                <Badge variant="secondary">Current Plan</Badge>
              </div>
            )}

            <CardHeader className="text-center pb-4">
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              <div className="text-2xl font-bold">
                {plan.price === 0 ? 'Free' : `$${plan.price}/mo`}
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-3 mb-6">
                {keyFeatures.map((featureKey) => {
                  const feature = plan.features[featureKey];
                  const label = FEATURE_LABELS[featureKey]?.label;
                  
                  let displayText = label;
                  let hasFeature = !!feature;
                  
                  if (featureKey === 'maxPlayers') {
                    displayText = `${feature === 'unlimited' ? 'Unlimited' : feature} players`;
                    hasFeature = true;
                  } else if (featureKey === 'advancedAnalytics') {
                    displayText = feature === 'elite' ? 'AI-powered analytics & forecasting' :
                                feature === 'advanced' ? 'Advanced analytics' : 
                                feature === 'basic' ? 'Basic analytics' : 'Analytics';
                    hasFeature = !!feature;
                  }

                  return (
                    <div key={featureKey} className="flex items-center gap-2 text-sm">
                      {hasFeature ? (
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      )}
                      <span className={hasFeature ? '' : 'text-muted-foreground'}>
                        {displayText}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t">
                {isCurrent ? (
                  <Badge variant="secondary" className="w-full justify-center py-2">
                    Current Plan
                  </Badge>
                ) : canUpgrade ? (
                  <Button
                    onClick={() => handleUpgrade(planId)}
                    disabled={isLoading}
                    className="w-full"
                    variant={planId === 'elite' ? 'default' : 'outline'}
                  >
                    {isLoading ? 'Loading...' : 'Upgrade'}
                  </Button>
                ) : (
                  <Button variant="ghost" disabled className="w-full">
                    Downgrade
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}