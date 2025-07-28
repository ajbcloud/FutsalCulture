import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin-layout';
import { adminPayments } from '@/lib/adminApi';
import { queryClient } from '@/lib/queryClient';
import { usePageRefresh } from '@/hooks/use-page-refresh';
import { Button } from '../../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { CheckCircle, RefreshCw, DollarSign, XCircle, Info, Check } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
import { AGE_GROUPS, calculateAgeGroupFromAge } from '@shared/constants';
import { Pagination } from '@/components/pagination';

export default function AdminPayments() {
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<any[]>([]);
  const [paginatedPayments, setPaginatedPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    ageGroup: '',
    gender: '',
    search: '',
    dateRange: ''
  });
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  const { toast } = useToast();
  
  // Refresh payments data when returning to page
  usePageRefresh(["/api/admin/payments"]);

  const loadPayments = async () => {
    try {
      const [pending, paid] = await Promise.all([
        adminPayments.list('pending'),
        adminPayments.list('paid')
      ]);
      
      // Combine all payments and add status field
      const combined = [
        ...pending.map((p: any) => ({ ...p, status: 'pending' })),
        ...paid.map((p: any) => ({ ...p, status: p.refundedAt ? 'refunded' : 'paid' }))
      ];
      
      console.log('admin payments (combined):', combined);
      setAllPayments(combined);
      setFilteredPayments(combined);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  // Handle URL search parameters when component mounts and when URL changes
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchTerm = urlParams.get('search');
    
    if (searchTerm) {
      setFilters(prev => ({
        ...prev,
        search: searchTerm
      }));
    }
  }, []);

  // Listen for URL changes to re-apply search filtering  
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const searchTerm = urlParams.get('search');
      
      setFilters(prev => ({
        ...prev,
        search: searchTerm || ''
      }));
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const filterPayments = (payments: any[]) => {
      return payments.filter((payment: any) => {
        const player = payment.player;
        const age = new Date().getFullYear() - player.birthYear;
        const ageGroup = calculateAgeGroupFromAge(age);
        
        const matchesStatus = filters.status === 'all' || payment.status === filters.status;
        const matchesAgeGroup = !filters.ageGroup || filters.ageGroup === 'all' || ageGroup === filters.ageGroup;
        const matchesGender = !filters.gender || filters.gender === 'all' || player.gender === filters.gender;
        const matchesSearch = !filters.search || 
          player.firstName.toLowerCase().includes(filters.search.toLowerCase()) ||
          player.lastName.toLowerCase().includes(filters.search.toLowerCase()) ||
          `${player.firstName} ${player.lastName}`.toLowerCase().includes(filters.search.toLowerCase()) ||
          (payment.parent && payment.parent.firstName && payment.parent.firstName.toLowerCase().includes(filters.search.toLowerCase())) ||
          (payment.parent && payment.parent.lastName && payment.parent.lastName.toLowerCase().includes(filters.search.toLowerCase())) ||
          (payment.parent && `${payment.parent.firstName} ${payment.parent.lastName}`.toLowerCase().includes(filters.search.toLowerCase()));
        
        return matchesStatus && matchesAgeGroup && matchesGender && matchesSearch;
      });
    };

    setFilteredPayments(filterPayments(allPayments));
    setCurrentPage(1); // Reset to first page when filters change
  }, [allPayments, filters]);

  // Apply pagination whenever filtered payments or pagination settings change
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedPayments(filteredPayments.slice(startIndex, endIndex));
  }, [filteredPayments, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleConfirmPayment = async (signupId: string) => {
    try {
      await adminPayments.confirm(signupId);
      toast({ title: "Payment confirmed successfully" });
      loadPayments(); // Refresh data
      
      // Refresh all dashboard-related queries
      queryClient.invalidateQueries({ queryKey: ['/api/admin/recent-activity'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast({ title: "Error confirming payment", variant: "destructive" });
    }
  };

  const handleRefund = async (paymentId: string) => {
    const reason = prompt('Please provide a reason for the refund:');
    if (reason && confirm('Are you sure you want to issue a refund?')) {
      try {
        await adminPayments.refund(paymentId, reason);
        toast({ title: "Refund processed successfully" });
        loadPayments(); // Refresh data
        
        // Refresh all dashboard-related queries
        queryClient.invalidateQueries({ queryKey: ['/api/admin/recent-activity'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard-metrics'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      } catch (error) {
        console.error('Error processing refund:', error);
        toast({ title: "Error processing refund", variant: "destructive" });
      }
    }
  };

  const handleMassConfirmPayments = async () => {
    if (selectedPayments.size === 0) {
      toast({ title: "No payments selected", variant: "destructive" });
      return;
    }

    if (!confirm(`Are you sure you want to confirm ${selectedPayments.size} payment(s)?`)) {
      return;
    }

    setIsProcessing(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Process payments one by one for better error handling
      for (const paymentId of Array.from(selectedPayments)) {
        try {
          await adminPayments.confirm(paymentId);
          successCount++;
        } catch (error) {
          console.error(`Error confirming payment ${paymentId}:`, error);
          errorCount++;
        }
      }

      // Show results
      if (successCount > 0) {
        toast({ title: `${successCount} payment(s) confirmed successfully` });
      }
      if (errorCount > 0) {
        toast({ 
          title: `${errorCount} payment(s) failed to confirm`, 
          variant: "destructive" 
        });
      }

      // Clear selection and refresh data
      setSelectedPayments(new Set());
      loadPayments();
      
      // Refresh all dashboard-related queries
      queryClient.invalidateQueries({ queryKey: ['/api/admin/recent-activity'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
    } finally {
      setIsProcessing(false);
    }
  };

  const togglePaymentSelection = (paymentId: string) => {
    const newSelection = new Set(selectedPayments);
    if (newSelection.has(paymentId)) {
      newSelection.delete(paymentId);
    } else {
      newSelection.add(paymentId);
    }
    setSelectedPayments(newSelection);
  };

  const toggleSelectAll = () => {
    const pendingPayments = filteredPayments.filter(p => p.status === 'pending');
    if (selectedPayments.size === pendingPayments.length) {
      setSelectedPayments(new Set());
    } else {
      setSelectedPayments(new Set(pendingPayments.map(p => p.id)));
    }
  };

  const pendingPayments = filteredPayments.filter(p => p.status === 'pending');
  const selectedPendingCount = Array.from(selectedPayments).filter(id => 
    pendingPayments.some(p => p.id === id)
  ).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Pending</Badge>;
      case 'paid':
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Paid</Badge>;
      case 'refunded':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getActionButton = (payment: any) => {
    switch (payment.status) {
      case 'pending':
        return (
          <Button 
            size="sm" 
            onClick={() => handleConfirmPayment(payment.id)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Confirm Payment
          </Button>
        );
      case 'paid':
        return (
          <Button 
            size="sm" 
            variant="destructive"
            onClick={() => handleRefund(payment.id)}
          >
            <XCircle className="h-4 w-4 mr-1" />
            Refund
          </Button>
        );
      case 'refunded':
        return (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-gray-500">
              <XCircle className="h-4 w-4 mr-1" />
              Refunded
            </Badge>
            {payment.refundReason && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="flex items-center text-xs text-zinc-400 hover:text-zinc-300">
                      <Info className="h-3 w-3 mr-1" />
                      {payment.refundReason.length > 20 
                        ? `${payment.refundReason.substring(0, 20)}...` 
                        : payment.refundReason}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <div>
                      <p className="font-medium">Refund Reason:</p>
                      <p className="text-sm">{payment.refundReason}</p>
                      {payment.refundedAt && (
                        <p className="text-xs text-zinc-400 mt-1">
                          Refunded: {format(new Date(payment.refundedAt), 'MMM d, yyyy h:mm a')}
                        </p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-white mb-6">Payments & Refunds</h1>

      {/* Filter Controls */}
      <div className="bg-zinc-900 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label className="text-zinc-300">Search</Label>
            <Input
              placeholder="Search players or parents..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          <div>
            <Label className="text-zinc-300">Status</Label>
            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-zinc-300">Age Group</Label>
            <Select value={filters.ageGroup} onValueChange={(value) => setFilters(prev => ({ ...prev, ageGroup: value }))}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="All Ages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ages</SelectItem>
                {AGE_GROUPS.map(age => (
                  <SelectItem key={age} value={age}>{age}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-zinc-300">Gender</Label>
            <Select value={filters.gender} onValueChange={(value) => setFilters(prev => ({ ...prev, gender: value }))}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="All Genders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="boys">Boys</SelectItem>
                <SelectItem value="girls">Girls</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {pendingPayments.length > 0 && (
        <div className="bg-zinc-900 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={pendingPayments.length > 0 && selectedPayments.size === pendingPayments.length}
                  onChange={toggleSelectAll}
                  className="rounded border-zinc-600 bg-zinc-800 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-zinc-300 text-sm">
                  Select All Pending ({pendingPayments.length})
                </span>
              </div>
              {selectedPendingCount > 0 && (
                <span className="text-blue-400 text-sm">
                  {selectedPendingCount} selected
                </span>
              )}
            </div>
            
            {selectedPendingCount > 0 && (
              <Button
                onClick={handleMassConfirmPayments}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Confirm {selectedPendingCount} Payment(s)
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Top Pagination */}
      {filteredPayments.length > 0 && (
        <Pagination
          totalItems={filteredPayments.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          className="bg-zinc-900 p-4 rounded-lg border border-zinc-800"
        />
      )}

      {/* Single Payments Table */}
      <div className="bg-zinc-900 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800">
              <TableHead className="text-zinc-300 w-12">
                {pendingPayments.length > 0 && (
                  <input
                    type="checkbox"
                    checked={pendingPayments.length > 0 && selectedPayments.size === pendingPayments.length}
                    onChange={toggleSelectAll}
                    className="rounded border-zinc-600 bg-zinc-800 text-blue-600 focus:ring-blue-500"
                  />
                )}
              </TableHead>
              <TableHead className="text-zinc-300">Player</TableHead>
              <TableHead className="text-zinc-300">Parent</TableHead>
              <TableHead className="text-zinc-300">Session</TableHead>
              <TableHead className="text-zinc-300">Status</TableHead>
              <TableHead className="text-zinc-300">Reserved At</TableHead>
              <TableHead className="text-zinc-300">Amount</TableHead>
              <TableHead className="text-zinc-300">Notes/Actions</TableHead>
              <TableHead className="text-zinc-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedPayments.map((payment: any) => (
              <TableRow key={payment.id} className="border-zinc-800">
                <TableCell className="w-12">
                  {payment.status === 'pending' && (
                    <input
                      type="checkbox"
                      checked={selectedPayments.has(payment.id)}
                      onChange={() => togglePaymentSelection(payment.id)}
                      className="rounded border-zinc-600 bg-zinc-800 text-blue-600 focus:ring-blue-500"
                    />
                  )}
                </TableCell>
                <TableCell className="text-white">
                  {payment.player?.firstName} {payment.player?.lastName}
                </TableCell>
                <TableCell className="text-zinc-300">
                  {payment.parent?.firstName ? `${payment.parent.firstName} ${payment.parent.lastName}` : 'Unknown Parent'}
                </TableCell>
                <TableCell className="text-zinc-300">
                  {payment.session?.title || 'Unknown Session'}
                </TableCell>
                <TableCell>
                  {getStatusBadge(payment.status)}
                </TableCell>
                <TableCell className="text-zinc-300">
                  {format(new Date(payment.createdAt), 'MMM d, yyyy h:mm a')}
                </TableCell>
                <TableCell className="text-zinc-300">$10.00</TableCell>
                <TableCell className="max-w-xs">
                  {payment.status === 'refunded' ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2">
                            <Info className="h-4 w-4 text-blue-400" />
                            <span className="text-sm text-zinc-400 truncate">
                              {payment.refundReason || 'Refunded'}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-zinc-800 border-zinc-700 text-white p-3 max-w-sm">
                          <div className="space-y-2">
                            <div>
                              <p className="font-semibold">Refund Reason:</p>
                              <p className="text-sm">{payment.refundReason || 'No reason provided'}</p>
                            </div>
                            {payment.refundedAt && (
                              <div>
                                <p className="font-semibold">Refunded:</p>
                                <p className="text-sm">{format(new Date(payment.refundedAt), 'MMM d, yyyy h:mm a')}</p>
                              </div>
                            )}
                            {payment.refundedBy && (
                              <div>
                                <p className="font-semibold">Refunded By:</p>
                                <p className="text-sm">Admin ID: {payment.refundedBy}</p>
                              </div>
                            )}
                            {payment.adminNotes && (
                              <div>
                                <p className="font-semibold">Admin Notes:</p>
                                <p className="text-sm">{payment.adminNotes}</p>
                              </div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : payment.adminNotes ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2">
                            <Info className="h-4 w-4 text-blue-400" />
                            <span className="text-sm text-zinc-400 truncate">Admin notes</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-zinc-800 border-zinc-700 text-white p-3 max-w-sm">
                          <div>
                            <p className="font-semibold">Admin Notes:</p>
                            <p className="text-sm">{payment.adminNotes}</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <span className="text-zinc-500 text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {getActionButton(payment)}
                </TableCell>
              </TableRow>
            ))}
            {paginatedPayments.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-zinc-400 py-8">
                  {filteredPayments.length === 0 ? 'No payments found' : 'No payments on this page'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Bottom Pagination */}
      {filteredPayments.length > 0 && (
        <Pagination
          totalItems={filteredPayments.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          className="bg-zinc-900 p-4 rounded-lg border border-zinc-800"
        />
      )}
    </AdminLayout>
  );
}