import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import FilterBar from '@/components/shared/FilterBar';
import { get } from '@/lib/api';

interface AnalyticsData {
  totalPlatformRevenue: number;
  totalCommerceRevenue: number;
  activeTenants: number;
  totalPlayers: number;
  newTenantsInRange: number;
  failedPlatformPayments: { count: number; totalAmount: number };
  failedCommercePayments: { count: number; totalAmount: number };
  topTenantsByPlatformRevenue: Array<{ tenant: string; revenue: number }>;
  topTenantsByCommerceRevenue: Array<{ tenant: string; revenue: number }>;
  churnCandidates: Array<{ tenant: string; lastPayment: string; daysSince: number }>;
}

interface SeriesData {
  series: Array<{ date: string; revenue: number; registrations: number }>;
}

interface TenantData {
  rows: Array<{ tenant: string; revenue: number; signups: number; players: number }>;
}

export default function CompanyAnalytics() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [viewType, setViewType] = useState<'platform' | 'commerce'>('platform');
  const [interval, setInterval] = useState<'day' | 'week' | 'month'>('day');

  const { data: overview } = useQuery<AnalyticsData>({
    queryKey: ['/api/super-admin/analytics/overview', dateFrom, dateTo],
    queryFn: () => {
      const params = new URLSearchParams();
      if (dateFrom) params.set('from', encodeURIComponent(dateFrom));
      if (dateTo) params.set('to', encodeURIComponent(dateTo));
      return get<AnalyticsData>(`/api/super-admin/analytics/overview?${params}`);
    },
  });

  const { data: seriesData } = useQuery<SeriesData>({
    queryKey: ['/api/super-admin/analytics/series', dateFrom, dateTo, interval],
    queryFn: () => {
      const params = new URLSearchParams();
      if (dateFrom) params.set('from', encodeURIComponent(dateFrom));
      if (dateTo) params.set('to', encodeURIComponent(dateTo));
      params.set('interval', interval);
      return get<SeriesData>(`/api/super-admin/analytics/series?${params}`);
    },
  });

  const { data: tenantData } = useQuery<TenantData>({
    queryKey: ['/api/super-admin/analytics/by-tenant', dateFrom, dateTo, viewType],
    queryFn: () => {
      const params = new URLSearchParams();
      if (dateFrom) params.set('from', encodeURIComponent(dateFrom));
      if (dateTo) params.set('to', encodeURIComponent(dateTo));
      params.set('type', viewType);
      return get<TenantData>(`/api/super-admin/analytics/by-tenant?${params}`);
    },
  });

  const handleDateRangeChange = (from: string, to: string) => {
    setDateFrom(from);
    setDateTo(to);
  };

  const handleClearFilters = () => {
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Company Analytics</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Platform performance metrics and revenue insights
        </p>
      </div>

      <FilterBar
        showTenantFilter={false}
        onDateRangeChange={handleDateRangeChange}
        onClearFilters={handleClearFilters}
        dateFrom={dateFrom}
        dateTo={dateTo}
        statusOptions={[
          { value: 'all', label: 'All Data' },
          { value: 'platform', label: 'Platform Revenue' },
          { value: 'commerce', label: 'Client Commerce' }
        ]}
      />

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Platform Revenue</CardTitle>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              ${overview?.totalPlatformRevenue?.toLocaleString() || '0'}
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Commerce Revenue</CardTitle>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              ${overview?.totalCommerceRevenue?.toLocaleString() || '0'}
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Tenants</CardTitle>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {overview?.activeTenants || 0}
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Players</CardTitle>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {overview?.totalPlayers?.toLocaleString() || '0'}
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="revenue-trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue-trends">Revenue Trends</TabsTrigger>
          <TabsTrigger value="by-tenant">By Tenant</TabsTrigger>
          <TabsTrigger value="health">Platform Health</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue-trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Over Time</CardTitle>
              <div className="flex gap-2">
                {(['day', 'week', 'month'] as const).map((int) => (
                  <button
                    key={int}
                    onClick={() => setInterval(int)}
                    className={`px-3 py-1 text-sm rounded-md ${
                      interval === int ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                    }`}
                  >
                    {int.charAt(0).toUpperCase() + int.slice(1)}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={seriesData?.series || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} name="Revenue" />
                  <Line type="monotone" dataKey="registrations" stroke="#10B981" strokeWidth={2} name="Registrations" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="by-tenant" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Tenant</CardTitle>
              <div className="flex gap-2">
                {(['platform', 'commerce'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setViewType(type)}
                    className={`px-3 py-1 text-sm rounded-md ${
                      viewType === type ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                    }`}
                  >
                    {type === 'platform' ? 'Platform Revenue' : 'Commerce Revenue'}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={tenantData?.rows || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tenant" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#3B82F6" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Failed Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Platform Payments</span>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-red-600">{overview?.failedPlatformPayments?.count || 0}</div>
                      <div className="text-sm text-gray-500">${overview?.failedPlatformPayments?.totalAmount || 0}</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Commerce Payments</span>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-red-600">{overview?.failedCommercePayments?.count || 0}</div>
                      <div className="text-sm text-gray-500">${overview?.failedCommercePayments?.totalAmount || 0}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Churn Risk</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {overview?.churnCandidates?.map((tenant, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{tenant.tenant}</div>
                        <div className="text-sm text-gray-500">Last payment: {tenant.lastPayment}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-yellow-600">{tenant.daysSince} days</div>
                      </div>
                    </div>
                  )) || <p className="text-sm text-gray-500">No tenants at risk</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}