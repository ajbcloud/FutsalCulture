import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  TrendingUpIcon,
  Activity,
  MessageSquare
} from 'lucide-react';

interface AIInsightsBarProps {
  filters: {
    from?: string;
    to?: string;
    tenantId?: string;
    status?: string;
    lane?: 'platform' | 'commerce' | 'kpis';
  };
  onOpenAskAnalytics: () => void;
  onNavigate: (tab: string, filters?: any) => void;
}

interface InsightsData {
  now: {
    summary: string;
    deltas: Array<{
      label: string;
      value: number;
      pct: number;
      dir: 'up' | 'down';
    }>;
  };
  drivers: Array<{
    type: string;
    id: string;
    label: string;
    impactPct: number;
    impactAbs: number;
  }>;
  risks: Array<{
    metric: string;
    label: string;
    severity: 'warn' | 'crit';
    context?: { tenantId?: string };
  }>;
  forecast: {
    metric: string;
    mean: number;
    p10: number;
    p90: number;
    horizonDays: number;
  };
}

export function AIInsightsBar({ filters, onOpenAskAnalytics, onNavigate }: AIInsightsBarProps) {
  const { data, isLoading, error } = useQuery<InsightsData>({
    queryKey: ['/api/super-admin/ai/insights', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.from) params.append('from', filters.from);
      if (filters.to) params.append('to', filters.to);
      if (filters.tenantId) params.append('tenantId', filters.tenantId);
      if (filters.status) params.append('status', filters.status);
      if (filters.lane) params.append('lane', filters.lane);
      
      const response = await fetch(`/api/super-admin/ai/insights?${params}`);
      if (!response.ok) throw new Error('Failed to fetch AI insights');
      return response.json();
    },
    staleTime: 60 * 1000, // 1 minute
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="p-4">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-6 w-full mb-2" />
            <Skeleton className="h-4 w-32" />
          </Card>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
        <p className="text-yellow-800 dark:text-yellow-200">
          AI insights are currently unavailable. Using standard analytics view.
        </p>
      </div>
    );
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(cents / 100);
  };

  const formatPct = (pct: number) => {
    return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
  };

  // Parse markdown bold text
  const renderSummary = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="space-y-4 mb-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">AI Insights</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenAskAnalytics}
          className="gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          Ask Analytics
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Now - This Week at a Glance */}
        <Card 
          className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => onNavigate('overview')}
        >
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-muted-foreground">Now</span>
          </div>
          <p className="text-sm mb-3">{renderSummary(data.now.summary)}</p>
          <div className="flex flex-wrap gap-2">
            {data.now.deltas.slice(0, 3).map((delta, i) => (
              <Badge key={i} variant={delta.dir === 'up' ? 'default' : 'secondary'}>
                {delta.dir === 'up' ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {delta.label} {formatPct(delta.pct)}
              </Badge>
            ))}
          </div>
        </Card>

        {/* Drivers - Root Cause Analysis */}
        <Card 
          className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => onNavigate('by-tenant')}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUpIcon className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-muted-foreground">Drivers</span>
          </div>
          <p className="text-sm font-medium mb-2">Top impact:</p>
          <div className="space-y-1">
            {data.drivers.slice(0, 3).map((driver, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-xs truncate max-w-[120px]">{driver.label}</span>
                <Badge variant="outline" className="text-xs">
                  {formatPct(driver.impactPct)}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Risks - Anomalies & Alerts */}
        <Card 
          className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => onNavigate('platform-health')}
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium text-muted-foreground">Risks</span>
          </div>
          {data.risks.length > 0 ? (
            <div className="space-y-2">
              {data.risks.slice(0, 2).map((risk, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Badge 
                    variant={risk.severity === 'crit' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {risk.severity === 'crit' ? 'Critical' : 'Warning'}
                  </Badge>
                  <span className="text-xs">{risk.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No anomalies detected</p>
          )}
        </Card>

        {/* Next 30 Days - Forecast */}
        <Card 
          className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => onNavigate('revenue-trends')}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium text-muted-foreground">Next 30 days</span>
          </div>
          <p className="text-sm font-medium mb-1">
            Forecast {data.forecast.metric === 'platform_mrr' ? 'MRR' : 'Revenue'}
          </p>
          <p className="text-lg font-bold">
            {formatCurrency(data.forecast.mean)}
          </p>
          <p className="text-xs text-muted-foreground">
            ±{formatCurrency(data.forecast.p90 - data.forecast.mean)} (80% CI)
          </p>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground text-right">
        Last updated: {new Date().toLocaleTimeString()}
      </p>
    </div>
  );
}