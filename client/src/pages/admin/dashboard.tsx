import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin-layout";
import RequireAdmin from "@/components/require-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  Users, 
  Calendar, 
  CreditCard,
  TrendingUp,
  AlertCircle
} from "lucide-react";

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
  }>;
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  if (isLoading) {
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

  const kpiCards = [
    {
      title: "Total Revenue",
      value: `$${((stats?.totalRevenue || 0) / 100).toFixed(2)}`,
      icon: DollarSign,
      trend: "+12.5%",
      trendUp: true,
    },
    {
      title: "Total Players",
      value: stats?.totalPlayers?.toString() || "0",
      icon: Users,
      trend: "+3 this week",
      trendUp: true,
    },
    {
      title: "Sessions This Week",
      value: stats?.sessionsThisWeek?.toString() || "0",
      icon: Calendar,
      trend: "5 scheduled",
      trendUp: true,
    },
    {
      title: "Pending Payments",
      value: stats?.pendingPayments?.toString() || "0",
      icon: CreditCard,
      trend: "Needs attention",
      trendUp: false,
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

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpiCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.title} className="bg-zinc-900 border-zinc-700">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-zinc-400">
                      {card.title}
                    </CardTitle>
                    <Icon className="w-4 h-4 text-zinc-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white mb-1">
                      {card.value}
                    </div>
                    <div className={`text-xs flex items-center ${
                      card.trendUp ? 'text-green-500' : 'text-yellow-500'
                    }`}>
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {card.trend}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
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
                      <div key={task.id} className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
                        <div className="flex-1">
                          <p className="text-white text-sm">{task.message}</p>
                          <p className="text-zinc-400 text-xs mt-1">{task.type}</p>
                        </div>
                        <Badge 
                          variant={task.priority === 'high' ? 'destructive' : 
                                   task.priority === 'medium' ? 'default' : 'secondary'}
                        >
                          {task.priority}
                        </Badge>
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
            <CardHeader>
              <CardTitle className="text-white">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-zinc-800 rounded-lg">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm">Payment confirmed for U-10 Boys session</p>
                    <p className="text-zinc-400 text-xs">2 minutes ago</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-zinc-800 rounded-lg">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm">New player registered: Sarah Johnson</p>
                    <p className="text-zinc-400 text-xs">15 minutes ago</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-zinc-800 rounded-lg">
                  <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm">Session capacity reached: U-12 Girls Friday</p>
                    <p className="text-zinc-400 text-xs">1 hour ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </RequireAdmin>
  );
}