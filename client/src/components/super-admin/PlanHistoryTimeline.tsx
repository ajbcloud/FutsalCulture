import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Sparkles,
  ArrowRight,
  DollarSign,
  Calendar,
  User,
  Zap
} from 'lucide-react';

interface PlanHistoryItem {
  id: string;
  fromPlan: string | null;
  toPlan: string;
  changeType: string;
  reason?: string;
  changedBy?: string;
  automatedTrigger?: string;
  mrr?: number;
  annualValue?: number;
  metadata?: any;
  createdAt: string;
}

interface PlanHistoryTimelineProps {
  tenantId: string;
  limit?: number;
}

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  core: 'Core',
  growth: 'Growth',
  elite: 'Elite',
};

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  core: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  growth: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  elite: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
};

const CHANGE_TYPE_ICONS: Record<string, any> = {
  upgrade: TrendingUp,
  downgrade: TrendingDown,
  trial_conversion: Sparkles,
  reactivation: RefreshCw,
  initial: Zap,
};

const CHANGE_TYPE_COLORS: Record<string, string> = {
  upgrade: 'text-green-600 dark:text-green-400',
  downgrade: 'text-red-600 dark:text-red-400',
  trial_conversion: 'text-blue-600 dark:text-blue-400',
  reactivation: 'text-yellow-600 dark:text-yellow-400',
  initial: 'text-purple-600 dark:text-purple-400',
};

export function PlanHistoryTimeline({ tenantId, limit = 20 }: PlanHistoryTimelineProps) {
  const { data: history, isLoading } = useQuery<PlanHistoryItem[]>({
    queryKey: [`/api/super-admin/plan-history/tenant/${tenantId}`, limit],
    queryFn: async () => {
      const response = await fetch(`/api/super-admin/plan-history/tenant/${tenantId}?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch plan history');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Plan History</CardTitle>
          <CardDescription>Loading plan change history...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Plan History</CardTitle>
          <CardDescription>No plan changes recorded yet</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan History</CardTitle>
        <CardDescription>
          Complete timeline of plan changes and upgrades
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((item, index) => {
            const Icon = CHANGE_TYPE_ICONS[item.changeType] || RefreshCw;
            const iconColor = CHANGE_TYPE_COLORS[item.changeType] || 'text-gray-600';
            const isLast = index === history.length - 1;

            return (
              <div key={item.id} className="relative">
                {/* Timeline line */}
                {!isLast && (
                  <div className="absolute left-[15px] top-[40px] bottom-[-16px] w-0.5 bg-border" />
                )}

                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full border-2 bg-background flex items-center justify-center ${iconColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-6">
                    <div className="flex items-center gap-2 mb-1">
                      {item.fromPlan && (
                        <Badge className={PLAN_COLORS[item.fromPlan] || ''}>
                          {PLAN_LABELS[item.fromPlan] || item.fromPlan}
                        </Badge>
                      )}
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      <Badge className={PLAN_COLORS[item.toPlan] || ''}>
                        {PLAN_LABELS[item.toPlan] || item.toPlan}
                      </Badge>
                      <span className="text-sm text-muted-foreground capitalize ml-2">
                        {item.changeType.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(item.createdAt), 'MMM d, yyyy h:mm a')}
                      </div>

                      {item.mrr !== undefined && item.mrr !== null && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          ${(item.mrr / 100).toFixed(0)}/mo
                        </div>
                      )}

                      {item.automatedTrigger && (
                        <Badge variant="outline" className="text-xs">
                          {item.automatedTrigger.replace('_', ' ')}
                        </Badge>
                      )}

                      {item.changedBy && (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          Manual change
                        </div>
                      )}
                    </div>

                    {item.reason && (
                      <div className="mt-2 text-sm text-muted-foreground italic">
                        "{item.reason}"
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
