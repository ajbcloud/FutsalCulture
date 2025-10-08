import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin-layout';
import { usePageRefresh } from '@/hooks/use-page-refresh';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { useToast } from '../../hooks/use-toast';
import { format } from 'date-fns';
import { Check, X, User, Users, CheckSquare, Square } from 'lucide-react';
import { queryClient } from '../../lib/queryClient';
import { Pagination } from '../../components/pagination';

interface PendingRegistration {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  type: 'parent' | 'player';
  registrationStatus: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  parentId?: string;
}

export default function AdminPendingRegistrations() {
  const [registrations, setRegistrations] = useState<PendingRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState<string | null>(null);
  const [paginatedRegistrations, setPaginatedRegistrations] = useState<PendingRegistration[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  // Bulk operations state
  const [selectedRegistrations, setSelectedRegistrations] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [showBulkRejectDialog, setShowBulkRejectDialog] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState('');
  const [selectAllMode, setSelectAllMode] = useState<'none' | 'page' | 'all'>('none');
  const { toast } = useToast();
  
  // Refresh data when returning to page
  usePageRefresh(["/api/admin/pending-registrations"]);

  useEffect(() => {
    fetchPendingRegistrations();
  }, []);

  // Apply pagination whenever registrations or pagination settings change
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedRegistrations(registrations.slice(startIndex, endIndex));
  }, [registrations, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const fetchPendingRegistrations = async () => {
    try {
      const response = await fetch('/api/admin/pending-registrations');
      if (!response.ok) throw new Error('Failed to fetch pending registrations');
      const data = await response.json();
      setRegistrations(data);
      setCurrentPage(1); // Reset to first page when data changes
    } catch (error) {
      console.error('Error fetching pending registrations:', error);
      toast({
        title: "Error",
        description: "Failed to load pending registrations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string, type: string) => {
    setProcessing(id);
    try {
      const response = await fetch(`/api/admin/registrations/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });

      if (!response.ok) throw new Error('Failed to approve registration');

      toast({
        title: "Success",
        description: `${type === 'parent' ? 'Adult' : 'Player'} registration approved`,
      });

      // Refresh the list and invalidate related queries
      fetchPendingRegistrations();
      
      // Invalidate queries to refresh dashboard counters and recent activity
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/recent-activity'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard-metrics'] });
    } catch (error) {
      console.error('Error approving registration:', error);
      toast({
        title: "Error",
        description: "Failed to approve registration",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: string, type: string) => {
    if (!rejectReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    setProcessing(id);
    try {
      const response = await fetch(`/api/admin/registrations/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, reason: rejectReason }),
      });

      if (!response.ok) throw new Error('Failed to reject registration');

      toast({
        title: "Success",
        description: `${type === 'parent' ? 'Adult' : 'Player'} registration rejected`,
      });

      setShowRejectDialog(null);
      setRejectReason('');
      // Refresh the list
      fetchPendingRegistrations();
    } catch (error) {
      console.error('Error rejecting registration:', error);
      toast({
        title: "Error",
        description: "Failed to reject registration",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  // Bulk operations handlers
  const toggleSelectAll = () => {
    if (selectAllMode === 'none') {
      // Select all on current page
      setSelectedRegistrations(new Set(paginatedRegistrations.map(r => r.id)));
      setSelectAllMode('page');
    } else if (selectAllMode === 'page') {
      // Select all across all pages
      setSelectedRegistrations(new Set(registrations.map(r => r.id)));
      setSelectAllMode('all');
    } else {
      // Deselect all
      setSelectedRegistrations(new Set());
      setSelectAllMode('none');
    }
  };

  const toggleSelectRegistration = (id: string) => {
    const newSelected = new Set(selectedRegistrations);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRegistrations(newSelected);
    
    // Update select all mode based on selection
    if (newSelected.size === 0) {
      setSelectAllMode('none');
    } else if (newSelected.size === registrations.length) {
      setSelectAllMode('all');
    } else if (paginatedRegistrations.every(r => newSelected.has(r.id)) && newSelected.size === paginatedRegistrations.length) {
      setSelectAllMode('page');
    } else {
      setSelectAllMode('none');
    }
  };

  const handleBulkApprove = async () => {
    if (selectedRegistrations.size === 0) {
      toast({
        title: "Error",
        description: "Please select registrations to approve",
        variant: "destructive",
      });
      return;
    }

    setBulkProcessing(true);
    try {
      const selectedData = registrations
        .filter(r => selectedRegistrations.has(r.id))
        .map(r => ({ id: r.id, type: r.type }));

      const response = await fetch('/api/admin/registrations/bulk-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrations: selectedData }),
      });

      if (!response.ok) throw new Error('Failed to bulk approve registrations');
      
      const result = await response.json();
      toast({
        title: "Success",
        description: result.message,
      });

      setSelectedRegistrations(new Set());
      setSelectAllMode('none');
      fetchPendingRegistrations();
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/recent-activity'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard-metrics'] });
    } catch (error) {
      console.error('Error bulk approving registrations:', error);
      toast({
        title: "Error",
        description: "Failed to bulk approve registrations",
        variant: "destructive",
      });
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedRegistrations.size === 0) {
      toast({
        title: "Error",
        description: "Please select registrations to reject",
        variant: "destructive",
      });
      return;
    }

    if (!bulkRejectReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for bulk rejection",
        variant: "destructive",
      });
      return;
    }

    setBulkProcessing(true);
    try {
      const selectedData = registrations
        .filter(r => selectedRegistrations.has(r.id))
        .map(r => ({ id: r.id, type: r.type }));

      const response = await fetch('/api/admin/registrations/bulk-reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          registrations: selectedData,
          reason: bulkRejectReason 
        }),
      });

      if (!response.ok) throw new Error('Failed to bulk reject registrations');
      
      const result = await response.json();
      toast({
        title: "Success",
        description: result.message,
      });

      setSelectedRegistrations(new Set());
      setSelectAllMode('none');
      setBulkRejectReason('');
      setShowBulkRejectDialog(false);
      fetchPendingRegistrations();
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/recent-activity'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard-metrics'] });
    } catch (error) {
      console.error('Error bulk rejecting registrations:', error);
      toast({
        title: "Error",
        description: "Failed to bulk reject registrations",
        variant: "destructive",
      });
    } finally {
      setBulkProcessing(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-muted-foreground">Loading pending registrations...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pending Registrations</h1>
          {selectedRegistrations.size > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {selectedRegistrations.size} selected
              {selectAllMode === 'all' && (
                <span className="ml-2 text-blue-500 font-medium">(All {registrations.length} items)</span>
              )}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {selectedRegistrations.size > 0 && (
            <>
              <Button
                onClick={handleBulkApprove}
                disabled={bulkProcessing}
                className="bg-green-600 hover:bg-green-700"
                data-testid="button-bulk-approve"
              >
                <Check className="w-4 h-4 mr-2" />
                Approve Selected ({selectedRegistrations.size})
              </Button>
              <Dialog open={showBulkRejectDialog} onOpenChange={setShowBulkRejectDialog}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={bulkProcessing}
                    className="border-red-600 text-red-400 hover:bg-red-900/30"
                    data-testid="button-bulk-reject"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject Selected ({selectedRegistrations.size})
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Bulk Reject Registrations</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="bulk-reason">Reason for rejection</Label>
                      <Textarea
                        id="bulk-reason"
                        value={bulkRejectReason}
                        onChange={(e) => setBulkRejectReason(e.target.value)}
                        placeholder="Enter reason for rejecting these registrations..."
                        className="mt-2"
                        rows={3}
                        data-testid="textarea-bulk-reject-reason"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowBulkRejectDialog(false);
                          setBulkRejectReason('');
                        }}
                        data-testid="button-cancel-bulk-reject"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleBulkReject}
                        disabled={bulkProcessing || !bulkRejectReason.trim()}
                        className="bg-red-600 hover:bg-red-700"
                        data-testid="button-confirm-bulk-reject"
                      >
                        {bulkProcessing ? 'Rejecting...' : 'Reject'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
          <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/30 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-500/50">
            {registrations.length} Pending
          </Badge>
        </div>
      </div>

      {registrations.length === 0 ? (
        <div className="bg-card rounded-lg p-8 text-center">
          <Users className="w-12 h-12 text-muted-foreground/60 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Pending Registrations</h3>
          <p className="text-muted-foreground">All registrations are up to date!</p>
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-muted/50">
                <TableHead className="w-12 relative">
                  <div className="flex items-center justify-center">
                    <button
                      onClick={toggleSelectAll}
                      className="flex items-center justify-center w-5 h-5 rounded border-2 border-muted-foreground/30 hover:border-muted-foreground/50 transition-colors"
                      data-testid="checkbox-select-all"
                      title={
                        selectAllMode === 'none' 
                          ? 'Select all on this page' 
                          : selectAllMode === 'page' 
                          ? `Select all ${registrations.length} items` 
                          : 'Deselect all'
                      }
                    >
                      {selectAllMode === 'all' ? (
                        <CheckSquare className="w-4 h-4 text-blue-500" />
                      ) : selectAllMode === 'page' ? (
                        <CheckSquare className="w-4 h-4 text-primary" />
                      ) : (
                        <Square className="w-4 h-4 text-muted-foreground/30" />
                      )}
                    </button>
                  </div>
                  {/* Tooltip-style select all option */}
                  {selectAllMode === 'page' && registrations.length > paginatedRegistrations.length && (
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 z-50">
                      <div 
                        className="bg-blue-600 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap cursor-pointer hover:bg-blue-700 transition-colors"
                        onClick={toggleSelectAll}
                      >
                        Select all {registrations.length}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-blue-600"></div>
                      </div>
                    </div>
                  )}
                </TableHead>
                <TableHead className="text-muted-foreground">Type</TableHead>
                <TableHead className="text-muted-foreground">Name</TableHead>
                <TableHead className="text-muted-foreground">Email</TableHead>
                <TableHead className="text-muted-foreground">Phone</TableHead>
                <TableHead className="text-muted-foreground">Registered</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRegistrations.map((registration) => (
                <TableRow key={registration.id} className="border-zinc-700 hover:bg-zinc-800/30">
                  <TableCell>
                    <button
                      onClick={() => toggleSelectRegistration(registration.id)}
                      className="flex items-center justify-center w-5 h-5 rounded border-2 border-muted-foreground/30 hover:border-muted-foreground/50 transition-colors"
                      data-testid={`checkbox-select-${registration.id}`}
                    >
                      {selectedRegistrations.has(registration.id) ? (
                        <CheckSquare className="w-4 h-4 text-primary" />
                      ) : (
                        <Square className="w-4 h-4 text-muted-foreground/30" />
                      )}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {registration.type === 'parent' ? (
                        <User className="w-4 h-4 text-blue-400" />
                      ) : (
                        <Users className="w-4 h-4 text-green-400" />
                      )}
                      <span className="capitalize text-muted-foreground">{registration.type}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {registration.firstName} {registration.lastName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{registration.email}</TableCell>
                  <TableCell className="text-muted-foreground">{registration.phone || '-'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(registration.createdAt), 'MMM d, yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/30 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-500/50">
                      {registration.registrationStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApprove(registration.id, registration.type)}
                        disabled={processing === registration.id}
                        className="border-green-600 text-green-400 hover:bg-green-900/30"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Approve
                      </Button>
                      
                      <Dialog 
                        open={showRejectDialog === registration.id} 
                        onOpenChange={(open) => setShowRejectDialog(open ? registration.id : null)}
                      >
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={processing === registration.id}
                            className="border-red-600 text-red-400 hover:bg-red-900/30"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Reject
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-zinc-900 border-zinc-700">
                          <DialogHeader>
                            <DialogTitle className="text-white">
                              Reject Registration: {registration.firstName} {registration.lastName}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="reason" className="text-zinc-300">Reason for Rejection</Label>
                              <Textarea
                                id="reason"
                                placeholder="Please provide a reason for rejecting this registration..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="bg-zinc-800 border-zinc-600 text-white"
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setShowRejectDialog(null);
                                  setRejectReason('');
                                }}
                                className="border-zinc-600 text-zinc-300"
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => handleReject(registration.id, registration.type)}
                                disabled={processing === registration.id || !rejectReason.trim()}
                              >
                                Reject Registration
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Bottom Pagination */}
      {registrations.length > 0 && (
        <Pagination
          totalItems={registrations.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          className="bg-card p-4 rounded-lg border border-border"
        />
      )}
    </AdminLayout>
  );
}