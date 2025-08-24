import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { themeClasses } from '@/lib/ui/theme';

export function StatCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <Card className={`${themeClasses.card} ${className}`}>
      <CardContent className={themeClasses.cardPadding}>
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="h-4 bg-gray-300 rounded w-24 animate-pulse" />
            <div className="h-6 bg-gray-300 rounded w-16 animate-pulse" />
          </div>
          
          {/* Value */}
          <div className="h-8 bg-gray-300 rounded w-32 animate-pulse" />
          
          {/* Sparkline */}
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

export function TimeSeriesCardSkeleton({ 
  height = 320, 
  className = '' 
}: { 
  height?: number; 
  className?: string; 
}) {
  return (
    <Card className={`${themeClasses.card} ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-300 rounded w-48 animate-pulse" />
          <div className="h-8 bg-gray-300 rounded w-32 animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className={`h-[${height}px] bg-gray-200 rounded animate-pulse`} />
      </CardContent>
    </Card>
  );
}

export function RankingTableSkeleton({ 
  rows = 5, 
  className = '' 
}: { 
  rows?: number; 
  className?: string; 
}) {
  return (
    <Card className={`${themeClasses.card} ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-300 rounded w-48 animate-pulse" />
          <div className="h-8 bg-gray-300 rounded w-32 animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Header row */}
        <div className={`${themeClasses.surfaceMuted} p-4 flex justify-between`}>
          <div className="h-4 bg-gray-300 rounded w-24 animate-pulse" />
          <div className="h-4 bg-gray-300 rounded w-20 animate-pulse" />
          <div className="h-4 bg-gray-300 rounded w-16 animate-pulse" />
        </div>
        
        {/* Data rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex justify-between p-4 border-b border-gray-200 last:border-0">
            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function HealthListSkeleton({ 
  items = 3, 
  className = '' 
}: { 
  items?: number; 
  className?: string; 
}) {
  return (
    <Card className={`${themeClasses.card} ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-300 rounded w-48 animate-pulse" />
          <div className="h-6 bg-gray-300 rounded w-16 animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {Array.from({ length: items }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-4 border-b border-gray-200 last:border-0">
            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse mt-0.5" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
              <div className="h-3 bg-gray-200 rounded w-64 animate-pulse" />
              <div className="flex gap-4">
                <div className="h-3 bg-gray-200 rounded w-20 animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
              </div>
            </div>
            <div className="h-6 bg-gray-200 rounded w-16 animate-pulse" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function FilterBarSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`${themeClasses.glass} rounded-2xl p-6 ${className}`}>
      <div className="flex flex-wrap items-center gap-4">
        <div className="h-10 bg-gray-300 rounded w-48 animate-pulse" />
        <div className="h-10 bg-gray-300 rounded w-32 animate-pulse" />
        <div className="h-10 bg-gray-300 rounded w-40 animate-pulse" />
        <div className="h-10 bg-gray-300 rounded w-40 animate-pulse" />
        <div className="h-10 bg-gray-300 rounded w-24 animate-pulse" />
      </div>
    </div>
  );
}