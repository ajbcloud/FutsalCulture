import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [location, navigate] = useLocation();

  const handleClick = async () => {
    try {
      setIsLoading(true);

      if (planId === 'free' || billingStatus === 'none') {
        // Redirect to embedded checkout for Core plan upgrade
        navigate('/checkout?plan=core');
      } else {
        // Redirect to embedded checkout with portal parameter for existing subscriptions
        navigate('/checkout?portal=true');
      }
    } catch (error: any) {
      console.error('Error managing subscription:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to manage payment method. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = () => {
    return 'Manage Payment Method';
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