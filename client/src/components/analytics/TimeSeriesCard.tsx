import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { themeClasses, chartPalette, formatters } from '@/lib/ui/theme';

interface TimeSeriesCardProps {
  title: string;
  series: Array<Record<string, any>>;
  chartType?: 'line' | 'area' | 'bar';
  intervalToggle?: {
    value: string;
    onChange: (value: string) => void;
    options: Array<{ value: string; label: string }>;
  };
  height?: number;
  className?: string;
  'data-testid'?: string;
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
}

const customTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className={`${themeClasses.card} ${themeClasses.cardPadding} shadow-lg`}>
        <p className={`${themeClasses.textSecondary} text-sm mb-2`}>{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            <span className="font-medium">{entry.name}: </span>
            {entry.name.toLowerCase().includes('revenue') || entry.name.toLowerCase().includes('amount') 
              ? formatters.currency(entry.value)
              : entry.value.toLocaleString()
            }
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function TimeSeriesCard({
  title,
  series,
  chartType = 'line',
  intervalToggle,
  height = 320,
  className = '',
  'data-testid': testId,
  loading = false,
  error,
  emptyMessage = 'No data available for the selected period'
}: TimeSeriesCardProps) {
  
  if (loading) {
    return (
      <Card className={`${themeClasses.card} ${className}`} data-testid={`${testId}-loading`}>
        <CardHeader>
          <div className="h-6 bg-gray-300 rounded animate-pulse w-48" />
        </CardHeader>
        <CardContent>
          <div className={`h-[${height}px] bg-gray-200 rounded animate-pulse`} />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`${themeClasses.card} ${className}`} data-testid={`${testId}-error`}>
        <CardHeader>
          <CardTitle className={themeClasses.textPrimary}>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center" style={{ height }}>
          <div className="text-center">
            <p className={`${themeClasses.danger} font-medium`}>Failed to load chart data</p>
            <p className={`${themeClasses.textSecondary} text-sm mt-1`}>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!series || series.length === 0) {
    return (
      <Card className={`${themeClasses.card} ${className}`} data-testid={`${testId}-empty`}>
        <CardHeader>
          <CardTitle className={themeClasses.textPrimary}>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center" style={{ height }}>
          <div className="text-center">
            <p className={themeClasses.textSecondary}>{emptyMessage}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderChart = () => {
    const commonProps = {
      data: series,
      margin: { top: 10, right: 30, left: 0, bottom: 0 }
    };

    const chartProps = {
      strokeDasharray: '3 3',
      stroke: chartPalette.muted,
      strokeOpacity: 0.3
    };

    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartPalette.primary} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={chartPalette.primary} stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid {...chartProps} />
            <XAxis 
              dataKey="date" 
              tick={{ fill: '#a9b4c2', fontSize: 12 }}
              tickLine={{ stroke: '#a9b4c2' }}
            />
            <YAxis 
              tick={{ fill: '#a9b4c2', fontSize: 12 }}
              tickLine={{ stroke: '#a9b4c2' }}
            />
            <Tooltip content={customTooltip} />
            <Legend />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke={chartPalette.primary}
              fillOpacity={1}
              fill="url(#colorRevenue)"
              strokeWidth={2}
              name="Revenue"
            />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid {...chartProps} />
            <XAxis 
              dataKey="date" 
              tick={{ fill: '#a9b4c2', fontSize: 12 }}
              tickLine={{ stroke: '#a9b4c2' }}
            />
            <YAxis 
              tick={{ fill: '#a9b4c2', fontSize: 12 }}
              tickLine={{ stroke: '#a9b4c2' }}
            />
            <Tooltip content={customTooltip} />
            <Legend />
            <Bar
              dataKey="revenue"
              fill={chartPalette.primary}
              name="Revenue"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        );

      default: // line
        return (
          <LineChart {...commonProps}>
            <CartesianGrid {...chartProps} />
            <XAxis 
              dataKey="date" 
              tick={{ fill: '#a9b4c2', fontSize: 12 }}
              tickLine={{ stroke: '#a9b4c2' }}
            />
            <YAxis 
              tick={{ fill: '#a9b4c2', fontSize: 12 }}
              tickLine={{ stroke: '#a9b4c2' }}
            />
            <Tooltip content={customTooltip} />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke={chartPalette.primary}
              strokeWidth={2}
              dot={{ fill: chartPalette.primary, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: chartPalette.primary, strokeWidth: 2 }}
              name="Revenue"
            />
          </LineChart>
        );
    }
  };

  return (
    <Card className={`${themeClasses.card} ${className}`} data-testid={testId}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className={themeClasses.textPrimary}>{title}</CardTitle>
          {intervalToggle && (
            <Select value={intervalToggle.value} onValueChange={intervalToggle.onChange}>
              <SelectTrigger className="w-32 bg-[#0f1319] border-[#1f2733]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#11161d] border-[#1f2733]">
                {intervalToggle.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={height}>
          {renderChart()}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}