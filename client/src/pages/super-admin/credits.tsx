import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Ban,
  Calendar as CalendarIcon,
  MoreVertical,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  AlertCircle,
  Building,
  History,
  ChevronDown,
} from "lucide-react";

// Types
interface TenantCredit {
  id: string;
  tenantId: string;
  tenantName: string;
  amount: number;
  usedAmount: number;
  balance: number;
  reason: string;
  expiresAt?: string;
  createdAt: string;
  createdBy: string;
  status: "active" | "expired" | "used";
  isActive: boolean;
  lastTransaction?: {
    amount: number;
    type: "credit" | "debit";
    date: string;
  };
}

interface CreditTransaction {
  id: string;
  creditId: string;
  type: "credit" | "debit";
  amount: number;
  balance: number;
  description: string;
  createdAt: string;
  createdBy: string;
  reference?: string;
}

interface CreditStats {
  totalIssued: number;
  totalUsed: number;
  activeBalance: number;
  expiringSoonCount: number;
  activeCredits: number;
  expiredCredits: number;
  averageUtilization: number;
  topTenant?: {
    name: string;
    credits: number;
  };
}

interface Tenant {
  id: string;
  name: string;
  domain: string;
  status: string;
}

// Schemas
const creditSchema = z.object({
  tenantId: z.string().min(1, "Please select a tenant"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  reason: z.string().min(1, "Reason is required").max(500),
  expiresAt: z.date().optional().nullable(),
});

export default function SuperAdminCredits() {
  const [selectedCredit, setSelectedCredit] = useState<TenantCredit | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [transactionsDialogOpen, setTransactionsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [exportLoading, setExportLoading] = useState(false);
  const [expiresDate, setExpiresDate] = useState<Date>();
  const { toast } = useToast();

  // Form
  const form = useForm<z.infer<typeof creditSchema>>({
    resolver: zodResolver(creditSchema),
    defaultValues: {
      tenantId: "",
      amount: 0,
      reason: "",
      expiresAt: null,
    },
  });

  // Queries
  const { data: creditsData, isLoading: creditsLoading, refetch: refetchCredits } = useQuery<{
    credits: TenantCredit[];
    stats: CreditStats;
  }>({
    queryKey: ["/api/super-admin/tenant-credits"],
  });

  const { data: tenants = [], isLoading: tenantsLoading } = useQuery<Tenant[]>({
    queryKey: ["/api/super-admin/tenants"],
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<CreditTransaction[]>({
    queryKey: selectedCredit ? ["/api/super-admin/tenant-credits", selectedCredit.id, "transactions"] : [],
    enabled: !!selectedCredit && transactionsDialogOpen,
  });

  const credits = creditsData?.credits || [];
  const stats = creditsData?.stats || {
    totalIssued: 0,
    totalUsed: 0,
    activeBalance: 0,
    expiringSoonCount: 0,
    activeCredits: 0,
    expiredCredits: 0,
    averageUtilization: 0,
  };

  // Filter credits
  const filteredCredits = credits.filter((credit) => {
    const matchesSearch = searchQuery === "" || 
      credit.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      credit.reason.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && credit.status === "active") ||
      (statusFilter === "expired" && credit.status === "expired") ||
      (statusFilter === "used" && credit.status === "used");

    return matchesSearch && matchesStatus;
  });

  // Mutations
  const createCreditMutation = useMutation({
    mutationFn: async (data: z.infer<typeof creditSchema>) => {
      const response = await apiRequest("POST", "/api/super-admin/tenant-credits", {
        ...data,
        expiresAt: data.expiresAt?.toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Credit created successfully",
      });
      setDialogOpen(false);
      form.reset();
      refetchCredits();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create credit",
        variant: "destructive",
      });
    },
  });

  const deactivateCreditMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("PATCH", `/api/super-admin/tenant-credits/${id}/deactivate`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Credit deactivated successfully",
      });
      refetchCredits();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to deactivate credit",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: z.infer<typeof creditSchema>) => {
    createCreditMutation.mutate(data);
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const response = await apiRequest("GET", "/api/super-admin/tenant-credits/export");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tenant-credits-${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: "Credits exported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export credits",
        variant: "destructive",
      });
    } finally {
      setExportLoading(false);
    }
  };

  const openDialog = () => {
    form.reset({
      tenantId: "",
      amount: 0,
      reason: "",
      expiresAt: null,
    });
    setExpiresDate(undefined);
    setDialogOpen(true);
  };

  const viewTransactions = (credit: TenantCredit) => {
    setSelectedCredit(credit);
    setTransactionsDialogOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-900 text-green-100">Active</Badge>;
      case "expired":
        return <Badge className="bg-orange-900 text-orange-100">Expired</Badge>;
      case "used":
        return <Badge className="bg-gray-700 text-gray-100">Fully Used</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Tenant Credits</h2>
          <p className="text-muted-foreground">Manage credits across all tenants</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={exportLoading}
            data-testid="button-export"
          >
            {exportLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Export CSV
          </Button>
          <Button onClick={openDialog} data-testid="button-create-credit">
            <Plus className="w-4 h-4 mr-2" />
            Issue Credit
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Issued
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{formatCurrency(stats.totalIssued)}</div>
              <DollarSign className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.activeCredits} active credits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{formatCurrency(stats.totalUsed)}</div>
              <TrendingDown className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round(stats.averageUtilization)}% utilization
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{formatCurrency(stats.activeBalance)}</div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Available to use
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Expiring Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.expiringSoonCount}</div>
              <Clock className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Within 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by tenant name or reason..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Credits</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="used">Fully Used</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Credits Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tenant Credits</CardTitle>
          <CardDescription>
            {filteredCredits.length} {filteredCredits.length === 1 ? "credit" : "credits"} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Used</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {creditsLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading credits...
                    </TableCell>
                  </TableRow>
                ) : filteredCredits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No credits found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCredits.map((credit) => (
                    <TableRow key={credit.id} data-testid={`row-credit-${credit.id}`}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-muted-foreground" />
                          {credit.tenantName}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(credit.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(credit.usedAmount)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(credit.balance)}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={credit.reason}>
                        {credit.reason}
                      </TableCell>
                      <TableCell>
                        {credit.expiresAt ? (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(credit.expiresAt), "MMM d, yyyy")}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No expiry</span>
                        )}
                      </TableCell>
                      <TableCell>{credit.createdBy}</TableCell>
                      <TableCell>{getStatusBadge(credit.status)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              data-testid={`button-actions-${credit.id}`}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => viewTransactions(credit)}>
                              <History className="w-4 h-4 mr-2" />
                              View Transactions
                            </DropdownMenuItem>
                            {credit.status === "active" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => deactivateCreditMutation.mutate(credit.id)}
                                  className="text-destructive"
                                >
                                  <Ban className="w-4 h-4 mr-2" />
                                  Deactivate
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Credit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Issue Tenant Credit</DialogTitle>
            <DialogDescription>
              Issue a new credit to a tenant for their account
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="tenantId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tenant</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-tenant">
                          <SelectValue placeholder="Select a tenant" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tenantsLoading ? (
                          <SelectItem value="loading" disabled>
                            Loading tenants...
                          </SelectItem>
                        ) : tenants.length === 0 ? (
                          <SelectItem value="none" disabled>
                            No tenants available
                          </SelectItem>
                        ) : (
                          tenants.map((tenant) => (
                            <SelectItem key={tenant.id} value={tenant.id}>
                              {tenant.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          $
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="pl-8"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          data-testid="input-amount"
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      The credit amount in USD
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter the reason for this credit..."
                        className="resize-none"
                        rows={3}
                        {...field}
                        data-testid="textarea-reason"
                      />
                    </FormControl>
                    <FormDescription>
                      Describe why this credit is being issued
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiresAt"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Expires At (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            data-testid="button-expires-date"
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Leave empty for credits that don't expire
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={createCreditMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createCreditMutation.isPending}
                  data-testid="button-submit"
                >
                  {createCreditMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Issue Credit"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Transactions Dialog */}
      <Dialog open={transactionsDialogOpen} onOpenChange={setTransactionsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Transaction History</DialogTitle>
            <DialogDescription>
              {selectedCredit && `${selectedCredit.tenantName} - Credit #${selectedCredit.id.slice(0, 8)}`}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[400px] pr-4">
            {transactionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No transactions found
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-start justify-between p-4 border rounded-lg"
                    data-testid={`transaction-${transaction.id}`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {transaction.type === "credit" ? (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                        <span className="font-medium">
                          {transaction.type === "credit" ? "Credit" : "Debit"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{transaction.description}</p>
                      {transaction.reference && (
                        <p className="text-xs text-muted-foreground">Ref: {transaction.reference}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(transaction.createdAt), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={cn(
                        "font-bold",
                        transaction.type === "credit" ? "text-green-500" : "text-red-500"
                      )}>
                        {transaction.type === "credit" ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Balance: {formatCurrency(transaction.balance)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTransactionsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}