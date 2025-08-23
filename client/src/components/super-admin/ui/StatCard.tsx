import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  intent?: 'default' | 'warn' | 'danger';
  className?: string;
}

export default function StatCard({ title, value, subtext, intent = 'default', className }: StatCardProps) {
  const intentStyles = {
    default: 'text-foreground',
    warn: 'text-yellow-600 dark:text-yellow-400',
    danger: 'text-red-600 dark:text-red-400'
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn("text-2xl font-bold", intentStyles[intent])}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {subtext && (
          <p className="text-xs text-muted-foreground">{subtext}</p>
        )}
      </CardHeader>
    </Card>
  );
}