import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import AdminLayout from "@/components/admin-layout";
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subMonths, subQuarters, subYears } from "date-fns";
import { cn } from "@/lib/utils";
import {
  DollarSign,
  Download,
  FileText,
  Mail,
  Calendar as CalendarIcon,
  ArrowUpDown,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  CreditCard,
  MinusCircle,
  Receipt,
  Wallet,
} from "lucide-react";
import { useHasFeature, UpgradePrompt } from "@/hooks/use-feature-flags";
import { FEATURE_KEYS } from "@shared/feature-flags";

interface FinancialTransaction {
  id: string;
  tenantId: string;
  transactionType: string;
  amountCents: number;
  currency: string;
  sourceType: string;
  sourceId: string;
  userId?: string;
  playerId?: string;
  sessionId?: string;
  processorType?: string;
  processorTransactionId?: string;
  qbSyncStatus: string;
  qbSyncedAt?: string;
  qbTransactionId?: string;
  qbError?: string;
  description?: string;
  transactionDate: string;
  createdAt: string;
}

interface TransactionsResponse {
  transactions: FinancialTransaction[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

type DatePreset = 'this_month' | 'last_month' | 'this_quarter' | 'last_quarter' | 'this_year' | 'last_year' | 'custom';

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_quarter', label: 'This Quarter' },
  { value: 'last_quarter', label: 'Last Quarter' },
  { value: 'this_year', label: 'This Year' },
  { value: 'last_year', label: 'Last Year' },
  { value: 'custom', label: 'Custom Range' },
];

const TRANSACTION_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'session_payment', label: 'Session Payments' },
  { value: 'subscription_payment', label: 'Subscription Payments' },
  { value: 'refund', label: 'Refunds' },
  { value: 'credit_issued', label: 'Credits Issued' },
  { value: 'credit_redeemed', label: 'Credits Redeemed' },
  { value: 'processing_fee', label: 'Processing Fees' },
];

const SYNC_STATUSES = [
  { value: 'all', label: 'All Statuses' },
  { value: 'synced', label: 'Synced' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
];

function getPresetDates(preset: DatePreset): { start: Date; end: Date } {
  const now = new Date();
  switch (preset) {
    case 'this_month':
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'last_month':
      const lastMonth = subMonths(now, 1);
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
    case 'this_quarter':
      return { start: startOfQuarter(now), end: endOfQuarter(now) };
    case 'last_quarter':
      const lastQuarter = subQuarters(now, 1);
      return { start: startOfQuarter(lastQuarter), end: endOfQuarter(lastQuarter) };
    case 'this_year':
      return { start: startOfYear(now), end: endOfYear(now) };
    case 'last_year':
      const lastYear = subYears(now, 1);
      return { start: startOfYear(lastYear), end: endOfYear(lastYear) };
    default:
      return { start: startOfMonth(now), end: endOfMonth(now) };
  }
}

export default function FinancialReports() {
  const { toast } = useToast();
  
  const [datePreset, setDatePreset] = useState<DatePreset>('this_month');
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));
  const [typeFilter, setTypeFilter] = useState('all');
  const [syncStatusFilter, setSyncStatusFilter] = useState('all');
  const [sortField, setSortField] = useState<'transactionDate' | 'amountCents'>('transactionDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [bookKeeperEmail, setBookkeeperEmail] = useState('');
  const itemsPerPage = 20;

  const { hasFeature: hasQuickBooks, isLoading: featureLoading } = useHasFeature(FEATURE_KEYS.INTEGRATIONS_QUICKBOOKS);

  const handlePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    if (preset !== 'custom') {
      const { start, end } = getPresetDates(preset);
      setStartDate(start);
      setEndDate(end);
    }
    setCurrentPage(1);
  };

  const { data: transactionsData, isLoading: transactionsLoading, refetch } = useQuery<TransactionsResponse>({
    queryKey: [
      "/api/admin/integrations/quickbooks/reports/transactions",
      startDate.toISOString(),
      endDate.toISOString(),
      typeFilter,
      syncStatusFilter,
      currentPage,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: itemsPerPage.toString(),
        offset: ((currentPage - 1) * itemsPerPage).toString(),
      });
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (syncStatusFilter !== 'all') params.append('syncStatus', syncStatusFilter);
      
      const response = await fetch(`/api/admin/integrations/quickbooks/reports/transactions?${params}`);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
    enabled: hasQuickBooks === true,
  });

  const transactions = transactionsData?.transactions || [];
  const pagination = transactionsData?.pagination;

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'transactionDate') {
        comparison = new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime();
      } else if (sortField === 'amountCents') {
        comparison = a.amountCents - b.amountCents;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [transactions, sortField, sortDirection]);

  const summary = useMemo(() => {
    const allTransactions = transactions;
    
    const grossRevenue = allTransactions
      .filter(t => ['session_payment', 'subscription_payment'].includes(t.transactionType))
      .reduce((sum, t) => sum + t.amountCents, 0);
    
    const totalRefunds = allTransactions
      .filter(t => t.transactionType === 'refund')
      .reduce((sum, t) => sum + Math.abs(t.amountCents), 0);
    
    const netRevenue = grossRevenue - totalRefunds;
    
    const creditsIssued = allTransactions
      .filter(t => t.transactionType === 'credit_issued')
      .reduce((sum, t) => sum + Math.abs(t.amountCents), 0);
    
    const processingFees = allTransactions
      .filter(t => t.transactionType === 'processing_fee')
      .reduce((sum, t) => sum + Math.abs(t.amountCents), 0);
    
    const outstandingCredits = allTransactions
      .filter(t => t.transactionType === 'credit_issued')
      .reduce((sum, t) => sum + t.amountCents, 0) -
      allTransactions
        .filter(t => t.transactionType === 'credit_redeemed')
        .reduce((sum, t) => sum + Math.abs(t.amountCents), 0);

    return {
      grossRevenue,
      totalRefunds,
      netRevenue,
      creditsIssued,
      processingFees,
      outstandingCredits: Math.max(0, outstandingCredits),
    };
  }, [transactions]);

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams({
        format: 'csv',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      
      const response = await fetch(`/api/admin/integrations/quickbooks/reports/export?${params}`);
      if (!response.ok) throw new Error('Failed to export CSV');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financial-report-${format(startDate, 'yyyy-MM-dd')}-to-${format(endDate, 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: "CSV file has been downloaded.",
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export CSV",
        variant: "destructive",
      });
    }
  };

  const handleExportPDF = async () => {
    try {
      const params = new URLSearchParams({
        format: 'pdf',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      
      const response = await fetch(`/api/admin/integrations/quickbooks/reports/export?${params}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to export PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financial-report-${format(startDate, 'yyyy-MM-dd')}-to-${format(endDate, 'yyyy-MM-dd')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: "PDF file has been downloaded.",
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "PDF export is not available. Use CSV format.",
        variant: "destructive",
      });
    }
  };

  const emailReportMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("POST", "/api/admin/integrations/quickbooks/reports/email", {
        email,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Report Sent",
        description: `Financial report has been emailed to ${bookKeeperEmail}`,
      });
      setEmailDialogOpen(false);
      setBookkeeperEmail('');
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send",
        description: error.message || "Could not send the report. Please try exporting and sending manually.",
        variant: "destructive",
      });
    },
  });

  const handleSort = (field: 'transactionDate' | 'amountCents') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const getTransactionTypeLabel = (type: string) => {
    const typeObj = TRANSACTION_TYPES.find(t => t.value === type);
    return typeObj?.label || type.replace(/_/g, ' ');
  };

  const getTransactionTypeBadge = (type: string) => {
    switch (type) {
      case 'session_payment':
      case 'subscription_payment':
        return <Badge className="bg-green-900 text-green-100" data-testid={`badge-type-${type}`}><DollarSign className="w-3 h-3 mr-1" />Payment</Badge>;
      case 'refund':
        return <Badge className="bg-red-900 text-red-100" data-testid={`badge-type-${type}`}><MinusCircle className="w-3 h-3 mr-1" />Refund</Badge>;
      case 'credit_issued':
        return <Badge className="bg-blue-900 text-blue-100" data-testid={`badge-type-${type}`}><CreditCard className="w-3 h-3 mr-1" />Credit Issued</Badge>;
      case 'credit_redeemed':
        return <Badge className="bg-purple-900 text-purple-100" data-testid={`badge-type-${type}`}><Receipt className="w-3 h-3 mr-1" />Credit Redeemed</Badge>;
      case 'processing_fee':
        return <Badge className="bg-orange-900 text-orange-100" data-testid={`badge-type-${type}`}><Wallet className="w-3 h-3 mr-1" />Fee</Badge>;
      default:
        return <Badge variant="secondary" data-testid={`badge-type-${type}`}>{type}</Badge>;
    }
  };

  const getSyncStatusBadge = (status: string) => {
    switch (status) {
      case 'synced':
        return <Badge className="bg-green-900 text-green-100" data-testid={`badge-sync-${status}`}><CheckCircle className="w-3 h-3 mr-1" />Synced</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-900 text-yellow-100" data-testid={`badge-sync-${status}`}><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-900 text-red-100" data-testid={`badge-sync-${status}`}><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="secondary" data-testid={`badge-sync-${status}`}><AlertCircle className="w-3 h-3 mr-1" />{status}</Badge>;
    }
  };

  const totalPages = pagination ? Math.ceil(pagination.total / itemsPerPage) : 1;

  if (featureLoading) {
    return (
      <AdminLayout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </AdminLayout>
    );
  }

  if (!hasQuickBooks) {
    return (
      <AdminLayout>
        <div className="p-6">
          <Card>
            <CardHeader>
              <CardTitle>Financial Reports</CardTitle>
              <CardDescription>
                Generate and export financial reports for your bookkeeper or accountant.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UpgradePrompt feature={FEATURE_KEYS.INTEGRATIONS_QUICKBOOKS} />
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground" data-testid="text-page-title">Financial Reports</h1>
            <p className="text-muted-foreground mt-1">Generate and export financial reports for your bookkeeper</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={transactionsLoading}
              data-testid="button-export-csv"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={handleExportPDF}
              disabled={transactionsLoading}
              data-testid="button-export-pdf"
            >
              <FileText className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button
              variant="default"
              onClick={() => setEmailDialogOpen(true)}
              disabled={transactionsLoading}
              data-testid="button-email-bookkeeper"
            >
              <Mail className="w-4 h-4 mr-2" />
              Email to Bookkeeper
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Report Period</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2">
                <Label>Quick Select</Label>
                <Select value={datePreset} onValueChange={(value) => handlePresetChange(value as DatePreset)}>
                  <SelectTrigger className="w-[180px]" data-testid="select-date-preset">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    {DATE_PRESETS.map((preset) => (
                      <SelectItem key={preset.value} value={preset.value}>
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[180px] justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                      data-testid="button-start-date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {
                        if (date) {
                          setStartDate(date);
                          setDatePreset('custom');
                          setCurrentPage(1);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[180px] justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                      data-testid="button-end-date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => {
                        if (date) {
                          setEndDate(date);
                          setDatePreset('custom');
                          setCurrentPage(1);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => refetch()}
                disabled={transactionsLoading}
                data-testid="button-refresh"
              >
                <RefreshCw className={cn("h-4 w-4", transactionsLoading && "animate-spin")} />
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <Card data-testid="card-gross-revenue">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                Gross Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums text-foreground" data-testid="value-gross-revenue">
                {transactionsLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(summary.grossRevenue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Session + Subscription</p>
            </CardContent>
          </Card>

          <Card data-testid="card-total-refunds">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MinusCircle className="w-4 h-4 text-red-500" />
                Total Refunds
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums text-foreground" data-testid="value-total-refunds">
                {transactionsLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(summary.totalRefunds)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Refunded amount</p>
            </CardContent>
          </Card>

          <Card data-testid="card-net-revenue">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-500" />
                Net Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums text-foreground" data-testid="value-net-revenue">
                {transactionsLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(summary.netRevenue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Gross - Refunds</p>
            </CardContent>
          </Card>

          <Card data-testid="card-credits-issued">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-purple-500" />
                Credits Issued
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums text-foreground" data-testid="value-credits-issued">
                {transactionsLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(summary.creditsIssued)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total credits</p>
            </CardContent>
          </Card>

          <Card data-testid="card-processing-fees">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Receipt className="w-4 h-4 text-orange-500" />
                Processing Fees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums text-foreground" data-testid="value-processing-fees">
                {transactionsLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(summary.processingFees)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Payment processor</p>
            </CardContent>
          </Card>

          <Card data-testid="card-outstanding-credits">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Wallet className="w-4 h-4 text-cyan-500" />
                Outstanding Credits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums text-foreground" data-testid="value-outstanding-credits">
                {transactionsLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(summary.outstandingCredits)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Available balance</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-base font-medium">Transaction Details</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Select value={typeFilter} onValueChange={(value) => { setTypeFilter(value); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[180px]" data-testid="select-type-filter">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSACTION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={syncStatusFilter} onValueChange={(value) => { setSyncStatusFilter(value); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[160px]" data-testid="select-sync-filter">
                    <SelectValue placeholder="QB Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {SYNC_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : sortedTransactions.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium text-foreground">No transactions found</h3>
                <p className="mt-2 text-muted-foreground">
                  No financial transactions match your selected filters.
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="-ml-3 h-8"
                            onClick={() => handleSort('transactionDate')}
                            data-testid="button-sort-date"
                          >
                            Date
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="-ml-3 h-8"
                            onClick={() => handleSort('amountCents')}
                            data-testid="button-sort-amount"
                          >
                            Amount
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </TableHead>
                        <TableHead>QB Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedTransactions.map((transaction) => (
                        <TableRow key={transaction.id} data-testid={`row-transaction-${transaction.id}`}>
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(transaction.transactionDate), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            {getTransactionTypeBadge(transaction.transactionType)}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {transaction.description || getTransactionTypeLabel(transaction.transactionType)}
                          </TableCell>
                          <TableCell className={cn(
                            "font-medium tabular-nums",
                            transaction.transactionType === 'refund' || transaction.transactionType === 'processing_fee' 
                              ? "text-red-600 dark:text-red-400" 
                              : "text-green-600 dark:text-green-400"
                          )}>
                            {transaction.transactionType === 'refund' || transaction.transactionType === 'processing_fee' ? '-' : '+'}
                            {formatCurrency(Math.abs(transaction.amountCents))}
                          </TableCell>
                          <TableCell>
                            {getSyncStatusBadge(transaction.qbSyncStatus)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, pagination?.total || 0)} of {pagination?.total || 0} transactions
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        data-testid="button-prev-page"
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        data-testid="button-next-page"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Email Report to Bookkeeper</DialogTitle>
              <DialogDescription>
                Send the financial report for {format(startDate, "MMM d, yyyy")} to {format(endDate, "MMM d, yyyy")} to your bookkeeper's email.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Bookkeeper Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="bookkeeper@example.com"
                  value={bookKeeperEmail}
                  onChange={(e) => setBookkeeperEmail(e.target.value)}
                  data-testid="input-bookkeeper-email"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEmailDialogOpen(false)}
                data-testid="button-cancel-email"
              >
                Cancel
              </Button>
              <Button
                onClick={() => emailReportMutation.mutate(bookKeeperEmail)}
                disabled={!bookKeeperEmail || emailReportMutation.isPending}
                data-testid="button-send-email"
              >
                {emailReportMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Report
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
