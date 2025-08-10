import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Info, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  tooltip: string;
  icon?: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  subtitle?: string;
  growth?: number;
  showGrowth?: boolean;
  className?: string;
}

export function KPICard({
  title,
  value,
  tooltip,
  icon: Icon,
  iconColor = "text-blue-500",
  subtitle,
  growth,
  showGrowth = false,
  className
}: KPICardProps) {
  const formatGrowth = (growth: number) => {
    const isPositive = growth >= 0;
    const GrowthIcon = isPositive ? TrendingUp : TrendingDown;
    const colorClass = isPositive ? "text-green-500" : "text-red-500";
    
    return (
      <div className={cn("flex items-center text-xs", colorClass)}>
        <GrowthIcon className="h-3 w-3 mr-1" />
        {Math.abs(growth)}%
      </div>
    );
  };

  return (
    <TooltipProvider>
      <Card className={cn("theme-card-bg border-border", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium theme-card-title">{title}</CardTitle>
          <div className="flex items-center space-x-2">
            {Icon && <Icon className={cn("h-4 w-4 theme-icon-color")} />}
            <Tooltip>
              <TooltipTrigger asChild>
                <Info 
                  className="h-4 w-4 theme-description hover:text-blue-400 cursor-help transition-colors"
                  tabIndex={0}
                  aria-label={tooltip}
                />
              </TooltipTrigger>
              <TooltipContent 
                side="top" 
                className="max-w-xs theme-card-bg border-border theme-card-title"
              >
                <p>{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold theme-card-title">{value}</div>
          <div className="flex items-center justify-between mt-1">
            {subtitle && <p className="text-xs theme-description">{subtitle}</p>}
            {showGrowth && growth !== undefined && formatGrowth(growth)}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}