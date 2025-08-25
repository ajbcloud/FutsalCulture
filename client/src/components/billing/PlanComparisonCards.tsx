import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown } from "lucide-react";
import { plans } from "@/config/plans.config";
import { getPlan } from "@/lib/planUtils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PlanComparisonCardsProps {
  currentPlan: string;
  isHomepage?: boolean;
}

// Get features to display for a plan, including inheritance note and new/upgraded features only
const getDisplayFeatures = (planId: string) => {
  const plan = getPlan(planId);
  if (!plan) return [];

  const displayFeatures: Array<{name: string, description?: string, isInheritanceNote?: boolean}> = [];
  const planOrder = ['free', 'core', 'growth', 'elite'];
  
  // Add inheritance note for non-free plans
  if (planId !== 'free') {
    const previousPlanNames = {
      'core': 'Free',
      'growth': 'Core', 
      'elite': 'Growth'
    };
    displayFeatures.push({
      name: `Includes everything in ${previousPlanNames[planId as keyof typeof previousPlanNames]}, plus...`,
      isInheritanceNote: true
    });
  }

  // Get features that are new or upgraded in this tier
  const currentFeatures = Object.entries(plan.features).filter(([_, feature]) => feature.status === 'included');
  
  if (planId === 'free') {
    // For free plan, show all features
    currentFeatures.forEach(([featureKey, feature]) => {
      displayFeatures.push({
        name: feature.name,
        description: feature.description
      });
    });
  } else {
    // For paid plans, only show new/upgraded features
    const previousPlanIndex = planOrder.indexOf(planId) - 1;
    const previousPlan = previousPlanIndex >= 0 ? getPlan(planOrder[previousPlanIndex]) : null;
    
    currentFeatures.forEach(([featureKey, feature]) => {
      const previousFeature = previousPlan?.features[featureKey];
      
      // Show if it's a new feature or an upgraded one
      if (!previousFeature || previousFeature.status !== 'included' || 
          (feature.description && feature.description !== previousFeature.description)) {
        displayFeatures.push({
          name: feature.name,
          description: feature.description
        });
      }
    });
  }

  return displayFeatures;
};

export function PlanComparisonCards({ currentPlan, isHomepage = false }: PlanComparisonCardsProps) {
  const [upgradeLoading, setUpgradeLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const handleUpgrade = async (targetPlan: string) => {
    if (targetPlan === currentPlan || targetPlan === 'free') return;

    try {
      setUpgradeLoading(targetPlan);
      
      const response = await apiRequest('POST', `/api/billing/checkout?planId=${targetPlan}`);
      const responseData = await response.json();

      if (responseData.url) {
        window.location.href = responseData.url;
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

  const planOrder = ['free', 'core', 'growth', 'elite'];
  const isCurrentPlan = (planId: string) => planId === currentPlan;
  const canUpgradeTo = (planId: string) => {
    return planOrder.indexOf(planId) > planOrder.indexOf(currentPlan);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {plans.map((plan) => {
        const isCurrent = isCurrentPlan(plan.id);
        const canUpgrade = canUpgradeTo(plan.id);
        const isLoading = upgradeLoading === plan.id;

        return (
          <Card key={plan.id} className={`relative ${isCurrent ? 'ring-2 ring-primary' : ''}`}>
            {plan.id === 'growth' && (
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                <Badge variant="default" className="bg-gradient-to-r from-yellow-400 to-yellow-600">
                  <Crown className="h-3 w-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
            )}
            
            {isCurrent && !isHomepage && (
              <div className="absolute -top-2 right-2">
                <Badge variant="secondary">Current Plan</Badge>
              </div>
            )}

            <CardHeader className="text-center pb-4">
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              <div className="text-2xl font-bold">
                {plan.price === 0 ? '$0/mo' : `$${plan.price}/mo`}
              </div>
              <div className="text-sm text-muted-foreground">
                {plan.playerLimit === 'unlimited' ? 'Unlimited players' : `Up to ${plan.playerLimit} players`}
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-3 mb-6">
                {getDisplayFeatures(plan.id).map((displayFeature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="mt-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/15">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    </span>
                    <div className="text-sm">
                      <div className={`font-medium ${displayFeature.isInheritanceNote ? 'text-muted-foreground italic' : 'text-foreground'}`}>
                        {displayFeature.name}
                      </div>
                      {displayFeature.description && (
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">{displayFeature.description}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t">
                {isHomepage ? (
                  <a
                    href="/get-started"
                    className="inline-flex items-center justify-center w-full rounded-md px-6 py-2 font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Get Started
                  </a>
                ) : isCurrent ? (
                  <Badge variant="secondary" className="w-full justify-center py-2">
                    Current Plan
                  </Badge>
                ) : canUpgrade ? (
                  <Button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isLoading}
                    className="w-full"
                    variant={plan.id === 'elite' ? 'default' : 'outline'}
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