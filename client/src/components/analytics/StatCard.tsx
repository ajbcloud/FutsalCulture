import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { themeClasses, formatters } from '@/lib/ui/theme';
import { Info } from 'lucide-react';
import DeltaBadge from '@/components/analytics/DeltaBadge';
import MiniSparkline from '@/components/analytics/MiniSparkline';

interface StatCardProps {
  title: string;
  value: string | number;
  delta?: {
    current: number;
    previous: number;
    label?: string;
  };
  sparkData?: Array<{ date: string; value: number }>;
  icon?: ReactNode;
  hint?: string;
  className?: string;
  size?: 'default' | 'large';
  'data-testid'?: string;
}

export default function StatCard({ 
  title, 
  value, 
  delta, 
  sparkData, 
  icon, 
  hint, 
  className = '',
  size = 'default',
  'data-testid': testId
}: StatCardProps) {
  const valueClass = size === 'large' ? themeClasses.numberXLarge : themeClasses.numberLarge;
  
  return (
    <Card className={`${themeClasses.card} ${themeClasses.cardHover} ${className}`} data-testid={testId}>
      <CardContent className={themeClasses.cardPadding}>
        <div className="space-y-3">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {icon && (
                <div className={`${themeClasses.accentPrimary} text-lg`}>
                  {icon}
                </div>
              )}
              <span className={themeClasses.textLabel}>
                {title}
              </span>
              {hint && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className={`w-4 h-4 ${themeClasses.textSecondary}`} />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-sm">{hint}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            
            {delta && (
              <DeltaBadge
                current={delta.current}
                previous={delta.previous}
                label={delta.label}
              />
            )}
          </div>

          {/* Main value */}
          <div className={valueClass} data-testid={`${testId}-value`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>

          {/* Sparkline */}
          {sparkData && sparkData.length > 0 && (
            <div className="h-8">
              <MiniSparkline data={sparkData} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}