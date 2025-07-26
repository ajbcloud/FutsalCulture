import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin-layout';
import { adminAnalytics } from '@/lib/adminApi';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { TrendingUp, Users, DollarSign, Calendar } from 'lucide-react';

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAnalytics.get().then(data => {
      console.log('admin analytics:', data);
      setAnalytics(data);
      setLoading(false);
    }).catch(err => {
      console.error('Error fetching analytics:', err);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-white mb-6">Analytics Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-300">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ${analytics?.totalRevenue || 0}
            </div>
            <p className="text-xs text-zinc-400">Monthly revenue</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-300">Total Players</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {analytics?.totalPlayers || 0}
            </div>
            <p className="text-xs text-zinc-400">Registered players</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-300">Fill Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {analytics?.avgFillRate || 0}%
            </div>
            <p className="text-xs text-zinc-400">Average capacity</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-300">Active Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {analytics?.activeSessions || 0}
            </div>
            <p className="text-xs text-zinc-400">This week</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-zinc-900 p-6 rounded-lg">
        <h2 className="text-lg font-semibold text-white mb-4">Detailed Analytics</h2>
        <p className="text-zinc-400">"Work in progress" placeholder for detailed charts and reports.</p>
      </div>
    </AdminLayout>
  );
}