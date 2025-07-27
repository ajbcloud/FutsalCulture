import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { usePageRefresh } from "@/hooks/use-page-refresh";
import AdminLayout from "@/components/admin-layout";
import RequireAdmin from "@/components/require-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  DollarSign, 
  Users, 
  Calendar, 
  CreditCard,
  TrendingUp,
  TrendingDown,
  UserCheck,
  ClipboardList,
  ArrowUp,
  ArrowDown,
  Minus,
  ChevronRight,
  Activity,
  AlertCircle,
  RefreshCw
} from "lucide-react";

interface DashboardMetrics {
  // Primary KPIs
  totalRevenue: number;
  monthlyRevenue: number;
  ytdRevenue: number;
  totalPlayers: number;
  monthlyPlayers: number;
  totalSignups: number;
  sessionsThisWeek: number;
  pendingPayments: number;
  activeParents: number;
  fillRate: number;
  
  // Growth rates
  revenueGrowth: number;
  playersGrowth: number;
  registrationsGrowth: number;
  sessionsGrowth: number;
  ytdGrowth: number;
}

interface ActivityItem {
  id: string;
  type: string;
  icon: string;
  message: string;
  timestamp: string;
  timeAgo: string;
  // Navigation metadata for clickable activities
  navigationUrl?: string;
  searchTerm?: string;
  playerId?: string;
  parentId?: string;
}

interface AdminStats {
  totalRevenue: number;
  totalPlayers: number;
  sessionsThisWeek: number;
  pendingPayments: number;
  fillRate: number;
  pendingTasks: Array<{
    id: string;
    type: string;
    message: string;
    priority: 'high' | 'medium' | 'low';
    action?: string;
  }>;
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  
  // Automatically refresh data when navigating back to dashboard
  usePageRefresh([
    "/api/admin/dashboard-metrics",
    "/api/admin/recent-activity", 
    "/api/admin/stats"
  ]);
  
  // Fetch comprehensive dashboard metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/admin/dashboard-metrics"],
    staleTime: 0, // Always refetch for dashboard metrics
    refetchOnMount: true,
  });

  // Fetch recent activity
  const { data: activities, isLoading: activitiesLoading, refetch: refetchActivity } = useQuery<ActivityItem[]>({
    queryKey: ["/api/admin/recent-activity"],
    refetchInterval: 10000, // Auto-refresh every 10 seconds
    staleTime: 0, // Always consider data stale to ensure fresh fetches
    refetchOnMount: true,
  });

  // Legacy stats for backwards compatibility
  const { data: stats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    staleTime: 0, // Always refetch for stats
    refetchOnMount: true,
  });

  const handleTaskClick = (task: AdminStats['pendingTasks'][0]) => {
    if (task.action) {
      setLocation(task.action);
    }
  };

  const handleActivityClick = (activity: ActivityItem) => {
    if (activity.navigationUrl) {
      // Navigate to the URL with search parameters if available
      let url = activity.navigationUrl;
      if (activity.searchTerm) {
        url += `?search=${encodeURIComponent(activity.searchTerm)}`;
      }
      setLocation(url);
    }
  };

  const formatGrowth = (growth: number) => {
    // Handle edge cases
    if (!isFinite(growth) || isNaN(growth)) {
      return { text: "New", icon: ArrowUp, color: "text-green-500" };
    }
    
    if (growth === 0) return { text: "±0.0%", icon: Minus, color: "text-gray-500" };
    if (growth > 0) return { text: `+${growth}%`, icon: ArrowUp, color: "text-green-500" };
    return { text: `${growth}%`, icon: ArrowDown, color: "text-red-500" };
  };

  if (metricsLoading) {
    return (
      <RequireAdmin>
        <AdminLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
          </div>
        </AdminLayout>
      </RequireAdmin>
    );
  }

  // Primary KPI Cards
  const primaryKpis = [
    {
      title: "Total Revenue",
      subtitle: "(This Month)",
      value: `$${((metrics?.monthlyRevenue || 0) / 100).toFixed(2)}`,
      icon: DollarSign,
      growth: metrics?.revenueGrowth || 0,
      comparison: "vs. last month",
    },
    {
      title: "Total Players",
      subtitle: "(This Month)",
      value: (metrics?.totalPlayers || 0).toString(),
      icon: Users,
      growth: metrics?.playersGrowth || 0,
      comparison: "vs. last month",
    },
    {
      title: "Total Signups",
      subtitle: "(All Time)",
      value: (metrics?.totalSignups || 0).toString(),
      icon: ClipboardList,
      growth: metrics?.registrationsGrowth || 0,
      comparison: "vs. last month",
    },
    {
      title: "Sessions This Week",
      subtitle: "",
      value: (metrics?.sessionsThisWeek || 0).toString(),
      icon: Calendar,
      growth: metrics?.sessionsGrowth || 0,
      comparison: "vs. last week",
    },
    {
      title: "Pending Payments",
      subtitle: "(Needs attention)",
      value: (metrics?.pendingPayments || 0).toString(),
      icon: CreditCard,
      growth: 0, // No growth comparison for pending payments
      comparison: "",
      isAlert: (metrics?.pendingPayments || 0) > 0,
    },
  ];

  // Secondary KPI Cards
  const secondaryKpis = [
    {
      title: "YTD Revenue",
      subtitle: "",
      value: `$${((metrics?.ytdRevenue || 0) / 100).toFixed(2)}`,
      icon: DollarSign,
      growth: metrics?.ytdGrowth || 0,
      comparison: "vs. last year YTD",
    },
    {
      title: "Active Parents",
      subtitle: "(Last 30 days)",
      value: (metrics?.activeParents || 0).toString(),
      icon: UserCheck,
      growth: 0, // No historical comparison yet
      comparison: "",
    },
  ];

  return (
    <RequireAdmin>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-zinc-400 mt-2">
              Welcome to the Futsal Culture management portal
            </p>
          </div>

          {/* Primary KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <KPICard
              title="Total Revenue"
              value={`$${((metrics?.monthlyRevenue || 0) / 100).toFixed(2)}`}
              tooltip="Sum of all payments received this month from session bookings."
              icon={DollarSign}
              iconColor="text-green-500"
              subtitle="This Month"
              growth={metrics?.revenueGrowth || 0}
              showGrowth={true}
            />
            <KPICard
              title="Total Players"
              value={(metrics?.totalPlayers || 0).toString()}
              tooltip="Number of new player registrations this month."
              icon={Users}
              iconColor="text-blue-500"
              subtitle="This Month"
              growth={metrics?.playersGrowth || 0}
              showGrowth={true}
            />
            <KPICard
              title="Total Registrations"
              value={(metrics?.totalSignups || 0).toString()}
              tooltip="Session sign-ups created this month across all training sessions."
              icon={ClipboardList}
              iconColor="text-purple-500"
              subtitle="This Month"
              growth={metrics?.registrationsGrowth || 0}
              showGrowth={true}
            />
            <KPICard
              title="Sessions This Week"
              value={(metrics?.sessionsThisWeek || 0).toString()}
              tooltip="Training sessions scheduled for the current week."
              icon={Calendar}
              iconColor="text-orange-500"
              subtitle="Current Week"
              growth={metrics?.sessionsGrowth || 0}
              showGrowth={true}
            />
            <KPICard
              title="Pending Payments"
              value={(metrics?.pendingPayments || 0).toString()}
              tooltip="Unpaid reservations older than 1 hour that require attention."
              icon={CreditCard}
              iconColor={(metrics?.pendingPayments || 0) > 0 ? "text-yellow-500" : "text-zinc-500"}
              subtitle="Needs Attention"
              className={(metrics?.pendingPayments || 0) > 0 ? "border-yellow-500/50" : ""}
            />
          </div>

          {/* Secondary KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <KPICard
              title="YTD Revenue"
              value={`$${((metrics?.ytdRevenue || 0) / 100).toFixed(2)}`}
              tooltip="Total revenue from January 1 to today across all sessions."
              icon={DollarSign}
              iconColor="text-green-500"
              subtitle="Year to Date"
              growth={metrics?.ytdGrowth || 0}
              showGrowth={true}
            />
            <KPICard
              title="Active Parents"
              value={(metrics?.activeParents || 0).toString()}
              tooltip="Parents who logged in within the last 30 days."
              icon={UserCheck}
              iconColor="text-blue-500"
              subtitle="Last 30 Days"
            />
            <KPICard
              title="Fill Rate"
              value={`${metrics?.fillRate || 0}%`}
              tooltip="Percentage of session capacity filled across all sessions."
              icon={TrendingUp}
              iconColor="text-orange-500"
              subtitle="Average Capacity"
            />
          </div>

          {/* Alerts and Tasks */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Pending Tasks */}
            <Card className="bg-zinc-900 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Pending Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.pendingTasks?.length ? (
                    stats.pendingTasks.map((task) => (
                      <div 
                        key={task.id} 
                        className={`flex items-center justify-between p-3 bg-zinc-800 rounded-lg transition-colors ${
                          task.action ? 'hover:bg-zinc-700 cursor-pointer' : ''
                        }`}
                        onClick={() => task.action && handleTaskClick(task)}
                      >
                        <div className="flex-1">
                          <p className="text-white text-sm">{task.message}</p>
                          <p className="text-zinc-400 text-xs mt-1">{task.type}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={task.priority === 'high' ? 'destructive' : 
                                     task.priority === 'medium' ? 'default' : 'secondary'}
                          >
                            {task.priority}
                          </Badge>
                          {task.action && (
                            <ChevronRight className="w-4 h-4 text-zinc-400" />
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-zinc-400 text-center py-8">No pending tasks</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-zinc-900 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <a 
                    href="/admin/sessions/new" 
                    className="p-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-center text-white text-sm font-medium transition-colors"
                  >
                    Create Session
                  </a>
                  <a 
                    href="/admin/payments" 
                    className="p-3 bg-green-600 hover:bg-green-700 rounded-lg text-center text-white text-sm font-medium transition-colors"
                  >
                    Review Payments
                  </a>
                  <a 
                    href="/admin/players/import" 
                    className="p-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-center text-white text-sm font-medium transition-colors"
                  >
                    Import Players
                  </a>
                  <a 
                    href="/admin/help" 
                    className="p-3 bg-orange-600 hover:bg-orange-700 rounded-lg text-center text-white text-sm font-medium transition-colors"
                  >
                    Help Requests
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="bg-zinc-900 border-zinc-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-white">Recent Activity</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-zinc-400 hover:text-white"
                onClick={() => refetchActivity()}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-80">
                <div className="space-y-3">
                  {activitiesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
                    </div>
                  ) : activities && activities.length > 0 ? (
                    activities.map((activity) => (
                      <div 
                        key={`${activity.type}-${activity.id}`} 
                        className={`flex items-center space-x-3 p-3 bg-zinc-800 rounded-lg transition-colors ${
                          activity.navigationUrl ? 'hover:bg-zinc-700 cursor-pointer' : ''
                        }`}
                        onClick={() => activity.navigationUrl && handleActivityClick(activity)}
                      >
                        <div className="text-2xl">{activity.icon}</div>
                        <div className="flex-1">
                          <p className="text-white text-sm">{activity.message}</p>
                          <p className="text-zinc-400 text-xs">{activity.timeAgo}</p>
                        </div>
                        {activity.navigationUrl && (
                          <ChevronRight className="w-4 h-4 text-zinc-400" />
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                      <p className="text-zinc-400">No recent activity</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

        </div>
      </AdminLayout>
    </RequireAdmin>
  );
}