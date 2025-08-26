import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Minus } from "lucide-react";
import { plans } from "@/config/plans.config";
import { getPlan } from "@/lib/planUtils";

interface FeatureGridProps {
  currentPlan: string;
  isHomepage?: boolean;
}

export function FeatureGrid({ currentPlan, isHomepage = false }: FeatureGridProps) {
  // Define feature categories and their features in display order
  const featureCategories = {
    'Core Features': [
      'sessionManagement',
      'parentPlayerBooking',
      'waitlist',
      'csvExport',
      'csvImport',
      'bulkOperations',
      'accessCodes',
      'discountCodes'
    ],
    'Communication': [
      'emailNotifications',
      'smsNotifications',
      'emailSmsGateway'
    ],
    'Payment & Billing': [
      'payments',
      'paymentIntegrations'
    ],
    'Analytics & Automation': [
      'analytics',
      'playerDevelopment'
    ],
    'Integrations': [
      'calendarIntegration',
      'additionalIntegrations',
      'apiAccess'
    ],
    'Support & Requests': [
      'support',
      'featureRequests'
    ]
  };

  const getFeatureStatus = (planId: string, featureKey: string) => {
    const plan = getPlan(planId);
    const feature = plan?.features[featureKey];
    
    if (!feature || feature.status !== 'included') {
      return { included: false, label: '', description: '' };
    }

    return {
      included: true,
      label: feature.name,
      description: feature.description || ''
    };
  };

  const getFeatureValue = (planId: string, featureKey: string) => {
    const status = getFeatureStatus(planId, featureKey);
    if (!status.included) return null;

    // Handle special cases for feature descriptions
    switch (featureKey) {
      case 'analytics':
        if (status.description?.includes('AI-powered')) return 'AI-powered';
        if (status.description?.includes('Advanced')) return 'Advanced';
        if (status.description?.includes('Basic')) return 'Basic';
        return 'Yes';
      case 'payments':
        if (status.description?.includes('Multiple')) return 'Multiple providers';
        if (status.description?.includes('Stripe')) return 'Stripe only';
        return 'Yes';
      case 'support':
        if (status.description?.includes('High priority')) return 'Priority + phone';
        if (status.description?.includes('Standard')) return 'Standard';
        return 'Basic';
      case 'featureRequests':
        if (status.description?.includes('Priority')) return 'Priority queue';
        return 'Standard queue';
      default:
        return status.description ? status.description : 'Yes';
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center">
          Feature Comparison Grid
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          Compare features across all plans to understand what's included at each tier.
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 font-medium text-foreground">Features</th>
                {plans.map((plan) => (
                  <th key={plan.id} className="text-center p-3 min-w-[120px]">
                    <div className="flex flex-col items-center gap-1">
                      <div className={`font-semibold ${plan.id === currentPlan ? 'text-primary' : 'text-foreground'}`}>
                        {plan.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {plan.price === 0 ? '$0/mo' : `$${plan.price}/mo`}
                      </div>
                      {plan.id === currentPlan && !isHomepage && (
                        <Badge variant="secondary" className="text-xs">Current</Badge>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(featureCategories).map(([categoryName, features]) => (
                <React.Fragment key={categoryName}>
                  <tr>
                    <td colSpan={plans.length + 1} className="p-4 bg-muted/30">
                      <div className="font-bold text-lg uppercase tracking-wide">
                        {categoryName}
                      </div>
                    </td>
                  </tr>
                  {features.map((featureKey) => {
                    // Get the feature name from the first plan that has it
                    const featureName = plans.find(plan => plan.features[featureKey])?.features[featureKey]?.name;
                    
                    if (!featureName) return null;

                    return (
                      <tr key={featureKey} className="border-b border-border/50 hover:bg-muted/20">
                        <td className="p-3 font-medium text-foreground">
                          {featureName}
                        </td>
                        {plans.map((plan) => {
                          const featureValue = getFeatureValue(plan.id, featureKey);
                          const isIncluded = !!featureValue;
                          
                          return (
                            <td key={plan.id} className="p-3 text-center">
                              {isIncluded ? (
                                <div className="flex flex-col items-center gap-1">
                                  <Check className="h-4 w-4 text-green-600" />
                                  {featureValue !== 'Yes' && (
                                    <div className="text-xs text-muted-foreground max-w-20 text-center">
                                      {featureValue}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <Minus className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}