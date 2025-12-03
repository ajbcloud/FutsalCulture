import { Check, Crown, Rocket, Sparkles, Tag, CreditCard, Star, TrendingUp, Zap } from 'lucide-react';
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
import BraintreeHostedFields, { BraintreeHostedFieldsRef, BillingAddress } from '@/components/billing/BraintreeHostedFields';

interface PlanDetails {
  name: string;
  price: number;
  description: string;
  icon: React.ReactNode;
  features: string[];
  limits: {
    players?: number;
    sessions?: number;
    locations?: number;
    coaches?: number;
  };
  color: string;
}

const plans: Record<'free' | 'core' | 'growth' | 'elite', PlanDetails> = {
  free: {
    name: 'Free',
    price: 0,
    description: 'Perfect for getting started',
    icon: <Star className="h-5 w-5" />,
    features: [
      'Up to 10 players',
      'Basic session management',
      '1 location',
      'Email support',
    ],
    limits: {
      players: 10,
      sessions: 5,
      locations: 1,
      coaches: 1,
    },
    color: 'text-slate-600',
  },
  core: {
    name: 'Core',
    price: 99,
    description: 'Essential features for growing programs',
    icon: <Rocket className="h-5 w-5" />,
    features: [
      'Up to 100 players',
      'Advanced session management',
      '3 locations',
      'Waitlist management',
      'SMS notifications',
      'Priority support',
    ],
    limits: {
      players: 100,
      sessions: 50,
      locations: 3,
      coaches: 3,
    },
    color: 'text-blue-600',
  },
  growth: {
    name: 'Growth',
    price: 199,
    description: 'Advanced features for scaling',
    icon: <TrendingUp className="h-5 w-5" />,
    features: [
      'Up to 500 players',
      'Unlimited sessions',
      '10 locations',
      'Advanced analytics',
      'Custom branding',
      'API access',
      'Phone support',
    ],
    limits: {
      players: 500,
      sessions: -1,
      locations: 10,
      coaches: 10,
    },
    color: 'text-purple-600',
  },
  elite: {
    name: 'Elite',
    price: 399,
    description: 'Enterprise-grade features',
    icon: <Zap className="h-5 w-5" />,
    features: [
      'Unlimited players',
      'Unlimited sessions',
      'Unlimited locations',
      'White-label options',
      'Advanced integrations',
      'Dedicated account manager',
      '24/7 phone support',
      'Custom features',
    ],
    limits: {
      players: -1,
      sessions: -1,
      locations: -1,
      coaches: -1,
    },
    color: 'text-amber-600',
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
  const plan = plans[planKey];
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
        description: `You are now subscribed to the ${plan.name} plan!`,
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
      const billingAddress = hostedFieldsRef.current.getBillingAddress();
      
      if (!billingAddress.streetAddress) {
        toast({
          title: 'Missing Information',
          description: 'Please enter your street address',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
      
      const result = await hostedFieldsRef.current.tokenize(billingAddress);
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
            <CardTitle className={`flex items-center gap-2 ${plan.color}`}>
              {plan.icon}
              {plan.name}
            </CardTitle>
            <div className="text-right">
              <div className="text-2xl font-bold" data-testid={`text-price-${planKey}`}>
                ${plan.price}
              </div>
              <div className="text-xs text-muted-foreground">per month</div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="space-y-2">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>{feature}</span>
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
                  ? `Upgrade to ${plan.name}`
                  : `Downgrade to ${plan.name}`}
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
              Subscribe to {plan.name}
            </DialogTitle>
            <DialogDescription>
              Enter your payment details to start your ${plan.price}/month subscription.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">{plan.name} Plan</span>
                <span className="text-xl font-bold">${plan.price}/mo</span>
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
                    description: error.message || 'Failed to load payment form',
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
              {isLoading || subscribeMutation.isPending ? 'Processing...' : `Subscribe - $${plan.price}/month`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
