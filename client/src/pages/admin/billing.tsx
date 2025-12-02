import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import AdminLayout from "@/components/admin-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import BraintreeHostedFields, { BraintreeHostedFieldsRef } from "@/components/billing/BraintreeHostedFields";
import { 
  CreditCard, 
  Check, 
  Crown, 
  Zap, 
  Rocket, 
  AlertCircle, 
  Clock,
  ArrowUp,
  ArrowDown,
  Calendar,
  Loader2
} from "lucide-react";

interface SubscriptionData {
  hasSubscription: boolean;
  currentPlan: string;
  braintreeStatus?: string;
  subscription?: {
    id: string;
    status: string;
    nextBillingDate?: string;
    price?: string;
    planId?: string;
  };
  pendingPlanChange?: {
    plan: string;
    effectiveDate: string;
  };
  paymentMethod?: {
    cardType?: string;
    last4?: string;
  };
}

interface CooldownStatus {
  allowed: boolean;
  remainingHours?: number;
  lastChangeAt?: string;
}

const PLANS = [
  {
    id: "core",
    name: "Core",
    price: 29,
    icon: Zap,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    features: [
      "Up to 50 players",
      "Basic session management",
      "Email notifications",
      "Standard support",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: 79,
    icon: Rocket,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    popular: true,
    features: [
      "Up to 200 players",
      "Advanced analytics",
      "SMS notifications",
      "Priority support",
      "Custom branding",
    ],
  },
  {
    id: "elite",
    name: "Elite",
    price: 149,
    icon: Crown,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    features: [
      "Unlimited players",
      "Full analytics suite",
      "White-label options",
      "Dedicated support",
      "API access",
      "Multi-location support",
    ],
  },
];

function getPlanTier(plan: string): number {
  const tiers: Record<string, number> = { free: 0, core: 1, growth: 2, elite: 3 };
  return tiers[plan?.toLowerCase()] ?? 0;
}

export default function AdminBilling() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardIsValid, setCardIsValid] = useState(false);
  const hostedFieldsRef = useRef<BraintreeHostedFieldsRef>(null);

  const { data: subscription, isLoading: subscriptionLoading } = useQuery<SubscriptionData>({
    queryKey: ["/api/billing/braintree/subscription"],
  });

  const { data: clientTokenData, isLoading: tokenLoading } = useQuery<{ clientToken: string }>({
    queryKey: ["/api/billing/braintree/client-token"],
    enabled: !!selectedPlan,
  });

  const { data: cooldownStatus } = useQuery<CooldownStatus>({
    queryKey: ["/api/billing/braintree/cooldown-check"],
  });

  const subscribeMutation = useMutation({
    mutationFn: async ({ plan, nonce }: { plan: string; nonce: string }) => {
      const response = await apiRequest("POST", "/api/billing/braintree/subscribe", {
        plan,
        paymentMethodNonce: nonce,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/billing/braintree/subscription"] });
      queryClient.invalidateQueries({ queryKey: ["/api/billing/braintree/cooldown-check"] });
      toast({
        title: "Subscription Activated",
        description: "Your subscription has been successfully activated.",
      });
      setSelectedPlan(null);
    },
    onError: (error: any) => {
      toast({
        title: "Subscription Failed",
        description: error.message || "Failed to create subscription",
        variant: "destructive",
      });
    },
  });

  const upgradeMutation = useMutation({
    mutationFn: async (plan: string) => {
      const response = await apiRequest("POST", "/api/billing/braintree/upgrade", { plan });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/billing/braintree/subscription"] });
      queryClient.invalidateQueries({ queryKey: ["/api/billing/braintree/cooldown-check"] });
      toast({
        title: "Plan Upgraded",
        description: "Your plan has been upgraded immediately.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upgrade Failed",
        description: error.message || "Failed to upgrade plan",
        variant: "destructive",
      });
    },
  });

  const downgradeMutation = useMutation({
    mutationFn: async (plan: string) => {
      const response = await apiRequest("POST", "/api/billing/braintree/downgrade", { plan });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/billing/braintree/subscription"] });
      queryClient.invalidateQueries({ queryKey: ["/api/billing/braintree/cooldown-check"] });
      toast({
        title: "Downgrade Scheduled",
        description: `Your plan will change at the end of your billing period.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Downgrade Failed",
        description: error.message || "Failed to schedule downgrade",
        variant: "destructive",
      });
    },
  });

  const handleSubscribe = async () => {
    if (!selectedPlan || !hostedFieldsRef.current) return;

    setIsProcessing(true);
    try {
      const { nonce } = await hostedFieldsRef.current.tokenize();
      await subscribeMutation.mutateAsync({ plan: selectedPlan, nonce });
    } catch (error: any) {
      console.error("Tokenization error:", error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to process payment information",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlanAction = (planId: string) => {
    const currentTier = getPlanTier(subscription?.currentPlan || "free");
    const targetTier = getPlanTier(planId);

    if (!subscription?.hasSubscription) {
      setSelectedPlan(planId);
    } else if (targetTier > currentTier) {
      upgradeMutation.mutate(planId);
    } else if (targetTier < currentTier) {
      downgradeMutation.mutate(planId);
    }
  };

  const currentPlan = subscription?.currentPlan?.toLowerCase() || "free";
  const currentTier = getPlanTier(currentPlan);
  const isOnCooldown = cooldownStatus && !cooldownStatus.allowed;

  if (subscriptionLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {subscription?.pendingPlanChange && (
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <Clock className="h-4 w-4 text-amber-500" />
            <AlertTitle className="text-amber-500">Pending Plan Change</AlertTitle>
            <AlertDescription>
              Your plan will change to <strong>{subscription.pendingPlanChange.plan}</strong> on{" "}
              {new Date(subscription.pendingPlanChange.effectiveDate).toLocaleDateString()}.
            </AlertDescription>
          </Alert>
        )}

        {isOnCooldown && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Plan Change Cooldown</AlertTitle>
            <AlertDescription>
              You must wait {cooldownStatus?.remainingHours} hours before changing plans again.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current Subscription
            </CardTitle>
            <CardDescription>
              Manage your subscription and billing details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold capitalize">{currentPlan}</span>
                  <Badge variant={subscription?.braintreeStatus === "Active" ? "default" : "secondary"}>
                    {subscription?.braintreeStatus || "No subscription"}
                  </Badge>
                </div>
                {subscription?.subscription?.nextBillingDate && (
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Next billing: {new Date(subscription.subscription.nextBillingDate).toLocaleDateString()}
                  </p>
                )}
              </div>
              {subscription?.hasSubscription && (
                <Button
                  variant="outline"
                  onClick={() => apiRequest("POST", "/api/billing/braintree/cancel")}
                  data-testid="button-cancel-subscription"
                >
                  Cancel Subscription
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Choose a Plan</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((plan) => {
              const planTier = getPlanTier(plan.id);
              const isCurrent = currentPlan === plan.id;
              const isUpgrade = planTier > currentTier;
              const isDowngrade = planTier < currentTier && currentTier > 0;
              const Icon = plan.icon;

              return (
                <Card
                  key={plan.id}
                  className={`relative ${plan.popular ? "border-primary shadow-lg" : ""} ${
                    isCurrent ? "ring-2 ring-primary" : ""
                  }`}
                  data-testid={`card-plan-${plan.id}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg ${plan.bgColor} flex items-center justify-center mb-2`}>
                      <Icon className={`h-6 w-6 ${plan.color}`} />
                    </div>
                    <CardTitle className="flex items-center justify-between">
                      {plan.name}
                      {isCurrent && <Badge variant="outline">Current</Badge>}
                    </CardTitle>
                    <CardDescription>
                      <span className="text-3xl font-bold text-foreground">${plan.price}</span>
                      <span className="text-muted-foreground">/month</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm">
                          <Check className={`h-4 w-4 ${plan.color}`} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    {isCurrent ? (
                      <Button disabled className="w-full" data-testid={`button-plan-${plan.id}`}>
                        Current Plan
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        variant={isUpgrade ? "default" : "outline"}
                        onClick={() => handlePlanAction(plan.id)}
                        disabled={isOnCooldown || upgradeMutation.isPending || downgradeMutation.isPending}
                        data-testid={`button-plan-${plan.id}`}
                      >
                        {upgradeMutation.isPending || downgradeMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : isUpgrade ? (
                          <ArrowUp className="h-4 w-4 mr-2" />
                        ) : isDowngrade ? (
                          <ArrowDown className="h-4 w-4 mr-2" />
                        ) : null}
                        {!subscription?.hasSubscription
                          ? "Select Plan"
                          : isUpgrade
                          ? "Upgrade Now"
                          : "Schedule Downgrade"}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>

        {selectedPlan && !subscription?.hasSubscription && (
          <Card>
            <CardHeader>
              <CardTitle>Complete Your Subscription</CardTitle>
              <CardDescription>
                Enter your payment details to subscribe to the{" "}
                <strong className="capitalize">{selectedPlan}</strong> plan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {tokenLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading payment form...</span>
                </div>
              ) : clientTokenData?.clientToken ? (
                <>
                  <BraintreeHostedFields
                    ref={hostedFieldsRef}
                    clientToken={clientTokenData.clientToken}
                    onValidityChange={setCardIsValid}
                    onError={(err) => {
                      toast({
                        title: "Payment Form Error",
                        description: err.message,
                        variant: "destructive",
                      });
                    }}
                  />
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {PLANS.find((p) => p.id === selectedPlan)?.name} Plan
                      </p>
                      <p className="text-2xl font-bold">
                        ${PLANS.find((p) => p.id === selectedPlan)?.price}/month
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedPlan(null)}
                        disabled={isProcessing}
                        data-testid="button-cancel-checkout"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSubscribe}
                        disabled={!cardIsValid || isProcessing}
                        data-testid="button-subscribe"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Processing...
                          </>
                        ) : (
                          "Subscribe Now"
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Payment Unavailable</AlertTitle>
                  <AlertDescription>
                    Unable to load payment form. Please try again later.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Plan Comparison</CardTitle>
            <CardDescription>
              See what each plan includes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              <p>
                <strong>Upgrades:</strong> Take effect immediately with prorated charges for the remaining billing period.
              </p>
              <p className="mt-2">
                <strong>Downgrades:</strong> Scheduled for the end of your current billing period. You'll keep your current features until then.
              </p>
              <p className="mt-2">
                <strong>Cooldown:</strong> After changing plans, you must wait 24 hours before making another change.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
