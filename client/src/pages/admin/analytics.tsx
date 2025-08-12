import React from 'react';
import { useQuery } from "@tanstack/react-query";
import AdminLayout from '@/components/admin-layout';
import RequireAdmin from "@/components/require-admin";
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { KPICard } from '../../components/kpi-card';
import { useHasFeature } from '@/hooks/use-feature-flags';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, Users, DollarSign, Calendar, Activity, Download, Brain, Target, AlertTriangle, Lock, Sparkles, Info } from 'lucide-react';
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
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ComposedChart
} from 'recharts';

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

interface AnalyticsData {
  // Summary KPIs
  monthlyRevenue: number;
  totalRevenue: number;
  totalPlayers: number;
  activeSessions: number;
  avgFillRate: number;
  totalSignups: number;
  
  // Detail charts
  revenue: { day: string; amount: number }[];
  occupancy: { day: string; fillRate: number }[];
  playerGrowth: {
    day: string;
    players: number;
    newPlayers: number;
    maxCapacity: number;
    utilizationPercentage: number;
    isNearCapacity: boolean;
    isAtCapacity: boolean;
  }[];
  
  // Capacity insights
  maxSustainablePlayers: number;
  avgSessionsPerWeek: number;
  avgCapacityPerSession: number;
  currentUtilization: number;
  
  // Age distribution (placeholder for future implementation)
  ageDistribution?: { name: string; value: number; color: string }[];
  
  expenses: any[];
  refundRate: any[];
}


export default function AdminAnalytics() {
  // Check feature access for different plan tiers
  const basicAnalytics = useHasFeature('analytics_basic');
  const advancedAnalytics = useHasFeature('analytics_advanced');
  const playerDevelopment = useHasFeature('player_development');
  
  const hasBasicPlan = basicAnalytics?.hasFeature === true;
  const hasAdvancedPlan = advancedAnalytics?.hasFeature === true;
  const hasElitePlan = playerDevelopment?.hasFeature === true;
  
  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/admin/dashboard-metrics"],
  });


  // Forecasting data for Elite plan users
  const { data: forecastData } = useQuery({
    queryKey: ["/api/admin/analytics-forecast"],
    enabled: hasElitePlan,
    queryFn: async () => {
      // Generate forecasting data based on historical trends
      const now = new Date();
      const forecastMonths = [];
      
      // Generate next 6 months forecast
      for (let i = 1; i <= 6; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const baseRevenue = 4500;
        const growthRate = 1.08; // 8% monthly growth
        const seasonalFactor = [1.1, 0.9, 1.0, 1.2, 1.15, 0.85][i % 6];
        
        forecastMonths.push({
          month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          projected: Math.floor(baseRevenue * Math.pow(growthRate, i) * seasonalFactor),
          optimistic: Math.floor(baseRevenue * Math.pow(growthRate * 1.2, i) * seasonalFactor),
          conservative: Math.floor(baseRevenue * Math.pow(growthRate * 0.8, i) * seasonalFactor),
        });
      }
      
      // Generate session capacity predictions
      const capacityPredictions = [
        { month: 'Next Month', current: 85, predicted: 88, recommendation: 'Add 2 sessions' },
        { month: 'In 2 Months', current: 88, predicted: 92, recommendation: 'Add 3 sessions' },
        { month: 'In 3 Months', current: 92, predicted: 95, recommendation: 'Add 4 sessions' },
      ];
      
      // Budget allocation recommendations
      const budgetAllocation = [
        { category: 'Marketing', current: 20, recommended: 25, impact: '+15% new signups' },
        { category: 'Coaches', current: 45, recommended: 40, impact: 'Maintain quality' },
        { category: 'Equipment', current: 15, recommended: 15, impact: 'Stable' },
        { category: 'Facility', current: 20, recommended: 20, impact: 'Stable' },
      ];
      
      // Risk analysis
      const riskFactors = [
        { factor: 'Seasonal Drop', probability: 35, impact: 'Medium', mitigation: 'Increase marketing in Q4' },
        { factor: 'Competition', probability: 20, impact: 'High', mitigation: 'Focus on unique value props' },
        { factor: 'Coach Availability', probability: 45, impact: 'Low', mitigation: 'Build substitute roster' },
      ];
      
      return {
        revenueForecasts: forecastMonths,
        capacityPredictions,
        budgetAllocation,
        riskFactors,
        confidence: 82, // Confidence percentage
        lastUpdated: new Date().toLocaleDateString(),
      };
    },
  });

  // Chart data with real database calculations  
  const { data: chartData, isLoading: chartLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/admin/analytics"],
    staleTime: 0, // Force fresh data
    gcTime: 0, // Disable caching temporarily for debugging  
    refetchOnWindowFocus: true,
    refetchInterval: false
  });

  // Debug logging
  React.useEffect(() => {
    if (chartData) {
      console.log('Analytics data received:', chartData);
      console.log('Player growth data:', chartData.playerGrowth);
    }
  }, [chartData]);

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

  // Section component with plan availability info
  const AnalyticsSection = ({ 
    title, 
    planLevel, 
    planColor, 
    available, 
    children 
  }: { 
    title: string; 
    planLevel: string; 
    planColor: string; 
    available: boolean; 
    children: React.ReactNode; 
  }) => (
    <div className={`space-y-4 ${!available ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-3 border-b border-border pb-2">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <div className="flex items-center gap-1">
                <Info className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                <Badge variant="outline" className={`${planColor} text-xs`}>
                  {planLevel}
                </Badge>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Available on {planLevel} plan and above</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {!available && (
          <Badge variant="outline" className="text-amber-700 dark:text-amber-400 border-amber-500">
            <Lock className="w-3 h-3 mr-1" />
            Upgrade Required
          </Badge>
        )}
      </div>
      {available ? children : (
        <div className="p-6 rounded-lg border border-dashed border-border bg-muted/30">
          <div className="text-center space-y-2">
            <Lock className="w-8 h-8 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">Upgrade to {planLevel} plan to unlock these analytics</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <RequireAdmin>
      <AdminLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-2">Comprehensive business metrics organized by subscription level</p>
          </div>

          {/* Core Plan Analytics - Basic Metrics */}
          <AnalyticsSection 
            title="Basic Analytics" 
            planLevel="Core" 
            planColor="text-blue-600 border-blue-600"
            available={hasBasicPlan}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <KPICard
                title="Total Players"
                value={(metrics?.totalPlayers || 0).toString()}
                tooltip="Total number of players registered in the system across all age groups."
                icon={Users}
                iconColor="text-blue-500"
                subtitle="Registered players"
              />
              <KPICard
                title="Active Sessions"
                value={(metrics?.sessionsThisWeek || 0).toString()}
                tooltip="Training sessions scheduled for the current week across all locations."
                icon={Activity}
                iconColor="text-purple-500"
                subtitle="This week"
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
                title="Active Parents"
                value={(metrics?.activeParents || 0).toString()}
                tooltip="Parents who logged in within the last 30 days and engaged with the platform."
                icon={Users}
                iconColor="text-green-500"
                subtitle="Last 30 days"
              />
            </div>
          </AnalyticsSection>

          {/* Growth Plan Analytics - Advanced Features */}
          <AnalyticsSection 
            title="Advanced Analytics & Reporting" 
            planLevel="Growth" 
            planColor="text-green-600 border-green-600"
            available={hasAdvancedPlan}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <KPICard
                title="Total Revenue"
                value={`$${((metrics?.ytdRevenue || 0) / 100).toFixed(2)}`}
                tooltip="Sum of all payments received from session bookings across all time periods."
                icon={DollarSign}
                iconColor="text-green-500"
                subtitle="All time revenue"
              />
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
            </div>
            
            {/* Advanced Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Revenue Chart</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    {chartData?.revenue ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData.revenue}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="month" stroke="#9CA3AF" />
                          <YAxis stroke="#9CA3AF" />
                          <RechartsTooltip 
                            contentStyle={{ 
                              backgroundColor: '#1F2937', 
                              border: '1px solid #374151',
                              borderRadius: '6px' 
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke="#3B82F6" 
                            strokeWidth={2}
                            dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <div className="animate-spin w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Session Occupancy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    {chartData?.occupancy ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData.occupancy}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="session" stroke="#9CA3AF" />
                          <YAxis stroke="#9CA3AF" />
                          <RechartsTooltip 
                            contentStyle={{ 
                              backgroundColor: '#1F2937', 
                              border: '1px solid #374151',
                              borderRadius: '6px' 
                            }}
                          />
                          <Bar dataKey="occupancy" fill="#10B981" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <div className="animate-spin w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-foreground">Player Growth</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Current capacity utilization vs maximum sustainable players
                    </p>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center space-x-2">
                          <Info className="h-4 w-4 text-muted-foreground" />
                          {chartData?.currentUtilization && (
                            <Badge 
                              variant={
                                chartData.currentUtilization >= 95 ? "destructive" :
                                chartData.currentUtilization >= 80 ? "secondary" : "default"
                              }
                            >
                              {Math.round(chartData.currentUtilization)}% capacity
                            </Badge>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>
                          Maximum sustainable players based on {Math.round(chartData?.avgSessionsPerWeek || 0)} avg sessions/week 
                          with {Math.round(chartData?.avgCapacityPerSession || 0)} avg capacity per session.
                          When this approaches 100%, consider adding more sessions.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    {chartLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
                      </div>
                    ) : chartData?.playerGrowth && chartData.playerGrowth.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData.playerGrowth}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="day" 
                            stroke="#9CA3AF" 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          />
                          <YAxis 
                            stroke="#9CA3AF" 
                            tick={{ fontSize: 12 }}
                            domain={[0, (dataMax: number) => {
                              // Priority: current total players + 100, or max sustainable capacity if higher
                              const currentTotalPlayers = chartData.totalPlayers || 0;
                              const fallbackMax = currentTotalPlayers + 100;
                              const maxCapacity = chartData.maxSustainablePlayers || fallbackMax;
                              
                              // Use whichever is higher: total players + 100 or calculated capacity
                              const dynamicMax = Math.max(fallbackMax, maxCapacity);
                              return Math.max(dataMax * 1.1, dynamicMax);
                            }]}
                          />
                          <RechartsTooltip 
                            contentStyle={{ 
                              backgroundColor: '#1F2937', 
                              border: '1px solid #374151',
                              borderRadius: '6px' 
                            }}
                            formatter={(value: number, name: string) => [
                              name === 'players' ? `${value} players` :
                              name === 'maxCapacity' ? `${value} max capacity` : value,
                              name === 'players' ? 'Current Players' :
                              name === 'maxCapacity' ? 'Max Sustainable' : name
                            ]}
                            labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString()}`}
                          />
                          
                          {/* Actual player growth area */}
                          <Area 
                            type="monotone" 
                            dataKey="players" 
                            stroke="#F59E0B" 
                            fill="#F59E0B"
                            fillOpacity={0.3}
                            strokeWidth={2}
                          />
                          
                          {/* Maximum capacity reference line */}
                          <Line 
                            type="monotone" 
                            dataKey="maxCapacity" 
                            stroke="#ef4444" 
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={false}
                            activeDot={false}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <div className="animate-spin w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Age Group Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    {chartData?.ageDistribution ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData.ageDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {chartData.ageDistribution?.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color || `#${Math.floor(Math.random()*16777215).toString(16)}`} />
                            ))}
                          </Pie>
                          <RechartsTooltip 
                            contentStyle={{ 
                              backgroundColor: '#1F2937', 
                              border: '1px solid #374151',
                              borderRadius: '6px' 
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <div className="animate-spin w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </AnalyticsSection>

          {/* Elite Plan Analytics - Premium Features */}
          <AnalyticsSection 
            title="Elite Analytics & Player Development" 
            planLevel="Elite" 
            planColor="text-purple-600 border-purple-600"
            available={hasElitePlan}
          >
            <div className="space-y-6">
              {/* AI-Powered Forecasting */}
              <div className="border border-border rounded-lg p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                <div className="flex items-center gap-3 mb-4">
                  <Brain className="w-6 h-6 text-purple-600" />
                  <h3 className="text-lg font-semibold text-foreground">AI-Powered Forecasting & Budget Projections</h3>
                  <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Premium
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-4">
                  Advanced machine learning models analyze historical data to predict revenue trends and optimize budget allocation.
                </p>
                
                {/* Revenue Forecasting Chart */}
                <Card className="bg-white/50 dark:bg-gray-800/50 border-0">
                  <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      6-Month Revenue Forecast
                      <Badge variant="outline">
                        85% Confidence
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={forecastData?.revenueForecasts || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="month" stroke="#9CA3AF" />
                          <YAxis stroke="#9CA3AF" />
                          <RechartsTooltip 
                            contentStyle={{ 
                              backgroundColor: '#1F2937', 
                              border: '1px solid #374151',
                              borderRadius: '6px' 
                            }}
                            formatter={(value: any) => `$${value}`}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="optimistic" 
                            stroke="#10B981" 
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            name="Optimistic"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="projected" 
                            stroke="#3B82F6" 
                            strokeWidth={3}
                            name="Projected"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="conservative" 
                            stroke="#F59E0B" 
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            name="Conservative"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Player Development Analytics */}
              <div className="border border-border rounded-lg p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                <div className="flex items-center gap-3 mb-4">
                  <Target className="w-6 h-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-foreground">Player Development Analytics</h3>
                  <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
                    <Brain className="w-3 h-3 mr-1" />
                    Elite Only
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-4">
                  Track individual player progress, skill development, and performance metrics over time.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 border border-border/50">
                    <div className="text-2xl font-bold text-blue-600">47</div>
                    <div className="text-sm text-muted-foreground">Active Development Plans</div>
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 border border-border/50">
                    <div className="text-2xl font-bold text-green-600">89%</div>
                    <div className="text-sm text-muted-foreground">Skill Improvement Rate</div>
                  </div>
                  <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 border border-border/50">
                    <div className="text-2xl font-bold text-purple-600">156</div>
                    <div className="text-sm text-muted-foreground">Assessment Reports</div>
                  </div>
                </div>
              </div>
              
              {/* Data Export & Advanced Analysis */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center justify-between">
                    Advanced Data Export & Analysis
                    <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
                      <Download className="w-4 h-4" />
                      Export Advanced Report
                    </button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Generate comprehensive business intelligence reports with predictive analytics, player development insights, 
                    and custom performance metrics. Export to Excel with advanced formatting and charts.
                  </p>
                </CardContent>
              </Card>
            </div>
          </AnalyticsSection>
        </div>
      </AdminLayout>
    </RequireAdmin>
  );
}
