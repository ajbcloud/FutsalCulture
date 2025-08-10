import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface PlanUpgradeButtonsProps {
  tenantId?: string;
  currentPlan?: 'free' | 'core' | 'growth' | 'elite';
  className?: string;
}

export function PlanUpgradeButtons({ tenantId = 'unknown', currentPlan = 'free', className }: PlanUpgradeButtonsProps) {
  const currentDomain = window.location.origin;
  
  const createPaymentLink = (plan: 'core' | 'growth' | 'elite') => {
    // Test mode Stripe payment links - replace with your actual links
    const paymentLinks = {
      core: 'https://buy.stripe.com/test_14AeVe4GC2cAeVI4Ns2Fa00',
      growth: 'https://buy.stripe.com/test_8wM8z6bjs9Z82cw4gi', 
      elite: 'https://buy.stripe.com/test_7sI5mo7371816OkbIP'
    };
    
    const baseLink = paymentLinks[plan];
    const params = new URLSearchParams({
      client_reference_id: tenantId,
      success_url: `${currentDomain}/admin/settings?upgrade=success&plan=${plan}`,
      cancel_url: `${currentDomain}/admin/settings?upgrade=cancelled`
    });
    
    return `${baseLink}?${params.toString()}`;
  };

  const handleUpgrade = (plan: 'core' | 'growth' | 'elite') => {
    const link = createPaymentLink(plan);
    // Use _self to navigate in same tab so user returns to our app
    window.open(link, '_self');
  };

  if (currentPlan === 'free') {
    return (
      <div className={`space-y-2 ${className}`}>
        <Button 
          onClick={() => handleUpgrade('core')}
          className="bg-blue-600 hover:bg-blue-700 text-white w-full"
          size="sm"
        >
          Upgrade to Core ($99/mo)
        </Button>
        <Button 
          onClick={() => handleUpgrade('growth')}
          className="bg-green-600 hover:bg-green-700 text-white w-full"
          size="sm"
        >
          Upgrade to Growth ($199/mo)
        </Button>
        <Button 
          onClick={() => handleUpgrade('elite')}
          className="bg-purple-600 hover:bg-purple-700 text-white w-full"
          size="sm"
        >
          Upgrade to Elite ($499/mo)
        </Button>
      </div>
    );
  }

  if (currentPlan === 'core') {
    return (
      <div className={`space-y-2 ${className}`}>
        <Button 
          onClick={() => handleUpgrade('growth')}
          className="bg-green-600 hover:bg-green-700 text-white w-full"
          size="sm"
        >
          Upgrade to Growth ($199/mo)
        </Button>
        <Button 
          onClick={() => handleUpgrade('elite')}
          className="bg-purple-600 hover:bg-purple-700 text-white w-full"
          size="sm"
        >
          Upgrade to Elite ($499/mo)
        </Button>
      </div>
    );
  }

  if (currentPlan === 'growth') {
    return (
      <div className={className}>
        <Button 
          onClick={() => handleUpgrade('elite')}
          className="bg-purple-600 hover:bg-purple-700 text-white w-full"
          size="sm"
        >
          Upgrade to Elite ($499/mo)
        </Button>
      </div>
    );
  }

  // Elite plan - show billing portal
  return (
    <div className={className}>
      <Button 
        onClick={() => window.open('https://billing.stripe.com/p/login/test_aEU5ky8WS5p6hk428a', '_blank')}
        variant="outline"
        className="w-full flex items-center gap-2"
        size="sm"
      >
        <ExternalLink className="w-4 h-4" />
        Manage Billing Portal
      </Button>
    </div>
  );
}