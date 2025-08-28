import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ManageSubscriptionButtonProps {
  planId: 'free' | 'core' | 'growth' | 'elite';
  billingStatus: 'active' | 'trialing' | 'past_due' | 'cancelled' | 'none';
  className?: string;
}

export function ManageSubscriptionButton({ 
  planId, 
  billingStatus, 
  className = "" 
}: ManageSubscriptionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleClick = async () => {
    try {
      setIsLoading(true);

      if (planId === 'free' || billingStatus === 'none') {
        // Open Stripe checkout for Core plan upgrade
        const tenantId = (window as any).currentUser?.tenantId || 'test-tenant';
        const currentDomain = window.location.origin;
        
        const paymentLink = 'https://buy.stripe.com/test_14AeVe4GC2cAeVI4Ns2Fa00'; // Core plan link
        const params = new URLSearchParams({
          client_reference_id: tenantId,
          success_url: `${currentDomain}/admin/settings?upgrade=success&plan=core`,
          cancel_url: `${currentDomain}/admin/settings?upgrade=cancelled`
        });
        
        window.location.href = `${paymentLink}?${params.toString()}`;
      } else {
        // Fallback to direct Stripe billing portal since API isn't working
        window.open('https://billing.stripe.com/p/login/test_aEU5ky8WS5p6hk428a', '_blank');
      }
    } catch (error: any) {
      console.error('Error managing subscription:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to manage subscription. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = () => {
    if (planId === 'free' || billingStatus === 'none') {
      return 'Manage Subscription';
    }
    return 'Manage Subscription';
  };

  const getButtonIcon = () => {
    if (planId === 'free' || billingStatus === 'none') {
      return <CreditCard className="h-4 w-4" />;
    }
    return <ExternalLink className="h-4 w-4" />;
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      className={className}
      size="sm"
    >
      {getButtonIcon()}
      {isLoading ? 'Loading...' : getButtonText()}
    </Button>
  );
}