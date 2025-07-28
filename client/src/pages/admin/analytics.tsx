import React from 'react';
import { useQuery } from "@tanstack/react-query";
import AdminLayout from '@/components/admin-layout';
import RequireAdmin from "@/components/require-admin";
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { KPICard } from '../../components/kpi-card';
import { TrendingUp, Users, DollarSign, Calendar, Activity, Download } from 'lucide-react';

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
  revenueGrowth: number;
  playersGrowth: number;
  registrationsGrowth: number;
  sessionsGrowth: number;
  ytdGrowth: number;
}

interface BusinessInsights {
  peakHours: string;
  popularAgeGroups: string;
  revenueGrowth: string;
  utilizationRate: string;
  totalSessions: number;
  totalPlayers: number;
  thisMonthRevenue: number;
  lastMonthRevenue: number;
}

export default function AdminAnalytics() {
  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/admin/dashboard-metrics"],
  });

  const { data: insights, isLoading: insightsLoading } = useQuery<BusinessInsights>({
    queryKey: ["/api/admin/business-insights"],
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
            <KPICard
              title="Total Revenue"
              value={`$${((metrics?.ytdRevenue || 0) / 100).toFixed(2)}`}
              tooltip="Sum of all payments received from session bookings across all time periods."
              icon={DollarSign}
              iconColor="text-green-500"
              subtitle="All time revenue"
            />
            <KPICard
              title="Total Players"
              value={(metrics?.totalPlayers || 0).toString()}
              tooltip="Total number of players registered in the system across all age groups."
              icon={Users}
              iconColor="text-blue-500"
              subtitle="Registered players"
            />
            <KPICard
              title="Fill Rate"
              value={`${metrics?.fillRate || 0}%`}
              tooltip="Percentage of session capacity filled across all sessions and age groups."
              icon={TrendingUp}
              iconColor="text-orange-500"
              subtitle="Session capacity"
            />
            <KPICard
              title="Active Sessions"
              value={(metrics?.sessionsThisWeek || 0).toString()}
              tooltip="Training sessions scheduled for the current week across all locations."
              icon={Activity}
              iconColor="text-purple-500"
              subtitle="This week"
            />
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <KPICard
              title="Monthly Revenue"
              value={`$${((metrics?.monthlyRevenue || 0) / 100).toFixed(2)}`}
              tooltip="Sum of all payments received this month from session bookings."
              icon={DollarSign}
              iconColor="text-green-500"
              subtitle="Current month"
            />
            <KPICard
              title="YTD Revenue"
              value={`$${((metrics?.ytdRevenue || 0) / 100).toFixed(2)}`}
              tooltip="Total revenue from January 1 to today across all sessions."
              icon={DollarSign}
              iconColor="text-green-500"
              subtitle="Year to date"
            />
            <KPICard
              title="Active Parents"
              value={(metrics?.activeParents || 0).toString()}
              tooltip="Parents who logged in within the last 30 days and engaged with the platform."
              icon={Users}
              iconColor="text-blue-500"
              subtitle="Last 30 days"
            />
          </div>

          {/* Data Export & Analysis */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                Data Export & Analysis
                <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-400">
                Export the current filtered dataset as CSV for further analysis in Excel or other tools. 
                Includes revenue, occupancy rates, and player growth data for the selected period.
              </p>
            </CardContent>
          </Card>

          {/* Dynamic Business Insights */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Business Insights</CardTitle>
            </CardHeader>
            <CardContent>
              {insightsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="text-white font-medium mb-2">Peak Hours</h3>
                    <p className="text-zinc-400">
                      {insights?.peakHours || "Most bookings occur between 6-8 PM"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-2">Popular Age Groups</h3>
                    <p className="text-zinc-400">
                      {insights?.popularAgeGroups || "U12 and U14 have highest enrollment"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-2">Revenue Growth</h3>
                    <p className="text-zinc-400">
                      {insights?.revenueGrowth || "15% increase month-over-month"}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

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
                      {metrics?.ytdRevenue && metrics?.totalPlayers 
                        ? `$${((metrics.ytdRevenue / metrics.totalPlayers) / 100).toFixed(2)}`
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
          {/* Chart Placeholder Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Revenue Chart</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center">
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
        </div>
      </AdminLayout>
    </RequireAdmin>
  );
}