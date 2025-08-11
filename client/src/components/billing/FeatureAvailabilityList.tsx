import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { plans } from "@/config/plans.config";
import { getPlan, isFeatureIncluded, upgradeTargetFor, getFeaturesByCategory } from "@/lib/planUtils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface FeatureAvailabilityListProps {
  currentPlan: string;
}

export function FeatureAvailabilityList({ currentPlan }: FeatureAvailabilityListProps) {
  const [upgradeLoading, setUpgradeLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const plan = getPlan(currentPlan);
  if (!plan) return null;

  const handleUpgrade = async (targetPlan: string) => {
    try {
      setUpgradeLoading(targetPlan);
      
      if (currentPlan === 'free') {
        const response = await apiRequest(`/api/billing/checkout?plan=${targetPlan}`, 'POST');
        if (response.url) {
          window.location.href = response.url;
        }
      } else {
        const response = await apiRequest('/api/billing/portal', 'POST');
        if (response.url) {
          window.location.href = response.url;
        }
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

  const featureCategories = getFeaturesByCategory(currentPlan);

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
                    const included = isFeatureIncluded(currentPlan, featureKey);
                    const feature = plan.features[featureKey];
                    const target = upgradeTargetFor(featureKey);
                    const targetPlan = target ? getPlan(target) : null;

                    if (!feature) return null;

                    return (
                      <div key={featureKey} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                        <div className="flex items-center gap-3">
                          {included ? (
                            <Check className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                          ) : (
                            <X className="h-5 w-5 text-rose-500 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${included ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {feature.name}
                              </span>
                              {feature.description && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Info className="h-3 w-3 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">{feature.description}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                            {included && feature.description && (
                              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{feature.description}</p>
                            )}
                          </div>
                        </div>

                        {!included && targetPlan && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpgrade(target!)}
                            disabled={upgradeLoading === target}
                            className="ml-4 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 border-0"
                          >
                            {upgradeLoading === target ? 'Loading...' : `Upgrade to ${targetPlan.name}`}
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