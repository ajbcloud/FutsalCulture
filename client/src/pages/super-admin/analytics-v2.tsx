import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useRoute } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { themeClasses } from '@/lib/ui/theme';
import { get } from '@/lib/api';

// Analytics v2 components
import FilterBar from '@/components/analytics/FilterBar';
import StatCard from '@/components/analytics/StatCard';
import TimeSeriesCard from '@/components/analytics/TimeSeriesCard';
import RankingTable from '@/components/analytics/RankingTable';
import HealthList from '@/components/analytics/HealthList';
import { NoDataState, ErrorState } from '@/components/analytics/EmptyState';
import { StatCardSkeleton, TimeSeriesCardSkeleton, RankingTableSkeleton, HealthListSkeleton } from '@/components/analytics/Skeletons';

// AI Analytics components
import { AIInsightsBar } from '@/components/analytics/AIInsightsBar';
import { AskAnalyticsDrawer } from '@/components/analytics/AskAnalyticsDrawer';

// Icons
import { DollarSign, Users, TrendingUp, AlertTriangle, CreditCard, UserPlus, Activity, Target } from 'lucide-react';

// Types from existing analytics
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

export default function AnalyticsV2() {
  // URL params and navigation
  const [location, setLocation] = useLocation();
  const [, params] = useRoute('/super-admin/analytics-v2/:tab?/:subTab?');
  
  // State management
  const [lane, setLane] = useState<'platform' | 'commerce' | 'kpis'>(
    (params?.tab as 'platform' | 'commerce' | 'kpis') || 'platform'
  );
  const [subTab, setSubTab] = useState(params?.subTab || 'overview');
  const [tenantId, setTenantId] = useState('all');
  const [status, setStatus] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [interval, setInterval] = useState<'day' | 'week' | 'month' | 'year'>('day');
  
  // AI Analytics state
  const [isAskAnalyticsOpen, setIsAskAnalyticsOpen] = useState(false);

  // URL sync
  useEffect(() => {
    const newPath = `/super-admin/analytics-v2/${lane}${subTab !== 'overview' ? `/${subTab}` : ''}`;
    if (location !== newPath) {
      setLocation(newPath);
    }
  }, [lane, subTab, location, setLocation]);

  // Query parameter builder
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

  // Data queries using existing endpoints
  const { data: overviewData, isLoading: overviewLoading, error: overviewError } = useQuery<PlatformOverviewData | CommerceOverviewData>({
    queryKey: ['/api/super-admin/analytics/overview', lane, status, tenantId, dateFrom, dateTo],
    queryFn: () => get(`/api/super-admin/analytics/overview?${buildParams()}`),
  });

  const { data: seriesData, isLoading: seriesLoading, error: seriesError } = useQuery({
    queryKey: ['/api/super-admin/analytics/series', lane, status, tenantId, dateFrom, dateTo, interval],
    queryFn: () => get<SeriesData>(`/api/super-admin/analytics/series?${buildParams({ interval })}`),
    enabled: subTab === 'revenue-trends' || subTab === 'registrations'
  });

  const { data: tenantData, isLoading: tenantLoading, error: tenantError } = useQuery({
    queryKey: ['/api/super-admin/analytics/by-tenant', lane, status, tenantId, dateFrom, dateTo],
    queryFn: () => get<TenantData>(`/api/super-admin/analytics/by-tenant?${buildParams()}`),
    enabled: subTab === 'by-tenant'
  });

  // Event handlers
  const handleTabChange = (newLane: string) => {
    setLane(newLane as 'platform' | 'commerce' | 'kpis');
    setSubTab('overview');
  };

  const handleSubTabChange = (newSubTab: string) => {
    setSubTab(newSubTab);
  };

  const handleFilterChange = {
    tenant: setTenantId,
    status: setStatus,
    dateRange: (from: string, to: string) => {
      setDateFrom(from);
      setDateTo(to);
    },
    clear: () => {
      setTenantId('all');
      setStatus('all');
      setDateFrom('');
      setDateTo('');
    }
  };

  // AI navigation handler
  const handleAINavigate = (tab: string, filters?: any) => {
    if (tab === 'overview' || tab === 'revenue-trends' || tab === 'by-tenant') {
      setSubTab(tab);
    } else if (tab === 'platform-health') {
      setLane('platform');
      setSubTab('platform-health');
    }
    if (filters) {
      if (filters.tenantId) setTenantId(filters.tenantId);
      if (filters.status) setStatus(filters.status);
    }
  };

  // Tab configurations
  const platformSubTabs = [
    { value: 'overview', label: 'Overview' },
    { value: 'revenue-trends', label: 'Revenue Trends' },
    { value: 'by-tenant', label: 'By Tenant' },
    { value: 'platform-health', label: 'Platform Health' }
  ];

  const commerceSubTabs = [
    { value: 'overview', label: 'Overview' },
    { value: 'revenue-trends', label: 'Revenue Trends' },
    { value: 'registrations', label: 'Registrations' },
    { value: 'by-tenant', label: 'By Tenant' }
  ];

  const currentSubTabs = lane === 'platform' ? platformSubTabs : commerceSubTabs;

  // Generate mock sparkline data
  const generateSparklineData = (baseValue: number) => {
    return Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      value: baseValue + Math.random() * baseValue * 0.2
    }));
  };

  // Mock delta calculation (previous period)
  const mockDelta = (current: number) => ({
    current,
    previous: current * (0.85 + Math.random() * 0.3) // ±15% variance
  });

  return (
    <div className="min-h-screen bg-[#0b0f14] text-[#e6edf3]">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-4xl font-semibold text-[#e6edf3]">Analytics</h1>
            <div className="px-3 py-1 bg-[#10b981]/10 text-[#10b981] text-sm font-medium rounded-lg">
              v2 Preview
            </div>
          </div>
          <p className="text-lg text-[#a9b4c2]">
            Real-time insights across platform and client commerce
          </p>
        </div>

        {/* Sticky Filter Bar */}
        <FilterBar
          tenantId={tenantId}
          status={status}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onTenantChange={handleFilterChange.tenant}
          onStatusChange={handleFilterChange.status}
          onDateRangeChange={handleFilterChange.dateRange}
          onClearFilters={handleFilterChange.clear}
          data-testid="analytics-filter-bar"
        />

        {/* AI Insights Bar - Replaces KPI Row */}
        <AIInsightsBar
          filters={{
            from: dateFrom,
            to: dateTo,
            tenantId,
            status,
            lane
          }}
          onOpenAskAnalytics={() => setIsAskAnalyticsOpen(true)}
          onNavigate={handleAINavigate}
        />

        {/* Main Tabs */}
        <Tabs value={lane} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3 bg-[#11161d] border-[#1f2733]">
            <TabsTrigger 
              value="platform" 
              className="data-[state=active]:bg-[#10b981] data-[state=active]:text-white"
            >
              Platform
            </TabsTrigger>
            <TabsTrigger 
              value="commerce"
              className="data-[state=active]:bg-[#10b981] data-[state=active]:text-white"
            >
              Client Commerce
            </TabsTrigger>
            <TabsTrigger 
              value="kpis"
              className="data-[state=active]:bg-[#10b981] data-[state=active]:text-white"
            >
              Company KPIs
            </TabsTrigger>
          </TabsList>

          {/* Platform Tab */}
          <TabsContent value="platform" className={themeClasses.sectionGap}>
            <Tabs value={subTab} onValueChange={handleSubTabChange}>
              <TabsList className="bg-[#0f1319] border-[#1f2733]">
                {platformSubTabs.map((tab) => (
                  <TabsTrigger 
                    key={tab.value} 
                    value={tab.value}
                    className="data-[state=active]:bg-[#1f2733] data-[state=active]:text-[#e6edf3]"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Platform Overview */}
              <TabsContent value="overview" className={themeClasses.sectionGap}>
                {overviewLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <StatCardSkeleton key={i} />
                    ))}
                  </div>
                ) : overviewError ? (
                  <ErrorState onRetry={() => window.location.reload()} />
                ) : (
                  <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <StatCard
                        title="Platform Revenue"
                        value={`$${Math.round(((overviewData as PlatformOverviewData)?.platformRevenue || 0) / 100).toLocaleString()}`}
                        delta={mockDelta((overviewData as PlatformOverviewData)?.platformRevenue || 0)}
                        sparkData={generateSparklineData((overviewData as PlatformOverviewData)?.platformRevenue || 0)}
                        icon={<DollarSign />}
                        hint="Total subscription revenue from all tenants"
                        data-testid="platform-revenue-card"
                      />
                      <StatCard
                        title="MRR"
                        value={`$${Math.round((overviewData as PlatformOverviewData)?.mrr || 0).toLocaleString()}`}
                        delta={mockDelta((overviewData as PlatformOverviewData)?.mrr || 0)}
                        sparkData={generateSparklineData((overviewData as PlatformOverviewData)?.mrr || 0)}
                        icon={<TrendingUp />}
                        hint="Monthly recurring revenue from subscriptions"
                        data-testid="mrr-card"
                      />
                      <StatCard
                        title="ARR"
                        value={`$${Math.round((overviewData as PlatformOverviewData)?.arr || 0).toLocaleString()}`}
                        delta={mockDelta((overviewData as PlatformOverviewData)?.arr || 0)}
                        sparkData={generateSparklineData((overviewData as PlatformOverviewData)?.arr || 0)}
                        icon={<Target />}
                        hint="Annual recurring revenue projection"
                        data-testid="arr-card"
                      />
                      <StatCard
                        title="Active Tenants"
                        value={(overviewData as PlatformOverviewData)?.activeTenants || 0}
                        delta={mockDelta((overviewData as PlatformOverviewData)?.activeTenants || 0)}
                        icon={<Users />}
                        hint="Currently paying tenant organizations"
                        data-testid="active-tenants-card"
                      />
                    </div>

                    {/* Charts and Tables */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <RankingTable
                        title="Top Tenants by Revenue"
                        rows={(overviewData as PlatformOverviewData)?.topTenantsByPlatformRevenue?.map(t => ({
                          tenantName: t.tenantName,
                          revenue: t.revenue
                        })) || []}
                        columns={[
                          { key: 'tenantName', label: 'Tenant', sortable: true },
                          { key: 'revenue', label: 'Revenue', align: 'right', format: 'currency', sortable: true }
                        ]}
                        searchable
                        data-testid="platform-top-tenants-table"
                      />

                      <HealthList
                        title="Platform Health Issues"
                        items={[
                          ...(((overviewData as PlatformOverviewData)?.churnCandidates || []).map(c => ({
                            id: c.tenantId,
                            title: `Payment Overdue: ${c.tenantName}`,
                            description: `No payment received for ${c.daysSince} days`,
                            severity: c.daysSince > 30 ? 'high' as const : 'medium' as const,
                            tenantName: c.tenantName,
                            lastOccurred: c.lastPayment
                          }))),
                          ...(((overviewData as PlatformOverviewData)?.failedCount || 0) > 0 ? [{
                            id: 'failed-payments',
                            title: 'Failed Platform Payments',
                            description: `${(overviewData as PlatformOverviewData)?.failedCount} payment failures require attention`,
                            severity: 'critical' as const,
                            count: (overviewData as PlatformOverviewData)?.failedCount
                          }] : [])
                        ]}
                        data-testid="platform-health-list"
                      />
                    </div>
                  </>
                )}
              </TabsContent>

              {/* Platform Revenue Trends */}
              <TabsContent value="revenue-trends" className={themeClasses.sectionGap}>
                <TimeSeriesCard
                  title="Platform Revenue Over Time"
                  series={seriesData?.series || []}
                  chartType="area"
                  intervalToggle={{
                    value: interval,
                    onChange: (value) => setInterval(value as 'day' | 'week' | 'month' | 'year'),
                    options: [
                      { value: 'day', label: 'Daily' },
                      { value: 'week', label: 'Weekly' },
                      { value: 'month', label: 'Monthly' },
                      { value: 'year', label: 'Yearly' }
                    ]
                  }}
                  loading={seriesLoading}
                  error={seriesError?.message}
                  data-testid="platform-revenue-chart"
                />
              </TabsContent>

              {/* Platform By Tenant */}
              <TabsContent value="by-tenant" className={themeClasses.sectionGap}>
                {tenantLoading ? (
                  <RankingTableSkeleton />
                ) : (
                  <RankingTable
                    title="Platform Revenue by Tenant"
                    rows={tenantData?.rows || []}
                    columns={[
                      { key: 'tenantName', label: 'Tenant', sortable: true },
                      { key: 'revenue', label: 'Revenue', align: 'right', format: 'currency', sortable: true },
                      { key: 'transactions', label: 'Payments', align: 'right', format: 'number', sortable: true },
                      { key: 'failed', label: 'Failed', align: 'right', format: 'number', sortable: true },
                      { key: 'refunds', label: 'Refunds', align: 'right', format: 'number', sortable: true }
                    ]}
                    searchable
                    onExportCSV={() => console.log('Export CSV')}
                    data-testid="platform-by-tenant-table"
                  />
                )}
              </TabsContent>

              {/* Platform Health */}
              <TabsContent value="platform-health" className={themeClasses.sectionGap}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <StatCard
                    title="Failed Payments"
                    value={(overviewData as PlatformOverviewData)?.failedCount || 0}
                    icon={<AlertTriangle />}
                    hint="Platform subscription payment failures"
                    data-testid="platform-failed-payments-card"
                  />
                  <StatCard
                    title="Outstanding Receivables"
                    value={`$${Math.round(((overviewData as PlatformOverviewData)?.outstandingReceivables || 0) / 100).toLocaleString()}`}
                    icon={<CreditCard />}
                    hint="Unpaid subscription amounts"
                    data-testid="platform-receivables-card"
                  />
                  <StatCard
                    title="Churn Risk"
                    value={(overviewData as PlatformOverviewData)?.churnCandidates?.length || 0}
                    icon={<Users />}
                    hint="Tenants at risk of churning"
                    data-testid="platform-churn-risk-card"
                  />
                </div>

                <HealthList
                  title="Platform Health Monitoring"
                  items={[
                    {
                      id: 'api-performance',
                      title: 'API Response Time',
                      description: 'Average p95 response time: 245ms (normal)',
                      severity: 'low',
                      lastOccurred: '2 minutes ago'
                    },
                    {
                      id: 'database-connections',
                      title: 'Database Pool Health',
                      description: 'Connection pool at 75% capacity',
                      severity: 'medium',
                      count: 15
                    }
                  ]}
                  data-testid="platform-health-monitoring"
                />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Commerce Tab (similar structure) */}
          <TabsContent value="commerce" className={themeClasses.sectionGap}>
            <Tabs value={subTab} onValueChange={handleSubTabChange}>
              <TabsList className="bg-[#0f1319] border-[#1f2733]">
                {commerceSubTabs.map((tab) => (
                  <TabsTrigger 
                    key={tab.value} 
                    value={tab.value}
                    className="data-[state=active]:bg-[#1f2733] data-[state=active]:text-[#e6edf3]"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Commerce Overview */}
              <TabsContent value="overview" className={themeClasses.sectionGap}>
                {overviewLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <StatCardSkeleton key={i} />
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <StatCard
                        title="Commerce Revenue"
                        value={`$${Math.round(((overviewData as CommerceOverviewData)?.commerceRevenue || 0) / 100).toLocaleString()}`}
                        delta={mockDelta((overviewData as CommerceOverviewData)?.commerceRevenue || 0)}
                        sparkData={generateSparklineData((overviewData as CommerceOverviewData)?.commerceRevenue || 0)}
                        icon={<DollarSign />}
                        hint="Total parent-to-tenant payment volume"
                        data-testid="commerce-revenue-card"
                      />
                      <StatCard
                        title="Net Revenue"
                        value={`$${Math.round(((overviewData as CommerceOverviewData)?.netRevenue || 0) / 100).toLocaleString()}`}
                        delta={mockDelta((overviewData as CommerceOverviewData)?.netRevenue || 0)}
                        sparkData={generateSparklineData((overviewData as CommerceOverviewData)?.netRevenue || 0)}
                        icon={<TrendingUp />}
                        hint="Revenue after refunds and fees"
                        data-testid="commerce-net-revenue-card"
                      />
                      <StatCard
                        title="Active Players"
                        value={(overviewData as CommerceOverviewData)?.activePlayers || 0}
                        delta={mockDelta((overviewData as CommerceOverviewData)?.activePlayers || 0)}
                        icon={<Users />}
                        hint="Players with paid bookings this period"
                        data-testid="commerce-active-players-card"
                      />
                      <StatCard
                        title="Registrations"
                        value={(overviewData as CommerceOverviewData)?.totalRegistrations || 0}
                        delta={mockDelta((overviewData as CommerceOverviewData)?.totalRegistrations || 0)}
                        icon={<UserPlus />}
                        hint="New player registrations"
                        data-testid="commerce-registrations-card"
                      />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <RankingTable
                        title="Top Tenants by Commerce"
                        rows={(overviewData as CommerceOverviewData)?.topTenantsByCommerceRevenue?.map(t => ({
                          tenantName: t.tenantName,
                          revenue: t.revenue
                        })) || []}
                        columns={[
                          { key: 'tenantName', label: 'Tenant', sortable: true },
                          { key: 'revenue', label: 'Revenue', align: 'right', format: 'currency', sortable: true }
                        ]}
                        searchable
                        data-testid="commerce-top-tenants-table"
                      />

                      <HealthList
                        title="Commerce Health Issues"
                        items={[
                          ...(((overviewData as CommerceOverviewData)?.failedCount || 0) > 0 ? [{
                            id: 'failed-commerce-payments',
                            title: 'Failed Commerce Payments',
                            description: `${(overviewData as CommerceOverviewData)?.failedCount} payment failures need attention`,
                            severity: 'high' as const,
                            count: (overviewData as CommerceOverviewData)?.failedCount
                          }] : []),
                          ...(((overviewData as CommerceOverviewData)?.refundCount || 0) > 0 ? [{
                            id: 'high-refund-rate',
                            title: 'Elevated Refund Rate',
                            description: `${(overviewData as CommerceOverviewData)?.refundCount} refunds this period`,
                            severity: 'medium' as const,
                            count: (overviewData as CommerceOverviewData)?.refundCount
                          }] : [])
                        ]}
                        data-testid="commerce-health-list"
                      />
                    </div>
                  </>
                )}
              </TabsContent>

              {/* Other commerce sub-tabs would follow similar pattern */}
            </Tabs>
          </TabsContent>

          {/* Company KPIs Tab */}
          <TabsContent value="kpis" className={themeClasses.sectionGap}>
            <div className="text-center py-12">
              <h3 className="text-2xl font-semibold text-[#e6edf3] mb-4">Company KPIs</h3>
              <p className="text-[#a9b4c2]">
                Comprehensive business metrics and cohort analysis coming soon.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Ask Analytics Drawer */}
        <AskAnalyticsDrawer
          isOpen={isAskAnalyticsOpen}
          onClose={() => setIsAskAnalyticsOpen(false)}
          filters={{
            from: dateFrom,
            to: dateTo,
            tenantId,
            status: lane === 'platform' ? 'platform' : 'commerce'
          }}
        />
      </div>
    </div>
  );
}