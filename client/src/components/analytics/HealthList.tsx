import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { themeClasses } from '@/lib/ui/theme';
import { AlertTriangle, AlertCircle, Info, ExternalLink } from 'lucide-react';

type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

interface HealthItem {
  id: string;
  title: string;
  description: string;
  severity: SeverityLevel;
  tenantName?: string;
  tenantId?: string;
  count?: number;
  lastOccurred?: string;
  drillDownUrl?: string;
}

interface HealthListProps {
  title: string;
  items: HealthItem[];
  maxItems?: number;
  className?: string;
  'data-testid'?: string;
  loading?: boolean;
  emptyMessage?: string;
}

const severityConfig = {
  low: {
    icon: Info,
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    textColor: 'text-blue-400'
  },
  medium: {
    icon: AlertCircle,
    badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    textColor: 'text-yellow-400'
  },
  high: {
    icon: AlertTriangle,
    badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    textColor: 'text-orange-400'
  },
  critical: {
    icon: AlertTriangle,
    badge: 'bg-red-500/10 text-red-400 border-red-500/20',
    textColor: 'text-red-400'
  }
};

export default function HealthList({
  title,
  items,
  maxItems = 10,
  className = '',
  'data-testid': testId,
  loading = false,
  emptyMessage = 'No issues found'
}: HealthListProps) {
  
  if (loading) {
    return (
      <Card className={`${themeClasses.card} ${className}`} data-testid={`${testId}-loading`}>
        <CardHeader>
          <div className="h-6 bg-gray-300 rounded animate-pulse w-48" />
        </CardHeader>
        <CardContent>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-3 border-b border-gray-200 last:border-0">
              <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-48 animate-pulse" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const displayItems = items.slice(0, maxItems);

  return (
    <Card className={`${themeClasses.card} ${className}`} data-testid={testId}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className={themeClasses.textPrimary}>{title}</CardTitle>
          {items.length > 0 && (
            <Badge variant="outline" className="bg-[#0f1319] border-[#1f2733]">
              {items.length} {items.length === 1 ? 'issue' : 'issues'}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {displayItems.length === 0 ? (
          <div className="p-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className={`w-12 h-12 rounded-full ${themeClasses.surfaceMuted} flex items-center justify-center`}>
                <Info className={`w-6 h-6 ${themeClasses.accentPrimary}`} />
              </div>
              <p className={themeClasses.textSecondary}>{emptyMessage}</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[#1f2733]">
            {displayItems.map((item, index) => {
              const config = severityConfig[item.severity];
              const Icon = config.icon;
              
              return (
                <div
                  key={item.id}
                  className="p-4 hover:bg-[#0f1319] transition-colors"
                  data-testid={`${testId}-item-${index}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Severity Icon */}
                    <div className={`mt-0.5 ${config.textColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-medium ${themeClasses.textPrimary} leading-tight`}>
                            {item.title}
                          </h4>
                          <p className={`${themeClasses.textSecondary} text-sm mt-1`}>
                            {item.description}
                          </p>
                          
                          {/* Meta info */}
                          <div className="flex items-center gap-4 mt-2 text-xs">
                            {item.tenantName && (
                              <span className={themeClasses.textSecondary}>
                                <span className="opacity-75">Tenant:</span> {item.tenantName}
                              </span>
                            )}
                            {item.count && (
                              <span className={config.textColor}>
                                {item.count} {item.count === 1 ? 'occurrence' : 'occurrences'}
                              </span>
                            )}
                            {item.lastOccurred && (
                              <span className={themeClasses.textSecondary}>
                                <span className="opacity-75">Last:</span> {item.lastOccurred}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge 
                            variant="outline" 
                            className={`${config.badge} text-xs font-medium`}
                          >
                            {item.severity}
                          </Badge>
                          
                          {item.drillDownUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-[#1f2733]"
                              onClick={() => window.open(item.drillDownUrl, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span className="sr-only">View details</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {items.length > maxItems && (
          <div className="p-4 border-t border-[#1f2733]">
            <p className={`${themeClasses.textSecondary} text-sm text-center`}>
              and {items.length - maxItems} more {items.length - maxItems === 1 ? 'issue' : 'issues'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}