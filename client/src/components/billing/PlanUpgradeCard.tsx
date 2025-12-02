import { Check, X, Crown, Rocket, Sparkles, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useTenantPlan } from '@/hooks/useTenantPlan';
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

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
    icon: <Sparkles className="h-5 w-5" />,
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
    color: 'text-gray-600',
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
    icon: <Crown className="h-5 w-5 text-purple-600" />,
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
    icon: <Crown className="h-5 w-5 text-yellow-600" />,
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
  const plan = plans[planKey];
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const { data: tenantPlanData } = useTenantPlan();
  const [isLoading, setIsLoading] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [showDiscountInput, setShowDiscountInput] = useState(false);

  const currentPlan = tenantPlanData?.planId || 'free';
  const hasActiveSubscription = tenantPlanData?.billingStatus === 'active';

  const planOrder: Record<string, number> = { free: 0, core: 1, growth: 2, elite: 3 };
  const isUpgrade = planOrder[planKey] > planOrder[currentPlan];
  const isDowngrade = planOrder[planKey] < planOrder[currentPlan];

  // Query to check subscription status
  const { data: subscriptionStatus } = useQuery({
    queryKey: ['/api/billing/check-subscription'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/billing/check-subscription');
      return res.json();
    },
    enabled: false, // We'll refetch manually when needed
  });

  // Braintree upgrade mutation - immediate plan upgrade
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
      // If no subscription exists, redirect to billing page for new subscription
      if (error.message?.includes('No active subscription') || error.message?.includes('not found')) {
        navigate('/admin/billing');
      } else {
        toast({
          title: 'Upgrade Failed',
          description: error.message || 'Failed to upgrade plan',
          variant: 'destructive',
        });
      }
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
          // For new subscriptions, redirect to billing page to set up subscription
          navigate('/admin/billing');
        }
      } else if (isDowngrade) {
        await downgradeMutation.mutateAsync();
      }
    } catch (error) {
      console.error('Error handling plan action:', error);
      // If checking subscription fails, redirect to billing page
      if (isUpgrade || (!isCurrentPlan && !isDowngrade)) {
        navigate('/admin/billing');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
              disabled={isLoading || upgradeMutation.isPending || downgradeMutation.isPending}
              data-testid={`button-${isUpgrade ? 'upgrade' : 'downgrade'}-${planKey}`}
            >
              {isLoading || upgradeMutation.isPending || downgradeMutation.isPending
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
  );
}