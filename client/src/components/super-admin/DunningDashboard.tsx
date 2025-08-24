import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, RefreshCw, CheckCircle2, XCircle, Clock, Calendar } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { get, post } from '@/lib/api';

interface DunningStats {
  failed: number;
  retryScheduled: number;
  retrying: number;
  recovered: number;
  uncollectible: number;
}

interface DunningEvent {
  id: string;
  status: string;
  attempt_no: number;
  reason: string;
  created_at: string;
  invoice_id: string;
  tenant_id: string;
  tenant_name: string;
  total_cents: number;
  invoice_status: string;
  total_amount: number;
}

interface DunningListResponse {
  rows: DunningEvent[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function DunningDashboard() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch dashboard stats
  const { data: stats } = useQuery<DunningStats>({
    queryKey: ['/api/super-admin/dunning/dashboard'],
    queryFn: () => get('/api/super-admin/dunning/dashboard'),
  });

  // Fetch dunning events list
  const { data: dunningList, isLoading } = useQuery<DunningListResponse>({
    queryKey: ['/api/super-admin/dunning', { page, pageSize, status: statusFilter }],
    queryFn: () => get('/api/super-admin/dunning', { 
      page: page.toString(), 
      pageSize: pageSize.toString(),
      ...(statusFilter !== 'all' && { status: statusFilter })
    }),
  });

  // Retry payment mutation
  const retryMutation = useMutation({
    mutationFn: (id: string) => post(`/api/super-admin/dunning/${id}/retry`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/dunning'] });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/dunning/dashboard'] });
      toast({ title: "Success", description: "Payment retry scheduled successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to schedule retry",
        variant: "destructive" 
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'failed': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'retry_scheduled': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'retrying': return <RefreshCw className="w-4 h-4 text-blue-600" />;
      case 'recovered': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'uncollectible': return <AlertCircle className="w-4 h-4 text-gray-600" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
      case 'retry_scheduled': return <Badge variant="secondary">Retry Scheduled</Badge>;
      case 'retrying': return <Badge variant="default" className="bg-blue-600">Retrying</Badge>;
      case 'recovered': return <Badge variant="default" className="bg-green-600">Recovered</Badge>;
      case 'uncollectible': return <Badge variant="outline">Uncollectible</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">In Retry</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.retrying}</p>
                </div>
                <RefreshCw className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Scheduled</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.retryScheduled}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Recovered</p>
                  <p className="text-2xl font-bold text-green-600">{stats.recovered}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Uncollectible</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.uncollectible}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <CardTitle>Dunning Events</CardTitle>
            <div className="flex space-x-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="retry_scheduled">Retry Scheduled</SelectItem>
                  <SelectItem value="retrying">Retrying</SelectItem>
                  <SelectItem value="recovered">Recovered</SelectItem>
                  <SelectItem value="uncollectible">Uncollectible</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex space-x-4 p-4">
                  <div className="w-4 h-4 bg-muted rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                  <div className="w-20 h-8 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          ) : dunningList?.rows.length ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Attempt</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dunningList.rows.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">
                        {event.tenant_name}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(event.total_amount * 100)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(event.status)}
                          {getStatusBadge(event.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">#{event.attempt_no}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {event.reason || 'No reason provided'}
                      </TableCell>
                      <TableCell>
                        {new Date(event.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {(event.status === 'failed' || event.status === 'retry_scheduled') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => retryMutation.mutate(event.id)}
                            disabled={retryMutation.isPending}
                          >
                            <RefreshCw className="w-4 h-4 mr-1" />
                            {retryMutation.isPending ? 'Retrying...' : 'Retry'}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {dunningList.totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, dunningList.total)} of {dunningList.total} results
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(dunningList.totalPages, p + 1))}
                      disabled={page === dunningList.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">No dunning events found</p>
              <p className="text-sm text-muted-foreground mt-2">All payments are processing successfully</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}