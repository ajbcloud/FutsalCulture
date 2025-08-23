import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import FilterBar from '@/components/shared/FilterBar';
import { get } from '@/lib/api';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Calendar, 
  UserCheck, 
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// Type definitions for all KPI responses
interface PlatformBillingKPIs {
  mrr: {
    core: number;
    growth: number;
    elite: number;
    total: number;
  };
  arr: number;
  planMix: Array<{ plan: string; count: number; percentage: number }>;
  churn: {
    monthlyChurnRate: number;
    quarterlyChurnRate: number;
    churned: number;
    retained: number;
  };
  arpt: number;
  outstandingReceivables: {
    amount: number;
    count: number;
    aging: Array<{ range: string; amount: number; count: number }>;
  };
}

interface ClientCommerceKPIs {
  gtv: {
    amountCents: number;
    amount: number;
    transactionCount: number;
  };
  netRevenue: {
    amountCents: number;
    amount: number;
    transactionCount: number;
  };
  failedPaymentRate: {
    rate: number;
    amount: number;
    count: number;
  };
  refundRate: {
    rate: number;
    amount: number;
    count: number;
  };
  averageTicketSize: {
    cents: number;
    amount: number;
  };
  growthRate: {
    monthOverMonth: number;
    quarterOverQuarter: number;
  };
}

interface RegistrationKPIs {
  newRegistrations: number;
  conversionRate: {
    rate: number;
    paid: number;
    unpaid: number;
  };
  dropOffAnalysis: {
    viewedSessions: number;
    startedBooking: number;
    completedPayment: number;
    dropOffRate: number;
  };
  retention: {
    weeklyRetention: number;
    monthlyRetention: number;
    repeatBookings: number;
  };
}

interface PlayerKPIs {
  totalPlayers: number;
  newPlayers: number;
  activePlayers: {
    count: number;
    withMultipleBookings: number;
    averageBookingsPerPlayer: number;
  };
  returningVsNew: {
    returning: number;
    new: number;
    retentionRate: number;
  };
  demographics: Array<{
    gender: string;
    count: number;
    percentage: number;
    averageAge: number;
  }>;
  growthTrend: {
    monthOverMonth: number;
    newPlayerRate: number;
  };
  churnRisk: {
    inactivePlayers: number;
    churnRate: number;
  };
}

interface SessionKPIs {
  scheduled: number;
  completed: number;
  fillRate: {
    percentage: number;
    averageAttendance: number;
    capacityUtilization: number;
  };
  revenue: {
    total: number;
    totalCents: number;
    perSession: number;
    perPlayer: number;
  };
  attendance: {
    totalBookings: number;
    averagePerSession: number;
    noShows: number;
    showRate: number;
  };
  demographics: {
    topAgeGroups: string[];
    genderSplit: { boys: number; girls: number };
    sessionsByAge: Array<{ ageGroup: string; sessions: number; bookings: number }>;
  };
  trends: {
    weeklyGrowth: number;
    monthlyGrowth: number;
    capacityTrend: string;
  };
}

interface ParentKPIs {
  totalParents: number;
  activeParents: number;
  engagementRate: number;
  bookingsPerParent: {
    average: number;
    median: number;
    distribution: {
      low: number;
      medium: number;
      high: number;
    };
  };
  ltv: {
    averagePerParent: number;
    totalRevenue: number;
    top10Percent: {
      count: number;
      averageLtv: number;
      revenueContribution: number;
    };
  };
  retention: {
    monthlyRetention: number;
    quarterlyRetention: number;
    churnedParents: number;
    churnRate: number;
  };
  playerRelationships: {
    singleChild: number;
    multipleChildren: number;
    averageChildrenPerParent: number;
  };
}

interface CrossCuttingKPIs {
  tenantLtv: Array<{
    tenantId: string;
    tenantName: string;
    planLevel: string;
    totalRevenue: number;
    playerCount: number;
    parentCount: number;
    sessionCount: number;
    revenuePerPlayer: number;
    revenuePerSession: number;
  }>;
  churnRisk: Array<{
    tenantId: string;
    tenantName: string;
    daysSinceActivity: number;
    riskLevel: string;
    lastActivity: Date;
  }>;
  cohorts: Array<{
    cohort: string;
    initialSize: number;
    retentionRates: {
      month1: number;
      month2: number;
      month3: number;
      month6?: number;
    };
    ltvProgression: {
      month1: number;
      month2: number;
      month3: number;
      month6?: number;
    };
  }>;
  platformHealth: {
    tenantGrowthRate: number;
    revenueGrowthRate: number;
    playerGrowthRate: number;
    overallChurnRate: number;
    averageTenantLtv: number;
  };
}

// Color palette for charts
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

export default function EnhancedAnalytics() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [tenantId, setTenantId] = useState('all');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Query functions for all KPI endpoints
  const buildQueryFn = (endpoint: string) => () => {
    const params = new URLSearchParams();
    if (dateFrom) params.set('from', encodeURIComponent(dateFrom));
    if (dateTo) params.set('to', encodeURIComponent(dateTo));
    if (tenantId !== 'all') params.set('tenantId', tenantId);
    return get(`/api/super-admin/analytics/${endpoint}?${params}`);
  };

  const { data: platformBilling } = useQuery<PlatformBillingKPIs>({
    queryKey: ['/api/super-admin/analytics/platform-billing', dateFrom, dateTo, tenantId],
    queryFn: buildQueryFn('platform-billing'),
  });

  const { data: clientCommerce } = useQuery<ClientCommerceKPIs>({
    queryKey: ['/api/super-admin/analytics/client-commerce', dateFrom, dateTo, tenantId],
    queryFn: buildQueryFn('client-commerce'),
  });

  const { data: registrations } = useQuery<RegistrationKPIs>({
    queryKey: ['/api/super-admin/analytics/registrations', dateFrom, dateTo, tenantId],
    queryFn: buildQueryFn('registrations'),
  });

  const { data: players } = useQuery<PlayerKPIs>({
    queryKey: ['/api/super-admin/analytics/players', dateFrom, dateTo, tenantId],
    queryFn: buildQueryFn('players'),
  });

  const { data: sessions } = useQuery<SessionKPIs>({
    queryKey: ['/api/super-admin/analytics/sessions', dateFrom, dateTo, tenantId],
    queryFn: buildQueryFn('sessions'),
  });

  const { data: parents } = useQuery<ParentKPIs>({
    queryKey: ['/api/super-admin/analytics/parents', dateFrom, dateTo, tenantId],
    queryFn: buildQueryFn('parents'),
  });

  const { data: crossCutting } = useQuery<CrossCuttingKPIs>({
    queryKey: ['/api/super-admin/analytics/cross-cutting', dateFrom, dateTo, tenantId],
    queryFn: buildQueryFn('cross-cutting'),
  });

  const handleDateRangeChange = (from: string, to: string) => {
    setDateFrom(from);
    setDateTo(to);
  };

  const handleTenantChange = (value: string) => {
    setTenantId(value);
  };

  const handleClearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setTenantId('all');
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Helper component for metric cards
  const MetricCard = ({ title, value, change, icon: Icon, color = 'blue' }: {
    title: string;
    value: string | number;
    change?: { value: number; label: string };
    icon: any;
    color?: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 text-${color}-600`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <div className="flex items-center text-xs text-muted-foreground">
            {change.value > 0 ? (
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
            )}
            <span className={change.value > 0 ? 'text-green-600' : 'text-red-600'}>
              {Math.abs(change.value)}%
            </span>
            <span className="ml-1">{change.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Helper component for collapsible sections
  const CollapsibleSection = ({ title, children, defaultOpen = false }: {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
  }) => {
    const isOpen = expandedSections[title] ?? defaultOpen;
    
    return (
      <Collapsible open={isOpen} onOpenChange={() => toggleSection(title)}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="flex w-full justify-between p-4 h-auto">
            <h3 className="text-lg font-semibold">{title}</h3>
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 p-4">
          {children}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Enhanced Analytics Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Comprehensive KPIs and metrics mapped directly to database tables
        </p>
      </div>

      <FilterBar
        showTenantFilter={true}
        onTenantChange={handleTenantChange}
        onDateRangeChange={handleDateRangeChange}
        onClearFilters={handleClearFilters}
        tenantId={tenantId}
        dateFrom={dateFrom}
        dateTo={dateTo}
        statusOptions={[
          { value: 'all', label: 'All Data' },
          { value: 'active', label: 'Active Only' }
        ]}
      />

      <div className="space-y-6">
        {/* Platform Billing Section */}
        <Card>
          <CollapsibleSection title="Platform Billing KPIs" defaultOpen={true}>
            {platformBilling && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <MetricCard
                    title="Monthly Recurring Revenue"
                    value={`$${platformBilling.mrr.total.toLocaleString()}`}
                    icon={DollarSign}
                    color="green"
                  />
                  <MetricCard
                    title="Annual Recurring Revenue"
                    value={`$${platformBilling.arr.toLocaleString()}`}
                    icon={TrendingUp}
                    color="blue"
                  />
                  <MetricCard
                    title="Average Revenue Per Tenant"
                    value={`$${platformBilling.arpt}`}
                    icon={Users}
                    color="purple"
                  />
                  <MetricCard
                    title="Monthly Churn Rate"
                    value={`${platformBilling.churn.monthlyChurnRate}%`}
                    icon={AlertTriangle}
                    color="red"
                  />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Plan Mix Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={platformBilling.planMix}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ plan, percentage }) => `${plan} (${percentage}%)`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {platformBilling.planMix.map((entry, index) => (
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
                      <CardTitle>Outstanding Receivables</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="text-2xl font-bold">${(platformBilling.outstandingReceivables.amount / 100).toLocaleString()}</div>
                          <div className="text-sm text-gray-500">{platformBilling.outstandingReceivables.count} outstanding payments</div>
                        </div>
                        <div className="space-y-2">
                          {platformBilling.outstandingReceivables.aging.map((item, index) => (
                            <div key={index} className="flex justify-between items-center">
                              <span className="text-sm">{item.range}</span>
                              <div className="text-right">
                                <div className="font-medium">${(item.amount / 100).toLocaleString()}</div>
                                <div className="text-xs text-gray-500">{item.count} payments</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </CollapsibleSection>
        </Card>

        {/* Client Commerce Section */}
        <Card>
          <CollapsibleSection title="Client Commerce KPIs" defaultOpen={false}>
            {clientCommerce && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <MetricCard
                    title="Gross Transaction Volume"
                    value={`$${clientCommerce.gtv.amount.toLocaleString()}`}
                    change={{ value: clientCommerce.growthRate.monthOverMonth, label: 'vs last month' }}
                    icon={DollarSign}
                    color="blue"
                  />
                  <MetricCard
                    title="Net Revenue"
                    value={`$${clientCommerce.netRevenue.amount.toLocaleString()}`}
                    icon={TrendingUp}
                    color="green"
                  />
                  <MetricCard
                    title="Average Ticket Size"
                    value={`$${clientCommerce.averageTicketSize.amount}`}
                    icon={Calendar}
                    color="purple"
                  />
                  <MetricCard
                    title="Failed Payment Rate"
                    value={`${clientCommerce.failedPaymentRate.rate.toFixed(1)}%`}
                    icon={AlertTriangle}
                    color="red"
                  />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Payment Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {clientCommerce.netRevenue.transactionCount}
                            </div>
                            <div className="text-sm text-gray-500">Successful Payments</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">
                              {clientCommerce.failedPaymentRate.count}
                            </div>
                            <div className="text-sm text-gray-500">Failed Payments</div>
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm">Success Rate</span>
                            <span className="text-sm font-medium">
                              {((clientCommerce.netRevenue.transactionCount / (clientCommerce.netRevenue.transactionCount + clientCommerce.failedPaymentRate.count)) * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ 
                                width: `${((clientCommerce.netRevenue.transactionCount / (clientCommerce.netRevenue.transactionCount + clientCommerce.failedPaymentRate.count)) * 100)}%` 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Refund Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="text-2xl font-bold">{clientCommerce.refundRate.rate.toFixed(2)}%</div>
                          <div className="text-sm text-gray-500">Refund Rate</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="font-medium">{clientCommerce.refundRate.count}</div>
                            <div className="text-gray-500">Total Refunds</div>
                          </div>
                          <div>
                            <div className="font-medium">${clientCommerce.refundRate.amount.toLocaleString()}</div>
                            <div className="text-gray-500">Refunded Amount</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </CollapsibleSection>
        </Card>
      </div>
    </div>
  );
}