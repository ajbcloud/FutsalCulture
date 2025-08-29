import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface UpgradeStatus {
  success: boolean | null;
  plan: string | null;
  cancelled: boolean;
  isAnimating: boolean;
}

export function useUpgradeStatus() {
  const [upgradeStatus, setUpgradeStatus] = useState<UpgradeStatus>({
    success: null,
    plan: null,
    cancelled: false,
    isAnimating: false
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Check URL parameters for upgrade status
    const urlParams = new URLSearchParams(window.location.search);
    const upgrade = urlParams.get('upgrade');
    const plan = urlParams.get('plan');

    if (upgrade === 'success' && plan) {
      setUpgradeStatus({
        success: true,
        plan,
        cancelled: false,
        isAnimating: true
      });

      // Show success toast with animation
      toast({
        title: "🎉 Upgrade Successful!",
        description: `Your ${plan.toUpperCase()} plan is being activated. This may take a few moments.`,
        duration: 5000,
      });

      // Start polling for subscription status update
      startPolling();

      // Clear URL parameters after handling
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);

    } else if (upgrade === 'cancelled') {
      setUpgradeStatus({
        success: false,
        plan: null,
        cancelled: true,
        isAnimating: false
      });

      toast({
        title: "Upgrade Cancelled",
        description: "Your upgrade was cancelled. You can upgrade again anytime.",
        duration: 3000,
        variant: "destructive"
      });

      // Clear URL parameters
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [toast]);

  const startPolling = () => {
    // Poll subscription info every 2 seconds for up to 30 seconds
    let pollCount = 0;
    const maxPolls = 15;
    
    const pollInterval = setInterval(async () => {
      pollCount++;
      
      try {
        // Invalidate and refetch subscription info
        await queryClient.invalidateQueries({ queryKey: ['/api/admin/subscription-info'] });
        await queryClient.invalidateQueries({ queryKey: ['/api/tenant/plan-features'] });
        await queryClient.invalidateQueries({ queryKey: ['/api/tenant/capabilities'] });
        
        const subscriptionData = await queryClient.fetchQuery({
          queryKey: ['/api/admin/subscription-info'],
          queryFn: () => fetch('/api/admin/subscription-info').then(res => res.json())
        });

        // Check if subscription is now active
        if (subscriptionData?.subscription?.status === 'active') {
          clearInterval(pollInterval);
          setUpgradeStatus(prev => ({
            ...prev,
            isAnimating: false
          }));
          
          toast({
            title: "✅ Plan Activated!",
            description: "Your new plan is now active and all features are available.",
            duration: 4000,
          });
        }
      } catch (error) {
        console.error('Error polling subscription status:', error);
      }

      // Stop polling after max attempts
      if (pollCount >= maxPolls) {
        clearInterval(pollInterval);
        setUpgradeStatus(prev => ({
          ...prev,
          isAnimating: false
        }));
        
        toast({
          title: "Plan Update in Progress",
          description: "Your payment was successful. Plan activation may take a few more minutes.",
          duration: 5000,
        });
      }
    }, 2000);
  };

  const clearUpgradeStatus = () => {
    setUpgradeStatus({
      success: null,
      plan: null,
      cancelled: false,
      isAnimating: false
    });
  };

  return {
    upgradeStatus,
    clearUpgradeStatus,
  };
}