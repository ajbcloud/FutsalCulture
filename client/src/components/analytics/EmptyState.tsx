import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { themeClasses } from '@/lib/ui/theme';
import { Search, Filter, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  'data-testid'?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
  'data-testid': testId
}: EmptyStateProps) {
  const defaultIcon = <Search className="w-8 h-8" />;
  
  return (
    <div 
      className={`flex flex-col items-center justify-center text-center py-12 px-6 ${className}`}
      data-testid={testId}
    >
      <div className={`w-16 h-16 rounded-full ${themeClasses.surfaceMuted} flex items-center justify-center mb-4`}>
        <div className={themeClasses.textSecondary}>
          {icon || defaultIcon}
        </div>
      </div>
      
      <h3 className={`${themeClasses.textPrimary} font-semibold text-lg mb-2`}>
        {title}
      </h3>
      
      <p className={`${themeClasses.textSecondary} max-w-md mb-6`}>
        {description}
      </p>
      
      {action && (
        <Button
          onClick={action.onClick}
          variant="outline"
          className="bg-[#11161d] border-[#1f2733] hover:bg-[#1f2733]"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Specialized empty states
export function NoDataState({ 
  onAdjustFilters, 
  'data-testid': testId 
}: { 
  onAdjustFilters?: () => void;
  'data-testid'?: string;
}) {
  return (
    <EmptyState
      icon={<Filter className="w-8 h-8" />}
      title="No data found"
      description="There's no data matching your current filters. Try adjusting the date range or removing some filters."
      action={onAdjustFilters ? {
        label: "Adjust Filters",
        onClick: onAdjustFilters
      } : undefined}
      data-testid={testId}
    />
  );
}

export function ErrorState({ 
  onRetry, 
  error,
  'data-testid': testId 
}: { 
  onRetry?: () => void;
  error?: string;
  'data-testid'?: string;
}) {
  return (
    <EmptyState
      icon={<RefreshCw className="w-8 h-8" />}
      title="Something went wrong"
      description={error || "We encountered an error while loading your data. Please try again."}
      action={onRetry ? {
        label: "Try Again",
        onClick: onRetry
      } : undefined}
      data-testid={testId}
    />
  );
}