import { useEffect, useState } from 'react';
import { useLocation, useRouter } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function Checkout() {
  const [location, navigate] = useLocation();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);

  // Parse query parameters
  const searchParams = new URLSearchParams(window.location.search);
  const sessionUrl = searchParams.get('session_url');
  const portal = searchParams.get('portal') === 'true';
  const planKey = searchParams.get('plan');
  const sessionId = searchParams.get('session_id');

  // Create checkout session mutation for new sessions
  const createCheckoutMutation = useMutation({
    mutationFn: async ({ plan, discountCode }: { plan: string; discountCode?: string }) => {
      const res = await apiRequest('POST', '/api/billing/checkout', { plan, discountCode });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        setIframeUrl(data.url);
        setIsLoading(false);
      } else {
        setError('Failed to create checkout session');
        setIsLoading(false);
      }
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to create checkout session');
      setIsLoading(false);
    },
  });

  // Create portal session mutation
  const createPortalMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/billing/portal');
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        setIframeUrl(data.url);
        setIsLoading(false);
      } else {
        setError('Failed to create portal session');
        setIsLoading(false);
      }
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to create portal session');
      setIsLoading(false);
    },
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // If session_url is provided directly, use it
    if (sessionUrl) {
      try {
        const decodedUrl = decodeURIComponent(sessionUrl);
        setIframeUrl(decodedUrl);
        setIsLoading(false);
      } catch (err) {
        setError('Invalid session URL');
        setIsLoading(false);
      }
    }
    // If portal requested, create portal session
    else if (portal) {
      createPortalMutation.mutate();
    }
    // If plan specified, create new checkout session
    else if (planKey) {
      // Get discount code from URL if present
      const discountCode = searchParams.get('discount_code') || undefined;
      createCheckoutMutation.mutate({ plan: planKey, discountCode });
    }
    // If session_id provided, reconstruct the URL
    else if (sessionId) {
      // For existing session ID, use Stripe hosted checkout URL format
      const checkoutUrl = `https://checkout.stripe.com/pay/${sessionId}`;
      setIframeUrl(checkoutUrl);
      setIsLoading(false);
    }
    // No parameters provided
    else {
      setError('No checkout parameters provided');
      setIsLoading(false);
    }
  }, [user, sessionUrl, portal, planKey, sessionId]);

  // Listen for messages from iframe (Stripe events)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from Stripe domains
      if (!event.origin.includes('stripe.com')) return;

      // Handle different Stripe events
      if (event.data === 'stripe-checkout-complete') {
        // Redirect to success page
        navigate('/checkout/success');
      } else if (event.data === 'stripe-checkout-cancel') {
        // User cancelled, go back
        navigate('/admin/settings');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate]);

  const handleCancel = () => {
    navigate('/admin/settings');
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Checkout Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleCancel}
                variant="outline"
                className="w-full"
                data-testid="button-back-settings"
              >
                Back to Settings
              </Button>
              <Button 
                onClick={() => window.location.reload()}
                variant="default"
                className="w-full"
                data-testid="button-retry"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 py-8">
        <div className="mb-4">
          <Button
            variant="outline"
            onClick={handleCancel}
            data-testid="button-cancel-checkout"
          >
            Cancel
          </Button>
        </div>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>
              {portal ? 'Manage Payment Method' : 'Complete Your Purchase'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-[600px]">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    {portal ? 'Loading payment portal...' : 'Loading checkout...'}
                  </p>
                </div>
              </div>
            ) : (
              iframeUrl && (
                <iframe
                  src={iframeUrl}
                  className="w-full h-[600px] border-0"
                  allow="payment"
                  data-testid="iframe-stripe-checkout"
                  title={portal ? 'Stripe Customer Portal' : 'Stripe Checkout'}
                />
              )
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}