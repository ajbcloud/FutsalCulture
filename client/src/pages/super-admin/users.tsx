import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  UserX, 
  RotateCcw,
  Mail,
  Building,
  Calendar,
  Download
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  status: 'active' | 'disabled' | 'pending';
  tenantId: string;
  tenantName: string;
  lastLogin: string;
  createdAt: string;
  playerCount?: number;
  sessionCount?: number;
}

export default function SuperAdminUsers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tenantFilter, setTenantFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all users across tenants
  const { data: users = [], isLoading, error } = useQuery<User[]>({
    queryKey: ['/api/super-admin/users', { search: searchTerm, role: roleFilter, status: statusFilter, tenant: tenantFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (tenantFilter !== 'all') params.append('tenant', tenantFilter);
      
      const response = await fetch(`/api/super-admin/users?${params}`);
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    }
  });

  // Fetch tenants for filter dropdown
  const { data: tenants = [] } = useQuery({
    queryKey: ['/api/super-admin/tenants-list'],
    queryFn: async () => {
      const response = await fetch('/api/super-admin/tenants');
      if (!response.ok) throw new Error('Failed to fetch tenants');
      return response.json();
    }
  });

  // Toggle user status mutation
  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      const response = await fetch(`/api/super-admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Failed to update user status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/users'] });
      toast({ title: 'User status updated successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to update user status', description: error.message, variant: 'destructive' });
    }
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/super-admin/users/${userId}/reset-password`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to reset password');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Password reset email sent successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to reset password', description: error.message, variant: 'destructive' });
    }
  });

  // Export users data
  const handleExportUsers = async () => {
    try {
      const response = await fetch('/api/super-admin/users/export');
      if (!response.ok) throw new Error('Failed to export users');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({ title: 'Users data exported successfully' });
    } catch (error: any) {
      toast({ title: 'Failed to export users', description: error.message, variant: 'destructive' });
    }
  };

  const handleToggleUserStatus = (user: User) => {
    const newStatus = user.status === 'active' ? 'disabled' : 'active';
    toggleUserStatusMutation.mutate({ userId: user.id, status: newStatus });
  };

  const handleResetPassword = (userId: string) => {
    resetPasswordMutation.mutate(userId);
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowUserDialog(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
        </div>
        <div className="space-y-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">User Management</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">Failed to load users. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeUsers = users.filter(u => u.status === 'active').length;
  const adminUsers = users.filter(u => u.isAdmin).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground">Manage users across all organizations</p>
        </div>
        
        <Button onClick={handleExportUsers}>
          <Download className="w-4 h-4 mr-2" />
          Export Users
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{activeUsers}</div>
            <p className="text-xs text-muted-foreground">Active Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{adminUsers}</div>
            <p className="text-xs text-muted-foreground">Admin Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{tenants.length}</div>
            <p className="text-xs text-muted-foreground">Organizations</p>
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
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="super-admin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tenantFilter} onValueChange={setTenantFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Organization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Organizations</SelectItem>
                {tenants.map((tenant: any) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({users.length})</CardTitle>
          <CardDescription>
            Manage user accounts across all organizations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-12 gap-4 p-4 font-medium border-b bg-muted/50">
              <div className="col-span-3">User</div>
              <div className="col-span-2">Organization</div>
              <div className="col-span-2">Role</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-2">Last Login</div>
              <div className="col-span-1">Players</div>
              <div className="col-span-1">Actions</div>
            </div>
            {users.map((user) => (
              <div key={user.id} className="grid grid-cols-12 gap-4 p-4 border-b last:border-b-0 hover:bg-muted/25">
                <div className="col-span-3">
                  <div className="font-medium">{user.firstName} {user.lastName}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-sm">{user.tenantName}</div>
                </div>
                <div className="col-span-2">
                  <div className="flex gap-1">
                    {user.isSuperAdmin && (
                      <Badge variant="destructive">Super Admin</Badge>
                    )}
                    {user.isAdmin && (
                      <Badge variant="default">Admin</Badge>
                    )}
                    {!user.isAdmin && !user.isSuperAdmin && (
                      <Badge variant="secondary">User</Badge>
                    )}
                  </div>
                </div>
                <div className="col-span-1">
                  <Badge variant={
                    user.status === 'active' ? 'default' :
                    user.status === 'disabled' ? 'destructive' : 'secondary'
                  }>
                    {user.status}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <div className="text-sm">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                  </div>
                </div>
                <div className="col-span-1">
                  <div className="font-medium">{user.playerCount || 0}</div>
                </div>
                <div className="col-span-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewUser(user)}>
                        <Building className="w-4 h-4 mr-2" />
                        View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleResetPassword(user.id)}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset Password
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleToggleUserStatus(user)}>
                        {user.status === 'active' ? (
                          <><UserX className="w-4 h-4 mr-2" />Disable User</>
                        ) : (
                          <><Mail className="w-4 h-4 mr-2" />Enable User</>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User Details Modal */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogTitle>
            <DialogDescription>
              User profile and account details
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Contact Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Email:</span> {selectedUser.email}</div>
                    <div><span className="font-medium">Organization:</span> {selectedUser.tenantName}</div>
                    <div><span className="font-medium">Account Created:</span> {new Date(selectedUser.createdAt).toLocaleDateString()}</div>
                    <div><span className="font-medium">Last Login:</span> {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleDateString() : 'Never'}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Account Status</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Status:</span>
                      <Badge variant={
                        selectedUser.status === 'active' ? 'default' :
                        selectedUser.status === 'disabled' ? 'destructive' : 'secondary'
                      }>
                        {selectedUser.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Role:</span>
                      <div className="flex gap-1">
                        {selectedUser.isSuperAdmin && (
                          <Badge variant="destructive">Super Admin</Badge>
                        )}
                        {selectedUser.isAdmin && (
                          <Badge variant="default">Admin</Badge>
                        )}
                        {!selectedUser.isAdmin && !selectedUser.isSuperAdmin && (
                          <Badge variant="secondary">User</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Activity Summary</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-lg font-bold">{selectedUser.playerCount || 0}</div>
                      <p className="text-xs text-muted-foreground">Players Managed</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-lg font-bold">{selectedUser.sessionCount || 0}</div>
                      <p className="text-xs text-muted-foreground">Sessions Booked</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => handleResetPassword(selectedUser.id)}>
                  Reset Password
                </Button>
                <Button 
                  variant={selectedUser.status === 'active' ? 'destructive' : 'default'}
                  onClick={() => handleToggleUserStatus(selectedUser)}
                >
                  {selectedUser.status === 'active' ? 'Disable User' : 'Enable User'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}