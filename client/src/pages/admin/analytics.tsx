import React from 'react';
import { useQuery } from "@tanstack/react-query";
import AdminLayout from '@/components/admin-layout';
import RequireAdmin from "@/components/require-admin";
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { TrendingUp, Users, DollarSign, Calendar, Activity } from 'lucide-react';

interface DashboardMetrics {
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
}

export default function AdminAnalytics() {
  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/admin/dashboard-metrics"],
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

  return (
    <RequireAdmin>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
            <p className="text-zinc-400 mt-2">Real-time business metrics and performance data</p>
          </div>

          {/* Primary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-zinc-900 border-zinc-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-300">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  ${((metrics?.totalRevenue || 0) / 100).toFixed(2)}
                </div>
                <p className="text-xs text-zinc-400">All time revenue</p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-300">Total Players</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {metrics?.totalPlayers || 0}
                </div>
                <p className="text-xs text-zinc-400">Registered players</p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-300">Fill Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {metrics?.fillRate || 0}%
                </div>
                <p className="text-xs text-zinc-400">Session capacity</p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-300">Active Sessions</CardTitle>
                <Activity className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {metrics?.sessionsThisWeek || 0}
                </div>
                <p className="text-xs text-zinc-400">This week</p>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-zinc-900 border-zinc-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-300">Monthly Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  ${((metrics?.monthlyRevenue || 0) / 100).toFixed(2)}
                </div>
                <p className="text-xs text-zinc-400">Current month</p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-300">YTD Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  ${((metrics?.ytdRevenue || 0) / 100).toFixed(2)}
                </div>
                <p className="text-xs text-zinc-400">Year to date</p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-300">Active Parents</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {metrics?.activeParents || 0}
                </div>
                <p className="text-xs text-zinc-400">Last 30 days</p>
              </CardContent>
            </Card>
          </div>

          {/* Data Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-zinc-900 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Registration Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Total Signups:</span>
                    <span className="text-white font-semibold">{metrics?.totalSignups || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">New This Month:</span>
                    <span className="text-white font-semibold">{metrics?.monthlyPlayers || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Pending Payments:</span>
                    <span className="text-yellow-500 font-semibold">{metrics?.pendingPayments || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Conversion Rate:</span>
                    <span className="text-white font-semibold">
                      {metrics?.totalSignups && metrics?.totalPlayers 
                        ? Math.round((metrics.totalSignups / metrics.totalPlayers) * 100) 
                        : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Avg Revenue per Player:</span>
                    <span className="text-white font-semibold">
                      {metrics?.totalRevenue && metrics?.totalPlayers 
                        ? `$${((metrics.totalRevenue / metrics.totalPlayers) / 100).toFixed(2)}`
                        : '$0.00'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Session Utilization:</span>
                    <span className="text-white font-semibold">{metrics?.fillRate || 0}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminLayout>
    </RequireAdmin>
  );
}
              <p className="text-zinc-400">Revenue chart will be displayed here</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Session Occupancy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <p className="text-zinc-400">Occupancy chart will be displayed here</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Player Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <p className="text-zinc-400">Player growth chart will be displayed here</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Age Group Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <p className="text-zinc-400">Age distribution pie chart will be displayed here</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Insights */}
      <div className="bg-zinc-900 p-6 rounded-lg">
        <h2 className="text-lg font-semibold text-white mb-4">Business Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-white font-medium mb-2">Peak Hours</h3>
            <p className="text-zinc-400">Most bookings occur between 6-8 PM</p>
          </div>
          <div>
            <h3 className="text-white font-medium mb-2">Popular Age Groups</h3>
            <p className="text-zinc-400">U12 and U14 have highest enrollment</p>
          </div>
          <div>
            <h3 className="text-white font-medium mb-2">Revenue Growth</h3>
            <p className="text-zinc-400">15% increase month-over-month</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}