import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { FormEvent } from 'react';
import { Loader2, Users, Send, Eye, CheckCircle, XCircle, Clock, Plus, Filter, Download } from 'lucide-react';

interface UnifiedInvitation {
  id: string;
  type: 'email' | 'code' | 'parent2' | 'player';
  recipientEmail: string;
  recipientName: string | null;
  role: 'parent' | 'player' | 'admin' | 'assistant';
  status: 'pending' | 'sent' | 'viewed' | 'accepted' | 'expired' | 'cancelled';
  customMessage: string | null;
  metadata: Record<string, any>;
  expiresAt: string;
  sentAt: string | null;
  viewedAt: string | null;
  acceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
  batchId: string | null;
  createdByName: string;
}

interface InvitationFilters {
  type?: 'email' | 'code' | 'parent2' | 'player';
  status?: 'pending' | 'sent' | 'viewed' | 'accepted' | 'expired' | 'cancelled';
  role?: 'parent' | 'player' | 'admin' | 'assistant';
  batchId?: string;
  limit: number;
  offset: number;
  sortBy: 'created_at' | 'updated_at' | 'expires_at' | 'status';
  sortOrder: 'asc' | 'desc';
}

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  sent: 'bg-blue-100 text-blue-800',
  viewed: 'bg-purple-100 text-purple-800',
  accepted: 'bg-green-100 text-green-800',
  expired: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

const STATUS_ICONS = {
  pending: Clock,
  sent: Send,
  viewed: Eye,
  accepted: CheckCircle,
  expired: XCircle,
  cancelled: XCircle,
};

export default function UnifiedInvitations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [filters, setFilters] = useState<InvitationFilters>({
    limit: 50,
    offset: 0,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showBatchDialog, setShowBatchDialog] = useState(false);

  // Fetch invitations with filters
  const { data: invitationsData, isLoading } = useQuery({
    queryKey: ['/api/invitations', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
      return apiRequest(`/api/invitations?${params}`);
    },
  });

  // Fetch analytics
  const { data: analyticsData } = useQuery({
    queryKey: ['/api/invitations/analytics'],
    queryFn: () => apiRequest('/api/invitations/analytics'),
  });

  // Create single invitation
  const createInvitationMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/invitations', { method: 'POST', body: data }),
    onSuccess: () => {
      toast({ title: 'Invitation sent successfully!' });
      setShowCreateDialog(false);
      queryClient.invalidateQueries({ queryKey: ['/api/invitations'] });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to send invitation', description: error.message, variant: 'destructive' });
    },
  });

  // Create batch invitations
  const createBatchMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/invitations', { method: 'POST', body: data }),
    onSuccess: (result: any) => {
      toast({ 
        title: 'Batch invitation completed!', 
        description: `${result.successful}/${result.total} invitations sent successfully` 
      });
      setShowBatchDialog(false);
      queryClient.invalidateQueries({ queryKey: ['/api/invitations'] });
    },
    onError: (error: any) => {
      toast({ title: 'Batch invitation failed', description: error.message, variant: 'destructive' });
    },
  });

  // Cancel invitation
  const cancelInvitationMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/invitations/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast({ title: 'Invitation cancelled successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/invitations'] });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to cancel invitation', description: error.message, variant: 'destructive' });
    },
  });

  const invitations = invitationsData?.invitations || [];
  const pagination = invitationsData?.pagination || {};
  const analytics = analyticsData || {};

  const handleCreateInvitation = (formData: FormData) => {
    const data = {
      type: formData.get('type'),
      recipientEmail: formData.get('recipientEmail'),
      recipientName: formData.get('recipientName'),
      role: formData.get('role'),
      customMessage: formData.get('customMessage'),
      expirationDays: parseInt(formData.get('expirationDays') as string) || 7,
    };
    createInvitationMutation.mutate(data);
  };

  const handleBatchInvitation = (formData: FormData) => {
    const emailList = (formData.get('emailList') as string).split('\n').filter(Boolean);
    const recipients = emailList.map(line => {
      const [email, name] = line.split(',').map(s => s.trim());
      return { email, name };
    });

    const data = {
      type: formData.get('type'),
      role: formData.get('role'),
      customMessage: formData.get('customMessage'),
      expirationDays: parseInt(formData.get('expirationDays') as string) || 7,
      recipients,
    };
    createBatchMutation.mutate(data);
  };

  const getStatusIcon = (status: string) => {
    const Icon = STATUS_ICONS[status as keyof typeof STATUS_ICONS] || Clock;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Unified Invitations
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage all invitation types from one centralized system
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-invitation">
                <Plus className="w-4 h-4 mr-2" />
                Create Invitation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <form onSubmit={(e) => {
                e.preventDefault();
                handleCreateInvitation(new FormData(e.target as HTMLFormElement));
              }}>
                <DialogHeader>
                  <DialogTitle>Create New Invitation</DialogTitle>
                  <DialogDescription>
                    Send a single invitation to join your organization
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Invitation Type</Label>
                    <Select name="type" required>
                      <SelectTrigger data-testid="select-invitation-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email Invitation</SelectItem>
                        <SelectItem value="code">Invite Code</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recipientEmail">Email Address *</Label>
                    <Input
                      name="recipientEmail"
                      type="email"
                      placeholder="user@example.com"
                      required
                      data-testid="input-recipient-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recipientName">Full Name</Label>
                    <Input
                      name="recipientName"
                      placeholder="John Doe"
                      data-testid="input-recipient-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select name="role" required>
                      <SelectTrigger data-testid="select-role">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="player">Player</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="assistant">Assistant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customMessage">Custom Message</Label>
                    <Textarea
                      name="customMessage"
                      placeholder="Add a personal message (optional)"
                      rows={3}
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                      data-testid="textarea-custom-message"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expirationDays">Expires In (Days)</Label>
                    <Input
                      name="expirationDays"
                      type="number"
                      defaultValue="7"
                      min="1"
                      max="30"
                      data-testid="input-expiration-days"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                    data-testid="button-cancel-create"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createInvitationMutation.isPending}
                    data-testid="button-submit-create"
                  >
                    {createInvitationMutation.isPending && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Send Invitation
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-batch-invitation">
                <Users className="w-4 h-4 mr-2" />
                Batch Invitation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <form onSubmit={(e) => {
                e.preventDefault();
                handleBatchInvitation(new FormData(e.target as HTMLFormElement));
              }}>
                <DialogHeader>
                  <DialogTitle>Batch Invitation</DialogTitle>
                  <DialogDescription>
                    Send multiple invitations at once. Enter one email per line, optionally with name (email,name)
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Invitation Type</Label>
                      <Select name="type" required>
                        <SelectTrigger data-testid="select-batch-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email Invitation</SelectItem>
                          <SelectItem value="code">Invite Code</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select name="role" required>
                        <SelectTrigger data-testid="select-batch-role">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="parent">Parent</SelectItem>
                          <SelectItem value="player">Player</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="assistant">Assistant</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emailList">Email List *</Label>
                    <Textarea
                      name="emailList"
                      placeholder="user1@example.com,John Doe&#10;user2@example.com,Jane Smith&#10;user3@example.com"
                      rows={8}
                      required
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                      data-testid="textarea-email-list"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customMessage">Custom Message</Label>
                    <Textarea
                      name="customMessage"
                      placeholder="Add a personal message (optional)"
                      rows={3}
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                      data-testid="textarea-batch-message"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expirationDays">Expires In (Days)</Label>
                    <Input
                      name="expirationDays"
                      type="number"
                      defaultValue="7"
                      min="1"
                      max="30"
                      data-testid="input-batch-expiration"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowBatchDialog(false)}
                    data-testid="button-cancel-batch"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createBatchMutation.isPending}
                    data-testid="button-submit-batch"
                  >
                    {createBatchMutation.isPending && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Send Batch
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="invitations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invitations" data-testid="tab-invitations">
            Invitations
          </TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invitations" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="filter-status">Status</Label>
                  <Select
                    value={filters.status || ''}
                    onValueChange={(value) =>
                      setFilters(prev => ({ ...prev, status: value as any, offset: 0 }))
                    }
                  >
                    <SelectTrigger data-testid="select-filter-status">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="viewed">Viewed</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="filter-type">Type</Label>
                  <Select
                    value={filters.type || ''}
                    onValueChange={(value) =>
                      setFilters(prev => ({ ...prev, type: value as any, offset: 0 }))
                    }
                  >
                    <SelectTrigger data-testid="select-filter-type">
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All types</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="code">Code</SelectItem>
                      <SelectItem value="parent2">Parent2</SelectItem>
                      <SelectItem value="player">Player</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="filter-role">Role</Label>
                  <Select
                    value={filters.role || ''}
                    onValueChange={(value) =>
                      setFilters(prev => ({ ...prev, role: value as any, offset: 0 }))
                    }
                  >
                    <SelectTrigger data-testid="select-filter-role">
                      <SelectValue placeholder="All roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All roles</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="player">Player</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="assistant">Assistant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="filter-sort">Sort By</Label>
                  <Select
                    value={`${filters.sortBy}-${filters.sortOrder}`}
                    onValueChange={(value) => {
                      const [sortBy, sortOrder] = value.split('-');
                      setFilters(prev => ({ ...prev, sortBy: sortBy as any, sortOrder: sortOrder as any, offset: 0 }));
                    }}
                  >
                    <SelectTrigger data-testid="select-filter-sort">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_at-desc">Newest First</SelectItem>
                      <SelectItem value="created_at-asc">Oldest First</SelectItem>
                      <SelectItem value="updated_at-desc">Recently Updated</SelectItem>
                      <SelectItem value="expires_at-asc">Expiring Soon</SelectItem>
                      <SelectItem value="status-asc">Status A-Z</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invitations Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                Invitations
                {pagination.total && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({pagination.total} total)
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invitations.map((invitation: UnifiedInvitation) => (
                        <TableRow key={invitation.id} data-testid={`row-invitation-${invitation.id}`}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{invitation.recipientName || invitation.recipientEmail}</div>
                              {invitation.recipientName && (
                                <div className="text-sm text-gray-500">{invitation.recipientEmail}</div>
                              )}
                              {invitation.createdByName && (
                                <div className="text-xs text-gray-400">by {invitation.createdByName}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {invitation.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="capitalize">
                              {invitation.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(invitation.status)}
                              <Badge className={STATUS_COLORS[invitation.status] || 'bg-gray-100 text-gray-800'}>
                                {invitation.status}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-600">
                              {new Date(invitation.createdAt).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-600">
                              {new Date(invitation.expiresAt).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {invitation.status !== 'accepted' && invitation.status !== 'cancelled' && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => cancelInvitationMutation.mutate(invitation.id)}
                                  disabled={cancelInvitationMutation.isPending}
                                  data-testid={`button-cancel-${invitation.id}`}
                                >
                                  Cancel
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {pagination.total > filters.limit && (
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        Showing {filters.offset + 1} to {Math.min(filters.offset + filters.limit, pagination.total)} of {pagination.total}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFilters(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))}
                          disabled={filters.offset === 0}
                          data-testid="button-prev-page"
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFilters(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
                          disabled={!pagination.hasMore}
                          data-testid="button-next-page"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Invitations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-total-invitations">
                  {analytics.overview?.totalInvitations || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Accepted</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600" data-testid="stat-accepted-invitations">
                  {analytics.overview?.acceptedInvitations || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600" data-testid="stat-conversion-rate">
                  {analytics.overview?.conversionRate || 0}%
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}