import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { AlertTriangle, DollarSign, TrendingUp, Users, Calendar } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { get } from '@/lib/api';

interface KPIData {
  mrr: number;
  arr: number;
  nrr: number;
  grr: number;
  arAging: {
    b0_30: number;
    b31_60: number;
    b61_90: number;
    b90p: number;
  };
  churnRisk: Array<{
    tenantId: string;
    tenantName: string;
    lastPaidAt: string;
    failures: number;
  }>;
}

interface KPISeries {
  series: Array<{
    date: string;
    revenue: number;
  }>;
}

export default function CompanyKPIs() {
  const [period, setPeriod] = useState('3m');

  const { data: kpiData, isLoading } = useQuery<KPIData>({
    queryKey: ['/api/super-admin/kpi/overview'],
    queryFn: () => get('/api/super-admin/kpi/overview'),
  });

  const { data: seriesData } = useQuery<KPISeries>({
    queryKey: ['/api/super-admin/kpi/series', period],
    queryFn: () => get('/api/super-admin/kpi/series', { period }),
  });

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!kpiData) return null;

  const arAgingData = [
    { name: '0-30 days', value: kpiData.arAging.b0_30, color: '#10b981' },
    { name: '31-60 days', value: kpiData.arAging.b31_60, color: '#f59e0b' },
    { name: '61-90 days', value: kpiData.arAging.b61_90, color: '#f97316' },
    { name: '90+ days', value: kpiData.arAging.b90p, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">MRR</p>
                <p className="text-2xl font-bold">{formatCurrency(kpiData.mrr * 100)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ARR</p>
                <p className="text-2xl font-bold">{formatCurrency(kpiData.arr * 100)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Net Retention</p>
                <p className="text-2xl font-bold">{(kpiData.nrr * 100).toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">
                  GRR: {(kpiData.grr * 100).toFixed(1)}%
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Churn Risk</p>
                <p className="text-2xl font-bold">{kpiData.churnRisk.length}</p>
                <p className="text-xs text-muted-foreground">tenants at risk</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Trend */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Revenue Trend</CardTitle>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">1M</SelectItem>
                <SelectItem value="3m">3M</SelectItem>
                <SelectItem value="6m">6M</SelectItem>
                <SelectItem value="1y">1Y</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={seriesData?.series || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short' })}
                />
                <YAxis tickFormatter={(value) => formatCurrency(value * 100)} />
                <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString()} />
                <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* A/R Aging */}
        <Card>
          <CardHeader>
            <CardTitle>A/R Aging</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={arAgingData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  dataKey="value"
                >
                  {arAgingData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value * 100)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              {arAgingData.map((item) => (
                <div key={item.name} className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded mr-2"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Churn Risk List */}
      {kpiData.churnRisk.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
              Churn Risk Tenants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {kpiData.churnRisk.slice(0, 10).map((tenant) => (
                <div key={tenant.tenantId} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div>
                    <p className="font-medium">{tenant.tenantName}</p>
                    <p className="text-sm text-muted-foreground">
                      Last paid: {new Date(tenant.lastPaidAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="destructive">{tenant.failures} failures</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}