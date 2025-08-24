import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Building2, Plus, Edit, Trash2, Users, Calendar, DollarSign, Search, Filter, LogIn } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { impersonateTenant } from "@/utils/impersonation";

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  contactEmail: string;
  status: 'active' | 'inactive';
  planLevel: 'core' | 'growth' | 'elite';
  createdAt: string;
  adminCount: number;
  playerCount: number;
  sessionCount: number;
  revenue: number;
}

export default function SuperAdminTenants() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tenantsData, isLoading } = useQuery({
    queryKey: ['/api/super-admin/tenants'],
    queryFn: async () => {
      const response = await fetch('/api/super-admin/tenants');
      const data = await response.json();
      return data.rows || data || [];
    }
  });
  
  const tenants = Array.isArray(tenantsData) ? tenantsData : [];

  const createTenantMutation = useMutation({
    mutationFn: (tenantData: any) => apiRequest('POST', '/api/super-admin/tenants', tenantData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/tenants'] });
      setIsCreateModalOpen(false);
      toast({ title: "Success", description: "Tenant created successfully!" });
    }
  });

  const updateTenantMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest('PATCH', `/api/super-admin/tenants/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/tenants'] });
      setEditingTenant(null);
      toast({ title: "Success", description: "Tenant updated successfully!" });
    }
  });

  const deleteTenantMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/super-admin/tenants/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/tenants'] });
      toast({ title: "Success", description: "Tenant deleted successfully!" });
    }
  });

  const filteredTenants = tenants.filter((tenant: Tenant) => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.subdomain.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.contactEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || tenant.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateTenant = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    createTenantMutation.mutate({
      name: formData.get('name'),
      subdomain: formData.get('subdomain'),
      contactEmail: formData.get('contactEmail'),
      status: 'active'
    });
  };

  const handleUpdateTenant = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingTenant) return;
    const formData = new FormData(event.currentTarget);
    updateTenantMutation.mutate({
      id: editingTenant.id,
      name: formData.get('name'),
      subdomain: formData.get('subdomain'),
      contactEmail: formData.get('contactEmail'),
      status: formData.get('status')
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Tenants Management</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const totalRevenue = tenants.reduce((sum: number, tenant: Tenant) => sum + (Number(tenant.revenue) || 0), 0);
  const totalPlayers = tenants.reduce((sum: number, tenant: Tenant) => sum + (Number(tenant.playerCount) || 0), 0);
  const totalSessions = tenants.reduce((sum: number, tenant: Tenant) => sum + (Number(tenant.sessionCount) || 0), 0);
  const activeTenants = tenants.filter((tenant: Tenant) => tenant.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold">Tenants Management</h1>
          <p className="text-muted-foreground">Manage all tenant organizations across the platform</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Tenant
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreateTenant}>
              <DialogHeader>
                <DialogTitle>Create New Tenant</DialogTitle>
                <DialogDescription>Add a new tenant organization to the platform.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">Organization Name</Label>
                  <Input id="name" name="name" required />
                </div>
                <div>
                  <Label htmlFor="subdomain">Subdomain</Label>
                  <Input id="subdomain" name="subdomain" required />
                </div>
                <div>
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input id="contactEmail" name="contactEmail" type="email" required />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createTenantMutation.isPending}>
                  {createTenantMutation.isPending ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Tenants</p>
                <p className="text-2xl font-bold">{activeTenants}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Players</p>
                <p className="text-2xl font-bold">{totalPlayers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
                <p className="text-2xl font-bold">{totalSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search tenants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tenants - Desktop Table / Mobile Cards */}
      <Card>
        <CardHeader>
          <CardTitle>All Tenants ({filteredTenants.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden lg:block">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Subdomain</TableHead>
                    <TableHead>Contact Email</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Admins</TableHead>
                    <TableHead>Players</TableHead>
                    <TableHead>Sessions</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTenants.map((tenant: Tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell className="font-medium">{tenant.name}</TableCell>
                      <TableCell>{tenant.subdomain}</TableCell>
                      <TableCell>{tenant.contactEmail}</TableCell>
                      <TableCell>
                        <Badge variant={
                          tenant.planLevel === 'elite' ? 'default' : 
                          tenant.planLevel === 'growth' ? 'secondary' : 
                          'outline'
                        } className={
                          tenant.planLevel === 'elite' ? 'bg-purple-600 text-white' : 
                          tenant.planLevel === 'growth' ? 'bg-blue-600 text-white' : 
                          'bg-gray-600 text-white'
                        }>
                          {tenant.planLevel?.toUpperCase() || 'CORE'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                          {tenant.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{Number(tenant.adminCount) || 0}</TableCell>
                      <TableCell>{Number(tenant.playerCount) || 0}</TableCell>
                      <TableCell>{Number(tenant.sessionCount) || 0}</TableCell>
                      <TableCell>${(Number(tenant.revenue) || 0).toFixed(2)}</TableCell>
                      <TableCell>{new Date(tenant.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => impersonateTenant(tenant.id, tenant.name)}
                            title="Impersonate tenant"
                          >
                            <LogIn className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingTenant(tenant)}
                            title="Edit tenant"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTenantMutation.mutate(tenant.id)}
                            title="Delete tenant"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-4">
            {filteredTenants.map((tenant: Tenant) => (
              <Card key={tenant.id} className="p-4">
                <div className="space-y-3">
                  {/* Header with name and status */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-base">{tenant.name}</h3>
                      <p className="text-sm text-muted-foreground">{tenant.subdomain}</p>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                        {tenant.status}
                      </Badge>
                      <Badge variant={
                        tenant.planLevel === 'elite' ? 'default' : 
                        tenant.planLevel === 'growth' ? 'secondary' : 
                        'outline'
                      } className={
                        tenant.planLevel === 'elite' ? 'bg-purple-600 text-white' : 
                        tenant.planLevel === 'growth' ? 'bg-blue-600 text-white' : 
                        'bg-gray-600 text-white'
                      }>
                        {tenant.planLevel?.toUpperCase() || 'CORE'}
                      </Badge>
                    </div>
                  </div>

                  {/* Contact info */}
                  <div>
                    <p className="text-sm text-muted-foreground">Contact</p>
                    <p className="text-sm">{tenant.contactEmail}</p>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-lg font-semibold">{Number(tenant.playerCount) || 0}</p>
                      <p className="text-xs text-muted-foreground">Players</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">{Number(tenant.sessionCount) || 0}</p>
                      <p className="text-xs text-muted-foreground">Sessions</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">${(Number(tenant.revenue) || 0).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">Revenue</p>
                    </div>
                  </div>

                  {/* Additional info */}
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{Number(tenant.adminCount) || 0} Admins</span>
                    <span>Created {new Date(tenant.createdAt).toLocaleDateString()}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-2 pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => impersonateTenant(tenant.id, tenant.name)}
                      title="Impersonate tenant"
                    >
                      <LogIn className="w-4 h-4 mr-1" />
                      Login
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingTenant(tenant)}
                      title="Edit tenant"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTenantMutation.mutate(tenant.id)}
                      title="Delete tenant"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {filteredTenants.length === 0 && (
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No tenants found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Tenant Modal */}
      <Dialog open={!!editingTenant} onOpenChange={() => setEditingTenant(null)}>
        <DialogContent>
          <form onSubmit={handleUpdateTenant}>
            <DialogHeader>
              <DialogTitle>Edit Tenant</DialogTitle>
              <DialogDescription>Update tenant organization details.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-name">Organization Name</Label>
                <Input id="edit-name" name="name" defaultValue={editingTenant?.name} required />
              </div>
              <div>
                <Label htmlFor="edit-subdomain">Subdomain</Label>
                <Input id="edit-subdomain" name="subdomain" defaultValue={editingTenant?.subdomain} required />
              </div>
              <div>
                <Label htmlFor="edit-contactEmail">Contact Email</Label>
                <Input id="edit-contactEmail" name="contactEmail" type="email" defaultValue={editingTenant?.contactEmail} required />
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select name="status" defaultValue={editingTenant?.status}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingTenant(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateTenantMutation.isPending}>
                {updateTenantMutation.isPending ? "Updating..." : "Update"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}