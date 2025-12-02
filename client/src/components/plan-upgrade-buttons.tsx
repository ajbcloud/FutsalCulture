import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

interface PlanUpgradeButtonsProps {
  tenantId?: string;
  currentPlan?: 'free' | 'core' | 'growth' | 'elite';
  className?: string;
}

export function PlanUpgradeButtons({ tenantId = 'unknown', currentPlan = 'free', className }: PlanUpgradeButtonsProps) {
  const handleUpgrade = () => {
    // Navigate to admin settings page for Braintree-based upgrade
    window.location.href = '/admin/settings?tab=plan';
  };

  if (currentPlan === 'free') {
    return (
      <div className={`space-y-2 ${className}`}>
        <Button 
          onClick={handleUpgrade}
          className="bg-blue-600 hover:bg-blue-700 text-white w-full"
          size="sm"
        >
          Upgrade to Core ($99/mo)
        </Button>
        <Button 
          onClick={handleUpgrade}
          className="bg-blue-600 hover:bg-blue-700 text-white w-full"
          size="sm"
        >
          Upgrade to Growth ($199/mo)
        </Button>
        <Button 
          onClick={handleUpgrade}
          className="bg-blue-600 hover:bg-blue-700 text-white w-full"
          size="sm"
        >
          Upgrade to Elite ($399/mo)
        </Button>
      </div>
    );
  }

  if (currentPlan === 'core') {
    return (
      <div className={`space-y-2 ${className}`}>
        <Button 
          onClick={handleUpgrade}
          className="bg-blue-600 hover:bg-blue-700 text-white w-full"
          size="sm"
        >
          Upgrade to Growth ($199/mo)
        </Button>
        <Button 
          onClick={handleUpgrade}
          className="bg-blue-600 hover:bg-blue-700 text-white w-full"
          size="sm"
        >
          Upgrade to Elite ($399/mo)
        </Button>
      </div>
    );
  }

  if (currentPlan === 'growth') {
    return (
      <div className={className}>
        <Button 
          onClick={handleUpgrade}
          className="bg-blue-600 hover:bg-blue-700 text-white w-full"
          size="sm"
        >
          Upgrade to Elite ($399/mo)
        </Button>
      </div>
    );
  }

  // Elite plan - show billing management
  return (
    <div className={className}>
      <Button 
        onClick={() => {
          // Navigate to billing page for subscription management
          window.location.href = '/admin/billing';
        }}
        variant="outline"
        className="w-full flex items-center gap-2"
        size="sm"
      >
        <Settings className="w-4 h-4" />
        Manage Subscription
      </Button>
    </div>
  );
}