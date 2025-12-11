import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import TenantProfileDrawer from '@/components/super-admin/TenantProfileDrawer';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  UserCheck, 
  Settings,
  Users,
  BarChart3,
  ExternalLink,
  Power,
  PowerOff,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  CreditCard,
  Mail,
  Calendar,
  Percent,
  Loader2
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  status: 'active' | 'suspended' | 'trial' | 'pending' | 'inactive' | 'rejected';
  billingStatus?: 'trial' | 'active' | 'pending_approval' | 'suspended' | 'rejected';
  plan: 'free' | 'core' | 'growth' | 'elite';
  planLevel?: string;
  trialStartedAt?: string;
  trialEndsAt?: string;
  trialPlan?: string;
  userCount: number;
  playerCount: number;
  sessionCount: number;
  revenue: number;
  lastActive: string;
  createdAt: string;
  adminEmail?: string;
  contactEmail?: string;
  contactName?: string;
  city?: string;
  state?: string;
  country?: string;
  hasPaymentMethod?: boolean;
}

interface TenantDetails {
  id: string;
  name: string;
  subdomain: string;
  status: string;
  plan: string;
  settings: Record<string, any>;
  users: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    isAdmin: boolean;
    lastLogin: string;
    status: string;
  }>;
  stats: {
    totalUsers: number;
    activePlayers: number;
    sessionsThisMonth: number;
    revenueThisMonth: number;
  };
}

interface TenantAgePolicy {
  audienceMode: 'youth_only' | 'mixed' | 'adult_only';
  parentRequiredBelow: number;
  teenSelfAccessAt: number;
  adultAge: number;
  allowTeenPayments: boolean;
}

export default function SuperAdminTenants() {
  const [location] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [profileDrawerTenant, setProfileDrawerTenant] = useState<{ id: string; name: string } | null>(null);
  const [impersonationDialog, setImpersonationDialog] = useState<{ tenant: Tenant | null; open: boolean }>({ tenant: null, open: false });
  const [impersonationReason, setImpersonationReason] = useState('');
  const [discountDialog, setDiscountDialog] = useState<{ tenant: Tenant | null; open: boolean }>({ tenant: null, open: false });
  const [newTenant, setNewTenant] = useState({
    name: '',
    subdomain: '',
    adminEmail: '',
    plan: 'starter'
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check for URL parameters on component mount and set search term
  useEffect(() => {
    const urlParams = new URLSearchParams(location.split('?')[1] || '');
    const searchParam = urlParams.get('search');
    if (searchParam) {
      setSearchTerm(decodeURIComponent(searchParam));
    }
  }, [location]);

  // Fetch tenants list
  const { data: tenants = [], isLoading, error } = useQuery<Tenant[]>({
    queryKey: ['/api/super-admin/tenants'],
    queryFn: async () => {
      const response = await fetch('/api/super-admin/tenants');
      if (!response.ok) throw new Error('Failed to fetch tenants');
      return response.json();
    }
  });

  // Fetch selected tenant details
  const { data: tenantDetails, isLoading: detailsLoading } = useQuery<TenantDetails>({
    queryKey: ['/api/super-admin/tenants', selectedTenant],
    queryFn: async () => {
      const response = await fetch(`/api/super-admin/tenants/${selectedTenant}/details`);
      if (!response.ok) throw new Error('Failed to fetch tenant details');
      return response.json();
    },
    enabled: !!selectedTenant
  });

  // Fetch tenant age policy
  const { data: tenantAgePolicy, isLoading: agePolicyLoading } = useQuery<TenantAgePolicy>({
    queryKey: ['/api/super-admin/tenants', selectedTenant, 'age-policy'],
    queryFn: async () => {
      const response = await fetch(`/api/super-admin/tenants/${selectedTenant}/age-policy`);
      if (!response.ok) throw new Error('Failed to fetch age policy');
      return response.json();
    },
    enabled: !!selectedTenant
  });

  // Update tenant age policy mutation
  const updateAgePolicyMutation = useMutation({
    mutationFn: async ({ tenantId, audienceMode }: { tenantId: string; audienceMode: string }) => {
      const response = await fetch(`/api/super-admin/tenants/${tenantId}/age-policy`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audienceMode })
      });
      if (!response.ok) throw new Error('Failed to update age policy');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/tenants', selectedTenant, 'age-policy'] });
      toast({ title: 'Age policy updated successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to update age policy', description: error.message, variant: 'destructive' });
    }
  });

  // Create tenant mutation
  const createTenantMutation = useMutation({
    mutationFn: async (tenantData: typeof newTenant) => {
      const response = await fetch('/api/super-admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tenantData)
      });
      if (!response.ok) throw new Error('Failed to create tenant');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/tenants'] });
      setShowCreateDialog(false);
      setNewTenant({ name: '', subdomain: '', adminEmail: '', plan: 'starter' });
      toast({ title: 'Tenant created successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to create tenant', description: error.message, variant: 'destructive' });
    }
  });

  // Toggle tenant status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ tenantId, status }: { tenantId: string; status: string }) => {
      const response = await fetch(`/api/super-admin/tenants/${tenantId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Failed to update tenant status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/tenants'] });
      toast({ title: 'Tenant status updated successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to update tenant status', description: error.message, variant: 'destructive' });
    }
  });

  // Fetch discount status for the selected tenant in discount dialog
  const { data: discountStatus, isLoading: discountLoading, refetch: refetchDiscount } = useQuery<{
    hasActiveDiscount: boolean;
    discountType?: string;
    discountValue?: number;
    discountDuration?: string;
    appliedAt?: string;
    expiresAt?: string;
    appliedBy?: string;
    cyclesRemaining?: number;
  }>({
    queryKey: ['/api/super-admin/tenants', discountDialog.tenant?.id, 'discount-status'],
    queryFn: async () => {
      const response = await fetch(`/api/super-admin/tenants/${discountDialog.tenant?.id}/discount-status`);
      if (!response.ok) throw new Error('Failed to fetch discount status');
      return response.json();
    },
    enabled: !!discountDialog.tenant?.id && discountDialog.open
  });

  // Remove discount mutation
  const removeDiscountMutation = useMutation({
    mutationFn: async (tenantId: string) => {
      const response = await fetch(`/api/super-admin/tenants/${tenantId}/discount`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove discount');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/tenants', discountDialog.tenant?.id, 'discount-status'] });
      toast({ title: 'Discount removed successfully' });
      setDiscountDialog({ tenant: null, open: false });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to remove discount', description: error.message, variant: 'destructive' });
    }
  });

  // Filter tenants based on search and filters
  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.subdomain.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
    const matchesPlan = planFilter === 'all' || tenant.plan === planFilter;
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const handleCreateTenant = () => {
    if (!newTenant.name || !newTenant.subdomain || !newTenant.adminEmail) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }
    createTenantMutation.mutate(newTenant);
  };

  const handleToggleStatus = (tenantId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    toggleStatusMutation.mutate({ tenantId, status: newStatus });
  };
  
  // Approve tenant mutation
  const approveTenantMutation = useMutation({
    mutationFn: async (tenantId: string) => {
      const response = await fetch(`/api/super-admin/tenants/${tenantId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to approve tenant');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/tenants'] });
      toast({ 
        title: 'Tenant approved successfully', 
        description: 'Welcome email has been sent to the admin.' 
      });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to approve tenant', description: error.message, variant: 'destructive' });
    }
  });
  
  // Reject tenant mutation
  const rejectTenantMutation = useMutation({
    mutationFn: async ({ tenantId, reason }: { tenantId: string; reason?: string }) => {
      const response = await fetch(`/api/super-admin/tenants/${tenantId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      if (!response.ok) throw new Error('Failed to reject tenant');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/tenants'] });
      toast({ title: 'Tenant rejected', description: 'Rejection notification has been sent.' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to reject tenant', description: error.message, variant: 'destructive' });
    }
  });
  
  // Resend welcome email mutation
  const resendWelcomeEmailMutation = useMutation({
    mutationFn: async (tenantId: string) => {
      const response = await fetch(`/api/super-admin/tenants/${tenantId}/resend-welcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to resend welcome email');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Welcome email sent', description: 'The welcome email has been resent successfully.' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to resend email', description: error.message, variant: 'destructive' });
    }
  });
  
  const handleApproveTenant = (tenantId: string) => {
    if (confirm('Are you sure you want to approve this tenant? This will activate their account and start their trial.')) {
      approveTenantMutation.mutate(tenantId);
    }
  };
  
  const handleRejectTenant = (tenantId: string) => {
    const reason = prompt('Please provide a reason for rejection (optional):');
    if (reason !== null) { // User didn't cancel
      rejectTenantMutation.mutate({ tenantId, reason: reason || undefined });
    }
  };
  
  const handleResendWelcomeEmail = (tenantId: string) => {
    resendWelcomeEmailMutation.mutate(tenantId);
  };

  // Impersonation mutation
  const impersonateMutation = useMutation({
    mutationFn: async ({ tenantId, reason }: { tenantId: string; reason: string }) => {
      const response = await fetch('/api/super-admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, reason })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start impersonation');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: 'Impersonation session started', 
        description: 'Opening tenant admin portal in new tab...' 
      });
      // Open the impersonation URL in a new tab
      window.open(data.url, '_blank');
      setImpersonationDialog({ tenant: null, open: false });
      setImpersonationReason('');
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to start impersonation', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  });

  const handleImpersonateLogin = (tenant: Tenant) => {
    setImpersonationDialog({ tenant, open: true });
  };

  const handleStartImpersonation = () => {
    if (!impersonationDialog.tenant || !impersonationReason.trim()) {
      toast({ 
        title: 'Reason required', 
        description: 'Please provide a reason for impersonation.', 
        variant: 'destructive' 
      });
      return;
    }
    impersonateMutation.mutate({ 
      tenantId: impersonationDialog.tenant.id, 
      reason: impersonationReason.trim() 
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Tenant Management</h1>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Tenant Management</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">Failed to load tenants. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate stats for KPI cards
  const totalTenants = tenants.length;
  const activeTenants = tenants.filter(t => t.status === 'active').length;
  const trialTenants = tenants.filter(t => t.status === 'trial').length;
  const pendingTenants = tenants.filter(t => t.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tenant Management</h1>
          <p className="text-muted-foreground">Manage all organizations on the platform</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-tenant">
              <Plus className="w-4 h-4 mr-2" />
              Add Tenant
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Tenant</DialogTitle>
              <DialogDescription>
                Add a new organization to the platform
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Organization Name *</Label>
                <Input
                  id="name"
                  value={newTenant.name}
                  onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                  placeholder="Elite Soccer Academy"
                  data-testid="input-tenant-name"
                />
              </div>
              <div>
                <Label htmlFor="subdomain">Subdomain *</Label>
                <Input
                  id="subdomain"
                  value={newTenant.subdomain}
                  onChange={(e) => setNewTenant({ ...newTenant, subdomain: e.target.value.toLowerCase() })}
                  placeholder="elite-soccer"
                  data-testid="input-tenant-subdomain"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Will be accessible at: {newTenant.subdomain || 'subdomain'}.playhq.app
                </p>
              </div>
              <div>
                <Label htmlFor="adminEmail">Admin Email *</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={newTenant.adminEmail}
                  onChange={(e) => setNewTenant({ ...newTenant, adminEmail: e.target.value })}
                  placeholder="admin@elitesoccer.com"
                  data-testid="input-tenant-email"
                />
              </div>
              <div>
                <Label htmlFor="plan">Plan</Label>
                <Select value={newTenant.plan} onValueChange={(value) => setNewTenant({ ...newTenant, plan: value })}>
                  <SelectTrigger data-testid="select-tenant-plan">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free - $0/month</SelectItem>
                    <SelectItem value="core">Core - $79/month</SelectItem>
                    <SelectItem value="growth">Growth - $149/month</SelectItem>
                    <SelectItem value="elite">Elite - $299/month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateDialog(false)}
                  data-testid="button-cancel-tenant"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateTenant} 
                  disabled={createTenantMutation.isPending}
                  data-testid="button-create-tenant"
                >
                  {createTenantMutation.isPending ? 'Creating...' : 'Create Tenant'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTenants}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All organizations
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTenants}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Fully operational
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trial</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trialTenants}</div>
            <p className="text-xs text-muted-foreground mt-1">
              In trial period
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTenants}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting approval
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tenants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-tenants"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40" data-testid="select-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending Approval</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-40" data-testid="select-plan-filter">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="core">Core</SelectItem>
                <SelectItem value="growth">Growth</SelectItem>
                <SelectItem value="elite">Elite</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tenants List */}
      <Card>
        <CardHeader>
          <CardTitle>Organizations ({filteredTenants.length})</CardTitle>
          <CardDescription>
            {tenants.length} total tenants, {tenants.filter(t => t.status === 'active').length} active
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-13 gap-4 p-4 font-medium border-b bg-muted/50">
              <div className="col-span-3">Organization</div>
              <div className="col-span-2">Tenant ID</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1">Users</div>
              <div className="col-span-1">Players</div>
              <div className="col-span-2">Revenue</div>
              <div className="col-span-1">Last Active</div>
              <div className="col-span-1">Actions</div>
            </div>
            {filteredTenants.map((tenant) => (
              <div key={tenant.id} className="grid grid-cols-13 gap-4 p-4 border-b last:border-b-0 hover:bg-muted/25">
                <div className="col-span-3">
                  <div className="font-medium">{tenant.name}</div>
                  <div className="text-sm text-muted-foreground">{tenant.subdomain}.playhq.app</div>
                </div>
                <div className="col-span-2">
                  <div className="font-mono text-sm text-muted-foreground">{tenant.id}</div>
                </div>
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <Badge 
                      className={
                        tenant.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                        tenant.status === 'pending' ? 'bg-orange-100 text-orange-700 hover:bg-orange-100' :
                        tenant.status === 'trial' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100' :
                        tenant.status === 'suspended' || tenant.status === 'rejected' ? 'bg-red-100 text-red-700 hover:bg-red-100' :
                        'bg-red-100 text-red-700 hover:bg-red-100'
                      }
                      data-testid={`badge-status-${tenant.id}`}
                    >
                      {tenant.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                      {tenant.status === 'trial' && <Calendar className="w-3 h-3 mr-1" />}
                      {tenant.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                      {tenant.status}
                    </Badge>
                    {!tenant.hasPaymentMethod && tenant.status === 'active' && (
                      <CreditCard className="w-3 h-3 text-orange-500" title="No payment method" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    <Badge 
                      className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-xs"
                      data-testid={`badge-plan-${tenant.id}`}
                    >
                      {tenant.planLevel || tenant.plan}
                    </Badge>
                    {tenant.trialEndsAt && (
                      <>
                        {' • '}
                        <span className={
                          new Date(tenant.trialEndsAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
                            ? 'text-orange-600 font-semibold' 
                            : ''
                        }>
                          Trial ends {new Date(tenant.trialEndsAt).toLocaleDateString()}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="col-span-1">
                  <div className="font-medium">{tenant.userCount}</div>
                </div>
                <div className="col-span-1">
                  <div className="font-medium">{tenant.playerCount}</div>
                </div>
                <div className="col-span-2">
                  <div className="font-medium">${(tenant.revenue / 100).toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">{tenant.sessionCount} sessions</div>
                </div>
                <div className="col-span-1">
                  <div className="text-sm">{new Date(tenant.lastActive).toLocaleDateString()}</div>
                </div>
                <div className="col-span-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        data-testid={`button-actions-${tenant.id}`}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {tenant.status === 'pending' && (
                        <>
                          <DropdownMenuItem 
                            onClick={() => handleApproveTenant(tenant.id)} 
                            className="text-green-600"
                            data-testid={`menu-approve-${tenant.id}`}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve Tenant
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleRejectTenant(tenant.id)} 
                            className="text-red-600"
                            data-testid={`menu-reject-${tenant.id}`}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject Tenant
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem 
                        onClick={() => setSelectedTenant(tenant.id)}
                        data-testid={`menu-view-details-${tenant.id}`}
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setProfileDrawerTenant({ id: tenant.id, name: tenant.name })}
                        data-testid={`menu-health-profile-${tenant.id}`}
                      >
                        <UserCheck className="w-4 h-4 mr-2" />
                        Health Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleImpersonateLogin(tenant)}
                        data-testid={`menu-impersonate-${tenant.id}`}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Impersonate Admin
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleResendWelcomeEmail(tenant.id)}
                        data-testid={`menu-resend-welcome-${tenant.id}`}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Resend Welcome Email
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setDiscountDialog({ tenant, open: true })}
                        data-testid={`menu-manage-discount-${tenant.id}`}
                      >
                        <Percent className="w-4 h-4 mr-2" />
                        Manage Discount
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleToggleStatus(tenant.id, tenant.status)}
                        data-testid={`menu-toggle-status-${tenant.id}`}
                      >
                        {tenant.status === 'active' ? (
                          <><PowerOff className="w-4 h-4 mr-2" />Suspend</>
                        ) : (
                          <><Power className="w-4 h-4 mr-2" />Activate</>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem data-testid={`menu-edit-${tenant.id}`}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive"
                        data-testid={`menu-delete-${tenant.id}`}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Impersonation Dialog */}
      <Dialog open={impersonationDialog.open} onOpenChange={(open) => {
        setImpersonationDialog({ tenant: null, open });
        setImpersonationReason('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Impersonate Tenant Admin
            </DialogTitle>
            <DialogDescription>
              You are about to impersonate an admin user for <strong>{impersonationDialog.tenant?.name}</strong>. 
              This action will be logged and audited for security purposes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-orange-800 mb-1">Security Notice</p>
                  <ul className="text-orange-700 space-y-1">
                    <li>• This session will expire in 5 minutes</li>
                    <li>• All actions will be logged and attributed to you</li>
                    <li>• Only use for legitimate support purposes</li>
                    <li>• Session can be revoked at any time</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="reason">Reason for Impersonation *</Label>
              <Textarea
                id="reason"
                value={impersonationReason}
                onChange={(e) => setImpersonationReason(e.target.value)}
                placeholder="e.g., Troubleshooting payment issue reported by customer"
                className="mt-1"
                rows={3}
                data-testid="textarea-impersonation-reason"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Provide a clear business justification for this impersonation session.
              </p>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setImpersonationDialog({ tenant: null, open: false });
                  setImpersonationReason('');
                }}
                data-testid="button-cancel-impersonation"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleStartImpersonation}
                disabled={impersonateMutation.isPending || !impersonationReason.trim()}
                data-testid="button-start-impersonation"
              >
                {impersonateMutation.isPending ? 'Starting...' : 'Start Impersonation'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tenant Details Modal */}
      {selectedTenant && (
        <Dialog open={!!selectedTenant} onOpenChange={() => setSelectedTenant(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {tenantDetails?.name || 'Loading...'}
              </DialogTitle>
              <DialogDescription>
                Detailed view and management options
              </DialogDescription>
            </DialogHeader>
            
            {detailsLoading ? (
              <div className="space-y-4">
                <div className="h-32 bg-muted rounded animate-pulse" />
                <div className="h-64 bg-muted rounded animate-pulse" />
              </div>
            ) : tenantDetails ? (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="users">Users</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-2xl font-bold">{tenantDetails.stats.totalUsers}</div>
                        <p className="text-xs text-muted-foreground">Total Users</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-2xl font-bold">{tenantDetails.stats.activePlayers}</div>
                        <p className="text-xs text-muted-foreground">Active Players</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-2xl font-bold">{tenantDetails.stats.sessionsThisMonth}</div>
                        <p className="text-xs text-muted-foreground">Sessions This Month</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-2xl font-bold">
                          ${(tenantDetails.stats.revenueThisMonth / 100).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">Revenue This Month</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="users" className="space-y-4">
                  <div className="rounded-md border">
                    <div className="grid grid-cols-5 gap-4 p-4 font-medium border-b bg-muted/50">
                      <div>Name</div>
                      <div>Email</div>
                      <div>Role</div>
                      <div>Last Login</div>
                      <div>Status</div>
                    </div>
                    {tenantDetails.users.map((user) => (
                      <div key={user.id} className="grid grid-cols-5 gap-4 p-4 border-b last:border-b-0">
                        <div>{user.firstName} {user.lastName}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                        <div>
                          <Badge 
                            className={user.isAdmin ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' : 'bg-gray-100 text-gray-700 hover:bg-gray-100'}
                            data-testid={`badge-role-${user.id}`}
                          >
                            {user.isAdmin ? 'Admin' : 'User'}
                          </Badge>
                        </div>
                        <div className="text-sm">{new Date(user.lastLogin).toLocaleDateString()}</div>
                        <div>
                          <Badge 
                            className={user.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-red-100 text-red-700 hover:bg-red-100'}
                            data-testid={`badge-user-status-${user.id}`}
                          >
                            {user.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="settings" className="space-y-4">
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Plan</Label>
                        <Select value={tenantDetails.plan} disabled>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="starter">Starter</SelectItem>
                            <SelectItem value="pro">Pro</SelectItem>
                            <SelectItem value="enterprise">Enterprise</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Status</Label>
                        <Select value={tenantDetails.status} disabled>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                            <SelectItem value="trial">Trial</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {/* Age Policy Configuration */}
                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-3">Age Policy & Household Requirements</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Configure how this tenant handles player registration and household requirements.
                      </p>
                      
                      {agePolicyLoading ? (
                        <div className="h-20 bg-muted rounded animate-pulse" />
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <Label>Audience Mode</Label>
                            <Select 
                              value={tenantAgePolicy?.audienceMode || 'youth_only'}
                              onValueChange={(value) => {
                                if (selectedTenant) {
                                  updateAgePolicyMutation.mutate({ tenantId: selectedTenant, audienceMode: value });
                                }
                              }}
                              disabled={updateAgePolicyMutation.isPending}
                            >
                              <SelectTrigger data-testid="select-audience-mode">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="youth_only">Youth Only</SelectItem>
                                <SelectItem value="mixed">Mixed Ages</SelectItem>
                                <SelectItem value="adult_only">Adults Only</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                            <p className="text-sm font-medium">Household Requirements:</p>
                            {tenantAgePolicy?.audienceMode === 'youth_only' && (
                              <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• Household is <strong>required</strong> before creating any player</li>
                                <li>• All players must be associated with a household</li>
                                <li>• Parent/guardian consent is required for all minors</li>
                              </ul>
                            )}
                            {tenantAgePolicy?.audienceMode === 'mixed' && (
                              <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• Players 18+ can register <strong>without</strong> a household</li>
                                <li>• Players under 18 <strong>require</strong> a household</li>
                                <li>• Parent/guardian consent needed for minors</li>
                              </ul>
                            )}
                            {tenantAgePolicy?.audienceMode === 'adult_only' && (
                              <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• Household is <strong>optional</strong></li>
                                <li>• No age restrictions on player registration</li>
                                <li>• No parent/guardian consent required</li>
                              </ul>
                            )}
                            {!tenantAgePolicy?.audienceMode && (
                              <p className="text-sm text-muted-foreground">Loading policy settings...</p>
                            )}
                          </div>
                          
                          {tenantAgePolicy && (
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Adult Age:</span>
                                <span className="ml-2 font-medium">{tenantAgePolicy.adultAge}+</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Parent Required Below:</span>
                                <span className="ml-2 font-medium">{tenantAgePolicy.parentRequiredBelow}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <p>Failed to load tenant details</p>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Discount Management Dialog */}
      <Dialog open={discountDialog.open} onOpenChange={(open) => {
        if (!open) setDiscountDialog({ tenant: null, open: false });
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Manage Discount
            </DialogTitle>
            <DialogDescription>
              View and manage discount for <strong>{discountDialog.tenant?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {discountLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : discountStatus?.hasActiveDiscount ? (
              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800 dark:text-green-200">Active Discount</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <span className="ml-2 font-medium">
                        {discountStatus.discountType === 'percentage' 
                          ? `${discountStatus.discountValue}% off` 
                          : discountStatus.discountType === 'full'
                            ? '100% off (Free)'
                            : `$${discountStatus.discountValue} off`}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="ml-2 font-medium">
                        {discountStatus.discountDuration === 'indefinite' 
                          ? 'Forever' 
                          : discountStatus.discountDuration === 'one_time'
                            ? 'One-time'
                            : discountStatus.discountDuration?.replace('months_', '') + ' months'}
                      </span>
                    </div>
                    {discountStatus.appliedAt && (
                      <div>
                        <span className="text-muted-foreground">Applied:</span>
                        <span className="ml-2 font-medium">
                          {new Date(discountStatus.appliedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {discountStatus.cyclesRemaining !== undefined && discountStatus.cyclesRemaining > 0 && (
                      <div>
                        <span className="text-muted-foreground">Cycles Left:</span>
                        <span className="ml-2 font-medium">{discountStatus.cyclesRemaining}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-orange-800 dark:text-orange-200 mb-1">Remove Discount</p>
                      <p className="text-orange-700 dark:text-orange-300">
                        This will immediately end the discount. The tenant will be charged full price on their next billing cycle.
                      </p>
                    </div>
                  </div>
                </div>

                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={() => discountDialog.tenant && removeDiscountMutation.mutate(discountDialog.tenant.id)}
                  disabled={removeDiscountMutation.isPending}
                  data-testid="button-remove-discount"
                >
                  {removeDiscountMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Remove Discount
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-muted-foreground mb-4">
                  <Percent className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>No active discount</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  This tenant is paying full price. To apply a discount, create a platform discount code in the Invitations section and have the tenant use it during checkout.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setDiscountDialog({ tenant: null, open: false })}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tenant Profile Drawer */}
      <TenantProfileDrawer
        tenantId={profileDrawerTenant?.id || null}
        tenantName={profileDrawerTenant?.name}
        onClose={() => setProfileDrawerTenant(null)}
      />
    </div>
  );
}