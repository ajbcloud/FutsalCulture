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
        // Open upgrade flow - redirect to plans page with upgrade mode
        window.location.href = '/admin/settings?tab=plans-features&upgrade=true';
      } else {
        // Open Stripe billing portal
        const response = await apiRequest('/api/billing/portal', {
          method: 'POST'
        });

        if (response.url) {
          window.location.href = response.url;
        } else {
          throw new Error('No billing portal URL returned');
        }
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