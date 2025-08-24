import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, ShieldCheck, Users, UserCheck, Search, Ban, AlertTriangle, CheckCircle, Clock, Code, Download, RefreshCw, TestTube, BarChart3, FileText } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import FilterBar from '@/components/shared/FilterBar';

interface SecurityOverview {
  superAdmins: {
    total: number;
    withMfa: number;
  };
  tenantAdmins: {
    total: number;
    withMfa: number;
  };
}

interface ImpersonationEvent {
  id: string;
  super_admin_id: string;
  super_admin_email: string;
  tenant_id: string;
  tenant_name: string;
  reason: string;
  started_at: string;
  expires_at: string;
  revoked_at: string | null;
  ip: string;
}

interface AuditLog {
  id: string;
  actor_id: string;
  actor_role: string;
  section: string;
  action: string;
  target_id: string;
  diff: any;
  ip: string;
  created_at: string;
}

interface PaginatedResponse<T> {
  rows: T[];
  page: number;
  pageSize: number;
  totalRows: number;
}

export default function SecurityAudit() {
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    to: new Date().toISOString(),
  });
  const [impersonationsPage, setImpersonationsPage] = useState(1);
  const [auditLogsPage, setAuditLogsPage] = useState(1);
  const [auditSearchTerm, setAuditSearchTerm] = useState('');

  const queryClient = useQueryClient();

  // Overview query
  const { data: overview, isLoading: overviewLoading } = useQuery<SecurityOverview>({
    queryKey: ['super-admin', 'security', 'overview'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/super-admin/security/overview');
      return await response.json();
    },
  });

  // Impersonations query
  const { data: impersonationsData, isLoading: impersonationsLoading } = useQuery<PaginatedResponse<ImpersonationEvent>>({
    queryKey: ['super-admin', 'security', 'impersonations', dateRange, impersonationsPage],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/super-admin/security/impersonations?from=${encodeURIComponent(dateRange.from)}&to=${encodeURIComponent(dateRange.to)}&page=${impersonationsPage}&pageSize=25`);
      return await response.json();
    },
  });

  // Audit logs query
  const { data: auditLogsData, isLoading: auditLogsLoading } = useQuery<PaginatedResponse<AuditLog>>({
    queryKey: ['super-admin', 'security', 'audit-logs', dateRange, auditLogsPage],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/super-admin/security/audit-logs?from=${encodeURIComponent(dateRange.from)}&to=${encodeURIComponent(dateRange.to)}&page=${auditLogsPage}&pageSize=25`);
      return await response.json();
    },
  });

  // Revoke impersonation mutation
  const revokeMutation = useMutation({
    mutationFn: (impersonationId: string) => 
      apiRequest('POST', `/api/super-admin/security/impersonations/${impersonationId}/revoke`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['super-admin', 'security', 'impersonations']
      });
    },
  });

  const superAdminMfaPercentage = overview?.superAdmins?.total > 0 
    ? (overview.superAdmins.withMfa / overview.superAdmins.total) * 100 
    : 0;

  const tenantAdminMfaPercentage = overview?.tenantAdmins?.total > 0 
    ? (overview.tenantAdmins.withMfa / overview.tenantAdmins.total) * 100 
    : 0;

  // Filter audit logs by search term (client-side)
  const filteredAuditLogs = auditLogsData?.rows.filter(log => {
    if (!auditSearchTerm) return true;
    const searchLower = auditSearchTerm.toLowerCase();
    return (
      log.section.toLowerCase().includes(searchLower) ||
      log.action.toLowerCase().includes(searchLower) ||
      log.actor_role.toLowerCase().includes(searchLower)
    );
  }) || [];

  return (
    <div className="space-y-8 max-w-none">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Security & Audit
          </h1>
          <p className="text-lg text-muted-foreground mt-1">
            Monitor authentication security and track administrative activities
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Logs
          </Button>
          <Button size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="bg-muted/50 p-4 rounded-lg">
        <FilterBar
          dateFrom={dateRange.from}
          dateTo={dateRange.to}
          onDateRangeChange={(from, to) => setDateRange({ from, to })}
        />
      </div>

      {/* MFA Adoption Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-foreground flex items-center">
          <Shield className="h-6 w-6 mr-3" />
          MFA Adoption
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card data-testid="super-admin-mfa" className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base font-semibold">Super Admins</CardTitle>
              <ShieldCheck className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent className="space-y-4">
              {overviewLoading ? (
                <div className="animate-pulse">
                  <div className="h-10 bg-muted rounded mb-3"></div>
                  <div className="h-4 bg-muted rounded"></div>
                </div>
              ) : (
                <>
                  <div className="flex items-baseline space-x-2 mb-3">
                    <span className="text-3xl font-bold text-green-600">
                      {overview?.superAdmins.withMfa || 0}
                    </span>
                    <span className="text-xl text-muted-foreground">/ {overview?.superAdmins.total || 0}</span>
                  </div>
                  <Progress value={superAdminMfaPercentage} className="mb-3 h-3" />
                  <p className="text-sm text-green-600 font-medium">
                    {superAdminMfaPercentage.toFixed(1)}% have MFA enabled
                  </p>
                  {superAdminMfaPercentage < 100 && (
                    <Alert className="mt-3">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        Some super admins don't have MFA enabled - consider enforcing MFA
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card data-testid="tenant-admin-mfa">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tenant Admins</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {overviewLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              ) : (
                <>
                  <div className="flex items-baseline space-x-2 mb-2">
                    <span className="text-2xl font-bold">
                      {overview?.tenantAdmins.withMfa || 0}
                    </span>
                    <span className="text-lg text-gray-500">/ {overview?.tenantAdmins.total || 0}</span>
                  </div>
                  <Progress value={tenantAdminMfaPercentage} className="mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {tenantAdminMfaPercentage.toFixed(1)}% have MFA enabled
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Impersonations Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Impersonation Sessions
        </h2>

        <Card data-testid="impersonations-table">
          <CardHeader>
            <CardTitle>Recent Impersonation Events</CardTitle>
          </CardHeader>
          <CardContent>
            {impersonationsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : !impersonationsData || impersonationsData.rows.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No impersonation events found for selected timeframe
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Started</TableHead>
                      <TableHead>Super Admin</TableHead>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {impersonationsData.rows.map((event) => {
                      const isActive = !event.revoked_at && new Date(event.expires_at) > new Date();
                      const isExpired = new Date(event.expires_at) <= new Date();
                      
                      return (
                        <TableRow key={event.id} data-testid={`impersonation-${event.id}`}>
                          <TableCell className="text-sm">
                            {new Date(event.started_at).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{event.super_admin_email}</div>
                              <div className="text-xs text-gray-500">{event.super_admin_id}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{event.tenant_name}</div>
                              <div className="text-xs text-gray-500">{event.tenant_id}</div>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <p className="truncate">{event.reason}</p>
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(event.expires_at).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {event.revoked_at ? (
                              <Badge variant="secondary" className="bg-gray-100">
                                <Ban className="h-3 w-3 mr-1" />
                                Revoked
                              </Badge>
                            ) : isExpired ? (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                                <Clock className="h-3 w-3 mr-1" />
                                Expired
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {event.ip}
                          </TableCell>
                          <TableCell>
                            {isActive && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => revokeMutation.mutate(event.id)}
                                disabled={revokeMutation.isPending}
                                data-testid={`revoke-${event.id}`}
                              >
                                {revokeMutation.isPending ? 'Revoking...' : 'Revoke'}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {/* Pagination for impersonations */}
                {impersonationsData.totalRows > impersonationsData.pageSize && (
                  <div className="flex items-center justify-between px-2 py-4">
                    <div className="text-sm text-gray-500">
                      Showing {((impersonationsData.page - 1) * impersonationsData.pageSize) + 1} to {Math.min(impersonationsData.page * impersonationsData.pageSize, impersonationsData.totalRows)} of {impersonationsData.totalRows} events
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setImpersonationsPage(p => Math.max(1, p - 1))}
                        disabled={impersonationsData.page <= 1}
                        data-testid="impersonations-prev"
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setImpersonationsPage(p => p + 1)}
                        disabled={impersonationsData.page * impersonationsData.pageSize >= impersonationsData.totalRows}
                        data-testid="impersonations-next"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Audit Log Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
          <Code className="h-5 w-5 mr-2" />
          Audit Log
        </h2>

        <Card data-testid="audit-log-table">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>System Activity Log</CardTitle>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search section, action, or role..."
                    value={auditSearchTerm}
                    onChange={(e) => setAuditSearchTerm(e.target.value)}
                    className="pl-10 w-80"
                    data-testid="audit-search"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {auditLogsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : !auditLogsData || auditLogsData.rows.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No audit logs found for selected timeframe
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Diff</TableHead>
                      <TableHead>IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAuditLogs.map((log, index) => (
                      <TableRow key={log.id} data-testid={`audit-log-${index}`}>
                        <TableCell className="text-sm">
                          {new Date(log.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div>
                            <Badge variant="outline" className="mb-1">
                              {log.actor_role}
                            </Badge>
                            <div className="text-xs text-gray-500 font-mono">{log.actor_id}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{log.section}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{log.action}</span>
                        </TableCell>
                        <TableCell className="font-mono text-sm max-w-xs truncate">
                          {log.target_id}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          {log.diff ? (
                            <details className="cursor-pointer">
                              <summary className="text-blue-600 hover:text-blue-800 text-sm">
                                View changes
                              </summary>
                              <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto max-h-32">
                                {JSON.stringify(log.diff, null, 2)}
                              </pre>
                            </details>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {log.ip}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Search result count */}
                {auditSearchTerm && (
                  <div className="px-2 py-2 text-sm text-gray-500">
                    Showing {filteredAuditLogs.length} of {auditLogsData.totalRows} logs matching "{auditSearchTerm}"
                  </div>
                )}

                {/* Pagination for audit logs */}
                {auditLogsData.totalRows > auditLogsData.pageSize && (
                  <div className="flex items-center justify-between px-2 py-4">
                    <div className="text-sm text-gray-500">
                      Showing {((auditLogsData.page - 1) * auditLogsData.pageSize) + 1} to {Math.min(auditLogsData.page * auditLogsData.pageSize, auditLogsData.totalRows)} of {auditLogsData.totalRows} logs
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAuditLogsPage(p => Math.max(1, p - 1))}
                        disabled={auditLogsData.page <= 1}
                        data-testid="audit-prev"
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAuditLogsPage(p => p + 1)}
                        disabled={auditLogsData.page * auditLogsData.pageSize >= auditLogsData.totalRows}
                        data-testid="audit-next"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}