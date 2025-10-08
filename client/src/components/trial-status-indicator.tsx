import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChevronRight, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { TrialExtensionModal } from '@/components/trial-extension-modal';
import { formatDistanceToNow, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
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

interface TrialStatusIndicatorProps {
  variant?: 'floating' | 'embedded';
}

export function TrialStatusIndicator({ variant = 'floating' }: TrialStatusIndicatorProps = {}) {
  const { user } = useAuth();
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [countdownKey, setCountdownKey] = useState(0);

  // Fetch trial status
  const { data: trialStatus, isLoading, error } = useQuery<TrialStatus>({
    queryKey: ['/api/trial/status'],
    enabled: !!user?.tenantId,
    refetchInterval: 60000, // Refetch every minute to update countdown
  });

  // Force re-render every minute for countdown updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdownKey((prev) => prev + 1);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Don't show if not in trial or loading
  if (isLoading || !trialStatus || 
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
    if (!trialStatus.trialEndsAt) return 'bg-green-100 text-green-800 border-green-200';

    const now = new Date();
    const endDate = new Date(trialStatus.trialEndsAt);
    const daysRemaining = differenceInDays(endDate, now);

    if (daysRemaining > 7) {
      return 'bg-green-100 text-green-800 border-green-200';
    } else if (daysRemaining >= 3) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    } else {
      return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const getBadgeVariant = () => {
    if (!trialStatus.trialEndsAt) return 'default';

    const now = new Date();
    const endDate = new Date(trialStatus.trialEndsAt);
    const daysRemaining = differenceInDays(endDate, now);

    if (daysRemaining > 7) {
      return 'default';
    } else if (daysRemaining >= 3) {
      return 'warning';
    } else {
      return 'destructive';
    }
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

  // Embedded version for sidebar
  if (variant === 'embedded') {
    return (
      <>
        <div className="space-y-2" data-testid="trial-status-indicator">
          <div className={`rounded-lg border p-3 ${getColorClasses()}`}>
            <div className="flex items-center gap-2 mb-2">
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
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

  // Floating version (original)
  return (
    <>
      <AnimatePresence>
        <motion.div
          key={countdownKey}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-4 left-4 z-50 max-w-sm"
          data-testid="trial-status-indicator"
        >
          <div className={`rounded-lg border-2 p-4 shadow-lg backdrop-blur-sm ${getColorClasses()}`}>
            <div className="flex items-center gap-3 mb-3">
              <Clock className="w-5 h-5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={getBadgeVariant()} className="text-xs">
                    {getPlanDisplayName()} Trial
                  </Badge>
                  {trialStatus.status === 'grace' && (
                    <Badge variant="destructive" className="text-xs">
                      Grace Period
                    </Badge>
                  )}
                </div>
                <motion.div
                  key={`countdown-${countdownKey}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="font-semibold text-sm"
                  data-testid="trial-countdown"
                >
                  {formatCountdown()}
                </motion.div>
              </div>
            </div>

            <div className="space-y-2">
              {/* Upgrade CTA */}
              <Button
                onClick={handleUpgradeClick}
                size="sm"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                data-testid="button-upgrade-trial"
              >
                <Zap className="w-4 h-4 mr-2" />
                Upgrade Now
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>

              {/* Extend Trial button if available */}
              {trialStatus.canExtend && trialStatus.extensionsUsed < trialStatus.maxExtensions && (
                <Button
                  onClick={() => setShowExtensionModal(true)}
                  size="sm"
                  variant="outline"
                  className="w-full"
                  data-testid="button-extend-trial"
                >
                  Extend Trial ({trialStatus.maxExtensions - trialStatus.extensionsUsed} left)
                </Button>
              )}
            </div>

            {/* Contextual message */}
            {trialStatus.status === 'active' && trialStatus.trialEndsAt && (
              <p className="text-xs mt-2 opacity-90">
                {differenceInDays(new Date(trialStatus.trialEndsAt), new Date()) <= 3 
                  ? 'Trial expires soon - Upgrade to continue' 
                  : 'Enjoying PlayHQ? Upgrade for full access'}
              </p>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Extension Modal */}
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