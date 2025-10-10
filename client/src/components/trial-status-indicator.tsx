import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChevronRight, Zap, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { TrialExtensionModal } from '@/components/trial-extension-modal';
import { formatDistanceToNow, differenceInDays, differenceInHours, differenceInMinutes, isToday, startOfDay } from 'date-fns';
import { PlanUpgradeButtons } from './plan-upgrade-buttons';

interface TrialStatus {
  status: 'active' | 'expired' | 'grace' | 'none';
  trialEndsAt: string | null;
  remainingMs: number;
  trialPlan: 'core' | 'growth' | 'elite';
  gracePeriodEndsAt: string | null;
  extensionsUsed: number;
  maxExtensions: number;
  canExtend: boolean;
  upgradeUrl: string;
  billingStatus: string;
}

const DISMISS_KEY = 'trial-indicator-dismissed';
const DISMISS_DATE_KEY = 'trial-indicator-dismiss-date';

export function TrialStatusIndicator() {
  const { user } = useAuth();
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [countdownKey, setCountdownKey] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);

  // Fetch trial status
  const { data: trialStatus, isLoading, error } = useQuery<TrialStatus>({
    queryKey: ['/api/trial/status'],
    enabled: !!user?.tenantId,
    refetchInterval: 60000, // Refetch every minute to update countdown
  });

  // Check if indicator should be shown based on dismiss state
  useEffect(() => {
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    const dismissedDate = localStorage.getItem(DISMISS_DATE_KEY);

    if (!dismissedAt || !dismissedDate) {
      setIsDismissed(false);
      return;
    }

    const dismissTime = new Date(dismissedAt);
    const dismissDateObj = new Date(dismissedDate);
    const now = new Date();

    // Calculate hours since dismiss
    const hoursSinceDismiss = (now.getTime() - dismissTime.getTime()) / (1000 * 60 * 60);

    // Show if:
    // 1. It's been 12+ hours since dismiss
    // 2. OR it's a new day (not the same calendar day as when dismissed)
    const shouldShow = hoursSinceDismiss >= 12 || !isToday(dismissDateObj);

    if (shouldShow) {
      // Clear dismiss state and show indicator
      localStorage.removeItem(DISMISS_KEY);
      localStorage.removeItem(DISMISS_DATE_KEY);
      setIsDismissed(false);
    } else {
      setIsDismissed(true);
    }
  }, [countdownKey]); // Re-check on countdown updates

  // Force re-render every minute for countdown updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdownKey((prev) => prev + 1);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleDismiss = () => {
    const now = new Date();
    localStorage.setItem(DISMISS_KEY, now.toISOString());
    localStorage.setItem(DISMISS_DATE_KEY, startOfDay(now).toISOString());
    setIsDismissed(true);
  };

  // Don't show if dismissed, not in trial, or loading
  if (isLoading || isDismissed || !trialStatus || 
      (trialStatus.billingStatus !== 'trialing' && 
       trialStatus.billingStatus !== 'trial' && 
       trialStatus.status !== 'grace')) {
    return null;
  }

  const formatCountdown = () => {
    if (!trialStatus.trialEndsAt) return 'Trial Active';

    const now = new Date();
    const endDate = new Date(trialStatus.trialEndsAt);
    const days = Math.max(0, differenceInDays(endDate, now));
    const hours = Math.max(0, differenceInHours(endDate, now) % 24);
    const minutes = Math.max(0, differenceInMinutes(endDate, now) % 60);

    if (days > 0) {
      return `${days} day${days !== 1 ? 's' : ''}, ${hours} hour${hours !== 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} min`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      return 'Trial Expired';
    }
  };

  const getColorClasses = () => {
    if (!trialStatus.trialEndsAt) return 'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950 dark:text-blue-100 dark:border-blue-800';

    const now = new Date();
    const endDate = new Date(trialStatus.trialEndsAt);
    const daysRemaining = differenceInDays(endDate, now);

    if (daysRemaining > 7) {
      return 'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950 dark:text-blue-100 dark:border-blue-800';
    } else if (daysRemaining >= 3) {
      return 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-700';
    } else {
      return 'bg-blue-600 text-white border-blue-700 dark:bg-blue-700 dark:text-white dark:border-blue-600';
    }
  };

  const getBadgeVariant = (): "default" | "destructive" | "outline" | "secondary" | "disabled" | "success" | "warning" | "info" => {
    // Always use default variant to maintain brand blue consistency
    return 'default';
  };

  const getPlanDisplayName = () => {
    const names = {
      core: 'Core Plan',
      growth: 'Growth Plan',
      elite: 'Elite Plan'
    };
    return names[trialStatus.trialPlan] || 'Trial';
  };

  const handleUpgradeClick = () => {
    if (trialStatus.upgradeUrl) {
      window.open(trialStatus.upgradeUrl, '_self');
    }
  };

  // Embedded version only
  return (
    <>
      <div className="space-y-2" data-testid="trial-status-indicator">
        <div className={`rounded-lg border p-3 relative ${getColorClasses()}`}>
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
            aria-label="Close trial indicator"
            data-testid="button-close-trial-indicator"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-2 mb-2 pr-6">
            <Clock className="w-4 h-4" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 mb-1">
                <Badge variant={getBadgeVariant()} className="text-xs">
                  Trial
                </Badge>
                {trialStatus.status === 'grace' && (
                  <Badge variant="destructive" className="text-xs">
                    Grace
                  </Badge>
                )}
              </div>
              <p className="text-xs font-semibold truncate" data-testid="trial-countdown">
                {formatCountdown()}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Button
              onClick={handleUpgradeClick}
              size="sm"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-8"
              data-testid="button-upgrade-trial"
            >
              <Zap className="w-3 h-3 mr-1" />
              Upgrade
            </Button>

            {trialStatus.canExtend && trialStatus.extensionsUsed < trialStatus.maxExtensions && (
              <Button
                onClick={() => setShowExtensionModal(true)}
                size="sm"
                variant="outline"
                className="w-full text-xs h-8"
                data-testid="button-extend-trial"
              >
                Extend ({trialStatus.maxExtensions - trialStatus.extensionsUsed})
              </Button>
            )}
          </div>
        </div>
      </div>

      {showExtensionModal && (
        <TrialExtensionModal
          isOpen={showExtensionModal}
          onClose={() => setShowExtensionModal(false)}
          currentExtensions={trialStatus.extensionsUsed}
          maxExtensions={trialStatus.maxExtensions}
        />
      )}
    </>
  );
}
