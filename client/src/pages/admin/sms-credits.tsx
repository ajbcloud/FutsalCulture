import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import AdminLayout from "@/components/admin-layout";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Send,
  Clock,
  Zap,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  DollarSign,
  ShoppingCart,
} from "lucide-react";

interface SmsCreditsStatus {
  balance: number;
  isLow: boolean;
  lowThreshold: number;
  autoRechargeEnabled: boolean;
  autoRechargeAmount: number;
  lastPurchasedAt: string | null;
  isConfigured: boolean;
  provider: string;
}

interface SmsBalance {
  balance: number;
  isLow: boolean;
  lowThreshold: number;
  autoRechargeEnabled: boolean;
  autoRechargeAmount: number;
  lastPurchasedAt: string | null;
}

interface SmsPackage {
  id: string;
  name: string;
  credits: number;
  bonusCredits: number;
  priceInCents: number;
  isActive: boolean;
  sortOrder: number;
  description?: string;
}

interface SmsTransaction {
  id: string;
  tenantId: string;
  type: "purchase" | "usage" | "adjustment" | "refund";
  amount: number;
  balanceAfter: number;
  description: string;
  referenceId?: string;
  createdAt: string;
  createdBy?: string;
}

interface SmsUsageStats {
  usedThisMonth: number;
  totalSent30Days: number;
  averageDailyUsage: number;
  projectedDaysRemaining: number | null;
}

interface TransactionsResponse {
  transactions: SmsTransaction[];
  total: number;
  hasMore: boolean;
}

const ITEMS_PER_PAGE = 10;

export default function SmsCredits() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<SmsPackage | null>(null);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [autoRechargeEnabled, setAutoRechargeEnabled] = useState(false);
  const [lowThreshold, setLowThreshold] = useState(100);
  const [autoRechargeAmount, setAutoRechargeAmount] = useState(500);

  const { data: status, isLoading: statusLoading } = useQuery<SmsCreditsStatus>({
    queryKey: ["/api/admin/sms-credits/status"],
  });

  const { data: balance, isLoading: balanceLoading } = useQuery<SmsBalance>({
    queryKey: ["/api/admin/sms-credits/balance"],
  });

  const { data: packages = [], isLoading: packagesLoading } = useQuery<SmsPackage[]>({
    queryKey: ["/api/admin/sms-credits/packages"],
  });

  const { data: usageStats, isLoading: statsLoading } = useQuery<SmsUsageStats>({
    queryKey: ["/api/admin/sms-credits/usage-stats"],
  });

  const { data: transactionsData, isLoading: transactionsLoading } = useQuery<TransactionsResponse>({
    queryKey: ["/api/admin/sms-credits/transactions", { limit: ITEMS_PER_PAGE, offset: (page - 1) * ITEMS_PER_PAGE }],
  });

  const purchaseMutation = useMutation({
    mutationFn: async (packageId: string) => {
      const response = await apiRequest("POST", "/api/admin/sms-credits/purchase", {
        packageId,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sms-credits/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sms-credits/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sms-credits/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sms-credits/usage-stats"] });
      toast({
        title: "Purchase successful",
        description: `${data.creditsAdded} credits have been added to your account.`,
      });
      setPurchaseDialogOpen(false);
      setSelectedPackage(null);
    },
    onError: (error: any) => {
      toast({
        title: "Purchase failed",
        description: error.message || "Failed to purchase SMS credits",
        variant: "destructive",
      });
    },
  });

  const updateAutoRechargeMutation = useMutation({
    mutationFn: async (settings: { enabled: boolean; rechargeAmount?: number; lowThreshold?: number }) => {
      const response = await apiRequest("PATCH", "/api/admin/sms-credits/auto-recharge", settings);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sms-credits/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sms-credits/balance"] });
      toast({
        title: "Settings updated",
        description: "Auto-recharge settings have been saved.",
      });
      setSettingsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update settings",
        description: error.message || "Failed to update auto-recharge settings",
        variant: "destructive",
      });
    },
  });

  const openSettingsDialog = () => {
    if (balance) {
      setAutoRechargeEnabled(balance.autoRechargeEnabled);
      setLowThreshold(balance.lowThreshold);
      setAutoRechargeAmount(balance.autoRechargeAmount);
    }
    setSettingsDialogOpen(true);
  };

  const handleSaveSettings = () => {
    updateAutoRechargeMutation.mutate({
      enabled: autoRechargeEnabled,
      rechargeAmount: autoRechargeAmount,
      lowThreshold: lowThreshold,
    });
  };

  const handlePurchase = (pkg: SmsPackage) => {
    setSelectedPackage(pkg);
    setPurchaseDialogOpen(true);
  };

  const confirmPurchase = () => {
    if (selectedPackage) {
      purchaseMutation.mutate(selectedPackage.id);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const getTransactionTypeBadge = (type: string) => {
    switch (type) {
      case "purchase":
        return <Badge className="bg-green-900 text-green-100" data-testid={`badge-type-${type}`}>Purchase</Badge>;
      case "usage":
        return <Badge className="bg-blue-900 text-blue-100" data-testid={`badge-type-${type}`}>Usage</Badge>;
      case "adjustment":
        return <Badge className="bg-amber-900 text-amber-100" data-testid={`badge-type-${type}`}>Adjustment</Badge>;
      case "refund":
        return <Badge className="bg-purple-900 text-purple-100" data-testid={`badge-type-${type}`}>Refund</Badge>;
      default:
        return <Badge variant="secondary" data-testid={`badge-type-${type}`}>{type}</Badge>;
    }
  };

  const getAmountDisplay = (transaction: SmsTransaction) => {
    const isPositive = transaction.amount > 0;
    return (
      <span className={cn("font-bold tabular-nums", isPositive ? "text-green-500" : "text-red-500")}>
        {isPositive ? "+" : ""}{formatNumber(transaction.amount)}
      </span>
    );
  };

  const transactions = transactionsData?.transactions || [];
  const totalTransactions = transactionsData?.total || 0;
  const totalPages = Math.ceil(totalTransactions / ITEMS_PER_PAGE);

  const isLoading = statusLoading || balanceLoading;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-semibold text-foreground" data-testid="text-page-title">SMS Credits</h1>
          </div>
          <Button onClick={openSettingsDialog} variant="outline" size="sm" data-testid="button-settings">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>

        {/* Top Section: Balance Overview + Packages */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Balance Overview Card */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-foreground">Credit Balance</CardTitle>
              <CardDescription>Your current SMS credits and status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Large Balance Display */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-4xl font-bold tabular-nums text-foreground" data-testid="text-balance">
                    {formatNumber(balance?.balance || 0)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Available Credits</p>
                </div>
                <div className={cn(
                  "p-3 rounded-full",
                  balance?.isLow ? "bg-amber-500/10" : "bg-green-500/10"
                )}>
                  {balance?.isLow ? (
                    <AlertTriangle className="w-8 h-8 text-amber-500" />
                  ) : (
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  )}
                </div>
              </div>

              {/* Low Balance Warning */}
              {balance?.isLow && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20" data-testid="alert-low-balance">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    Low balance! Credits below {formatNumber(balance.lowThreshold)} threshold.
                  </p>
                </div>
              )}

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Last Purchase</p>
                  <p className="text-sm font-medium text-foreground" data-testid="text-last-purchase">
                    {balance?.lastPurchasedAt
                      ? format(new Date(balance.lastPurchasedAt), "MMM d, yyyy")
                      : "No purchases yet"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Auto-Recharge</p>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={balance?.autoRechargeEnabled ? "default" : "secondary"}
                      className={balance?.autoRechargeEnabled ? "bg-green-900 text-green-100" : ""}
                      data-testid="badge-auto-recharge"
                    >
                      {balance?.autoRechargeEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Purchase Packages Card */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Purchase Credits
              </CardTitle>
              <CardDescription>Select a package to add credits</CardDescription>
            </CardHeader>
            <CardContent>
              {packagesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20" />
                  ))}
                </div>
              ) : packages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No packages available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {packages.filter(p => p.isActive).map((pkg, index) => {
                    const totalCredits = pkg.credits + pkg.bonusCredits;
                    const pricePerCredit = pkg.priceInCents / totalCredits;
                    const isPopular = index === 1;

                    return (
                      <div
                        key={pkg.id}
                        className={cn(
                          "relative p-4 rounded-lg border transition-all hover:shadow-md cursor-pointer",
                          isPopular
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                        onClick={() => handlePurchase(pkg)}
                        data-testid={`card-package-${pkg.id}`}
                      >
                        {isPopular && (
                          <Badge className="absolute -top-2 right-3 bg-primary text-primary-foreground">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Popular
                          </Badge>
                        )}
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-foreground">{pkg.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-2xl font-bold tabular-nums text-foreground">
                                {formatNumber(pkg.credits)}
                              </span>
                              {pkg.bonusCredits > 0 && (
                                <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400">
                                  +{formatNumber(pkg.bonusCredits)} bonus
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatCurrency(pricePerCredit * 100)}/credit
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-foreground">
                              {formatCurrency(pkg.priceInCents)}
                            </p>
                            <Button
                              size="sm"
                              className="mt-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePurchase(pkg);
                              }}
                              data-testid={`button-purchase-${pkg.id}`}
                            >
                              Purchase
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Send className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xl font-bold tabular-nums text-foreground" data-testid="stat-used-this-month">
                    {formatNumber(usageStats?.usedThisMonth || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Used This Month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xl font-bold tabular-nums text-foreground" data-testid="stat-total-sent">
                    {formatNumber(usageStats?.totalSent30Days || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Sent (30 days)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-xl font-bold tabular-nums text-foreground" data-testid="stat-avg-daily">
                    {usageStats?.averageDailyUsage?.toFixed(1) || "0"}
                  </p>
                  <p className="text-xs text-muted-foreground">Avg Daily Usage</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  usageStats?.projectedDaysRemaining != null && usageStats.projectedDaysRemaining < 7
                    ? "bg-red-500/10"
                    : "bg-purple-500/10"
                )}>
                  <Calendar className={cn(
                    "w-5 h-5",
                    usageStats?.projectedDaysRemaining != null && usageStats.projectedDaysRemaining < 7
                      ? "text-red-500"
                      : "text-purple-500"
                  )} />
                </div>
                <div>
                  <p className="text-xl font-bold tabular-nums text-foreground" data-testid="stat-days-remaining">
                    {usageStats?.projectedDaysRemaining != null
                      ? usageStats.projectedDaysRemaining === Infinity
                        ? "∞"
                        : formatNumber(Math.round(usageStats.projectedDaysRemaining))
                      : "N/A"}
                  </p>
                  <p className="text-xs text-muted-foreground">Days Remaining</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-foreground">Transaction History</CardTitle>
            <CardDescription>Your recent SMS credit transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">No transactions yet</p>
                <p className="text-sm mt-1">Your transaction history will appear here</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date/Time</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Balance After</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id} data-testid={`row-transaction-${transaction.id}`}>
                          <TableCell>
                            <div className="text-sm" data-testid={`text-date-${transaction.id}`}>
                              {format(new Date(transaction.createdAt), "MMM d, yyyy")}
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(transaction.createdAt), "h:mm a")}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getTransactionTypeBadge(transaction.type)}
                          </TableCell>
                          <TableCell className="text-right" data-testid={`text-amount-${transaction.id}`}>
                            {getAmountDisplay(transaction)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium" data-testid={`text-balance-after-${transaction.id}`}>
                            {formatNumber(transaction.balanceAfter)}
                          </TableCell>
                          <TableCell className="max-w-xs truncate" data-testid={`text-description-${transaction.id}`}>
                            {transaction.description}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {((page - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(page * ITEMS_PER_PAGE, totalTransactions)} of {totalTransactions} transactions
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        data-testid="button-prev-page"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {page} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        data-testid="button-next-page"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Purchase Confirmation Dialog */}
        <AlertDialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Purchase</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3">
                  {selectedPackage && (
                    <>
                      <p>You are about to purchase:</p>
                      <div className="p-4 rounded-lg bg-muted">
                        <p className="font-medium">{selectedPackage.name}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-2xl font-bold tabular-nums">
                            {formatNumber(selectedPackage.credits)}
                          </span>
                          {selectedPackage.bonusCredits > 0 && (
                            <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                              +{formatNumber(selectedPackage.bonusCredits)} bonus
                            </Badge>
                          )}
                          <span className="text-muted-foreground">credits</span>
                        </div>
                        <p className="text-lg font-semibold mt-2">
                          {formatCurrency(selectedPackage.priceInCents)}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={purchaseMutation.isPending} data-testid="button-cancel-purchase">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmPurchase}
                disabled={purchaseMutation.isPending}
                data-testid="button-confirm-purchase"
              >
                {purchaseMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Confirm Purchase"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Settings Dialog */}
        <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Auto-Recharge Settings</DialogTitle>
              <DialogDescription>
                Configure automatic credit purchases when your balance runs low
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Auto-Recharge Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-recharge">Auto-Recharge</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically purchase credits when balance is low
                  </p>
                </div>
                <Switch
                  id="auto-recharge"
                  checked={autoRechargeEnabled}
                  onCheckedChange={setAutoRechargeEnabled}
                  data-testid="switch-auto-recharge"
                />
              </div>

              {autoRechargeEnabled && (
                <>
                  {/* Low Balance Threshold */}
                  <div className="space-y-2">
                    <Label htmlFor="threshold">Low Balance Threshold</Label>
                    <Input
                      id="threshold"
                      type="number"
                      value={lowThreshold}
                      onChange={(e) => setLowThreshold(parseInt(e.target.value) || 0)}
                      placeholder="100"
                      data-testid="input-threshold"
                    />
                    <p className="text-sm text-muted-foreground">
                      Trigger auto-recharge when credits fall below this number
                    </p>
                  </div>

                  {/* Auto-Recharge Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="recharge-amount">Recharge Amount</Label>
                    <Input
                      id="recharge-amount"
                      type="number"
                      value={autoRechargeAmount}
                      onChange={(e) => setAutoRechargeAmount(parseInt(e.target.value) || 0)}
                      placeholder="500"
                      data-testid="input-recharge-amount"
                    />
                    <p className="text-sm text-muted-foreground">
                      Number of credits to purchase automatically
                    </p>
                  </div>
                </>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSettingsDialogOpen(false)}
                disabled={updateAutoRechargeMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveSettings}
                disabled={updateAutoRechargeMutation.isPending}
                data-testid="button-save-settings"
              >
                {updateAutoRechargeMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Settings"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
