import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CreditCard, 
  Receipt,
  Calendar,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Crown,
  Sparkles,
  ArrowUpRight
} from "lucide-react";
import { PlanUpgradeCard } from "@/components/billing/PlanUpgradeCard";
import { useTenantPlan } from "@/hooks/useTenantPlan";

interface PaymentHistoryItem {
  id: string;
  date: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  plan: string;
  paymentMethod?: {
    type: string;
    last4?: string;
    cardType?: string;
  };
  description?: string;
}

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
  paymentMethod?: {
    cardType?: string;
    last4?: string;
  };
}

const planPrices: Record<string, number> = {
  free: 0,
  core: 99,
  growth: 199,
  elite: 399,
};

function getStatusBadge(status: string) {
  switch (status) {
    case 'completed':
      return <Badge className="bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
    case 'pending':
      return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    case 'failed':
      return <Badge className="bg-red-500/10 text-red-500 border-red-500/20"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
    case 'refunded':
      return <Badge variant="secondary"><DollarSign className="h-3 w-3 mr-1" />Refunded</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function AdminBilling() {
  const { data: subscription, isLoading: subscriptionLoading } = useQuery<SubscriptionData>({
    queryKey: ["/api/billing/braintree/subscription"],
  });

  const { data: paymentHistory, isLoading: historyLoading } = useQuery<PaymentHistoryItem[]>({
    queryKey: ["/api/billing/braintree/payment-history"],
  });

  const { data: tenantPlan, isLoading: tenantPlanLoading } = useTenantPlan();

  const isLoading = subscriptionLoading || historyLoading || tenantPlanLoading;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  const currentPlan = tenantPlan?.planId || subscription?.currentPlan?.toLowerCase() || "free";

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Billing & Plans</h1>
          <p className="text-muted-foreground mt-1">
            Manage your subscription, upgrade your plan, and view payment history
          </p>
        </div>

        <Tabs defaultValue="plans" className="w-full">
          <TabsList>
            <TabsTrigger value="plans" className="flex items-center gap-2" data-testid="tab-plans">
              <Crown className="h-4 w-4" />
              Plans
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2" data-testid="tab-history">
              <Receipt className="h-4 w-4" />
              Payment History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="mt-6 space-y-6">
            {/* Current Plan Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  Current Plan
                </CardTitle>
                <CardDescription>
                  Your active subscription and billing details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold capitalize">{currentPlan}</span>
                      <Badge variant={subscription?.braintreeStatus === "Active" ? "default" : "secondary"}>
                        {subscription?.braintreeStatus || (currentPlan === "free" ? "Free Plan" : "No subscription")}
                      </Badge>
                    </div>
                    <p className="text-lg font-semibold mt-1">
                      ${planPrices[currentPlan] || 0}/month
                    </p>
                    {subscription?.subscription?.nextBillingDate && (
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Next billing: {new Date(subscription.subscription.nextBillingDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {subscription?.paymentMethod?.last4 && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CreditCard className="h-5 w-5" />
                      <span className="capitalize">{subscription.paymentMethod.cardType || "Card"}</span>
                      <span>•••• {subscription.paymentMethod.last4}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Upgrade Cards */}
            <div>
              <h2 className="text-xl font-semibold mb-4">
                {currentPlan === "elite" ? "You're on our best plan!" : "Upgrade Your Plan"}
              </h2>
              {currentPlan !== "elite" && (
                <p className="text-muted-foreground mb-6">
                  Unlock more features and capabilities for your organization
                </p>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {currentPlan !== "core" && currentPlan !== "growth" && currentPlan !== "elite" && (
                  <PlanUpgradeCard planKey="core" />
                )}
                {currentPlan !== "growth" && currentPlan !== "elite" && (
                  <PlanUpgradeCard planKey="growth" />
                )}
                {currentPlan !== "elite" && (
                  <PlanUpgradeCard planKey="elite" />
                )}
              </div>
              
              {currentPlan === "elite" && (
                <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200 dark:border-amber-800">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <Crown className="h-6 w-6 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Elite Plan</h3>
                        <p className="text-muted-foreground">
                          You have access to all features and unlimited capabilities.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6 space-y-6">
            {/* Payment History Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Transaction History
                </CardTitle>
                <CardDescription>
                  Complete record of all payments made for your subscription
                </CardDescription>
              </CardHeader>
              <CardContent>
                {paymentHistory && paymentHistory.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentHistory.map((payment) => (
                        <TableRow key={payment.id} data-testid={`row-payment-${payment.id}`}>
                          <TableCell className="font-medium">
                            {new Date(payment.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {payment.description || "Subscription payment"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {payment.plan}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {payment.paymentMethod?.last4 ? (
                              <span className="flex items-center gap-1">
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                                <span className="capitalize">{payment.paymentMethod.cardType || "Card"}</span>
                                <span className="text-muted-foreground">•••• {payment.paymentMethod.last4}</span>
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(payment.status)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ${(payment.amount / 100).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <Receipt className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-semibold">No payment history</h3>
                    <p className="text-muted-foreground mt-1">
                      Your payment history will appear here once you subscribe to a plan.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
