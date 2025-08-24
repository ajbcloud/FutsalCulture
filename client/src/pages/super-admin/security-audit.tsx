import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Shield, Activity, Search, Download, Eye, Ban } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { get } from '@/lib/queryClient';

interface MFAData {
  superAdmins: { total: number; withMfa: number };
  tenantAdmins: { total: number; withMfa: number };
}

interface ImpersonationEvent {
  id: string;
  started_at: string;
  used_at?: string;
  ended_at?: string;
  expires_at: string;
  reason: string;
  jti: string;
  tenant_id: string;
  tenant_name: string;
  super_admin_id: string;
  super_admin_email: string;
  status: 'issued' | 'active' | 'ended' | 'expired';
}

interface AuditLog {
  created_at: string;
  tenant_id?: string;
  user_id?: string;
  section: string;
  action: string;
  meta?: any;
  is_impersonated: boolean;
  impersonator_id?: string;
  impersonation_event_id?: string;
}

export default function SecurityAudit() {
  const [activeTab, setActiveTab] = useState('mfa');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('7d');
  const [impersonationFilter, setImpersonationFilter] = useState('all');

  // MFA Adoption Data
  const { data: mfaData } = useQuery<MFAData>({
    queryKey: ['/api/super-admin/security/overview'],
    queryFn: () => get('/api/super-admin/security/overview')
  });

  // Impersonation Events
  const { data: impersonationResponse } = useQuery({
    queryKey: ['/api/super-admin/security/impersonation/events', dateFilter, searchQuery],
    queryFn: () => {
      const params = new URLSearchParams();
      if (dateFilter !== 'all') {
        const days = parseInt(dateFilter.replace('d', ''));
        const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
        params.append('from', from);
      }
      if (searchQuery) params.append('q', searchQuery);
      return get(`/api/super-admin/security/impersonation/events?${params.toString()}`);
    }
  });
  
  const impersonationEvents = (impersonationResponse as any)?.events || [];

  // Audit Logs
  const { data: auditResponse } = useQuery({
    queryKey: ['/api/super-admin/security/audit', dateFilter, searchQuery, impersonationFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (dateFilter !== 'all') {
        const days = parseInt(dateFilter.replace('d', ''));
        const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
        params.append('from', from);
      }
      if (searchQuery) params.append('q', searchQuery);
      if (impersonationFilter === 'impersonated') params.append('impersonated', '1');
      return get(`/api/super-admin/security/audit?${params.toString()}`);
    }
  });
  
  const auditLogs = (auditResponse as any)?.logs || [];

  const getStatusBadge = (status: string) => {
    const variants = {
      issued: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      ended: 'bg-gray-100 text-gray-800',
      expired: 'bg-red-100 text-red-800'
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const getMFAPercentage = (withMfa: number, total: number) => {
    return total > 0 ? Math.round((withMfa / total) * 100) : 0;
  };

  return (
    <div className="p-6 space-y-6" data-testid="security-audit-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Security & Audit</h1>
          <p className="text-gray-600">Monitor platform security, impersonation events, and system activity</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="mfa" className="flex items-center gap-2" data-testid="tab-mfa">
            <Shield className="h-4 w-4" />
            MFA Adoption
          </TabsTrigger>
          <TabsTrigger value="impersonation" className="flex items-center gap-2" data-testid="tab-impersonation">
            <Eye className="h-4 w-4" />
            Impersonation Events
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2" data-testid="tab-audit">
            <Activity className="h-4 w-4" />
            System Activity
          </TabsTrigger>
        </TabsList>

        {/* MFA Adoption Tab */}
        <TabsContent value="mfa" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card data-testid="card-super-admin-mfa">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Super Admin MFA Adoption
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Super Admins</span>
                    <span className="font-semibold" data-testid="text-super-admin-total">{mfaData?.superAdmins.total || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">With MFA Enabled</span>
                    <span className="font-semibold text-green-600" data-testid="text-super-admin-mfa">{mfaData?.superAdmins.withMfa || 0}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${getMFAPercentage(mfaData?.superAdmins.withMfa || 0, mfaData?.superAdmins.total || 0)}%` }}
                    ></div>
                  </div>
                  <div className="text-center">
                    <span className="text-2xl font-bold text-green-600" data-testid="text-super-admin-percentage">
                      {getMFAPercentage(mfaData?.superAdmins.withMfa || 0, mfaData?.superAdmins.total || 0)}%
                    </span>
                    <p className="text-sm text-gray-600">MFA Adoption Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-tenant-admin-mfa">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Tenant Admin MFA Adoption
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Tenant Admins</span>
                    <span className="font-semibold" data-testid="text-tenant-admin-total">{mfaData?.tenantAdmins.total || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">With MFA Enabled</span>
                    <span className="font-semibold text-green-600" data-testid="text-tenant-admin-mfa">{mfaData?.tenantAdmins.withMfa || 0}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${getMFAPercentage(mfaData?.tenantAdmins.withMfa || 0, mfaData?.tenantAdmins.total || 0)}%` }}
                    ></div>
                  </div>
                  <div className="text-center">
                    <span className="text-2xl font-bold text-green-600" data-testid="text-tenant-admin-percentage">
                      {getMFAPercentage(mfaData?.tenantAdmins.withMfa || 0, mfaData?.tenantAdmins.total || 0)}%
                    </span>
                    <p className="text-sm text-gray-600">MFA Adoption Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Impersonation Events Tab */}
        <TabsContent value="impersonation" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Impersonation Events</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search events..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 w-64"
                      data-testid="input-search-events"
                    />
                  </div>
                  <select 
                    value={dateFilter} 
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    data-testid="select-date-filter"
                  >
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                    <option value="all">All time</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {impersonationEvents.map((event: ImpersonationEvent) => (
                  <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`event-${event.id}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <div>
                        <div className="font-medium">{event.tenant_name}</div>
                        <div className="text-sm text-gray-600">
                          by {event.super_admin_email} • {formatDistanceToNow(new Date(event.started_at))} ago
                        </div>
                        <div className="text-sm text-gray-500 mt-1">{event.reason}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusBadge(event.status)}>
                        {event.status}
                      </Badge>
                      {event.status === 'active' && (
                        <Button variant="outline" size="sm" data-testid={`button-end-${event.id}`}>
                          <Ban className="h-4 w-4 mr-1" />
                          End
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {impersonationEvents.length === 0 && (
                  <div className="text-center py-8 text-gray-500" data-testid="text-no-events">
                    No impersonation events found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Activity Tab */}
        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>System Activity Log</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search activity..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 w-64"
                      data-testid="input-search-activity"
                    />
                  </div>
                  <select 
                    value={impersonationFilter} 
                    onChange={(e) => setImpersonationFilter(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    data-testid="select-impersonation-filter"
                  >
                    <option value="all">All activity</option>
                    <option value="impersonated">Impersonated only</option>
                  </select>
                  <select 
                    value={dateFilter} 
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    data-testid="select-audit-date-filter"
                  >
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                    <option value="all">All time</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {auditLogs.map((log: AuditLog, index: number) => (
                  <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${
                    log.is_impersonated ? 'bg-orange-50 border-l-4 border-l-orange-400' : 'bg-gray-50'
                  }`} data-testid={`audit-log-${index}`}>
                    <div className="flex items-center gap-4">
                      {log.is_impersonated && (
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                      )}
                      <div>
                        <div className="font-medium">
                          {log.section} • {log.action}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatDistanceToNow(new Date(log.created_at))} ago
                          {log.is_impersonated && (
                            <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                              Impersonated
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {log.tenant_id && `Tenant: ${log.tenant_id.slice(0, 8)}...`}
                    </div>
                  </div>
                ))}
                {auditLogs.length === 0 && (
                  <div className="text-center py-8 text-gray-500" data-testid="text-no-logs">
                    No audit logs found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}