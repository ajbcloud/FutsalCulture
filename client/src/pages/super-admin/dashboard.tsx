import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Calendar, 
  DollarSign, 
  Users, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  Server,
  Database,
  Zap
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface SuperAdminMetrics {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  activeUsers: number;
  totalPlayers: number;
  totalSessions: number;
  totalRevenue: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  userGrowth: number;
  sessionGrowth: number;
  tenantGrowth: number;
}

interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

interface UsageChart {
  date: string;
  users: number;
  sessions: number;
  revenue: number;
}

export default function SuperAdminDashboard() {
  const [timeRange, setTimeRange] = useState<string>('30d');

  // Fetch super admin dashboard metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery<SuperAdminMetrics>({
    queryKey: ['/api/super-admin/dashboard-metrics', timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/super-admin/dashboard-metrics?timeRange=${timeRange}`);
      if (!response.ok) throw new Error('Failed to fetch metrics');
      return response.json();
    }
  });

  // Fetch system alerts
  const { data: alerts = [], isLoading: alertsLoading } = useQuery<SystemAlert[]>({
    queryKey: ['/api/super-admin/alerts'],
    queryFn: async () => {
      const response = await fetch('/api/super-admin/alerts');
      if (!response.ok) throw new Error('Failed to fetch alerts');
      return response.json();
    }
  });

  // Fetch usage trend data
  const { data: chartData = [], isLoading: chartLoading } = useQuery<UsageChart[]>({
    queryKey: ['/api/super-admin/usage-trends', timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/super-admin/usage-trends?timeRange=${timeRange}`);
      if (!response.ok) throw new Error('Failed to fetch usage trends');
      return response.json();
    }
  });

  const unresolvedAlerts = alerts.filter(alert => !alert.resolved);
  const criticalAlerts = unresolvedAlerts.filter(alert => alert.type === 'error');

  if (metricsLoading || alertsLoading || chartLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Platform Dashboard</h1>
            <p className="text-muted-foreground">System overview and key metrics</p>
          </div>
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
          <h1 className="text-3xl font-bold text-foreground">Platform Dashboard</h1>
          <p className="text-muted-foreground">System overview and key metrics</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* System Alerts */}
      {criticalAlerts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Critical System Alerts</AlertTitle>
          <AlertDescription>
            {criticalAlerts.length} critical issue{criticalAlerts.length > 1 ? 's' : ''} require immediate attention.
            <Button variant="link" className="p-0 ml-2">View All Alerts</Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalTenants || 0}</div>
            <p className="text-xs text-muted-foreground">
              <span className={metrics?.tenantGrowth && metrics.tenantGrowth > 0 ? 'text-green-600' : 'text-red-600'}>
                {metrics?.tenantGrowth > 0 ? '+' : ''}{metrics?.tenantGrowth || 0}%
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
            <div className="text-2xl font-bold">{metrics?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              <span className={metrics?.userGrowth && metrics.userGrowth > 0 ? 'text-green-600' : 'text-red-600'}>
                {metrics?.userGrowth > 0 ? '+' : ''}{metrics?.userGrowth || 0}%
              </span> growth this period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(metrics?.totalRevenue / 100 || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className={metrics?.revenueGrowth && metrics.revenueGrowth > 0 ? 'text-green-600' : 'text-red-600'}>
                {metrics?.revenueGrowth > 0 ? '+' : ''}{metrics?.revenueGrowth || 0}%
              </span> vs last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalSessions || 0}</div>
            <p className="text-xs text-muted-foreground">
              <span className={metrics?.sessionGrowth && metrics.sessionGrowth > 0 ? 'text-green-600' : 'text-red-600'}>
                {metrics?.sessionGrowth > 0 ? '+' : ''}{metrics?.sessionGrowth || 0}%
              </span> vs last period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.activeTenants || 0}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round(((metrics?.activeTenants || 0) / (metrics?.totalTenants || 1)) * 100)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.activeUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round(((metrics?.activeUsers || 0) / (metrics?.totalUsers || 1)) * 100)}% engagement rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Players</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalPlayers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Across all organizations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(metrics?.monthlyRevenue / 100 || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Current month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Trends</CardTitle>
            <CardDescription>User activity and session counts over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="users"
                  stroke="#8884d8"
                  strokeWidth={2}
                  name="Active Users"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="sessions"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  name="Sessions"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trends</CardTitle>
            <CardDescription>Platform revenue over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value: number) => [`$${(value / 100).toFixed(2)}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* System Health & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent System Alerts</CardTitle>
            <CardDescription>Latest system notifications and issues</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unresolvedAlerts.length === 0 ? (
                <p className="text-muted-foreground text-sm">No active alerts - system running smoothly</p>
              ) : (
                unresolvedAlerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Badge variant={alert.type === 'error' ? 'destructive' : alert.type === 'warning' ? 'secondary' : 'default'}>
                      {alert.type}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{alert.title}</p>
                      <p className="text-muted-foreground text-xs">{alert.message}</p>
                      <p className="text-muted-foreground text-xs mt-1">{new Date(alert.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                ))
              )}
              {unresolvedAlerts.length > 5 && (
                <Button variant="outline" size="sm" className="w-full">
                  View All {unresolvedAlerts.length} Alerts
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Core service status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Database</span>
                <Badge variant="default" className="bg-green-500">Online</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">API Services</span>
                <Badge variant="default" className="bg-green-500">Online</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Payment Processing</span>
                <Badge variant="default" className="bg-green-500">Online</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Email Service</span>
                <Badge variant="default" className="bg-green-500">Online</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Background Jobs</span>
                <Badge variant="default" className="bg-green-500">Online</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}