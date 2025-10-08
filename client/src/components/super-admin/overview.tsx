import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/kpi-card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Badge } from "@/components/ui/badge";
import GeographicDistribution from "@/components/super-admin/geographic-distribution";
import { 
  DollarSign, 
  Users, 
  Calendar, 
  CreditCard,
  Building2,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Minus,
  ClipboardList,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowRight,
  Plus
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { format } from "date-fns";

interface SuperAdminMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  ytdRevenue: number;
  totalPlayers: number;
  totalTenants: number;
  totalSessions: number;
  pendingPayments: number;
  revenueGrowth: number;
  playersGrowth: number;
  tenantsGrowth: number;
}

// Pending Registrations Widget Component
function PendingRegistrationsWidget() {
  // Fetch pending registration stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/super-admin/pending-registrations/stats'],
    queryFn: async () => {
      const response = await fetch('/api/super-admin/pending-registrations/stats', {
        credentials: 'include'
      });
      if (!response.ok) {
        return {
          totalPending: 0,
          pendingByType: { parents: 0, players: 0 },
          pendingByTenant: [],
          recentRegistrations: [],
          trendData: []
        };
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <ClipboardList className="w-5 h-5 mr-2" />
            Pending Registrations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.totalPending === 0) {
    return null; // Don't show widget if no pending registrations
  }

  return (
    <Card className="w-full border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <ClipboardList className="w-5 h-5 mr-2 text-orange-600" />
            Pending Registrations
          </CardTitle>
          <Link href="/super-admin/pending-registrations">
            <Button variant="outline" size="sm" className="gap-2">
              View All
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {stats.totalPending}
              </div>
              <div className="text-xs text-muted-foreground">Total Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {stats.pendingByType.parents}
              </div>
              <div className="text-xs text-muted-foreground">Parents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {stats.pendingByType.players}
              </div>
              <div className="text-xs text-muted-foreground">Players</div>
            </div>
          </div>

          {/* Top Tenants with Pending */}
          {stats.pendingByTenant && stats.pendingByTenant.length > 0 && (
            <div>
              <div className="text-sm font-medium mb-2">By Organization</div>
              <div className="space-y-2">
                {stats.pendingByTenant.slice(0, 3).map((tenant: any) => (
                  <div key={tenant.tenantId} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground truncate">{tenant.tenantName}</span>
                    <Badge variant="secondary">{tenant.pendingCount}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Registrations */}
          {stats.recentRegistrations && stats.recentRegistrations.length > 0 && (
            <div>
              <div className="text-sm font-medium mb-2">Recent Registrations</div>
              <div className="space-y-2">
                {stats.recentRegistrations.slice(0, 3).map((reg: any) => (
                  <div key={reg.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {reg.type === 'parent' ? (
                        <Users className="w-3 h-3 text-muted-foreground" />
                      ) : (
                        <Users className="w-3 h-3 text-blue-500" />
                      )}
                      <span className="truncate">{reg.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(reg.createdAt), 'MMM d')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alert Message */}
          <div className="flex items-center gap-2 p-3 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
            <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0" />
            <span className="text-sm text-orange-900 dark:text-orange-200">
              {stats.totalPending} registration{stats.totalPending !== 1 ? 's' : ''} awaiting approval
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SuperAdminOverview() {
  const [selectedTenant, setSelectedTenant] = useState("all");
  const [dateRange, setDateRange] = useState<any>(null);

  // Fetch super admin metrics
  const { data: metricsData, isLoading } = useQuery({
    queryKey: ["/api/super-admin/stats", selectedTenant, dateRange],
    queryFn: async () => {
      const tenantParam = selectedTenant !== 'all' ? `?tenantId=${selectedTenant}` : '';
      const response = await fetch(`/api/super-admin/stats${tenantParam}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        return {
          totals: { revenue: 0, players: 0, activeTenants: 0, sessionsThisMonth: 0, pendingPayments: 0 },
          topTenants: [],
          recentActivity: []
        };
      }
      return response.json();
    },
  });
  
  const metrics = metricsData ? {
    totalRevenue: metricsData.totals?.revenue || 0,
    monthlyRevenue: metricsData.totals?.revenue || 0,
    ytdRevenue: metricsData.totals?.revenue || 0,
    totalPlayers: metricsData.totals?.players || 0,
    totalTenants: metricsData.totals?.activeTenants || 0,
    totalSessions: metricsData.totals?.sessionsThisMonth || 0,
    pendingPayments: metricsData.totals?.pendingPayments || 0,
    revenueGrowth: 15,
    playersGrowth: 8,
    tenantsGrowth: 2,
  } : null;

  // Fetch tenants for filter
  const { data: tenantsData } = useQuery({
    queryKey: ["/api/super-admin/tenants"],
    queryFn: async () => {
      const response = await fetch("/api/super-admin/tenants", {
        credentials: 'include'
      });
      if (!response.ok) return { rows: [] };
      return response.json();
    },
  });
  
  const tenants = tenantsData?.rows || [];

  const formatGrowth = (growth: number) => {
    if (!isFinite(growth) || isNaN(growth)) {
      return { text: "New", icon: ArrowUp, color: "text-green-500" };
    }
    
    if (growth === 0) return { text: "±0.0%", icon: Minus, color: "text-gray-500" };
    if (growth > 0) return { text: `+${growth}%`, icon: ArrowUp, color: "text-green-500" };
    return { text: `${growth}%`, icon: ArrowDown, color: "text-red-500" };
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  const kpis = [
    {
      title: "Total Revenue",
      subtitle: "(All Tenants)",
      value: `$${((metrics?.totalRevenue || 0) / 100).toFixed(2)}`,
      icon: DollarSign,
      growth: metrics?.revenueGrowth || 0,
      comparison: "vs. last month",
      definition: "Sum of all payments received across all tenants"
    },
    {
      title: "Total Players",
      subtitle: "(Platform Wide)",
      value: (metrics?.totalPlayers || 0).toString(),
      icon: Users,
      growth: metrics?.playersGrowth || 0,
      comparison: "vs. last month",
      definition: "Total number of registered players across all tenants"
    },
    {
      title: "Active Tenants",
      subtitle: "(Organizations)",
      value: (metrics?.totalTenants || 0).toString(),
      icon: Building2,
      growth: metrics?.tenantsGrowth || 0,
      comparison: "vs. last month",
      definition: "Number of active futsal organizations on the platform"
    },
    {
      title: "Total Sessions",
      subtitle: "(This Month)",
      value: (metrics?.totalSessions || 0).toString(),
      icon: Calendar,
      growth: 0,
      comparison: "",
      definition: "Total training sessions scheduled across all tenants this month"
    },
    {
      title: "Pending Payments",
      subtitle: "(Needs Attention)",
      value: (metrics?.pendingPayments || 0).toString(),
      icon: CreditCard,
      growth: 0,
      comparison: "",
      isAlert: (metrics?.pendingPayments || 0) > 0,
      definition: "Number of unpaid signups across all tenants requiring follow-up"
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Platform Overview</h1>
          <p className="text-muted-foreground">Global metrics and insights across all tenants</p>
        </div>
        
        {/* Quick Filters */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Select value={selectedTenant} onValueChange={setSelectedTenant}>
            <SelectTrigger className="w-full sm:w-48">
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
          
          <div className="w-full sm:w-auto">
            <DatePickerWithRange
              date={dateRange}
              setDate={setDateRange}
              placeholder="Select date range"
            />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {kpis.map((kpi) => {
          const growthInfo = formatGrowth(kpi.growth);
          const GrowthIcon = growthInfo.icon;
          
          return (
            <KPICard
              key={kpi.title}
              title={kpi.title}
              subtitle={kpi.subtitle}
              value={kpi.value}
              icon={kpi.icon}
              definition={kpi.definition}
              className={kpi.isAlert ? "border-red-500 bg-red-50 dark:bg-red-950" : ""}
            />
          );
        })}
      </div>

      {/* Pending Registrations Widget */}
      <PendingRegistrationsWidget />

      {/* Geographic Distribution - Full Width */}
      <div className="w-full">
        <GeographicDistribution selectedTenant={selectedTenant} />
      </div>

      {/* Charts and additional content */}
      {/* Invitations Widget */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Platform Invitations</CardTitle>
          <Link href="/super-admin/invitations" className="text-sm text-primary hover:underline">
            View All →
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
            <div className="space-y-1">
              <p className="text-2xl font-bold">
                {metricsData?.invitations?.totalActive || 0}
              </p>
              <p className="text-xs text-muted-foreground">Active Codes</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">
                {metricsData?.invitations?.platformCodes || 0}
              </p>
              <p className="text-xs text-muted-foreground">Platform Codes</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">
                {metricsData?.invitations?.expiringThisWeek || 0}
              </p>
              <p className="text-xs text-muted-foreground">Expiring Soon</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">
                {metricsData?.invitations?.totalUsageToday || 0}
              </p>
              <p className="text-xs text-muted-foreground">Used Today</p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Top Code: {metricsData?.invitations?.topCode || 'N/A'}
              </Badge>
            </div>
            <Link href="/super-admin/invitations?tab=platform-codes">
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Create Code
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Tenants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tenants.slice(0, 5).map((tenant: any) => (
                <div key={tenant.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">{tenant.name}</p>
                      <p className="text-sm text-muted-foreground">{tenant.subdomain}.futsal.app</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Active</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Platform Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm">New tenant "Metro Futsal" created</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm">Payment processed: $450 - Elite Academy</p>
                  <p className="text-xs text-muted-foreground">4 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm">Help request resolved - Futsal Culture</p>
                  <p className="text-xs text-muted-foreground">6 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}