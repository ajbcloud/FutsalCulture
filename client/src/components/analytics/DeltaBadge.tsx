import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { themeClasses, formatters } from '@/lib/ui/theme';

interface DeltaBadgeProps {
  current: number;
  previous: number;
  label?: string;
  size?: 'sm' | 'default';
  'data-testid'?: string;
}

export default function DeltaBadge({ 
  current, 
  previous, 
  label = '', 
  size = 'default',
  'data-testid': testId 
}: DeltaBadgeProps) {
  const delta = formatters.delta(current, previous);
  
  if (delta.value === 0) {
    return (
      <div 
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg ${themeClasses.surfaceMuted} ${themeClasses.textSecondary} ${size === 'sm' ? 'text-xs' : 'text-sm'}`}
        data-testid={testId}
        aria-label="No change from previous period"
      >
        <Minus className="w-3 h-3" />
        <span>–</span>
        {label && <span className="text-xs opacity-75">{label}</span>}
      </div>
    );
  }

  const isPositive = delta.isPositive;
  const colorClass = isPositive ? themeClasses.success : themeClasses.danger;
  const bgClass = isPositive ? 'bg-green-500/10' : 'bg-red-500/10';
  const Icon = isPositive ? TrendingUp : TrendingDown;
  
  return (
    <div 
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg ${bgClass} ${colorClass} ${size === 'sm' ? 'text-xs' : 'text-sm'} font-medium`}
      data-testid={testId}
      aria-label={`${isPositive ? 'Increased' : 'Decreased'} by ${formatters.percent(delta.value)} ${label}`}
    >
      <Icon className="w-3 h-3" />
      <span>{isPositive ? '+' : ''}{formatters.percent(delta.value)}</span>
      {label && <span className="text-xs opacity-75">{label}</span>}
    </div>
  );
}