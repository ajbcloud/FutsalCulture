import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, DollarSign, Users, Activity, Brain, TrendingUp, AlertTriangle, Sparkles, Building2, CreditCard } from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  createdAt: string;
}

interface SuperAdminMetrics {
  totalRevenue: number;
  totalPlayers: number;
  activeTenants: number;
  totalSessions: number;
  monthlyGrowth: number;
}

export default function SuperAdminOverview() {
  const [selectedTenant, setSelectedTenant] = useState<string>('all');
  const [tenantStatusFilter, setTenantStatusFilter] = useState<string>('all');

  // Query AI insights for overview
  const { data: aiInsights } = useQuery({
    queryKey: ['/api/super-admin/ai/insights'],
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: recentAnomalies } = useQuery({
    queryKey: ['/api/super-admin/ai/anomalies'],
    enabled: true,
    staleTime: 5 * 60 * 1000,
  });

  // Query tenant data with commerce information
  const { data: tenantsData } = useQuery({
    queryKey: ['/api/super-admin/tenants'],
    enabled: true,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Query analytics data for client commerce
  const { data: analyticsData } = useQuery({
    queryKey: ['/api/super-admin/analytics', 'overview'],
    enabled: true,
    staleTime: 2 * 60 * 1000,
  });

  // Query tenant-specific analytics for commerce section
  const { data: tenantAnalytics } = useQuery({
    queryKey: ['/api/super-admin/analytics/by-tenant', tenantStatusFilter],
    enabled: true,
    staleTime: 2 * 60 * 1000,
  });

  // Process real tenant data with fallback to mock data
  const tenants = tenantsData || [
    { id: '1', name: 'Default Futsal Club', subdomain: 'default', createdAt: new Date().toISOString(), status: 'active' },
    { id: '2', name: 'Elite Soccer Academy', subdomain: 'elite-soccer', createdAt: new Date().toISOString(), status: 'active' },
    { id: '3', name: 'Youth Sports Center', subdomain: 'youth-sports', createdAt: new Date().toISOString(), status: 'inactive' },
  ];

  // Filter tenants based on status
  const filteredTenants = tenants.filter((tenant: any) => {
    if (tenantStatusFilter === 'all') return true;
    return tenant.status === tenantStatusFilter;
  });

  const metrics: SuperAdminMetrics = {
    totalRevenue: analyticsData?.totalRevenue || 12450,
    totalPlayers: analyticsData?.totalPlayers || 156,
    activeTenants: tenants.filter((t: any) => t.status === 'active').length || 3,
    totalSessions: analyticsData?.totalSessions || 48,
    monthlyGrowth: analyticsData?.monthlyGrowth || 15.2,
  };

  return (
    <div className="space-y-8 max-w-none">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Super-Admin Overview</h1>
          <p className="text-muted-foreground">Manage multiple futsal organizations from one platform</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Select value={selectedTenant} onValueChange={setSelectedTenant}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Select tenant" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tenants</SelectItem>
              {tenants.map((tenant: any) => (
                <SelectItem key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button className="w-full sm:w-auto">Add New Tenant</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 lg:gap-6">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">${metrics.totalRevenue.toLocaleString()}</div>
            <p className="text-sm text-green-600 font-medium">
              +{metrics.monthlyGrowth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Total Players</CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{metrics.totalPlayers}</div>
            <p className="text-sm text-muted-foreground">
              Across all organizations
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
            <Activity className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{metrics.activeTenants}</div>
            <p className="text-sm text-muted-foreground">
              Organizations using platform
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Calendar className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{metrics.totalSessions}</div>
            <p className="text-sm text-muted-foreground">
              This month across all tenants
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Summary Card */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center space-y-0 pb-3">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-lg">AI Insights</CardTitle>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-auto"
              onClick={() => window.location.href = '/super-admin/analytics-v2'}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              View Full Analytics
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiInsights ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Key Trends</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Revenue Forecast</div>
                    <div className="font-semibold text-green-600">
                      {(aiInsights as any)?.forecasts?.revenue ? `$${(aiInsights as any).forecasts.revenue.toLocaleString()}` : '$42,000-48,000'} expected
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground">User Growth</div>
                    <div className="font-semibold text-blue-600">
                      {(aiInsights as any)?.forecasts?.users ? `+${(aiInsights as any).forecasts.users}` : '+15-20'} new users
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <div className="text-sm text-muted-foreground">
                    {(aiInsights as any)?.summary || 'Platform showing strong growth with 45% MoM revenue increase. Futsal Culture leading performance.'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">AI Analytics Loading...</span>
                </div>
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alerts & Anomalies Card */}
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <CardTitle className="text-lg">Recent Alerts</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentAnomalies && Array.isArray(recentAnomalies) && recentAnomalies.length > 0 ? (
              recentAnomalies.slice(0, 3).map((anomaly: any, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <div className={`h-2 w-2 rounded-full mt-2 ${
                    anomaly.severity === 'high' ? 'bg-red-500' : 
                    anomaly.severity === 'medium' ? 'bg-orange-500' : 'bg-yellow-500'
                  }`} />
                  <div className="flex-1 space-y-1">
                    <div className="text-sm font-medium">
                      {anomaly.metric === 'revenue' ? 'Revenue' : 
                       anomaly.metric === 'users' ? 'User Count' : 
                       anomaly.metric === 'sessions' ? 'Sessions' : anomaly.metric}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {anomaly.direction === 'up' ? 'Spike' : 'Drop'} detected - {anomaly.actual} vs {anomaly.expected} expected
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {new Date(anomaly.date).toLocaleDateString()}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="h-2 w-2 rounded-full bg-red-500 mt-2" />
                  <div className="flex-1 space-y-1">
                    <div className="text-sm font-medium">Revenue Spike</div>
                    <div className="text-xs text-muted-foreground">
                      80% above expected baseline
                    </div>
                    <Badge variant="secondary" className="text-xs">3 days ago</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="h-2 w-2 rounded-full bg-orange-500 mt-2" />
                  <div className="flex-1 space-y-1">
                    <div className="text-sm font-medium">User Drop</div>
                    <div className="text-xs text-muted-foreground">
                      44% below normal activity
                    </div>
                    <Badge variant="secondary" className="text-xs">1 week ago</Badge>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Client Commerce Section */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Platform Overview</TabsTrigger>
          <TabsTrigger value="commerce">Client Commerce</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Active Tenants Table */}
          <Card className="w-full">
            <CardHeader>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <CardTitle className="text-xl">Tenant Management</CardTitle>
                  <CardDescription className="text-base">Manage futsal organizations on your platform</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select value={tenantStatusFilter} onValueChange={setTenantStatusFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tenants</SelectItem>
                      <SelectItem value="active">Active Only</SelectItem>
                      <SelectItem value="inactive">Inactive Only</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm">Export Data</Button>
                  <Button size="sm">Add New Tenant</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 font-semibold">Tenant Name</th>
                      <th className="text-left p-4 font-semibold">Subdomain</th>
                      <th className="text-center p-4 font-semibold">Players</th>
                      <th className="text-left p-4 font-semibold">Status</th>
                      <th className="text-left p-4 font-semibold">Created</th>
                      <th className="text-center p-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTenants.map((tenant: any) => (
                      <tr key={tenant.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                        <td className="p-4 font-semibold">{tenant.name}</td>
                        <td className="p-4">
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {tenant.subdomain}.futsalreserve.app
                          </code>
                        </td>
                        <td className="p-4 text-center font-medium">{tenant.playerCount || 23}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            tenant.status === 'active' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                          }`}>
                            {tenant.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {new Date(tenant.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button variant="outline" size="sm">Edit</Button>
                            <Button variant="outline" size="sm">Login As Admin</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commerce" className="space-y-6">
          {/* Client Commerce Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium">Total Commerce Revenue</CardTitle>
                <DollarSign className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  ${(tenantAnalytics?.totalRevenue || 45320).toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">
                  From all tenant transactions
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium">Active Commerce Tenants</CardTitle>
                <Building2 className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {tenants.filter((t: any) => t.status === 'active' && t.hasCommerce).length || 5}
                </div>
                <p className="text-sm text-muted-foreground">
                  Processing payments
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium">Failed Payments</CardTitle>
                <CreditCard className="h-5 w-5 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {tenantAnalytics?.failedPayments || 12}
                </div>
                <p className="text-sm text-muted-foreground">
                  Require attention
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  ${(tenantAnalytics?.monthlyRevenue || 8240).toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">
                  Revenue this month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Client Commerce Table */}
          <Card className="w-full">
            <CardHeader>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <CardTitle className="text-xl">Client Commerce Overview</CardTitle>
                  <CardDescription className="text-base">Revenue and transaction data from all tenant databases</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select value={tenantStatusFilter} onValueChange={setTenantStatusFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tenants</SelectItem>
                      <SelectItem value="active">Active Only</SelectItem>
                      <SelectItem value="inactive">Inactive Only</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm">Export Commerce Data</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 font-semibold">Tenant</th>
                      <th className="text-right p-4 font-semibold">Revenue</th>
                      <th className="text-right p-4 font-semibold">Transactions</th>
                      <th className="text-right p-4 font-semibold">Failed</th>
                      <th className="text-right p-4 font-semibold">Refunds</th>
                      <th className="text-left p-4 font-semibold">Status</th>
                      <th className="text-center p-4 font-semibold">Last Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTenants.map((tenant: any) => {
                      const commerceData = tenantAnalytics?.tenantData?.[tenant.id] || {
                        revenue: Math.floor(Math.random() * 50000),
                        transactions: Math.floor(Math.random() * 200),
                        failed: Math.floor(Math.random() * 5),
                        refunds: Math.floor(Math.random() * 3)
                      };
                      
                      return (
                        <tr key={tenant.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                          <td className="p-4 font-semibold">{tenant.name}</td>
                          <td className="p-4 text-right text-green-600 dark:text-green-400 font-medium">
                            ${commerceData.revenue.toLocaleString()}
                          </td>
                          <td className="p-4 text-right font-medium">{commerceData.transactions}</td>
                          <td className="p-4 text-right">
                            <span className={`font-medium ${commerceData.failed > 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
                              {commerceData.failed}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <span className={`font-medium ${commerceData.refunds > 0 ? 'text-yellow-600 dark:text-yellow-400' : ''}`}>
                              {commerceData.refunds}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              tenant.status === 'active' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                            }`}>
                              {tenant.status === 'active' ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="p-4 text-center text-muted-foreground text-sm">
                            {new Date().toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}