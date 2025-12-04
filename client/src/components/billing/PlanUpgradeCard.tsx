import { Check, Crown, Rocket, Sparkles, Tag, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useTenantPlan } from '@/hooks/useTenantPlan';
import { useState, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import BraintreeHostedFields, { BraintreeHostedFieldsRef } from '@/components/billing/BraintreeHostedFields';
import { plans as planConfigs, PlanConfig } from '@/config/plans.config';
import { getPlan } from '@/lib/planUtils';

interface PlanDetails {
  name: string;
  price: number;
  playerLimit: string;
  description: string;
  icon: React.ReactNode;
  features: Array<{ name: string; description?: string }>;
  color: string;
}

const getDisplayFeatures = (planId: string): Array<{ name: string; description?: string; isInheritanceNote?: boolean }> => {
  const plan = getPlan(planId);
  if (!plan) return [];

  const displayFeatures: Array<{name: string, description?: string, isInheritanceNote?: boolean}> = [];
  const planOrder = ['free', 'core', 'growth', 'elite'];
  
  if (planId !== 'free') {
    const previousPlanNames: Record<string, string> = {
      'core': 'Free',
      'growth': 'Core', 
      'elite': 'Growth'
    };
    displayFeatures.push({
      name: `Includes everything in ${previousPlanNames[planId as keyof typeof previousPlanNames]}, plus...`,
      isInheritanceNote: true
    });
  }

  const currentFeatures = Object.entries(plan.features).filter(([_, feature]) => feature.status === 'included');
  
  if (planId === 'free') {
    currentFeatures.forEach(([featureKey, feature]) => {
      displayFeatures.push({
        name: feature.name,
        description: feature.description
      });
    });
  } else {
    const previousPlanIndex = planOrder.indexOf(planId) - 1;
    const previousPlan = previousPlanIndex >= 0 ? getPlan(planOrder[previousPlanIndex]) : null;
    
    currentFeatures.forEach(([featureKey, feature]) => {
      const previousFeature = previousPlan?.features[featureKey];
      
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

const planMeta: Record<'free' | 'core' | 'growth' | 'elite', { description: string; icon: React.ReactNode; color: string }> = {
  free: {
    description: 'Perfect for getting started',
    icon: <Sparkles className="h-5 w-5" />,
    color: 'text-gray-600',
  },
  core: {
    description: 'Essential features for growing programs',
    icon: <Rocket className="h-5 w-5" />,
    color: 'text-blue-600',
  },
  growth: {
    description: 'Advanced features for scaling',
    icon: <Crown className="h-5 w-5 text-purple-600" />,
    color: 'text-purple-600',
  },
  elite: {
    description: 'Enterprise-grade features',
    icon: <Crown className="h-5 w-5 text-yellow-600" />,
    color: 'text-yellow-600',
  },
};

interface PlanUpgradeCardProps {
  planKey: 'free' | 'core' | 'growth' | 'elite';
  isCurrentPlan?: boolean;
  onUpgrade?: () => void;
  onDowngrade?: () => void;
}

export function PlanUpgradeCard({ 
  planKey, 
  isCurrentPlan = false,
  onUpgrade,
  onDowngrade,
}: PlanUpgradeCardProps) {
  const planConfig = planConfigs.find(p => p.id === planKey);
  const meta = planMeta[planKey];
  const displayFeatures = getDisplayFeatures(planKey);
  const { toast } = useToast();
  const { data: tenantPlanData } = useTenantPlan();
  const [isLoading, setIsLoading] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [clientToken, setClientToken] = useState<string | null>(null);
  const hostedFieldsRef = useRef<BraintreeHostedFieldsRef>(null);

  const currentPlan = tenantPlanData?.planId || 'free';
  const hasActiveSubscription = tenantPlanData?.billingStatus === 'active';

  const planOrder: Record<string, number> = { free: 0, core: 1, growth: 2, elite: 3 };
  const isUpgrade = planOrder[planKey] > planOrder[currentPlan];
  const isDowngrade = planOrder[planKey] < planOrder[currentPlan];

  // Braintree upgrade mutation - immediate plan upgrade for existing subscriptions
  const upgradeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/billing/braintree/upgrade', { plan: planKey });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Plan Upgraded',
        description: data.message || 'Your plan has been upgraded immediately.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/billing/braintree/subscription'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tenant/subscription'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tenant/info'] });
      if (onUpgrade) onUpgrade();
    },
    onError: (error: any) => {
      toast({
        title: 'Upgrade Failed',
        description: error.message || 'Failed to upgrade plan',
        variant: 'destructive',
      });
    },
  });

  // Braintree downgrade mutation - scheduled for end of billing period
  const downgradeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/billing/braintree/downgrade', { plan: planKey });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Downgrade Scheduled',
        description: `Your plan will be downgraded at the end of the current billing period`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/billing/braintree/subscription'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tenant/subscription'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tenant/info'] });
      if (onDowngrade) onDowngrade();
    },
    onError: (error: any) => {
      toast({
        title: 'Downgrade Failed',
        description: error.message || 'Failed to schedule downgrade',
        variant: 'destructive',
      });
    },
  });

  // New subscription mutation for users without existing subscription
  const subscribeMutation = useMutation({
    mutationFn: async (nonce: string) => {
      const res = await apiRequest('POST', '/api/billing/braintree/subscribe', { 
        paymentMethodNonce: nonce,
        plan: planKey,
        discountCode: discountCode || undefined
      });
      return res.json();
    },
    onSuccess: (data) => {
      setShowCheckoutDialog(false);
      toast({
        title: 'Subscription Created',
        description: `You are now subscribed to the ${planKey.charAt(0).toUpperCase() + planKey.slice(1)} plan!`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/billing/braintree/subscription'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tenant/subscription'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tenant/info'] });
      if (onUpgrade) onUpgrade();
    },
    onError: (error: any) => {
      toast({
        title: 'Subscription Failed',
        description: error.message || 'Failed to create subscription',
        variant: 'destructive',
      });
    },
  });

  const handleAction = async () => {
    setIsLoading(true);
    
    try {
      // Check Braintree subscription status
      const res = await apiRequest('GET', '/api/billing/braintree/subscription');
      const status = await res.json();
      
      if (isUpgrade || (!isCurrentPlan && !isDowngrade)) {
        if (status?.hasSubscription) {
          // For existing subscriptions, use upgrade endpoint
          await upgradeMutation.mutateAsync();
        } else {
          // For new subscriptions, fetch client token first then show checkout dialog
          const tokenRes = await apiRequest('GET', '/api/billing/braintree/client-token');
          const tokenData = await tokenRes.json();
          if (tokenData?.clientToken) {
            setClientToken(tokenData.clientToken);
            setShowCheckoutDialog(true);
          } else {
            toast({
              title: 'Error',
              description: 'Failed to initialize payment form. Please try again.',
              variant: 'destructive',
            });
          }
        }
      } else if (isDowngrade) {
        await downgradeMutation.mutateAsync();
      }
    } catch (error: any) {
      console.error('Error handling plan action:', error);
      // If checking subscription fails, try to show checkout dialog for upgrades
      if (isUpgrade || (!isCurrentPlan && !isDowngrade)) {
        try {
          const tokenRes = await apiRequest('GET', '/api/billing/braintree/client-token');
          const tokenData = await tokenRes.json();
          if (tokenData?.clientToken) {
            setClientToken(tokenData.clientToken);
            setShowCheckoutDialog(true);
          } else {
            toast({
              title: 'Payment Unavailable',
              description: 'Unable to initialize payment form. Please try again later.',
              variant: 'destructive',
            });
          }
        } catch (e) {
          toast({
            title: 'Connection Error',
            description: 'Unable to connect to payment service. Please check your connection and try again.',
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Error',
          description: error.message || 'An error occurred. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!hostedFieldsRef.current) return;

    setIsLoading(true);
    try {
      const result = await hostedFieldsRef.current.tokenize();
      // Extract just the nonce string from the tokenize result
      await subscribeMutation.mutateAsync(result.nonce);
    } catch (error: any) {
      toast({
        title: 'Payment Error',
        description: error.message || 'Failed to process payment',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!planConfig) return null;

  const planName = planConfig.name;
  const planPrice = planConfig.price;
  const playerLimit = planConfig.playerLimit === 'unlimited' 
    ? 'Unlimited players' 
    : `Up to ${planConfig.playerLimit} players`;

  return (
    <>
      <Card className={`relative ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}>
        {isCurrentPlan && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-primary text-white" data-testid="badge-current-plan">
              Current Plan
            </Badge>
          </div>
        )}
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className={`flex items-center gap-2 ${meta.color}`}>
              {meta.icon}
              {planName}
            </CardTitle>
            <div className="text-right">
              <div className="text-2xl font-bold" data-testid={`text-price-${planKey}`}>
                ${planPrice}
              </div>
              <div className="text-xs text-muted-foreground">per month</div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{playerLimit}</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="space-y-2">
              {displayFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <span className="mt-1 inline-flex h-4 w-4 items-center justify-center flex-shrink-0">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                  <div>
                    <span className={feature.isInheritanceNote ? 'text-muted-foreground italic' : ''}>
                      {feature.name}
                    </span>
                    {feature.description && !feature.isInheritanceNote && (
                      <span className="text-xs text-neutral-500 dark:text-neutral-400 ml-1">
                        ({feature.description})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {!isCurrentPlan && isUpgrade && (
              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  onClick={() => setShowDiscountInput(!showDiscountInput)}
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                  data-testid="button-toggle-discount-code"
                >
                  <Tag className="h-3 w-3" />
                  Have a discount code?
                </button>
                
                {showDiscountInput && (
                  <Input
                    type="text"
                    placeholder="Enter discount code"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                    className="w-full"
                    data-testid="input-discount-code"
                  />
                )}
              </div>
            )}

            {!isCurrentPlan && (
              <Button
                className="w-full mt-4"
                variant={isUpgrade ? 'default' : 'outline'}
                onClick={handleAction}
                disabled={isLoading || upgradeMutation.isPending || downgradeMutation.isPending || subscribeMutation.isPending}
                data-testid={`button-${isUpgrade ? 'upgrade' : 'downgrade'}-${planKey}`}
              >
                {isLoading || upgradeMutation.isPending || downgradeMutation.isPending || subscribeMutation.isPending
                  ? 'Processing...'
                  : isUpgrade
                  ? `Upgrade to ${planName}`
                  : `Downgrade to ${planName}`}
              </Button>
            )}

            {isCurrentPlan && (
              <Button className="w-full mt-4" variant="outline" disabled>
                Current Plan
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Checkout Dialog for New Subscriptions */}
      <Dialog open={showCheckoutDialog} onOpenChange={setShowCheckoutDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscribe to {planName}
            </DialogTitle>
            <DialogDescription>
              Enter your payment details to start your ${planPrice}/month subscription.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">{planName} Plan</span>
                <span className="text-xl font-bold">${planPrice}/mo</span>
              </div>
              {discountCode && (
                <div className="mt-2 text-sm text-muted-foreground flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  Discount code: {discountCode}
                </div>
              )}
            </div>

            {clientToken ? (
              <BraintreeHostedFields
                ref={hostedFieldsRef}
                clientToken={clientToken}
                onError={(error) => {
                  toast({
                    title: 'Payment Error',
                    description: error.message || 'An error occurred',
                    variant: 'destructive',
                  });
                }}
              />
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                Loading payment form...
              </div>
            )}

            <Button
              className="w-full"
              onClick={handlePaymentSubmit}
              disabled={isLoading || subscribeMutation.isPending || !clientToken}
              data-testid="button-confirm-subscription"
            >
              {isLoading || subscribeMutation.isPending ? 'Processing...' : `Subscribe - $${planPrice}/month`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
