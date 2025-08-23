import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import FilterBar from '@/components/shared/FilterBar';
import { get } from '@/lib/api';
import { ChevronLeft, ChevronRight, CreditCard, AlertTriangle } from 'lucide-react';

interface PlatformPayment {
  id: string;
  tenant: string;
  adminName: string;
  planLevel: string;
  gateway: string;
  paymentId: string;
  method: string;
  status: 'completed' | 'failed' | 'pending';
  date: string;
}

interface PaymentResponse {
  rows: PlatformPayment[];
  page: number;
  pageSize: number;
  totalRows: number;
}

export default function PlatformBilling() {
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [tenantId, setTenantId] = useState('all');
  const [status, setStatus] = useState('all');
  const [method, setMethod] = useState('all');
  const pageSize = 25;

  const { data, isLoading } = useQuery<PaymentResponse>({
    queryKey: ['/api/super-admin/platform-payments', page, dateFrom, dateTo, tenantId, status, method],
    queryFn: () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString()
      });
      if (dateFrom) params.set('from', encodeURIComponent(dateFrom));
      if (dateTo) params.set('to', encodeURIComponent(dateTo));
      if (tenantId !== 'all') params.set('tenantId', tenantId);
      if (status !== 'all') params.set('status', status);
      if (method !== 'all') params.set('method', method);
      return get<PaymentResponse>(`/api/super-admin/platform-payments?${params}`);
    },
  });

  const handleDateRangeChange = (from: string, to: string) => {
    setDateFrom(from);
    setDateTo(to);
    setPage(1); // Reset to first page when filters change
  };

  const handleTenantChange = (value: string) => {
    setTenantId(value);
    setPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setPage(1);
  };

  const handleMethodChange = (value: string) => {
    setMethod(value);
    setPage(1);
  };

  const handleClearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setTenantId('all');
    setStatus('all');
    setMethod('all');
    setPage(1);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getMethodIcon = (method: string) => {
    return method === 'card' ? <CreditCard className="w-4 h-4" /> : <span className="text-sm font-medium">ACH</span>;
  };

  const totalPages = Math.ceil((data?.totalRows || 0) / pageSize);
  const showingFrom = ((page - 1) * pageSize) + 1;
  const showingTo = Math.min(page * pageSize, data?.totalRows || 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Platform Billing</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          QIT platform subscription payments from tenant organizations
        </p>
      </div>

      {/* Custom filter bar for platform billing */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 min-w-[180px]">
              <label className="text-sm font-medium mb-1 block">Tenant Organization</label>
              <select 
                value={tenantId} 
                onChange={(e) => handleTenantChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">All Tenants</option>
                <option value="elite-footwork">Elite Footwork Academy</option>
                <option value="futsal-culture">Futsal Culture</option>
                <option value="metro-futsal">Metro Futsal</option>
              </select>
            </div>
            
            <div className="flex-1 min-w-[150px]">
              <label className="text-sm font-medium mb-1 block">Payment Status</label>
              <select 
                value={status} 
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div className="flex-1 min-w-[150px]">
              <label className="text-sm font-medium mb-1 block">Payment Method</label>
              <select 
                value={method} 
                onChange={(e) => handleMethodChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">All Methods</option>
                <option value="card">Credit Card</option>
                <option value="ach">ACH Transfer</option>
              </select>
            </div>

            <div className="flex-1 min-w-[140px]">
              <label className="text-sm font-medium mb-1 block">From Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex-1 min-w-[140px]">
              <label className="text-sm font-medium mb-1 block">To Date</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleDateRangeChange(dateFrom, dateTo)}
                className="whitespace-nowrap"
              >
                Apply Filters
              </Button>
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="whitespace-nowrap"
              >
                Clear All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Platform Subscription Payments
            {isLoading && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data?.rows && data.rows.length > 0 ? (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Gateway</TableHead>
                      <TableHead>Payment ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.rows.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.tenant}</TableCell>
                        <TableCell>{payment.adminName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{payment.planLevel}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getMethodIcon(payment.method)}
                            {payment.method === 'card' ? 'Card' : 'ACH'}
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{payment.gateway}</TableCell>
                        <TableCell className="font-mono text-sm">{payment.paymentId}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(payment.status)}>
                            {payment.status === 'failed' && <AlertTriangle className="w-3 h-3 mr-1" />}
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(payment.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Showing {showingFrom} to {showingTo} of {data.totalRows} results
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-sm">
                    Page {page} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                {isLoading ? 'Loading platform payments...' : 'No platform payments found'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}