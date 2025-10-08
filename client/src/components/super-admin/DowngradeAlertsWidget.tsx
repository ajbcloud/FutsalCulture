import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  TrendingDown, 
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  DollarSign
} from 'lucide-react';
import { Link } from 'wouter';

interface DowngradeAlert {
  id: string;
  tenantId: string;
  tenantName: string;
  fromPlan: string;
  toPlan: string;
  changeType: string;
  reason?: string;
  automatedTrigger?: string;
  mrr?: number;
  createdAt: string;
}

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  core: 'Core',
  growth: 'Growth',
  elite: 'Elite',
};

// Helper function to get plan label with fallback
const getPlanLabel = (plan: string): string => {
  return PLAN_LABELS[plan] || plan.charAt(0).toUpperCase() + plan.slice(1);
};

export function DowngradeAlertsWidget() {
  const { data: downgrades, isLoading } = useQuery<DowngradeAlert[]>({
    queryKey: ['/api/super-admin/plan-history/downgrades'],
    queryFn: async () => {
      const response = await fetch('/api/super-admin/plan-history/downgrades?days=30&limit=10');
      if (!response.ok) throw new Error('Failed to fetch downgrades');
      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const recentDowngrades = downgrades?.length || 0;
  const hasDowngrades = recentDowngrades > 0;

  // Calculate revenue impact
  const revenueImpact = downgrades?.reduce((sum, d) => {
    const mrrLoss = d.mrr ? -d.mrr : 0;
    return sum + mrrLoss;
  }, 0) || 0;

  return (
    <Card className={hasDowngrades ? "border-red-500 bg-red-50 dark:bg-red-950" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasDowngrades ? (
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            ) : (
              <TrendingDown className="w-5 h-5 text-muted-foreground" />
            )}
            <CardTitle className={hasDowngrades ? "text-red-900 dark:text-red-100" : ""}>
              Downgrade Alerts
            </CardTitle>
          </div>
          <Badge 
            variant={hasDowngrades ? "destructive" : "secondary"}
            data-testid="badge-downgrade-count"
          >
            {recentDowngrades} Last 30 Days
          </Badge>
        </div>
        <CardDescription className={hasDowngrades ? "text-red-700 dark:text-red-300" : ""}>
          Track clients who have downgraded their plans
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading downgrades...</div>
        ) : !hasDowngrades ? (
          <div className="text-center py-6">
            <TrendingDown className="w-12 h-12 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No downgrades in the last 30 days</p>
            <p className="text-xs text-muted-foreground mt-1">Great retention! 🎉</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary metrics */}
            {revenueImpact !== 0 && (
              <div className="bg-red-100 dark:bg-red-900/30 rounded-lg p-3 border border-red-200 dark:border-red-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-red-700 dark:text-red-300" />
                    <span className="text-sm font-medium text-red-900 dark:text-red-100">
                      MRR Impact
                    </span>
                  </div>
                  <span className="text-lg font-bold text-red-700 dark:text-red-300">
                    -${Math.abs(revenueImpact / 100).toFixed(0)}/mo
                  </span>
                </div>
              </div>
            )}

            {/* Recent downgrades list */}
            <div className="space-y-2">
              {downgrades?.slice(0, 5).map((downgrade) => (
                <div
                  key={downgrade.id}
                  className="flex items-start justify-between p-3 rounded-lg bg-background border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                  data-testid={`downgrade-alert-${downgrade.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link 
                        href={`/super-admin?tab=tenants&search=${encodeURIComponent(downgrade.tenantName)}`}
                        className="text-sm font-medium hover:underline truncate"
                      >
                        {downgrade.tenantName}
                      </Link>
                      <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant="outline" className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                        {getPlanLabel(downgrade.fromPlan)}
                      </Badge>
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800">
                        {getPlanLabel(downgrade.toPlan)}
                      </Badge>
                    </div>

                    <div className="mt-1 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(downgrade.createdAt), { addSuffix: true })}
                      {downgrade.automatedTrigger && (
                        <span className="ml-2">• {downgrade.automatedTrigger.replace(/_/g, ' ')}</span>
                      )}
                    </div>

                    {downgrade.reason && (
                      <div className="mt-1 text-xs text-muted-foreground italic">
                        "{downgrade.reason}"
                      </div>
                    )}
                  </div>

                  {downgrade.mrr && (
                    <div className="text-right flex-shrink-0 ml-2">
                      <div className="text-xs text-red-700 dark:text-red-300 font-medium">
                        -${Math.abs(downgrade.mrr / 100).toFixed(0)}/mo
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* View all link */}
            {downgrades && downgrades.length > 5 && (
              <Button 
                variant="outline" 
                className="w-full"
                asChild
                data-testid="button-view-all-downgrades"
              >
                <Link href="/super-admin?tab=tenants">
                  View All {recentDowngrades} Downgrades
                </Link>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
