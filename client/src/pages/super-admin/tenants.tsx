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
  AlertTriangle
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
  status: 'active' | 'suspended' | 'trial';
  plan: 'starter' | 'pro' | 'enterprise';
  userCount: number;
  playerCount: number;
  sessionCount: number;
  revenue: number;
  lastActive: string;
  createdAt: string;
  adminEmail?: string;
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tenant Management</h1>
          <p className="text-muted-foreground">Manage all organizations on the platform</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
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
                />
              </div>
              <div>
                <Label htmlFor="subdomain">Subdomain *</Label>
                <Input
                  id="subdomain"
                  value={newTenant.subdomain}
                  onChange={(e) => setNewTenant({ ...newTenant, subdomain: e.target.value.toLowerCase() })}
                  placeholder="elite-soccer"
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
                />
              </div>
              <div>
                <Label htmlFor="plan">Plan</Label>
                <Select value={newTenant.plan} onValueChange={(value) => setNewTenant({ ...newTenant, plan: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter - $49/month</SelectItem>
                    <SelectItem value="pro">Pro - $99/month</SelectItem>
                    <SelectItem value="enterprise">Enterprise - $199/month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTenant} disabled={createTenantMutation.isPending}>
                  {createTenantMutation.isPending ? 'Creating...' : 'Create Tenant'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
              </SelectContent>
            </Select>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
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
                  <Badge variant={
                    tenant.status === 'active' ? 'default' :
                    tenant.status === 'suspended' ? 'destructive' : 'secondary'
                  }>
                    {tenant.status}
                  </Badge>
                  <div className="text-xs text-muted-foreground mt-1">{tenant.plan}</div>
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
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelectedTenant(tenant.id)}>
                        <BarChart3 className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setProfileDrawerTenant({ id: tenant.id, name: tenant.name })}>
                        <UserCheck className="w-4 h-4 mr-2" />
                        Health Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleImpersonateLogin(tenant)}>
                        <Eye className="w-4 h-4 mr-2" />
                        Impersonate Admin
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleToggleStatus(tenant.id, tenant.status)}>
                        {tenant.status === 'active' ? (
                          <><PowerOff className="w-4 h-4 mr-2" />Suspend</>
                        ) : (
                          <><Power className="w-4 h-4 mr-2" />Activate</>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
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
                          <Badge variant={user.isAdmin ? 'default' : 'secondary'}>
                            {user.isAdmin ? 'Admin' : 'User'}
                          </Badge>
                        </div>
                        <div className="text-sm">{new Date(user.lastLogin).toLocaleDateString()}</div>
                        <div>
                          <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                            {user.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="settings" className="space-y-4">
                  <div className="space-y-4">
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
                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        Additional tenant-specific settings and configurations can be managed here.
                      </p>
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

      {/* Tenant Profile Drawer */}
      <TenantProfileDrawer
        tenantId={profileDrawerTenant?.id || null}
        tenantName={profileDrawerTenant?.name}
        onClose={() => setProfileDrawerTenant(null)}
      />
    </div>
  );
}