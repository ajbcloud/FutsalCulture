import { Check, X, Crown, Rocket, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTenantPlan } from '@/hooks/useTenantPlan';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

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
    price: 499,
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
  const { currentPlan, hasActiveSubscription } = useTenantPlan();
  const [isLoading, setIsLoading] = useState(false);

  const planOrder = { free: 0, core: 1, growth: 2, elite: 3 };
  const isUpgrade = currentPlan ? planOrder[planKey] > planOrder[currentPlan] : false;
  const isDowngrade = currentPlan ? planOrder[planKey] < planOrder[currentPlan] : false;

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: planKey }),
      });
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to start checkout process',
        variant: 'destructive',
      });
    },
  });

  const upgradeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/billing/upgrade', {
        method: 'POST',
        body: JSON.stringify({ plan: planKey }),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Your plan has been upgraded successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tenant/subscription'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tenant/info'] });
      if (onUpgrade) onUpgrade();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upgrade plan',
        variant: 'destructive',
      });
    },
  });

  const downgradeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/billing/downgrade', {
        method: 'POST',
        body: JSON.stringify({ plan: planKey }),
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Downgrade Scheduled',
        description: `Your plan will be downgraded at the end of the current billing period`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tenant/subscription'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tenant/info'] });
      if (onDowngrade) onDowngrade();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to downgrade plan',
        variant: 'destructive',
      });
    },
  });

  const handleAction = async () => {
    setIsLoading(true);
    try {
      if (isUpgrade) {
        if (hasActiveSubscription) {
          await upgradeMutation.mutateAsync();
        } else {
          await checkoutMutation.mutateAsync();
        }
      } else if (isDowngrade) {
        await downgradeMutation.mutateAsync();
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

          {!isCurrentPlan && (
            <Button
              className="w-full mt-4"
              variant={isUpgrade ? 'default' : 'outline'}
              onClick={handleAction}
              disabled={isLoading || checkoutMutation.isPending || upgradeMutation.isPending || downgradeMutation.isPending}
              data-testid={`button-${isUpgrade ? 'upgrade' : 'downgrade'}-${planKey}`}
            >
              {isLoading || checkoutMutation.isPending || upgradeMutation.isPending || downgradeMutation.isPending
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