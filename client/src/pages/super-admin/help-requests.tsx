import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { 
  Search, 
  Filter, 
  Download, 
  MessageSquare, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  MoreHorizontal,
  Reply,
  Archive,
  Flag,
  User,
  Building,
  Calendar,
  SortAsc,
  SortDesc,
  ChevronRight,
  ChevronLeft,
  ChevronsRight,
  ChevronsLeft,
  FileText,
  Send,
  Eye,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Mail,
  Phone,
  Globe,
  UserCircle,
  Ticket,
  TrendingUp,
  BarChart3,
  Activity,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface HelpRequest {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantSubdomain: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  subject: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  message: string;
  source: string;
  resolved: boolean;
  resolvedBy?: string;
  resolutionNote?: string;
  resolvedAt?: string;
  firstResponseAt?: string;
  replyHistory?: Array<{
    message: string;
    repliedBy: string;
    repliedAt: string;
    internal?: boolean;
    isSuperAdmin?: boolean;
  }>;
  createdAt: string;
  responseTime?: number;
  resolutionTime?: number;
  replyCount: number;
  lastReplyAt?: string;
}

interface HelpRequestStats {
  overview: {
    totalRequests: number;
    openRequests: number;
    inProgressRequests: number;
    resolvedRequests: number;
    closedRequests: number;
    highPriority: number;
    mediumPriority: number;
    lowPriority: number;
    avgResponseTime: number;
    avgResolutionTime: number;
  };
  requestsByTenant: Array<{
    tenantId: string;
    tenantName: string;
    count: number;
    openCount: number;
  }>;
  urgentRequests: Array<{
    id: string;
    subject: string;
    tenantName: string;
    createdAt: string;
  }>;
  requestsByCategory: Array<{
    category: string;
    count: number;
  }>;
  requestsTrend: Array<{
    date: string;
    count: number;
  }>;
}

export default function SuperAdminHelpRequests() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // States for filters and search
  const [search, setSearch] = useState('');
  const [tenantFilter, setTenantFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  // Modal states
  const [selectedRequest, setSelectedRequest] = useState<HelpRequest | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [isInternalReply, setIsInternalReply] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('');
  const [updatePriority, setUpdatePriority] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  
  // Bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkPriority, setBulkPriority] = useState('');

  // Stats view toggle
  const [showStats, setShowStats] = useState(false);

  // Fetch tenants for filter dropdown
  const { data: tenants } = useQuery({
    queryKey: ['/api/super-admin/tenants'],
  });

  // Fetch help requests
  const { data: helpRequestsData, isLoading, refetch } = useQuery({
    queryKey: ['/api/super-admin/help-requests', {
      page: currentPage,
      pageSize,
      tenant: tenantFilter,
      status: statusFilter,
      priority: priorityFilter,
      source: sourceFilter,
      search,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
    }],
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['/api/super-admin/help-requests/stats'],
    enabled: showStats,
  });

  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: async ({ id, message, internal }: { id: string; message: string; internal: boolean }) => {
      return apiRequest(`/api/super-admin/help-requests/${id}/reply`, 'POST', { message, internal });
    },
    onSuccess: () => {
      toast({
        title: "Reply sent",
        description: "Your reply has been sent successfully.",
      });
      setReplyMessage('');
      setIsInternalReply(false);
      refetch();
      if (selectedRequest) {
        refetchRequestDetails();
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send reply.",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      return apiRequest(`/api/super-admin/help-requests/${id}`, 'PATCH', updates);
    },
    onSuccess: () => {
      toast({
        title: "Updated",
        description: "Help request has been updated.",
      });
      refetch();
      if (selectedRequest) {
        refetchRequestDetails();
      }
      setUpdateStatus('');
      setUpdatePriority('');
      setResolutionNote('');
      setInternalNote('');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update help request.",
        variant: "destructive",
      });
    },
  });

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: any }) => {
      return apiRequest('/api/super-admin/help-requests/bulk-update', 'POST', { ids, ...updates });
    },
    onSuccess: () => {
      toast({
        title: "Bulk update complete",
        description: `${selectedIds.length} requests have been updated.`,
      });
      setSelectedIds([]);
      setBulkStatus('');
      setBulkPriority('');
      refetch();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update requests.",
        variant: "destructive",
      });
    },
  });

  // Fetch single request details
  const { data: requestDetails, refetch: refetchRequestDetails } = useQuery({
    queryKey: ['/api/super-admin/help-requests', selectedRequest?.id],
    enabled: !!selectedRequest?.id,
  });

  // Export to CSV
  const handleExport = () => {
    const params = new URLSearchParams({
      tenant: tenantFilter,
      status: statusFilter,
      priority: priorityFilter,
      dateFrom,
      dateTo,
    });
    window.open(`/api/super-admin/help-requests/export?${params}`, '_blank');
  };

  // Handle reply submit
  const handleReplySubmit = () => {
    if (!selectedRequest || !replyMessage.trim()) return;
    
    replyMutation.mutate({
      id: selectedRequest.id,
      message: replyMessage,
      internal: isInternalReply,
    });
  };

  // Handle status/priority update
  const handleUpdateSubmit = () => {
    if (!selectedRequest) return;
    
    const updates: any = {};
    
    if (updateStatus) {
      updates.status = updateStatus;
      
      if ((updateStatus === 'resolved' || updateStatus === 'closed') && resolutionNote) {
        updates.resolutionNote = resolutionNote;
      }
    }
    
    if (updatePriority) {
      updates.priority = updatePriority;
    }
    
    if (internalNote) {
      updates.internal_note = internalNote;
    }
    
    updateMutation.mutate({
      id: selectedRequest.id,
      updates,
    });
  };

  // Handle bulk actions
  const handleBulkUpdate = () => {
    if (selectedIds.length === 0) return;
    
    const updates: any = {};
    
    if (bulkStatus) {
      updates.status = bulkStatus;
    }
    
    if (bulkPriority) {
      updates.priority = bulkPriority;
    }
    
    bulkUpdateMutation.mutate({
      ids: selectedIds,
      updates,
    });
  };

  // Toggle select all
  const toggleSelectAll = () => {
    if (selectedIds.length === helpRequestsData?.rows?.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(helpRequestsData?.rows?.map((r: HelpRequest) => r.id) || []);
    }
  };

  // Toggle select one
  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="destructive">Open</Badge>;
      case 'in_progress':
        return <Badge variant="default">In Progress</Badge>;
      case 'resolved':
        return <Badge variant="outline" className="border-green-500 text-green-700">Resolved</Badge>;
      case 'closed':
        return <Badge variant="secondary">Closed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive"><ArrowUp className="h-3 w-3 mr-1" />High</Badge>;
      case 'medium':
        return <Badge variant="default"><ArrowUpDown className="h-3 w-3 mr-1" />Medium</Badge>;
      case 'low':
        return <Badge variant="secondary"><ArrowDown className="h-3 w-3 mr-1" />Low</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  // Format time duration
  const formatDuration = (minutes?: number) => {
    if (!minutes) return '-';
    
    if (minutes < 60) {
      return `${minutes} min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours < 24) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  };

  // Calculate SLA status
  const getSlaStatus = (responseTime?: number, resolutionTime?: number) => {
    // Example SLA: First response in 60 minutes, resolution in 24 hours
    const responseSlaMet = !responseTime || responseTime <= 60;
    const resolutionSlaMet = !resolutionTime || resolutionTime <= 1440; // 24 hours
    
    if (!responseTime) {
      return <Badge variant="outline">Pending</Badge>;
    }
    
    if (responseSlaMet && (!resolutionTime || resolutionSlaMet)) {
      return <Badge variant="outline" className="border-green-500 text-green-700">Met</Badge>;
    }
    
    return <Badge variant="destructive">Breached</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Help Request Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage support requests across all tenant organizations
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowStats(!showStats)}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            {showStats ? 'Hide' : 'Show'} Stats
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={!helpRequestsData?.rows?.length}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => refetch()}>
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Dashboard (if visible) */}
      {showStats && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overview.totalRequests}</div>
              <p className="text-xs text-muted-foreground">
                {stats.overview.openRequests} open, {stats.overview.inProgressRequests} in progress
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Priority Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-red-600">High</span>
                  <span className="font-medium">{stats.overview.highPriority}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-yellow-600">Medium</span>
                  <span className="font-medium">{stats.overview.mediumPriority}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Low</span>
                  <span className="font-medium">{stats.overview.lowPriority}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatDuration(stats.overview.avgResponseTime)}
              </div>
              <p className="text-xs text-muted-foreground">
                First response
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatDuration(stats.overview.avgResolutionTime)}
              </div>
              <p className="text-xs text-muted-foreground">
                To closure
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tenant">Tenant</Label>
              <Select value={tenantFilter} onValueChange={setTenantFilter}>
                <SelectTrigger id="tenant">
                  <SelectValue placeholder="All Tenants" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tenants</SelectItem>
                  {tenants?.rows?.map((tenant: any) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger id="priority">
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dateFrom">Date From</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dateTo">Date To</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
          
          {/* Bulk Actions */}
          {selectedIds.length > 0 && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {selectedIds.length} request(s) selected
                </span>
                <div className="flex gap-2">
                  <Select value={bulkStatus} onValueChange={setBulkStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Change status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={bulkPriority} onValueChange={setBulkPriority}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Change priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleBulkUpdate}
                    disabled={!bulkStatus && !bulkPriority}
                  >
                    Apply Changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedIds([])}
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Requests Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedIds.length === helpRequestsData?.rows?.length && helpRequestsData?.rows?.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Response Time</TableHead>
                <TableHead>SLA</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8">
                    Loading help requests...
                  </TableCell>
                </TableRow>
              ) : helpRequestsData?.rows?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8">
                    No help requests found
                  </TableCell>
                </TableRow>
              ) : (
                helpRequestsData?.rows?.map((request: HelpRequest) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(request.id)}
                        onCheckedChange={() => toggleSelect(request.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span className="text-sm">{request.tenantName}</span>
                        <span className="text-xs text-muted-foreground">
                          {request.tenantSubdomain}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">
                          {request.firstName} {request.lastName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {request.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={request.subject}>
                        {request.subject}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{request.category}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>{getPriorityBadge(request.priority)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">
                          {format(new Date(request.createdAt), 'MMM d, yyyy')}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(request.createdAt), 'h:mm a')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDuration(request.responseTime)}
                    </TableCell>
                    <TableCell>
                      {getSlaStatus(request.responseTime, request.resolutionTime)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => setSelectedRequest(request)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedRequest(request);
                              // Auto-focus reply tab
                            }}
                          >
                            <Reply className="mr-2 h-4 w-4" />
                            Reply
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              updateMutation.mutate({
                                id: request.id,
                                updates: { status: 'resolved' },
                              });
                            }}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Mark Resolved
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              updateMutation.mutate({
                                id: request.id,
                                updates: { status: 'closed' },
                              });
                            }}
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            Close
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {helpRequestsData && helpRequestsData.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * pageSize) + 1} to{' '}
            {Math.min(currentPage * pageSize, helpRequestsData.totalCount)} of{' '}
            {helpRequestsData.totalCount} results
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {currentPage} of {helpRequestsData.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === helpRequestsData.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(helpRequestsData.totalPages)}
              disabled={currentPage === helpRequestsData.totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Help Request Details Modal */}
      <Dialog 
        open={!!selectedRequest} 
        onOpenChange={(open) => !open && setSelectedRequest(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Help Request Details</DialogTitle>
            <DialogDescription>
              View and manage help request #{selectedRequest?.id.slice(0, 8)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="conversation">
                  Conversation ({selectedRequest.replyCount})
                </TabsTrigger>
                <TabsTrigger value="reply">Reply</TabsTrigger>
                <TabsTrigger value="manage">Manage</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Tenant</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{selectedRequest.tenantName}</span>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm text-muted-foreground">User</Label>
                      <div className="space-y-1 mt-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {selectedRequest.firstName} {selectedRequest.lastName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{selectedRequest.email}</span>
                        </div>
                        {selectedRequest.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{selectedRequest.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm text-muted-foreground">Source</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline">{selectedRequest.source}</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Status</Label>
                      <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                    </div>
                    
                    <div>
                      <Label className="text-sm text-muted-foreground">Priority</Label>
                      <div className="mt-1">{getPriorityBadge(selectedRequest.priority)}</div>
                    </div>
                    
                    <div>
                      <Label className="text-sm text-muted-foreground">Category</Label>
                      <div className="mt-1">
                        <Badge variant="outline">{selectedRequest.category}</Badge>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm text-muted-foreground">Created</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {format(new Date(selectedRequest.createdAt), 'PPpp')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <Label className="text-sm text-muted-foreground">Subject</Label>
                  <h3 className="font-semibold mt-1">{selectedRequest.subject}</h3>
                </div>
                
                <div>
                  <Label className="text-sm text-muted-foreground">Message</Label>
                  <div className="mt-1 p-3 bg-muted/50 rounded-md whitespace-pre-wrap">
                    {selectedRequest.message}
                  </div>
                </div>
                
                {selectedRequest.resolutionNote && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Resolution Note</Label>
                    <div className="mt-1 p-3 bg-green-50 dark:bg-green-950 rounded-md whitespace-pre-wrap">
                      {selectedRequest.resolutionNote}
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="conversation" className="mt-4">
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {!selectedRequest.replyHistory?.length ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No replies yet
                      </div>
                    ) : (
                      selectedRequest.replyHistory.map((reply, index) => (
                        <div key={index} className="space-y-2">
                          {index > 0 && <Separator />}
                          <div className={`p-3 rounded-lg ${
                            reply.internal 
                              ? 'bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800' 
                              : reply.isSuperAdmin
                              ? 'bg-blue-50 dark:bg-blue-950'
                              : 'bg-muted/50'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <UserCircle className="h-4 w-4" />
                                <span className="font-medium">{reply.repliedBy}</span>
                                {reply.isSuperAdmin && (
                                  <Badge variant="outline" className="text-xs">
                                    Super Admin
                                  </Badge>
                                )}
                                {reply.internal && (
                                  <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-700">
                                    Internal Note
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(reply.repliedAt), 'PPp')}
                              </span>
                            </div>
                            <div className="whitespace-pre-wrap">
                              {reply.message}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="reply" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="reply-message">Reply Message</Label>
                  <Textarea
                    id="reply-message"
                    placeholder="Type your reply here..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    rows={6}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="internal-reply"
                    checked={isInternalReply}
                    onCheckedChange={setIsInternalReply}
                  />
                  <Label htmlFor="internal-reply" className="cursor-pointer">
                    Mark as internal note (not visible to user)
                  </Label>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setReplyMessage('')}
                    disabled={!replyMessage}
                  >
                    Clear
                  </Button>
                  <Button
                    onClick={handleReplySubmit}
                    disabled={!replyMessage.trim() || replyMutation.isPending}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Reply
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="manage" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="update-status">Update Status</Label>
                    <Select value={updateStatus} onValueChange={setUpdateStatus}>
                      <SelectTrigger id="update-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="update-priority">Update Priority</Label>
                    <Select value={updatePriority} onValueChange={setUpdatePriority}>
                      <SelectTrigger id="update-priority">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {(updateStatus === 'resolved' || updateStatus === 'closed') && (
                  <div className="space-y-2">
                    <Label htmlFor="resolution-note">Resolution Note</Label>
                    <Textarea
                      id="resolution-note"
                      placeholder="Explain how this was resolved..."
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                      rows={4}
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="internal-note">Internal Note (Optional)</Label>
                  <Textarea
                    id="internal-note"
                    placeholder="Add an internal note about this update..."
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setUpdateStatus('');
                      setUpdatePriority('');
                      setResolutionNote('');
                      setInternalNote('');
                    }}
                  >
                    Reset
                  </Button>
                  <Button
                    onClick={handleUpdateSubmit}
                    disabled={(!updateStatus && !updatePriority && !internalNote) || updateMutation.isPending}
                  >
                    Apply Changes
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}