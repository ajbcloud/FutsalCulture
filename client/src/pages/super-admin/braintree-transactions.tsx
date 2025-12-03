import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subDays } from "date-fns";
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Search,
  Eye,
  Calendar,
  Filter
} from "lucide-react";

interface Transaction {
  id: string;
  type: string;
  amount: string;
  status: string;
  createdAt: string;
  customerId?: string;
  customerEmail?: string;
  customerFirstName?: string;
  customerLastName?: string;
  paymentMethodType?: string;
  cardType?: string;
  lastFour?: string;
  subscriptionId?: string;
  planId?: string;
  merchantAccountId?: string;
  processorResponseCode?: string;
  processorResponseText?: string;
}

interface TransactionStats {
  totalCount: number;
  totalAmount: number;
  successCount: number;
  failedCount: number;
  refundedCount: number;
  byStatus: Record<string, number>;
  byDay: Array<{ date: string; count: number; amount: number }>;
}

const statusColors: Record<string, string> = {
  authorized: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  submitted_for_settlement: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  settled: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  settling: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400",
  voided: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  gateway_rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  processor_declined: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export default function BraintreeTransactions() {
  const [dateRange, setDateRange] = useState("30");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const startDate = subDays(new Date(), parseInt(dateRange));

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<TransactionStats>({
    queryKey: ["/api/super-admin/braintree/transactions/stats", dateRange],
    queryFn: async () => {
      const res = await fetch(`/api/super-admin/braintree/transactions/stats?days=${dateRange}`);
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  const { data: transactions, isLoading: transactionsLoading, refetch: refetchTransactions } = useQuery<Transaction[]>({
    queryKey: ["/api/super-admin/braintree/transactions", dateRange, statusFilter, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        limit: "200",
      });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (typeFilter !== "all") params.set("type", typeFilter);
      
      const res = await fetch(`/api/super-admin/braintree/transactions?${params}`);
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json();
    },
  });

  const filteredTransactions = transactions?.filter((tx) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      tx.id.toLowerCase().includes(search) ||
      tx.customerEmail?.toLowerCase().includes(search) ||
      tx.customerFirstName?.toLowerCase().includes(search) ||
      tx.customerLastName?.toLowerCase().includes(search) ||
      tx.subscriptionId?.toLowerCase().includes(search)
    );
  });

  const handleRefresh = () => {
    refetchStats();
    refetchTransactions();
  };

  const formatAmount = (amount: string | number) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(num);
  };

  const getStatusIcon = (status: string) => {
    if (status === "settled" || status === "settling" || status === "submitted_for_settlement") {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (status === "failed" || status === "gateway_rejected" || status === "processor_declined") {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Braintree Transactions</h1>
          <p className="text-muted-foreground">View all payment transactions from Braintree</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" data-testid="button-refresh-transactions">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalCount || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">Last {dateRange} days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <div className="text-2xl font-bold">{formatAmount(stats?.totalAmount || 0)}</div>
            )}
            <p className="text-xs text-muted-foreground">Last {dateRange} days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">{stats?.successCount || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.totalCount ? ((stats.successCount / stats.totalCount) * 100).toFixed(1) : 0}% success rate
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold text-red-600">{stats?.failedCount || 0}</div>
                <p className="text-xs text-muted-foreground">Requires attention</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="date-range">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger id="date-range" data-testid="select-date-range">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="180">Last 6 months</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter" data-testid="select-status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="settled">Settled</SelectItem>
                  <SelectItem value="submitted_for_settlement">Submitted</SelectItem>
                  <SelectItem value="authorized">Authorized</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="voided">Voided</SelectItem>
                  <SelectItem value="gateway_rejected">Gateway Rejected</SelectItem>
                  <SelectItem value="processor_declined">Processor Declined</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type-filter">Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger id="type-filter" data-testid="select-type-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="sale">Sale</SelectItem>
                  <SelectItem value="credit">Credit/Refund</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="ID, email, name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-transactions"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            {filteredTransactions?.length || 0} transactions found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredTransactions?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No transactions found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions?.map((tx) => (
                  <TableRow key={tx.id} data-testid={`row-transaction-${tx.id}`}>
                    <TableCell className="font-mono text-xs">{tx.id}</TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(tx.createdAt), "MMM d, yyyy h:mm a")}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {tx.customerFirstName} {tx.customerLastName}
                      </div>
                      <div className="text-xs text-muted-foreground">{tx.customerEmail}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {tx.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{formatAmount(tx.amount)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(tx.status)}
                        <Badge className={statusColors[tx.status] || "bg-gray-100"}>
                          {tx.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {tx.cardType && tx.lastFour ? (
                        <div className="text-sm">
                          {tx.cardType} •••• {tx.lastFour}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">{tx.paymentMethodType || "N/A"}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTransaction(tx)}
                        data-testid={`button-view-transaction-${tx.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Transaction Details
            </DialogTitle>
            <DialogDescription>
              Transaction ID: {selectedTransaction?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Amount</Label>
                  <div className="text-lg font-bold">{formatAmount(selectedTransaction.amount)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(selectedTransaction.status)}
                    <Badge className={statusColors[selectedTransaction.status] || "bg-gray-100"}>
                      {selectedTransaction.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <div className="capitalize">{selectedTransaction.type}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date</Label>
                  <div>{format(new Date(selectedTransaction.createdAt), "PPpp")}</div>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="text-muted-foreground mb-2 block">Customer</Label>
                <div className="text-sm">
                  {selectedTransaction.customerFirstName} {selectedTransaction.customerLastName}
                </div>
                <div className="text-sm text-muted-foreground">{selectedTransaction.customerEmail}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Customer ID: {selectedTransaction.customerId}
                </div>
              </div>

              {(selectedTransaction.cardType || selectedTransaction.lastFour) && (
                <div className="border-t pt-4">
                  <Label className="text-muted-foreground mb-2 block">Payment Method</Label>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    <span>
                      {selectedTransaction.cardType} •••• {selectedTransaction.lastFour}
                    </span>
                  </div>
                </div>
              )}

              {selectedTransaction.subscriptionId && (
                <div className="border-t pt-4">
                  <Label className="text-muted-foreground mb-2 block">Subscription</Label>
                  <div className="text-sm font-mono">{selectedTransaction.subscriptionId}</div>
                  {selectedTransaction.planId && (
                    <div className="text-xs text-muted-foreground">Plan: {selectedTransaction.planId}</div>
                  )}
                </div>
              )}

              {selectedTransaction.processorResponseText && (
                <div className="border-t pt-4">
                  <Label className="text-muted-foreground mb-2 block">Processor Response</Label>
                  <div className="text-sm">
                    {selectedTransaction.processorResponseCode}: {selectedTransaction.processorResponseText}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
