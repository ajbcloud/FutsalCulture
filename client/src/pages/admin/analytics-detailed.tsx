import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { DollarSign, Users, TrendingUp, Calendar, Download } from 'lucide-react';
import { adminApi } from '../../lib/adminApi';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function DetailedAnalytics() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [detailedData, setDetailedData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    ageGroup: '',
    gender: '',
    location: '',
    viewBy: 'account'
  });

  useEffect(() => {
    Promise.all([
      adminApi.getAnalytics(),
      fetch(`/api/admin/analytics?${new URLSearchParams(filters)}`).then(r => r.json())
    ])
      .then(([basicAnalytics, detailed]) => {
        setAnalytics(basicAnalytics);
        setDetailedData(detailed);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const applyFilters = async () => {
    setLoading(true);
    try {
      const detailed = await fetch(`/api/admin/analytics?${new URLSearchParams(filters)}`).then(r => r.json());
      setDetailedData(detailed);
    } catch (error) {
      console.error('Failed to fetch filtered analytics:', error);
    }
    setLoading(false);
  };

  const exportCSV = () => {
    if (!detailedData) return;
    
    // Create CSV data from current chart data
    const csvData = detailedData.revenue.map((item: any, index: number) => ({
      date: item.day,
      revenue: item.amount,
      occupancy: detailedData.occupancy[index]?.fillRate || 0,
      playerGrowth: detailedData.playerGrowth[index]?.count || 0
    }));
    
    const csv = [
      ['Date', 'Revenue', 'Occupancy %', 'New Players'],
      ...csvData.map((row: any) => [row.date, row.revenue, row.occupancy, row.playerGrowth])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${filters.startDate}-${filters.endDate}.csv`;
    a.click();
  };

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
      <h1 className="text-2xl font-bold text-white mb-6">Detailed Analytics Dashboard</h1>

      {/* Filters Toolbar */}
      <Card className="bg-zinc-900 border-zinc-800 mb-6">
        <CardHeader>
          <CardTitle className="text-white">Filters & Date Range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <Label className="text-zinc-300">Start Date</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            
            <div>
              <Label className="text-zinc-300">End Date</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            
            <div>
              <Label className="text-zinc-300">Age Group</Label>
              <Select value={filters.ageGroup} onValueChange={(value) => setFilters(prev => ({ ...prev, ageGroup: value }))}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="All Ages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Ages</SelectItem>
                  <SelectItem value="U8">U8</SelectItem>
                  <SelectItem value="U10">U10</SelectItem>
                  <SelectItem value="U12">U12</SelectItem>
                  <SelectItem value="U14">U14</SelectItem>
                  <SelectItem value="U16">U16</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-zinc-300">Gender</Label>
              <Select value={filters.gender} onValueChange={(value) => setFilters(prev => ({ ...prev, gender: value }))}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="All Genders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Genders</SelectItem>
                  <SelectItem value="boys">Boys</SelectItem>
                  <SelectItem value="girls">Girls</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-zinc-300">View By</Label>
              <Select value={filters.viewBy} onValueChange={(value) => setFilters(prev => ({ ...prev, viewBy: value }))}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="account">Account</SelectItem>
                  <SelectItem value="profile">Profile</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end gap-2">
              <Button onClick={applyFilters} className="bg-blue-600 hover:bg-blue-700">
                Apply
              </Button>
              <Button onClick={() => setFilters({
                startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0],
                ageGroup: '',
                gender: '',
                location: '',
                viewBy: 'account'
              })} variant="outline">
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-300">Period Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ${detailedData?.revenue?.reduce((sum: number, item: any) => sum + item.amount, 0) || 0}
            </div>
            <p className="text-xs text-zinc-400">Filtered period total</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-300">New Players</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {detailedData?.playerGrowth?.reduce((sum: number, item: any) => sum + item.count, 0) || 0}
            </div>
            <p className="text-xs text-zinc-400">Period growth</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-300">Avg Fill Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {detailedData?.occupancy?.length > 0 
                ? Math.round(detailedData.occupancy.reduce((sum: number, item: any) => sum + item.fillRate, 0) / detailedData.occupancy.length)
                : 0}%
            </div>
            <p className="text-xs text-zinc-400">Period average</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-300">Data Points</CardTitle>
            <Calendar className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {detailedData?.revenue?.length || 0}
            </div>
            <p className="text-xs text-zinc-400">Days with data</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Revenue Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={detailedData?.revenue || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="day" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                  formatter={(value: number) => [`$${value}`, 'Revenue']}
                />
                <Line dataKey="amount" stroke="#22c55e" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Session Occupancy Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={detailedData?.occupancy || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="day" stroke="#9ca3af" />
                <YAxis domain={[0, 100]} stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                  formatter={(value: number) => [`${value}%`, 'Fill Rate']}
                />
                <Area dataKey="fillRate" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Player Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={detailedData?.playerGrowth || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="day" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                  formatter={(value: number) => [value, 'New Players']}
                />
                <Bar dataKey="count" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Profit Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={detailedData?.revenue || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="day" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                  formatter={(value: number) => [`$${value}`, 'Profit']}
                />
                <Line 
                  dataKey="amount" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  dot={false}
                  name="Profit (Revenue - Expenses)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Data Export */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Data Export & Analysis</CardTitle>
          <Button onClick={exportCSV} className="bg-green-600 hover:bg-green-700">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-zinc-400">
            Export the current filtered dataset as CSV for further analysis in Excel or other tools.
            Includes revenue, occupancy rates, and player growth data for the selected period.
          </p>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}