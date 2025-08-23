import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import FilterBar from '@/components/shared/FilterBar';
import StatCard from '@/components/super-admin/ui/StatCard';
import Section from '@/components/super-admin/ui/Section';
import CompanyKPIs from '@/components/super-admin/CompanyKPIs';
import { get } from '@/lib/api';
import { TrendingUp, TrendingDown, DollarSign, Users, Calendar, UserCheck, AlertTriangle } from 'lucide-react';

// Type definitions
interface PlatformOverviewData {
  platformRevenue: number;
  mrr: number;
  arr: number;
  activeTenants: number;
  planMix: Array<{ plan: string; count: number; percentage: number }>;
  failedCount: number;
  outstandingReceivables: number;
  topTenantsByPlatformRevenue: Array<{ tenantId: string; tenantName: string; revenue: number }>;
  churnCandidates: Array<{ tenantId: string; tenantName: string; lastPayment: string; daysSince: number }>;
}

interface CommerceOverviewData {
  commerceRevenue: number;
  netRevenue: number;
  failedCount: number;
  refundCount: number;
  totalRegistrations: number;
  activePlayers: number;
  avgTicket: number;
  revenuePerPlayer: number;
  topTenantsByCommerceRevenue: Array<{ tenantId: string; tenantName: string; revenue: number }>;
}

interface SeriesData {
  series: Array<{ date: string; revenue: number; registrations: number }>;
}

interface TenantData {
  rows: Array<{ tenantId: string; tenantName: string; revenue: number; transactions: number; failed: number; refunds: number }>;
  page: number;
  pageSize: number;
  totalRows: number;
}

export default function Analytics() {
  const [lane, setLane] = useState<'platform' | 'commerce' | 'kpis'>('platform');
  const [subTab, setSubTab] = useState('overview');
  const [tenantId, setTenantId] = useState('all');
  const [status, setStatus] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [interval, setInterval] = useState<'day' | 'week' | 'month' | 'year'>('day');

  // Build query params
  const buildParams = (additionalParams?: Record<string, string>) => {
    const params = new URLSearchParams();
    params.set('lane', lane);
    if (status !== 'all') params.set('status', status);
    if (tenantId !== 'all') params.set('tenantId', tenantId);
    if (dateFrom) params.set('from', encodeURIComponent(dateFrom));
    if (dateTo) params.set('to', encodeURIComponent(dateTo));
    
    if (additionalParams) {
      Object.entries(additionalParams).forEach(([key, value]) => {
        params.set(key, value);
      });
    }
    
    return params.toString();
  };

  // Data queries
  const { data: overviewData, isLoading: overviewLoading } = useQuery<PlatformOverviewData | CommerceOverviewData>({
    queryKey: ['/api/super-admin/analytics/overview', lane, status, tenantId, dateFrom, dateTo],
    queryFn: () => get(`/api/super-admin/analytics/overview?${buildParams()}`),
  });

  const { data: seriesData, isLoading: seriesLoading } = useQuery({
    queryKey: ['/api/super-admin/analytics/series', lane, status, tenantId, dateFrom, dateTo, interval],
    queryFn: () => get<SeriesData>(`/api/super-admin/analytics/series?${buildParams({ interval })}`),
    enabled: subTab === 'revenue-trends' || subTab === 'registrations'
  });

  const { data: tenantData, isLoading: tenantLoading } = useQuery({
    queryKey: ['/api/super-admin/analytics/by-tenant', lane, status, tenantId, dateFrom, dateTo],
    queryFn: () => get<TenantData>(`/api/super-admin/analytics/by-tenant?${buildParams()}`),
    enabled: subTab === 'by-tenant'
  });

  const handleFilterApply = () => {
    // Filters are already wired to React Query keys, so queries will refetch automatically
  };

  const handleTenantChange = (newTenantId: string) => {
    setTenantId(newTenantId);
  };

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
  };

  const handleDateRangeChange = (from: string, to: string) => {
    setDateFrom(from);
    setDateTo(to);
  };

  const handleClearFilters = () => {
    setTenantId('all');
    setStatus('all');
    setDateFrom('');
    setDateTo('');
  };

  // Platform sub-tabs
  const platformSubTabs = [
    { value: 'overview', label: 'Overview' },
    { value: 'revenue-trends', label: 'Revenue Trends' },
    { value: 'by-tenant', label: 'By Tenant' },
    { value: 'platform-health', label: 'Platform Health' }
  ];

  // Commerce sub-tabs
  const commerceSubTabs = [
    { value: 'overview', label: 'Overview' },
    { value: 'revenue-trends', label: 'Revenue Trends' },
    { value: 'registrations', label: 'Registrations' },
    { value: 'by-tenant', label: 'By Tenant' }
  ];

  const currentSubTabs = lane === 'platform' ? platformSubTabs : commerceSubTabs;

  // Zero state component
  const ZeroState = ({ message }: { message: string }) => (
    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
      <p className="text-muted-foreground">{message}</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-lg text-muted-foreground">
          Real-time insights across platform and client commerce
        </p>
      </div>

      {/* Filters */}
      <FilterBar
        tenantId={tenantId}
        status={status}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onTenantChange={handleTenantChange}
        onStatusChange={handleStatusChange}
        onDateRangeChange={handleDateRangeChange}
        onClearFilters={handleClearFilters}
        onApply={handleFilterApply}
        statusOptions={[
          { value: 'all', label: 'All Data' },
          { value: 'paid', label: 'Paid' },
          { value: 'pending', label: 'Pending' },
          { value: 'refunded', label: 'Refunded' }
        ]}
      />

      {/* Main tabs: Platform | Client Commerce | Company KPIs */}
      <Tabs value={lane} onValueChange={(value) => { setLane(value as 'platform' | 'commerce' | 'kpis'); setSubTab('overview'); }}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="platform">Platform</TabsTrigger>
          <TabsTrigger value="commerce">Client Commerce</TabsTrigger>
          <TabsTrigger value="kpis">Company KPIs</TabsTrigger>
        </TabsList>

        {/* KPIs Tab Content */}
        <TabsContent value="kpis" className="space-y-8">
          <CompanyKPIs />
        </TabsContent>

        {/* Platform/Commerce Tab Content */}
        <TabsContent value={lane} className="space-y-8">
          {/* Sub-tabs */}
          {lane !== 'kpis' && (
            <Tabs value={subTab} onValueChange={setSubTab}>
              <TabsList>
                {currentSubTabs.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8">
              {lane === 'platform' ? (
                <>
                  {/* Platform Overview Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                      title="Platform Revenue"
                      value={`$${Math.round(((overviewData as PlatformOverviewData)?.platformRevenue || 0) / 100).toLocaleString()}`}
                      subtext="Monthly subscription revenue"
                    />
                    <StatCard
                      title="MRR"
                      value={`$${Math.round((overviewData as PlatformOverviewData)?.mrr || 0).toLocaleString()}`}
                      subtext="Monthly recurring revenue"
                    />
                    <StatCard
                      title="ARR"
                      value={`$${Math.round((overviewData as PlatformOverviewData)?.arr || 0).toLocaleString()}`}
                      subtext="Annual recurring revenue"
                    />
                    <StatCard
                      title="Active Tenants"
                      value={(overviewData as PlatformOverviewData)?.activeTenants || 0}
                      subtext="Paying customers"
                    />
                  </div>

                  {/* Platform panels */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Section title="Top Tenants" subtitle="By platform revenue">
                      {(overviewData as PlatformOverviewData)?.topTenantsByPlatformRevenue?.length ? (
                        <div className="space-y-2">
                          {(overviewData as PlatformOverviewData).topTenantsByPlatformRevenue.map((tenant: any, index: number) => (
                            <div key={tenant.tenantId} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                              <span className="font-medium">{tenant.tenantName}</span>
                              <span className="text-green-600 dark:text-green-400">
                                ${Math.round(tenant.revenue / 100).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <ZeroState message="No platform revenue data for selected filters" />
                      )}
                    </Section>

                    <Section title="Failed Payments" subtitle="Requires attention">
                      {(overviewData as PlatformOverviewData)?.failedCount ? (
                        <div className="space-y-2">
                          <StatCard
                            title="Failed Platform Payments"
                            value={(overviewData as PlatformOverviewData).failedCount}
                            intent="danger"
                          />
                          {(overviewData as PlatformOverviewData)?.churnCandidates?.map((candidate: any, index: number) => (
                            <div key={candidate.tenantId} className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                              <span className="font-medium">{candidate.tenantName}</span>
                              <span className="text-red-600 dark:text-red-400 text-sm">
                                {candidate.daysSince} days since payment
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <ZeroState message="No failed payments for selected filters" />
                      )}
                    </Section>
                  </div>
                </>
              ) : (
                <>
                  {/* Commerce Overview Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                      title="Commerce Revenue"
                      value={`$${Math.round(((overviewData as CommerceOverviewData)?.commerceRevenue || 0) / 100).toLocaleString()}`}
                      subtext="Parent-to-tenant payments"
                    />
                    <StatCard
                      title="Net Revenue"
                      value={`$${Math.round(((overviewData as CommerceOverviewData)?.netRevenue || 0) / 100).toLocaleString()}`}
                      subtext="After refunds"
                    />
                    <StatCard
                      title="Failed Payments"
                      value={(overviewData as CommerceOverviewData)?.failedCount || 0}
                      intent={(overviewData as CommerceOverviewData)?.failedCount ? 'danger' : 'default'}
                    />
                    <StatCard
                      title="Total Registrations"
                      value={(overviewData as CommerceOverviewData)?.totalRegistrations || 0}
                      subtext="New sign-ups"
                    />
                  </div>

                  {/* Commerce panels */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Section title="Top Tenants" subtitle="By commerce revenue">
                      {(overviewData as CommerceOverviewData)?.topTenantsByCommerceRevenue?.length ? (
                        <div className="space-y-2">
                          {(overviewData as CommerceOverviewData).topTenantsByCommerceRevenue.map((tenant: any) => (
                            <div key={tenant.tenantId} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                              <span className="font-medium">{tenant.tenantName}</span>
                              <span className="text-blue-600 dark:text-blue-400">
                                ${Math.round(tenant.revenue / 100).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <ZeroState message="No commerce revenue data for selected filters" />
                      )}
                    </Section>

                    <Section title="Refunds" subtitle="Customer returns">
                      {(overviewData as CommerceOverviewData)?.refundCount ? (
                        <StatCard
                          title="Total Refunds"
                          value={(overviewData as CommerceOverviewData).refundCount}
                          intent="warn"
                        />
                      ) : (
                        <ZeroState message="No refunds for selected filters" />
                      )}
                    </Section>
                  </div>
                </>
              )}
            </TabsContent>

            {/* Revenue Trends Tab */}
            <TabsContent value="revenue-trends" className="space-y-8">
              <div className="flex justify-between items-center">
                <Section title="Revenue Trends" subtitle={`${lane === 'platform' ? 'Platform subscription' : 'Client commerce'} revenue over time`}>
                  <div />
                </Section>
                <Select value={interval} onValueChange={(value) => setInterval(value as 'day' | 'week' | 'month' | 'year')}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Daily</SelectItem>
                    <SelectItem value="week">Weekly</SelectItem>
                    <SelectItem value="month">Monthly</SelectItem>
                    <SelectItem value="year">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {seriesLoading ? (
                <div className="h-80 bg-muted/50 rounded-lg animate-pulse" />
              ) : seriesData?.series?.length ? (
                <Card>
                  <CardContent className="p-6">
                    <ResponsiveContainer width="100%" height={320}>
                      <LineChart data={seriesData.series}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value, name) => [
                            name === 'revenue' ? `$${Math.round(Number(value) / 100).toLocaleString()}` : value,
                            name === 'revenue' ? 'Revenue' : 'Registrations'
                          ]}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          name="Revenue"
                        />
                        {lane === 'commerce' && (
                          <Line 
                            type="monotone" 
                            dataKey="registrations" 
                            stroke="#10b981" 
                            strokeWidth={2}
                            name="Registrations"
                          />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              ) : (
                <ZeroState message="No revenue trends data for selected filters" />
              )}
            </TabsContent>

            {/* Registrations Tab (Commerce only) */}
            {lane === 'commerce' && (
              <TabsContent value="registrations" className="space-y-8">
                <Section title="Registration Metrics" subtitle="New sign-ups and conversion trends">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard
                      title="New Registrations"
                      value={(overviewData as CommerceOverviewData)?.totalRegistrations || 0}
                      subtext="In selected period"
                    />
                    <StatCard
                      title="Active Players"
                      value={(overviewData as CommerceOverviewData)?.activePlayers || 0}
                      subtext="With payments"
                    />
                    <StatCard
                      title="Avg Ticket Size"
                      value={`$${Math.round(((overviewData as CommerceOverviewData)?.avgTicket || 0) / 100).toLocaleString()}`}
                      subtext="Per transaction"
                    />
                  </div>
                </Section>

                {seriesLoading ? (
                  <div className="h-80 bg-muted/50 rounded-lg animate-pulse" />
                ) : seriesData?.series?.length ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Registration Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={320}>
                        <LineChart data={seriesData.series}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="registrations" 
                            stroke="#10b981" 
                            strokeWidth={2}
                            name="New Registrations"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                ) : (
                  <ZeroState message="No registration trends data for selected filters" />
                )}
              </TabsContent>
            )}

            {/* Platform Health Tab (Platform only) */}
            {lane === 'platform' && (
              <TabsContent value="platform-health" className="space-y-8">
                <Section title="Platform Health" subtitle="System status and risk indicators">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard
                      title="Failed Payments"
                      value={(overviewData as PlatformOverviewData)?.failedCount || 0}
                      intent={(overviewData as PlatformOverviewData)?.failedCount ? 'danger' : 'default'}
                    />
                    <StatCard
                      title="Outstanding Receivables"
                      value={`$${Math.round(((overviewData as PlatformOverviewData)?.outstandingReceivables || 0) / 100).toLocaleString()}`}
                      intent={(overviewData as PlatformOverviewData)?.outstandingReceivables ? 'warn' : 'default'}
                    />
                    <StatCard
                      title="Churn Candidates"
                      value={(overviewData as PlatformOverviewData)?.churnCandidates?.length || 0}
                      intent={(overviewData as PlatformOverviewData)?.churnCandidates?.length ? 'warn' : 'default'}
                    />
                  </div>

                  {(overviewData as PlatformOverviewData)?.planMix?.length && (
                    <Section title="Plan Distribution" subtitle="Current subscription mix">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {(overviewData as PlatformOverviewData).planMix.map((plan: any) => (
                          <StatCard
                            key={plan.plan}
                            title={`${plan.plan} Plan`}
                            value={plan.count}
                            subtext={`${plan.percentage.toFixed(1)}% of total`}
                          />
                        ))}
                      </div>
                    </Section>
                  )}
                </Section>
              </TabsContent>
            )}

            {/* By Tenant Tab */}
            <TabsContent value="by-tenant" className="space-y-8">
              <Section title={`${lane === 'platform' ? 'Platform' : 'Commerce'} Revenue by Tenant`} subtitle="Detailed breakdown per organization">
                {tenantLoading ? (
                  <div className="h-64 bg-muted/50 rounded-lg animate-pulse" />
                ) : tenantData?.rows?.length ? (
                  <Card>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="border-b">
                            <tr>
                              <th className="text-left p-4 font-medium">Tenant</th>
                              <th className="text-right p-4 font-medium">Revenue</th>
                              <th className="text-right p-4 font-medium">Transactions</th>
                              <th className="text-right p-4 font-medium">Failed</th>
                              <th className="text-right p-4 font-medium">Refunds</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tenantData.rows.map((row) => (
                              <tr key={row.tenantId} className="border-b last:border-b-0">
                                <td className="p-4 font-medium">{row.tenantName}</td>
                                <td className="p-4 text-right text-green-600 dark:text-green-400">
                                  ${Math.round(row.revenue / 100).toLocaleString()}
                                </td>
                                <td className="p-4 text-right">{row.transactions}</td>
                                <td className="p-4 text-right">
                                  <span className={row.failed > 0 ? 'text-red-600 dark:text-red-400' : ''}>
                                    {row.failed}
                                  </span>
                                </td>
                                <td className="p-4 text-right">
                                  <span className={row.refunds > 0 ? 'text-yellow-600 dark:text-yellow-400' : ''}>
                                    {row.refunds}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Pagination info */}
                      {tenantData.totalRows > tenantData.pageSize && (
                        <div className="p-4 border-t text-sm text-muted-foreground text-center">
                          Showing {tenantData.rows.length} of {tenantData.totalRows} tenants
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <ZeroState message="No tenant data for selected filters" />
                )}
              </Section>
            </TabsContent>
          </Tabs>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}