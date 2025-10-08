import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, RadialBarChart, RadialBar, 
  PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import {
  Heart, Activity, Moon, TrendingUp, TrendingDown,
  AlertCircle, CheckCircle, Footprints, Flame
} from 'lucide-react';
import { format } from 'date-fns';

interface MetricsDashboardProps {
  playerId: string;
  playerName: string;
  dateRange: string;
}

// Mock data generation based on date range
const generateMockData = (days: number) => {
  const data = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    data.push({
      date: format(date, 'MMM dd'),
      avgHeartRate: 65 + Math.floor(Math.random() * 20),
      maxHeartRate: 140 + Math.floor(Math.random() * 40),
      restingHeartRate: 55 + Math.floor(Math.random() * 15),
      steps: 5000 + Math.floor(Math.random() * 10000),
      distance: (3 + Math.random() * 7).toFixed(1),
      calories: 1500 + Math.floor(Math.random() * 1500),
      activeMinutes: 30 + Math.floor(Math.random() * 90),
      sleepDuration: 6 + Math.random() * 3,
      sleepQuality: 60 + Math.floor(Math.random() * 40),
      recoveryScore: 50 + Math.floor(Math.random() * 50),
      trainingLoad: 20 + Math.floor(Math.random() * 80),
    });
  }
  
  return data;
};

export default function MetricsDashboard({ playerId, playerName, dateRange }: MetricsDashboardProps) {
  // Parse date range
  const days = parseInt(dateRange) || 7;
  
  // Fetch metrics data
  const { data: metricsResponse, isLoading } = useQuery({
    queryKey: [`/api/admin/player-development/metrics/${playerId}`, { dateRange }],
    enabled: !!playerId,
  });

  // Use mock data if no real data available
  const metricsData = metricsResponse?.metrics || generateMockData(days);
  const latestMetrics = metricsResponse?.latest || metricsData[metricsData.length - 1];
  const recommendations = metricsResponse?.recommendations || [
    'Maintain consistent sleep schedule for better recovery',
    'Consider increasing hydration on high-intensity days',
    'Good heart rate variability - continue current training load'
  ];
  const anomalies = metricsResponse?.anomalies || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Calculate daily goals progress
  const dailyGoals = {
    steps: { current: latestMetrics?.steps || 0, goal: 10000 },
    activeMinutes: { current: latestMetrics?.activeMinutes || 0, goal: 60 },
    calories: { current: latestMetrics?.calories || 0, goal: 2500 },
    sleep: { current: latestMetrics?.sleepDuration || 0, goal: 8 },
  };

  const goalProgressData = [
    {
      name: 'Steps',
      value: Math.min((dailyGoals.steps.current / dailyGoals.steps.goal) * 100, 100),
      fill: '#8884d8'
    },
    {
      name: 'Activity',
      value: Math.min((dailyGoals.activeMinutes.current / dailyGoals.activeMinutes.goal) * 100, 100),
      fill: '#82ca9d'
    },
    {
      name: 'Calories',
      value: Math.min((dailyGoals.calories.current / dailyGoals.calories.goal) * 100, 100),
      fill: '#ffc658'
    },
    {
      name: 'Sleep',
      value: Math.min((dailyGoals.sleep.current / dailyGoals.sleep.goal) * 100, 100),
      fill: '#ff7c7c'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Resting HR</CardTitle>
              <Heart className="h-4 w-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-resting-hr">
              {latestMetrics?.restingHeartRate || 60} bpm
            </div>
            <p className="text-xs text-muted-foreground">
              Avg: {Math.round(metricsData.reduce((sum, d) => sum + d.restingHeartRate, 0) / metricsData.length)} bpm
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Steps Today</CardTitle>
              <Footprints className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-steps">
              {(latestMetrics?.steps || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Goal: 10,000 steps
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Recovery</CardTitle>
              <Activity className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-recovery">
              {latestMetrics?.recoveryScore || 75}%
            </div>
            <Badge 
              variant={latestMetrics?.recoveryScore >= 70 ? 'success' : 
                      latestMetrics?.recoveryScore >= 40 ? 'warning' : 'destructive'}
              className="text-xs mt-1"
            >
              {latestMetrics?.recoveryScore >= 70 ? 'Optimal' : 
               latestMetrics?.recoveryScore >= 40 ? 'Moderate' : 'Low'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Sleep Quality</CardTitle>
              <Moon className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-sleep">
              {latestMetrics?.sleepQuality || 85}%
            </div>
            <p className="text-xs text-muted-foreground">
              {(latestMetrics?.sleepDuration || 7).toFixed(1)} hours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Heart Rate Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Heart Rate Trends</CardTitle>
          <CardDescription>
            Resting, average, and maximum heart rate over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metricsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="restingHeartRate" 
                stroke="#ef4444" 
                name="Resting"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="avgHeartRate" 
                stroke="#f59e0b" 
                name="Average"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="maxHeartRate" 
                stroke="#dc2626" 
                name="Maximum"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Activity</CardTitle>
            <CardDescription>
              Steps and active minutes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={metricsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="steps" fill="#8884d8" name="Steps" />
                <Bar yAxisId="right" dataKey="activeMinutes" fill="#82ca9d" name="Active Minutes" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Training Load */}
        <Card>
          <CardHeader>
            <CardTitle>Training Load</CardTitle>
            <CardDescription>
              Workout intensity and recovery balance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={metricsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="trainingLoad" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.6}
                  name="Training Load"
                />
                <Area 
                  type="monotone" 
                  dataKey="recoveryScore" 
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.6}
                  name="Recovery Score"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Goals Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Goals Progress</CardTitle>
            <CardDescription>
              Today's achievement towards fitness goals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RadialBarChart 
                cx="50%" 
                cy="50%" 
                innerRadius="10%" 
                outerRadius="90%"
                data={goalProgressData}
                startAngle={180}
                endAngle={0}
              >
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                <RadialBar dataKey="value" cornerRadius={10} fill="#8884d8" />
                <Tooltip />
                <Legend />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {Object.entries(dailyGoals).map(([key, value]) => (
                <div key={key} className="text-xs">
                  <span className="font-medium capitalize">{key}:</span>{' '}
                  <span className="text-muted-foreground">
                    {value.current.toLocaleString()} / {value.goal.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recommendations & Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Insights & Recommendations</CardTitle>
            <CardDescription>
              Personalized guidance based on recent metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <p className="text-sm">{rec}</p>
                </div>
              ))}
              
              {anomalies.length > 0 && (
                <>
                  <div className="border-t pt-3 mt-3">
                    <p className="text-sm font-medium mb-2">Anomalies Detected:</p>
                    {anomalies.map((anomaly, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                        <p className="text-sm text-muted-foreground">{anomaly}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sleep Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Sleep Analysis</CardTitle>
          <CardDescription>
            Duration and quality of sleep over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={metricsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" orientation="left" stroke="#8b5cf6" />
              <YAxis yAxisId="right" orientation="right" stroke="#a78bfa" />
              <Tooltip />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="sleepDuration" 
                stroke="#8b5cf6" 
                name="Duration (hours)"
                strokeWidth={2}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="sleepQuality" 
                stroke="#a78bfa" 
                name="Quality (%)"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}