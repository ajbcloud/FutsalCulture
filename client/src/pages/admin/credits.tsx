import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "@/components/ui/dropdown-menu";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import AdminLayout from "@/components/admin-layout";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import {
  CreditCard,
  Plus,
  Search,
  Download,
  History,
  Calendar as CalendarIcon,
  MoreVertical,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Clock,
  User,
  Home,
  Check,
  ChevronsUpDown,
} from "lucide-react";

// Types
interface UserCredit {
  id: string;
  userId?: string;
  householdId?: string;
  userName?: string;
  userEmail?: string;
  householdName?: string;
  amount: number;
  usedAmount: number;
  balance: number;
  reason: string;
  expiresAt?: string;
  createdAt: string;
  createdBy: string;
  status: "active" | "expired" | "used";
  lastUsedAt?: string;
  transactionCount: number;
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
  sessionId?: string;
  sessionName?: string;
  reference?: string;
}

interface CreditBalance {
  totalIssued: number;
  totalUsed: number;
  totalAvailable: number;
  thisMonthIssued: number;
  thisMonthUsed: number;
  activeCredits: number;
  expiredCredits: number;
  averagePerUser: number;
  totalUsers: number;
}

interface UserOption {
  id: string;
  type: "user" | "household";
  name: string;
  email?: string;
  memberCount?: number;
}

// Schema
const creditSchema = z.object({
  targetId: z.string().min(1, "Please select a user or household"),
  targetType: z.enum(["user", "household"]),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  reason: z.string().min(1, "Reason is required").max(500),
  expiresAt: z.date().optional().nullable(),
});

export default function AdminCredits() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState<UserCredit | null>(null);
  const [transactionsDialogOpen, setTransactionsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [targetSearch, setTargetSearch] = useState("");
  const [targetOpen, setTargetOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Form
  const form = useForm<z.infer<typeof creditSchema>>({
    resolver: zodResolver(creditSchema),
    defaultValues: {
      targetId: "",
      targetType: "user",
      amount: 0,
      reason: "",
      expiresAt: null,
    },
  });

  // Queries
  const { data: credits = [], isLoading: creditsLoading, refetch: refetchCredits } = useQuery<UserCredit[]>({
    queryKey: ["/api/admin/credits"],
  });

  const { data: balance, isLoading: balanceLoading } = useQuery<CreditBalance>({
    queryKey: ["/api/admin/credits/balance"],
  });

  const { data: users = [] } = useQuery<UserOption[]>({
    queryKey: ["/api/admin/credits/users"],
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<CreditTransaction[]>({
    queryKey: selectedCredit ? ["/api/admin/credits", selectedCredit.id, "transactions"] : [],
    enabled: !!selectedCredit && transactionsDialogOpen,
  });

  // Filter credits
  const filteredCredits = credits.filter((credit) => {
    const matchesSearch = searchQuery === "" || 
      credit.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      credit.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      credit.householdName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      credit.reason.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && credit.status === "active") ||
      (statusFilter === "expired" && credit.status === "expired") ||
      (statusFilter === "used" && credit.status === "used");

    return matchesSearch && matchesStatus;
  });

  // Filter users/households for selection
  const filteredTargets = users.filter((user) => 
    targetSearch === "" ||
    user.name.toLowerCase().includes(targetSearch.toLowerCase()) ||
    user.email?.toLowerCase().includes(targetSearch.toLowerCase())
  );

  // Mutations
  const createCreditMutation = useMutation({
    mutationFn: async (data: z.infer<typeof creditSchema>) => {
      const response = await apiRequest("POST", "/api/admin/credits", {
        ...data,
        expiresAt: data.expiresAt?.toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/credits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/credits/balance"] });
      toast({ title: "Credit issued successfully" });
      setIsCreateOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to issue credit",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: z.infer<typeof creditSchema>) => {
    createCreditMutation.mutate(data);
  };

  const viewTransactions = (credit: UserCredit) => {
    setSelectedCredit(credit);
    setTransactionsDialogOpen(true);
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const response = await apiRequest("GET", "/api/admin/credits/export");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `user-credits-${format(new Date(), "yyyy-MM-dd")}.csv`;
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

  const resetForm = () => {
    form.reset({
      targetId: "",
      targetType: "user",
      amount: 0,
      reason: "",
      expiresAt: null,
    });
    setTargetSearch("");
  };

  if (creditsLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-xl sm:text-3xl font-bold text-foreground">Credits</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={exportLoading}
              size="sm"
              className="self-start sm:self-auto"
              data-testid="button-export"
            >
              {exportLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">Export</span>
            </Button>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <Button onClick={() => { resetForm(); setIsCreateOpen(true); }} size="sm" className="self-start sm:self-auto" data-testid="button-create-credit">
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Issue Credit</span>
                <span className="sm:hidden">Issue</span>
              </Button>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Issue Credit</DialogTitle>
                  <DialogDescription>
                    Issue a new credit to a user or household
                  </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    {/* Target Type Selection */}
                    <FormField
                      control={form.control}
                      name="targetType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Credit For</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-target-type">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="user">Individual User</SelectItem>
                              <SelectItem value="household">Household</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* User/Household Selection */}
                    <FormField
                      control={form.control}
                      name="targetId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {form.watch("targetType") === "user" ? "User" : "Household"}
                          </FormLabel>
                          <Popover open={targetOpen} onOpenChange={setTargetOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className="w-full justify-between"
                                  data-testid="button-target-selector"
                                >
                                  {field.value
                                    ? filteredTargets.find((t) => t.id === field.value)?.name
                                    : `Select ${form.watch("targetType")}...`}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0" align="start">
                              <Command>
                                <CommandInput
                                  placeholder={`Search ${form.watch("targetType")}...`}
                                  value={targetSearch}
                                  onValueChange={setTargetSearch}
                                />
                                <CommandEmpty>
                                  No {form.watch("targetType")} found.
                                </CommandEmpty>
                                <CommandGroup>
                                  <ScrollArea className="h-[200px]">
                                    {filteredTargets
                                      .filter(t => t.type === form.watch("targetType"))
                                      .map((target) => (
                                        <CommandItem
                                          key={target.id}
                                          value={target.id}
                                          onSelect={() => {
                                            field.onChange(target.id);
                                            setTargetOpen(false);
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              field.value === target.id ? "opacity-100" : "opacity-0"
                                            )}
                                          />
                                          <div className="flex-1">
                                            <div className="font-medium">{target.name}</div>
                                            {target.email && (
                                              <div className="text-xs text-muted-foreground">{target.email}</div>
                                            )}
                                            {target.memberCount && (
                                              <div className="text-xs text-muted-foreground">
                                                {target.memberCount} members
                                              </div>
                                            )}
                                          </div>
                                        </CommandItem>
                                      ))}
                                  </ScrollArea>
                                </CommandGroup>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Amount */}
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

                    {/* Reason */}
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

                    {/* Expiry Date */}
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
                        onClick={() => setIsCreateOpen(false)}
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
                            Issuing...
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
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Issued This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">
                  {formatCurrency(balance?.thisMonthIssued || 0)}
                </div>
                <DollarSign className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {balance?.activeCredits || 0} active credits
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Available
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">
                  {formatCurrency(balance?.totalAvailable || 0)}
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Ready to use
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Used This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">
                  {formatCurrency(balance?.thisMonthUsed || 0)}
                </div>
                <TrendingDown className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {balance?.expiredCredits || 0} expired
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Per User
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">
                  {formatCurrency(balance?.averagePerUser || 0)}
                </div>
                <Users className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {balance?.totalUsers || 0} total users
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
                    placeholder="Search by name, email, or reason..."
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
            <CardTitle>User & Household Credits</CardTitle>
            <CardDescription>
              {filteredCredits.length} {filteredCredits.length === 1 ? "credit" : "credits"} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User/Household</TableHead>
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
                  {filteredCredits.length === 0 ? (
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
                            {credit.householdId ? (
                              <Home className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <User className="w-4 h-4 text-muted-foreground" />
                            )}
                            <div>
                              <div>{credit.userName || credit.householdName}</div>
                              {credit.userEmail && (
                                <div className="text-xs text-muted-foreground">{credit.userEmail}</div>
                              )}
                            </div>
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

        {/* Transactions Dialog */}
        <Dialog open={transactionsDialogOpen} onOpenChange={setTransactionsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Transaction History</DialogTitle>
              <DialogDescription>
                {selectedCredit && (
                  <>
                    {selectedCredit.userName || selectedCredit.householdName} - 
                    Credit #{selectedCredit.id.slice(0, 8)}
                  </>
                )}
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
                        {transaction.sessionName && (
                          <p className="text-xs text-muted-foreground">
                            Session: {transaction.sessionName}
                          </p>
                        )}
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
    </AdminLayout>
  );
}
