import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import AdminLayout from "@/components/admin-layout";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  DollarSign,
  Link2,
  Link2Off,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Clock,
  Settings2,
  ArrowRightLeft,
  Building2,
  Calendar,
  TestTube,
  History,
  Lock,
  Crown,
} from "lucide-react";
import { useHasFeature, UpgradePrompt } from "@/hooks/use-feature-flags";
import { FEATURE_KEYS } from "@shared/feature-flags";
import { Link } from "wouter";

interface QuickBooksConnection {
  isConnected: boolean;
  companyName?: string;
  companyId?: string;
  connectedAt?: string;
  lastSyncAt?: string;
  lastSyncStatus?: 'success' | 'failure' | 'pending';
}

interface QuickBooksAccount {
  id: string;
  name: string;
  accountType: string;
  classification: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
}

interface AccountMapping {
  transactionType: string;
  accountId: string | null;
  accountName?: string;
}

interface SyncPreferences {
  syncCustomers: boolean;
  syncInvoices: boolean;
  syncPayments: boolean;
  syncRefunds: boolean;
  syncFrequency: 'realtime' | 'daily' | 'weekly';
  autoSyncEnabled: boolean;
}

interface SyncLog {
  id: string;
  startedAt: string;
  completedAt?: string;
  status: 'success' | 'failure' | 'in_progress';
  recordsSynced: number;
  errorMessage?: string;
  syncType: 'manual' | 'scheduled';
}

const TRANSACTION_TYPES = [
  { key: 'session_payment', label: 'Session Payments', category: 'Income' },
  { key: 'subscription_payment', label: 'Subscription Payments', category: 'Income' },
  { key: 'refund', label: 'Refunds', category: 'Income' },
  { key: 'credit_issued', label: 'Credits Issued', category: 'Liability' },
  { key: 'credit_redeemed', label: 'Credits Redeemed', category: 'Liability' },
  { key: 'processing_fee', label: 'Processing Fees', category: 'Expense' },
];

export default function QuickBooksIntegration() {
  const { toast } = useToast();
  const [mappingsChanged, setMappingsChanged] = useState(false);
  const [preferencesChanged, setPreferencesChanged] = useState(false);
  const [localMappings, setLocalMappings] = useState<Record<string, string>>({});
  const [localPreferences, setLocalPreferences] = useState<SyncPreferences | null>(null);

  const { hasFeature: hasQuickBooks, isLoading: featureLoading } = useHasFeature(FEATURE_KEYS.INTEGRATIONS_QUICKBOOKS);

  const { data: connection, isLoading: connectionLoading } = useQuery<QuickBooksConnection>({
    queryKey: ["/api/admin/integrations/quickbooks/connection"],
    enabled: hasQuickBooks,
  });

  const { data: accounts = [], isLoading: accountsLoading } = useQuery<{ accounts: QuickBooksAccount[] }, Error, QuickBooksAccount[]>({
    queryKey: ["/api/admin/integrations/quickbooks/accounts"],
    enabled: hasQuickBooks && connection?.isConnected,
    select: (data) => data.accounts || [],
  });

  const { data: mappings = [], isLoading: mappingsLoading } = useQuery<{ mappings: AccountMapping[] }, Error, AccountMapping[]>({
    queryKey: ["/api/admin/integrations/quickbooks/mappings"],
    enabled: hasQuickBooks && connection?.isConnected,
    select: (data) => data.mappings || [],
  });

  const { data: preferences, isLoading: preferencesLoading } = useQuery<{ preferences: SyncPreferences }, Error, SyncPreferences>({
    queryKey: ["/api/admin/integrations/quickbooks/preferences"],
    enabled: hasQuickBooks && connection?.isConnected,
    select: (data) => data.preferences,
  });

  const { data: syncLogs = [], isLoading: syncLogsLoading } = useQuery<{ logs: SyncLog[] }, Error, SyncLog[]>({
    queryKey: ["/api/admin/integrations/quickbooks/sync-logs"],
    enabled: hasQuickBooks && connection?.isConnected,
    select: (data) => data.logs || [],
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/admin/integrations/quickbooks/auth-url");
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      if (data.authUrl) {
        window.open(data.authUrl, 'quickbooks_auth', 'width=600,height=700');
        toast({
          title: "QuickBooks Authorization",
          description: "Please complete the authorization in the popup window.",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Connection failed",
        description: error.message || "Failed to initiate QuickBooks connection",
        variant: "destructive",
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/integrations/quickbooks/disconnect");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/integrations/quickbooks/connection"] });
      toast({
        title: "Disconnected",
        description: "QuickBooks has been disconnected successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Disconnect failed",
        description: error.message || "Failed to disconnect QuickBooks",
        variant: "destructive",
      });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/integrations/quickbooks/test");
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Connection Successful",
          description: "QuickBooks connection is working correctly.",
        });
      } else {
        toast({
          title: "Connection Test Failed",
          description: data.error || "Unable to connect to QuickBooks",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Test failed",
        description: error.message || "Failed to test QuickBooks connection",
        variant: "destructive",
      });
    },
  });

  const saveMappingsMutation = useMutation({
    mutationFn: async (newMappings: Record<string, string>) => {
      await apiRequest("POST", "/api/admin/integrations/quickbooks/mappings", { mappings: newMappings });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/integrations/quickbooks/mappings"] });
      setMappingsChanged(false);
      toast({
        title: "Mappings saved",
        description: "Account mappings have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Save failed",
        description: error.message || "Failed to save account mappings",
        variant: "destructive",
      });
    },
  });

  const savePreferencesMutation = useMutation({
    mutationFn: async (newPreferences: SyncPreferences) => {
      await apiRequest("PUT", "/api/admin/integrations/quickbooks/preferences", newPreferences);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/integrations/quickbooks/preferences"] });
      setPreferencesChanged(false);
      toast({
        title: "Preferences saved",
        description: "Sync preferences have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Save failed",
        description: error.message || "Failed to save sync preferences",
        variant: "destructive",
      });
    },
  });

  const syncNowMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/integrations/quickbooks/sync");
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/integrations/quickbooks/sync-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/integrations/quickbooks/connection"] });
      toast({
        title: "Sync started",
        description: data.message || "Data sync has been initiated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Sync failed",
        description: error.message || "Failed to start sync",
        variant: "destructive",
      });
    },
  });

  const handleMappingChange = (transactionType: string, accountId: string) => {
    setLocalMappings(prev => ({ ...prev, [transactionType]: accountId }));
    setMappingsChanged(true);
  };

  const handlePreferenceChange = (key: keyof SyncPreferences, value: any) => {
    setLocalPreferences(prev => {
      const base = prev || preferences || {
        syncCustomers: true,
        syncInvoices: true,
        syncPayments: true,
        syncRefunds: true,
        syncFrequency: 'daily' as const,
        autoSyncEnabled: false,
      };
      return { ...base, [key]: value };
    });
    setPreferencesChanged(true);
  };

  const getCurrentMapping = (transactionType: string) => {
    if (localMappings[transactionType]) {
      return localMappings[transactionType];
    }
    const existing = mappings.find(m => m.transactionType === transactionType);
    return existing?.accountId || '';
  };

  const getCurrentPreferences = (): SyncPreferences => {
    return localPreferences || preferences || {
      syncCustomers: true,
      syncInvoices: true,
      syncPayments: true,
      syncRefunds: true,
      syncFrequency: 'daily',
      autoSyncEnabled: false,
    };
  };

  const getFilteredAccounts = (category: string) => {
    return accounts.filter(account => {
      if (category === 'Income') return account.classification === 'Revenue';
      if (category === 'Liability') return account.classification === 'Liability';
      if (category === 'Expense') return account.classification === 'Expense';
      return true;
    });
  };

  const getSyncStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-900 text-green-100" data-testid={`badge-sync-${status}`}>Success</Badge>;
      case 'failure':
        return <Badge className="bg-red-900 text-red-100" data-testid={`badge-sync-${status}`}>Failed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-900 text-blue-100" data-testid={`badge-sync-${status}`}>In Progress</Badge>;
      default:
        return <Badge variant="secondary" data-testid={`badge-sync-${status}`}>{status}</Badge>;
    }
  };

  if (featureLoading) {
    return (
      <AdminLayout>
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!hasQuickBooks) {
    return (
      <AdminLayout>
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-semibold text-foreground" data-testid="text-page-title">QuickBooks Integration</h1>
            </div>
          </div>

          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-12 space-y-6 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center">
                  <Crown className="w-10 h-10 text-amber-500" />
                </div>
                <div className="space-y-2 max-w-md">
                  <h2 className="text-xl font-semibold text-foreground">Elite Plan Required</h2>
                  <p className="text-muted-foreground">
                    QuickBooks integration is available exclusively on the Elite plan. Upgrade to unlock seamless accounting integration, automated transaction syncing, and comprehensive financial reporting.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/admin/settings?tab=plans-features">
                    <Button data-testid="button-upgrade-plan">
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade to Elite
                    </Button>
                  </Link>
                  <Link href="/admin/settings">
                    <Button variant="outline" data-testid="button-view-plans">
                      View All Plans
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <Lock className="w-5 h-5 mr-2" />
                QuickBooks Features Included with Elite
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <ArrowRightLeft className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium text-foreground">Automatic Transaction Sync</h3>
                    <p className="text-sm text-muted-foreground">Sync payments, refunds, and credits automatically</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <Building2 className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium text-foreground">Account Mapping</h3>
                    <p className="text-sm text-muted-foreground">Map transactions to your QuickBooks chart of accounts</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <Calendar className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium text-foreground">Scheduled Syncing</h3>
                    <p className="text-sm text-muted-foreground">Real-time, daily, or weekly sync options</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <History className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-medium text-foreground">Sync History & Logs</h3>
                    <p className="text-sm text-muted-foreground">Complete audit trail of all synced transactions</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  const isLoading = connectionLoading;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-64" />
          </div>
          <div className="grid gap-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-64" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  const isConnected = connection?.isConnected ?? false;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-semibold text-foreground" data-testid="text-page-title">QuickBooks Integration</h1>
              <p className="text-sm text-muted-foreground">Sync your financial data with QuickBooks Online</p>
            </div>
          </div>
          {isConnected && (
            <Badge variant="outline" className="bg-green-900/50 text-green-200 border-green-700" data-testid="badge-connection-status">
              <CheckCircle className="w-3 h-3 mr-1" />
              Connected
            </Badge>
          )}
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center">
              <Link2 className="w-5 h-5 mr-2" />
              Connection Status
            </CardTitle>
            <CardDescription>
              Connect your QuickBooks Online account to sync financial data
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isConnected ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Building2 className="w-4 h-4" />
                      Company
                    </div>
                    <div className="font-semibold text-foreground" data-testid="text-company-name">
                      {connection?.companyName || 'Unknown Company'}
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Calendar className="w-4 h-4" />
                      Connected On
                    </div>
                    <div className="font-semibold text-foreground" data-testid="text-connected-date">
                      {connection?.connectedAt 
                        ? format(new Date(connection.connectedAt), 'MMM d, yyyy')
                        : 'Unknown'
                      }
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Clock className="w-4 h-4" />
                      Last Sync
                    </div>
                    <div className="font-semibold text-foreground flex items-center gap-2" data-testid="text-last-sync">
                      {connection?.lastSyncAt 
                        ? format(new Date(connection.lastSyncAt), 'MMM d, yyyy h:mm a')
                        : 'Never'
                      }
                      {connection?.lastSyncStatus === 'success' && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                      {connection?.lastSyncStatus === 'failure' && (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={() => testConnectionMutation.mutate()}
                    disabled={testConnectionMutation.isPending}
                    data-testid="button-test-connection"
                  >
                    {testConnectionMutation.isPending ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <TestTube className="w-4 h-4 mr-2" />
                    )}
                    Test Connection
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" data-testid="button-disconnect">
                        <Link2Off className="w-4 h-4 mr-2" />
                        Disconnect
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Disconnect QuickBooks?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will disconnect your QuickBooks account. No data will be deleted, but syncing will stop until you reconnect.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => disconnectMutation.mutate()}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Disconnect
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <DollarSign className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">Not Connected</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Connect your QuickBooks Online account to automatically sync transactions, payments, and customer data.
                  </p>
                </div>
                <Button
                  onClick={() => connectMutation.mutate()}
                  disabled={connectMutation.isPending}
                  data-testid="button-connect-quickbooks"
                >
                  {connectMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Link2 className="w-4 h-4 mr-2" />
                  )}
                  Connect QuickBooks
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {isConnected && (
          <>
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center">
                  <Settings2 className="w-5 h-5 mr-2" />
                  Account Mapping
                </CardTitle>
                <CardDescription>
                  Map your transaction types to the appropriate QuickBooks accounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {accountsLoading || mappingsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <Skeleton key={i} className="h-12" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border">
                          <TableHead className="text-muted-foreground">Transaction Type</TableHead>
                          <TableHead className="text-muted-foreground">Category</TableHead>
                          <TableHead className="text-muted-foreground">QuickBooks Account</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {TRANSACTION_TYPES.map((txType) => (
                          <TableRow key={txType.key} className="border-border">
                            <TableCell className="font-medium text-foreground">
                              {txType.label}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" data-testid={`badge-category-${txType.key}`}>
                                {txType.category}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={getCurrentMapping(txType.key)}
                                onValueChange={(value) => handleMappingChange(txType.key, value)}
                              >
                                <SelectTrigger 
                                  className="w-[280px]"
                                  data-testid={`select-account-${txType.key}`}
                                >
                                  <SelectValue placeholder="Select account..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {getFilteredAccounts(txType.category).map((account) => (
                                    <SelectItem key={account.id} value={account.id}>
                                      {account.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <div className="flex justify-end">
                      <Button
                        onClick={() => {
                          const allMappings = TRANSACTION_TYPES.reduce((acc, txType) => {
                            acc[txType.key] = getCurrentMapping(txType.key);
                            return acc;
                          }, {} as Record<string, string>);
                          saveMappingsMutation.mutate(allMappings);
                        }}
                        disabled={!mappingsChanged || saveMappingsMutation.isPending}
                        data-testid="button-save-mappings"
                      >
                        {saveMappingsMutation.isPending ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        Save Mappings
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center">
                  <ArrowRightLeft className="w-5 h-5 mr-2" />
                  Sync Preferences
                </CardTitle>
                <CardDescription>
                  Configure what data to sync and how often
                </CardDescription>
              </CardHeader>
              <CardContent>
                {preferencesLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Skeleton key={i} className="h-10" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="font-medium text-foreground">Data Types to Sync</h3>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="sync-customers" className="text-foreground">
                            Sync Customers (Parents/Households)
                          </Label>
                          <Switch
                            id="sync-customers"
                            checked={getCurrentPreferences().syncCustomers}
                            onCheckedChange={(checked) => handlePreferenceChange('syncCustomers', checked)}
                            data-testid="switch-sync-customers"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="sync-invoices" className="text-foreground">
                            Sync Invoices
                          </Label>
                          <Switch
                            id="sync-invoices"
                            checked={getCurrentPreferences().syncInvoices}
                            onCheckedChange={(checked) => handlePreferenceChange('syncInvoices', checked)}
                            data-testid="switch-sync-invoices"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="sync-payments" className="text-foreground">
                            Sync Payments
                          </Label>
                          <Switch
                            id="sync-payments"
                            checked={getCurrentPreferences().syncPayments}
                            onCheckedChange={(checked) => handlePreferenceChange('syncPayments', checked)}
                            data-testid="switch-sync-payments"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="sync-refunds" className="text-foreground">
                            Sync Refunds
                          </Label>
                          <Switch
                            id="sync-refunds"
                            checked={getCurrentPreferences().syncRefunds}
                            onCheckedChange={(checked) => handlePreferenceChange('syncRefunds', checked)}
                            data-testid="switch-sync-refunds"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="font-medium text-foreground">Sync Schedule</h3>
                        
                        <div className="space-y-2">
                          <Label htmlFor="sync-frequency" className="text-foreground">
                            Sync Frequency
                          </Label>
                          <Select
                            value={getCurrentPreferences().syncFrequency}
                            onValueChange={(value) => handlePreferenceChange('syncFrequency', value)}
                          >
                            <SelectTrigger id="sync-frequency" data-testid="select-sync-frequency">
                              <SelectValue placeholder="Select frequency..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="realtime">Real-time</SelectItem>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <div>
                            <Label htmlFor="auto-sync" className="text-foreground">
                              Auto-sync Enabled
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              Automatically sync data based on schedule
                            </p>
                          </div>
                          <Switch
                            id="auto-sync"
                            checked={getCurrentPreferences().autoSyncEnabled}
                            onCheckedChange={(checked) => handlePreferenceChange('autoSyncEnabled', checked)}
                            data-testid="switch-auto-sync"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={() => savePreferencesMutation.mutate(getCurrentPreferences())}
                        disabled={!preferencesChanged || savePreferencesMutation.isPending}
                        data-testid="button-save-preferences"
                      >
                        {savePreferencesMutation.isPending ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        Save Preferences
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="text-foreground flex items-center">
                    <History className="w-5 h-5 mr-2" />
                    Sync Operations
                  </CardTitle>
                  <CardDescription>
                    Trigger manual syncs and view sync history
                  </CardDescription>
                </div>
                <Button
                  onClick={() => syncNowMutation.mutate()}
                  disabled={syncNowMutation.isPending}
                  data-testid="button-sync-now"
                >
                  {syncNowMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Sync Now
                </Button>
              </CardHeader>
              <CardContent>
                {syncLogsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-16" />
                    ))}
                  </div>
                ) : syncLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <History className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="font-medium text-foreground">No Sync History</h3>
                    <p className="text-sm text-muted-foreground">
                      Sync history will appear here after your first sync
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead className="text-muted-foreground">Date</TableHead>
                        <TableHead className="text-muted-foreground">Type</TableHead>
                        <TableHead className="text-muted-foreground">Status</TableHead>
                        <TableHead className="text-muted-foreground">Records</TableHead>
                        <TableHead className="text-muted-foreground">Duration</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {syncLogs.slice(0, 10).map((log) => (
                        <TableRow key={log.id} className="border-border">
                          <TableCell className="text-foreground">
                            {format(new Date(log.startedAt), 'MMM d, yyyy h:mm a')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" data-testid={`badge-sync-type-${log.id}`}>
                              {log.syncType === 'manual' ? 'Manual' : 'Scheduled'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getSyncStatusBadge(log.status)}
                          </TableCell>
                          <TableCell className="text-foreground tabular-nums">
                            {log.recordsSynced.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {log.completedAt && log.startedAt
                              ? `${Math.round((new Date(log.completedAt).getTime() - new Date(log.startedAt).getTime()) / 1000)}s`
                              : log.status === 'in_progress' ? 'In progress...' : '-'
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {syncLogs.length > 10 && (
                  <div className="flex justify-center pt-4">
                    <Button variant="outline" size="sm" data-testid="button-view-all-logs">
                      View All Sync History
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
