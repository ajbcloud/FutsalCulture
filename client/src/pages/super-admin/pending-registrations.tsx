import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  User,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Download,
  Eye,
  Mail,
  Clock,
  Building2,
  Calendar,
  AlertCircle,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface PendingRegistration {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  type: 'parent' | 'player';
  registrationStatus: string;
  createdAt: string;
  tenantId: string;
  tenantName: string;
  role?: string;
  isAdmin?: boolean;
  birthYear?: number;
  gender?: string;
  parentId?: string;
  parent?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface RegistrationStats {
  totalPending: number;
  pendingByType: {
    parents: number;
    players: number;
  };
  pendingByTenant: Array<{
    tenantId: string;
    tenantName: string;
    pendingCount: number;
  }>;
  recentRegistrations: Array<{
    id: string;
    name: string;
    email: string;
    type: string;
    createdAt: string;
    tenantName: string;
  }>;
  trendData: Array<{
    date: string;
    count: number;
  }>;
}

export default function SuperAdminPendingRegistrations() {
  const [searchTerm, setSearchTerm] = useState('');
  const [tenantFilter, setTenantFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedRegistrations, setSelectedRegistrations] = useState<Set<string>>(new Set());
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showBulkRejectModal, setShowBulkRejectModal] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<PendingRegistration | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [bulkRejectReason, setBulkRejectReason] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  const { toast } = useToast();

  // Fetch tenants for filter
  const { data: tenants = [] } = useQuery({
    queryKey: ['/api/super-admin/tenants'],
    queryFn: async () => {
      const response = await fetch('/api/super-admin/tenants', {
        credentials: 'include'
      });
      const data = await response.json();
      return data.rows || [];
    },
  });

  // Fetch registration statistics
  const { data: stats, refetch: refetchStats } = useQuery<RegistrationStats>({
    queryKey: ['/api/super-admin/pending-registrations/stats'],
    queryFn: async () => {
      const response = await fetch('/api/super-admin/pending-registrations/stats', {
        credentials: 'include'
      });
      return response.json();
    },
  });

  // Fetch registrations with filters
  const { data: registrationsData, isLoading, refetch } = useQuery({
    queryKey: ['/api/super-admin/pending-registrations', {
      tenantId: tenantFilter,
      type: typeFilter === 'all' ? undefined : typeFilter,
      status: statusFilter,
      dateFrom,
      dateTo,
      search: searchTerm,
      page: currentPage,
      pageSize: itemsPerPage
    }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (tenantFilter !== 'all') params.append('tenantId', tenantFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      if (searchTerm) params.append('search', searchTerm);
      params.append('page', currentPage.toString());
      params.append('pageSize', itemsPerPage.toString());

      const response = await fetch(`/api/super-admin/pending-registrations?${params}`, {
        credentials: 'include'
      });
      return response.json();
    },
  });

  const registrations = registrationsData?.rows || [];
  const totalRegistrations = registrationsData?.totalRows || 0;
  const totalPages = Math.ceil(totalRegistrations / itemsPerPage);

  // Fetch single registration details
  const fetchRegistrationDetails = async (id: string) => {
    const response = await fetch(`/api/super-admin/pending-registrations/${id}`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch registration details');
    return response.json();
  };

  // Approve registration mutation
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/super-admin/pending-registrations/${id}/approve`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Registration approved successfully',
      });
      refetch();
      refetchStats();
      setShowDetailsModal(false);
      setSelectedRegistration(null);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to approve registration',
        variant: 'destructive',
      });
    },
  });

  // Reject registration mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return apiRequest(`/api/super-admin/pending-registrations/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Registration rejected',
      });
      refetch();
      refetchStats();
      setShowRejectModal(false);
      setShowDetailsModal(false);
      setSelectedRegistration(null);
      setRejectReason('');
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to reject registration',
        variant: 'destructive',
      });
    },
  });

  // Bulk approve mutation
  const bulkApproveMutation = useMutation({
    mutationFn: async () => {
      const ids = Array.from(selectedRegistrations);
      return apiRequest('/api/super-admin/pending-registrations/bulk-approve', {
        method: 'POST',
        body: JSON.stringify({ ids }),
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: data.message,
      });
      refetch();
      refetchStats();
      setSelectedRegistrations(new Set());
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to bulk approve registrations',
        variant: 'destructive',
      });
    },
  });

  // Bulk reject mutation
  const bulkRejectMutation = useMutation({
    mutationFn: async () => {
      const ids = Array.from(selectedRegistrations);
      return apiRequest('/api/super-admin/pending-registrations/bulk-reject', {
        method: 'POST',
        body: JSON.stringify({ ids, reason: bulkRejectReason }),
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: data.message,
      });
      refetch();
      refetchStats();
      setSelectedRegistrations(new Set());
      setShowBulkRejectModal(false);
      setBulkRejectReason('');
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to bulk reject registrations',
        variant: 'destructive',
      });
    },
  });

  // Handle view details
  const handleViewDetails = async (registration: PendingRegistration) => {
    try {
      const details = await fetchRegistrationDetails(registration.id);
      setSelectedRegistration(details);
      setShowDetailsModal(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch registration details',
        variant: 'destructive',
      });
    }
  };

  // Handle export to CSV
  const handleExport = () => {
    const params = new URLSearchParams();
    if (tenantFilter !== 'all') params.append('tenantId', tenantFilter);
    if (typeFilter !== 'all') params.append('type', typeFilter);
    if (statusFilter !== 'all') params.append('status', statusFilter);
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);

    window.location.href = `/api/super-admin/pending-registrations/export?${params}`;
  };

  // Toggle selection
  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedRegistrations);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedRegistrations(newSelection);
  };

  // Select all on current page
  const selectAllOnPage = () => {
    const newSelection = new Set(selectedRegistrations);
    if (registrations.every(r => newSelection.has(r.id))) {
      registrations.forEach(r => newSelection.delete(r.id));
    } else {
      registrations.forEach(r => newSelection.add(r.id));
    }
    setSelectedRegistrations(newSelection);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pending Registrations</h1>
          <p className="text-muted-foreground mt-2">
            Manage user and player registrations across all organizations
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={!registrations.length}
            data-testid="button-export-csv"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          {selectedRegistrations.size > 0 && (
            <>
              <Button
                onClick={() => bulkApproveMutation.mutate()}
                className="bg-green-600 hover:bg-green-700"
                data-testid="button-bulk-approve"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve ({selectedRegistrations.size})
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowBulkRejectModal(true)}
                data-testid="button-bulk-reject"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject ({selectedRegistrations.size})
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
              <Clock className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPending}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting approval
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Parents</CardTitle>
              <User className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingByType?.parents || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Parent registrations
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Players</CardTitle>
              <Users className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingByType?.players || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Player registrations
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Tenant</CardTitle>
              <Building2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {stats.pendingByTenant[0] ? (
                <>
                  <div className="text-2xl font-bold">
                    {stats.pendingByTenant[0].pendingCount}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.pendingByTenant[0].tenantName}
                  </p>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">No pending</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>

            <Select value={tenantFilter} onValueChange={setTenantFilter}>
              <SelectTrigger data-testid="select-tenant">
                <SelectValue placeholder="All Tenants" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tenants</SelectItem>
                {tenants.map((tenant: any) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger data-testid="select-type">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="parent">Parents</SelectItem>
                <SelectItem value="player">Players</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger data-testid="select-status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="all">All Statuses</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="From Date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              data-testid="input-date-from"
            />

            <Input
              type="date"
              placeholder="To Date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              data-testid="input-date-to"
            />
          </div>
        </CardContent>
      </Card>

      {/* Registrations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Registrations ({totalRegistrations})</span>
            {isLoading && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {registrations.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || tenantFilter !== 'all' || dateFrom || dateTo
                  ? 'No registrations found matching your filters'
                  : 'No pending registrations at this time'}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={registrations.every(r => selectedRegistrations.has(r.id))}
                          onCheckedChange={selectAllOnPage}
                          data-testid="checkbox-select-all"
                        />
                      </TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registrations.map((registration: PendingRegistration) => (
                      <TableRow key={registration.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedRegistrations.has(registration.id)}
                            onCheckedChange={() => toggleSelection(registration.id)}
                            data-testid={`checkbox-${registration.id}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={registration.type === 'parent' 
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' 
                              : 'bg-orange-100 text-orange-700 hover:bg-orange-100'
                            }
                          >
                            {registration.type === 'parent' ? (
                              <User className="w-3 h-3 mr-1" />
                            ) : (
                              <Users className="w-3 h-3 mr-1" />
                            )}
                            {registration.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {registration.firstName} {registration.lastName}
                          </div>
                          {registration.type === 'player' && registration.parent && (
                            <div className="text-sm text-muted-foreground">
                              Parent: {registration.parent.firstName} {registration.parent.lastName}
                            </div>
                          )}
                          {registration.isAdmin && (
                            <Badge variant="outline" className="mt-1">Admin</Badge>
                          )}
                        </TableCell>
                        <TableCell>{registration.email}</TableCell>
                        <TableCell>{registration.tenantName}</TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Calendar className="w-3 h-3 mr-1 text-muted-foreground" />
                            {format(new Date(registration.createdAt), 'MMM d, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={
                              registration.registrationStatus === 'approved' 
                                ? 'bg-green-100 text-green-700 hover:bg-green-100' 
                                : registration.registrationStatus === 'rejected'
                                ? 'bg-red-100 text-red-700 hover:bg-red-100'
                                : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
                            }
                          >
                            {registration.registrationStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleViewDetails(registration)}
                                data-testid={`button-view-details-${registration.id}`}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {registration.registrationStatus === 'pending' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => approveMutation.mutate(registration.id)}
                                    className="text-green-600"
                                    data-testid={`button-approve-${registration.id}`}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedRegistration(registration);
                                      setShowRejectModal(true);
                                    }}
                                    className="text-red-600"
                                    data-testid={`button-reject-${registration.id}`}
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalRegistrations)} of {totalRegistrations} registrations
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = currentPage - 2 + i;
                        if (page < 1 || page > totalPages) return null;
                        return (
                          <Button
                            key={page}
                            variant={page === currentPage ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Button>
                        );
                      }).filter(Boolean)}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Registration Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registration Details</DialogTitle>
            <DialogDescription>
              Complete information about this registration
            </DialogDescription>
          </DialogHeader>
          {selectedRegistration && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                  <p className="font-medium">
                    {selectedRegistration.firstName} {selectedRegistration.lastName}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Type</Label>
                  <Badge 
                    className={selectedRegistration.type === 'parent' 
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' 
                      : 'bg-orange-100 text-orange-700 hover:bg-orange-100'
                    }
                  >
                    {selectedRegistration.type}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                  <p>{selectedRegistration.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                  <p>{selectedRegistration.phone || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Organization</Label>
                  <p>{selectedRegistration.tenantName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Registration Date</Label>
                  <p>{format(new Date(selectedRegistration.createdAt), 'PPP')}</p>
                </div>
                {selectedRegistration.type === 'player' && (
                  <>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Birth Year</Label>
                      <p>{selectedRegistration.birthYear || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Gender</Label>
                      <p>{selectedRegistration.gender || 'Not provided'}</p>
                    </div>
                  </>
                )}
                {selectedRegistration.parent && (
                  <div className="col-span-2">
                    <Label className="text-sm font-medium text-muted-foreground">Parent</Label>
                    <p>
                      {selectedRegistration.parent.firstName} {selectedRegistration.parent.lastName} ({selectedRegistration.parent.email})
                    </p>
                  </div>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                <Badge 
                  className={
                    selectedRegistration.registrationStatus === 'approved' 
                      ? 'bg-green-100 text-green-700 hover:bg-green-100 mt-1' 
                      : selectedRegistration.registrationStatus === 'rejected'
                      ? 'bg-red-100 text-red-700 hover:bg-red-100 mt-1'
                      : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100 mt-1'
                  }
                >
                  {selectedRegistration.registrationStatus}
                </Badge>
              </div>
            </div>
          )}
          {selectedRegistration?.registrationStatus === 'pending' && (
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDetailsModal(false)}
                data-testid="button-cancel-details"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setShowRejectModal(true);
                }}
                data-testid="button-reject-details"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => approveMutation.mutate(selectedRegistration.id)}
                data-testid="button-approve-details"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Registration</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this registration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-reason">Rejection Reason</Label>
              <Select value={rejectReason} onValueChange={setRejectReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Incomplete information">Incomplete information</SelectItem>
                  <SelectItem value="Verification failed">Verification failed</SelectItem>
                  <SelectItem value="Duplicate registration">Duplicate registration</SelectItem>
                  <SelectItem value="Does not meet requirements">Does not meet requirements</SelectItem>
                  <SelectItem value="custom">Custom reason...</SelectItem>
                </SelectContent>
              </Select>
              {rejectReason === 'custom' && (
                <Textarea
                  className="mt-2"
                  placeholder="Enter custom reason..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectModal(false);
                setRejectReason('');
              }}
              data-testid="button-cancel-reject"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedRegistration && rejectReason) {
                  rejectMutation.mutate({
                    id: selectedRegistration.id,
                    reason: rejectReason,
                  });
                }
              }}
              disabled={!rejectReason}
              data-testid="button-confirm-reject"
            >
              Reject Registration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Reject Modal */}
      <Dialog open={showBulkRejectModal} onOpenChange={setShowBulkRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Reject Registrations</DialogTitle>
            <DialogDescription>
              Reject {selectedRegistrations.size} selected registrations
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bulk-reject-reason">Rejection Reason</Label>
              <Textarea
                id="bulk-reject-reason"
                placeholder="Enter reason for rejection..."
                value={bulkRejectReason}
                onChange={(e) => setBulkRejectReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowBulkRejectModal(false);
                setBulkRejectReason('');
              }}
              data-testid="button-cancel-bulk-reject"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => bulkRejectMutation.mutate()}
              disabled={!bulkRejectReason}
              data-testid="button-confirm-bulk-reject"
            >
              Reject All Selected
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}