import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { DatePickerWithRange } from '@/components/ui/date-picker';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar,
  Building,
  Download,
  Filter
} from 'lucide-react';
import { DateRange } from 'react-day-picker';

interface AnalyticsData {
  platformGrowth: Array<{
    date: string;
    users: number;
    revenue: number;
    sessions: number;
    tenants: number;
  }>;
  tenantActivity: Array<{
    name: string;
    users: number;
    sessions: number;
    revenue: number;
    growth: number;
  }>;
  ageGroupDistribution: Array<{
    ageGroup: string;
    count: number;
    percentage: number;
  }>;
  monthlyMetrics: {
    totalRevenue: number;
    revenueGrowth: number;
    totalUsers: number;
    userGrowth: number;
    totalSessions: number;
    sessionGrowth: number;
    activeTenants: number;
    tenantGrowth: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function SuperAdminAnalytics() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date()
  });
  const [selectedTenant, setSelectedTenant] = useState<string>('all');
  const [ageGroupFilter, setAgeGroupFilter] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');

  // Fetch analytics data
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['/api/super-admin/analytics', { 
      dateRange, 
      tenant: selectedTenant,
      ageGroup: ageGroupFilter,
      gender: genderFilter 
    }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange?.from) params.append('from', dateRange.from.toISOString());
      if (dateRange?.to) params.append('to', dateRange.to.toISOString());
      if (selectedTenant !== 'all') params.append('tenant', selectedTenant);
      if (ageGroupFilter !== 'all') params.append('ageGroup', ageGroupFilter);
      if (genderFilter !== 'all') params.append('gender', genderFilter);
      
      const response = await fetch(`/api/super-admin/analytics?${params}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    }
  });

  // Fetch tenants for filter
  const { data: tenants = [] } = useQuery({
    queryKey: ['/api/super-admin/tenants-list'],
    queryFn: async () => {
      const response = await fetch('/api/super-admin/tenants');
      if (!response.ok) throw new Error('Failed to fetch tenants');
      return response.json();
    }
  });

  const handleExportData = async () => {
    try {
      const params = new URLSearchParams();
      if (dateRange?.from) params.append('from', dateRange.from.toISOString());
      if (dateRange?.to) params.append('to', dateRange.to.toISOString());
      if (selectedTenant !== 'all') params.append('tenant', selectedTenant);
      
      const response = await fetch(`/api/super-admin/analytics/export?${params}`);
      if (!response.ok) throw new Error('Failed to export data');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Analytics & Reports</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded animate-pulse mb-2" />
                <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics & Reports</h1>
          <p className="text-muted-foreground">Platform insights and performance metrics</p>
        </div>
        
        <Button onClick={handleExportData}>
          <Download className="w-4 h-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="text-sm text-muted-foreground">
                Date Range: {dateRange?.from?.toLocaleDateString()} - {dateRange?.to?.toLocaleDateString()}
              </div>
            </div>
            <Select value={selectedTenant} onValueChange={setSelectedTenant}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Organizations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Organizations</SelectItem>
                {tenants.map((tenant: any) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={ageGroupFilter} onValueChange={setAgeGroupFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Age Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ages</SelectItem>
                <SelectItem value="U8">U8</SelectItem>
                <SelectItem value="U10">U10</SelectItem>
                <SelectItem value="U12">U12</SelectItem>
                <SelectItem value="U14">U14</SelectItem>
                <SelectItem value="U16">U16</SelectItem>
                <SelectItem value="U18">U18</SelectItem>
              </SelectContent>
            </Select>
            <Select value={genderFilter} onValueChange={setGenderFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="boys">Boys</SelectItem>
                <SelectItem value="girls">Girls</SelectItem>
                <SelectItem value="mixed">Mixed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      {analytics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(analytics.monthlyMetrics.totalRevenue / 100).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className={analytics.monthlyMetrics.revenueGrowth > 0 ? 'text-green-600' : 'text-red-600'}>
                    {analytics.monthlyMetrics.revenueGrowth > 0 ? '+' : ''}{analytics.monthlyMetrics.revenueGrowth}%
                  </span> from last period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.monthlyMetrics.totalUsers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  <span className={analytics.monthlyMetrics.userGrowth > 0 ? 'text-green-600' : 'text-red-600'}>
                    {analytics.monthlyMetrics.userGrowth > 0 ? '+' : ''}{analytics.monthlyMetrics.userGrowth}%
                  </span> growth
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.monthlyMetrics.totalSessions.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  <span className={analytics.monthlyMetrics.sessionGrowth > 0 ? 'text-green-600' : 'text-red-600'}>
                    {analytics.monthlyMetrics.sessionGrowth > 0 ? '+' : ''}{analytics.monthlyMetrics.sessionGrowth}%
                  </span> vs last period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.monthlyMetrics.activeTenants}</div>
                <p className="text-xs text-muted-foreground">
                  <span className={analytics.monthlyMetrics.tenantGrowth > 0 ? 'text-green-600' : 'text-red-600'}>
                    {analytics.monthlyMetrics.tenantGrowth > 0 ? '+' : ''}{analytics.monthlyMetrics.tenantGrowth}%
                  </span> growth
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Growth</CardTitle>
                <CardDescription>User and revenue trends over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics.platformGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        name === 'revenue' ? `$${(value / 100).toFixed(2)}` : value.toLocaleString(),
                        name === 'users' ? 'Users' : name === 'revenue' ? 'Revenue' : 'Sessions'
                      ]}
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="users"
                      stackId="1"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="revenue"
                      stroke="#82ca9d"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performing Tenants</CardTitle>
                <CardDescription>Organizations by activity and revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.tenantActivity.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        name === 'revenue' ? `$${(value / 100).toFixed(2)}` : value.toLocaleString(),
                        name === 'users' ? 'Users' : name === 'sessions' ? 'Sessions' : 'Revenue'
                      ]}
                    />
                    <Bar dataKey="sessions" fill="#8884d8" />
                    <Bar dataKey="revenue" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Age Group Distribution</CardTitle>
                <CardDescription>Player demographics across the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.ageGroupDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ ageGroup, percentage }) => `${ageGroup} (${percentage}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analytics.ageGroupDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tenant Activity Overview</CardTitle>
                <CardDescription>All organizations ranked by performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {analytics.tenantActivity.map((tenant, index) => (
                    <div key={tenant.name} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{tenant.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {tenant.users} users • {tenant.sessions} sessions
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${(tenant.revenue / 100).toLocaleString()}</div>
                        <div className={`text-sm ${tenant.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {tenant.growth >= 0 ? '+' : ''}{tenant.growth}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}