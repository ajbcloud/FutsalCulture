import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";
import { useLocation } from "wouter";

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
  const [, navigate] = useLocation();

  const handleClick = () => {
    navigate('/admin/billing');
  };

  const getButtonText = () => {
    if (planId === 'free' || billingStatus === 'none') {
      return 'Upgrade Plan';
    }
    return 'Manage Subscription';
  };

  return (
    <Button
      onClick={handleClick}
      className={className}
      size="sm"
      data-testid="button-manage-subscription"
    >
      <CreditCard className="h-4 w-4" />
      {getButtonText()}
    </Button>
  );
}