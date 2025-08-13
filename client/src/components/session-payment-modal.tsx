import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, DollarSign, Calendar, MapPin, Clock, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

interface SessionPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: {
    id: string;
    location: string;
    startTime: string;
    ageGroup: string;
    priceCents: number;
    title: string;
  };
  player: {
    id: string;
    firstName: string;
    lastName: string;
  };
  signup: {
    id: string;
    reservationExpiresAt: string;
  };
}

// Stripe Form Component
function StripePaymentForm({ session, player, signup, onSuccess, onError }: {
  session: any;
  player: any;
  signup: any;
  onSuccess: () => void;
  onError: (error: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const card = elements.getElement(CardElement);
    if (!card) {
      onError("Card element not found");
      setIsProcessing(false);
      return;
    }

    // Create payment method
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card,
      billing_details: {
        name: `${player.firstName} ${player.lastName}`,
      },
    });

    if (error) {
      onError(error.message || "Payment failed");
      setIsProcessing(false);
      return;
    }

    try {
      // Process payment through backend
      const response = await apiRequest('POST', '/api/session-billing/process-payment', {
        signupId: signup.id,
        sessionId: session.id,
        playerId: player.id,
        amount: session.priceCents,
        paymentMethodId: paymentMethod.id,
        provider: 'stripe'
      });

      if (response.ok) {
        onSuccess();
      } else {
        const errorData = await response.json();
        onError(errorData.message || "Payment failed");
      }
    } catch (err: any) {
      onError(err.message || "Payment processing failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-lg">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }}
        />
      </div>
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing} 
        className="w-full"
        data-testid="button-complete-stripe-payment"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          `Pay $${(session.priceCents / 100).toFixed(2)}`
        )}
      </Button>
    </form>
  );
}

// Braintree Form Component (placeholder)
function BraintreePaymentForm({ session, player, signup, onSuccess, onError }: {
  session: any;
  player: any;
  signup: any;
  onSuccess: () => void;
  onError: (error: string) => void;
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [dropinInstance, setDropinInstance] = useState<any>(null);
  const [isDropinReady, setIsDropinReady] = useState(false);
  const dropinContainerRef = useRef<HTMLDivElement>(null);

  // Handle escape key to close payment form
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onError('Payment canceled by user');
      }
    };

    if (isDropinReady) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isDropinReady, onError]);

  const { data: paymentConfig, error: paymentConfigError, isLoading: paymentConfigLoading } = useQuery<PaymentConfig>({
    queryKey: ['/api/session-billing/payment-config'],
  });

  // Log payment config status for debugging
  useEffect(() => {
    console.log('Payment config status:', {
      loading: paymentConfigLoading,
      hasData: !!paymentConfig,
      error: paymentConfigError,
      config: paymentConfig
    });
    
    if (paymentConfigError) {
      console.error('Payment config error details:', paymentConfigError);
    }
  }, [paymentConfig, paymentConfigError, paymentConfigLoading]);

  // Helper function to detect mobile device
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           (navigator.maxTouchPoints && navigator.maxTouchPoints > 1);
  };

  // Function to apply dark mode styles to Braintree Drop-in UI
  const applyDarkModeStyles = (container: HTMLElement) => {
    // Check if dark mode is enabled by checking the document element
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    if (!isDarkMode) return;
    
    const styles = `
      /* Braintree Drop-in dark mode overrides */
      .braintree-option {
        background-color: #1f2937 !important;
        border-color: #374151 !important;
        color: #f9fafb !important;
      }
      
      .braintree-option:hover {
        background-color: #374151 !important;
      }
      
      .braintree-option__label {
        color: #f9fafb !important;
      }
      
      .braintree-option__logo {
        filter: brightness(0.9);
        opacity: 1;
      }
      
      .braintree-sheet {
        background-color: #1f2937 !important;
        border-color: #374151 !important;
      }
      
      .braintree-form__label {
        color: #d1d5db !important;
      }
      
      .braintree-form__field {
        background-color: #374151 !important;
        border-color: #4b5563 !important;
        color: #f9fafb !important;
      }
      
      .braintree-form__field:focus {
        border-color: #3b82f6 !important;
        box-shadow: 0 0 0 1px #3b82f6 !important;
      }
      
      .braintree-form__field--valid {
        border-color: #10b981 !important;
      }
      
      .braintree-form__field-error {
        color: #ef4444 !important;
      }
      
      .braintree-methods {
        background-color: #111827 !important;
      }
      
      /* Venmo and Google Pay specific styling - keep original branding */
      .braintree-option--venmo .braintree-option__logo,
      .braintree-option--googlepay .braintree-option__logo {
        filter: none !important;
        opacity: 1 !important;
      }
      
      /* Card option specific styling - invert for visibility */
      .braintree-option--card .braintree-option__logo {
        filter: brightness(0) invert(0.8) !important;
        opacity: 1 !important;
      }
      
      /* Fix toggle text visibility */
      .braintree-toggle {
        color: #f9fafb !important;
      }
      
      .braintree-toggle__label {
        color: #f9fafb !important;
      }
      
      .braintree-toggle__switch {
        background-color: #374151 !important;
        border-color: #6b7280 !important;
      }
      
      .braintree-large-button {
        background-color: #1f2937 !important;
        color: #f9fafb !important;
        border-color: #374151 !important;
      }
      
      .braintree-large-button:hover {
        background-color: #374151 !important;
      }
      
      /* Fix for Venmo popup overlay issues */
      .braintree-venmo-popup,
      .braintree-venmo-modal {
        z-index: 9999 !important;
      }
      
      .braintree-venmo-popup .braintree-close {
        display: block !important;
        position: absolute !important;
        top: 10px !important;
        right: 10px !important;
        background: #fff !important;
        border: 1px solid #ccc !important;
        border-radius: 3px !important;
        cursor: pointer !important;
        padding: 5px 10px !important;
        font-size: 14px !important;
        color: #333 !important;
        z-index: 10000 !important;
      }
    `;
    
    // Create style element and inject CSS
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    styleElement.id = 'braintree-dark-mode-styles';
    
    // Remove any existing styles first
    const existingStyles = document.getElementById('braintree-dark-mode-styles');
    if (existingStyles) {
      existingStyles.remove();
    }
    
    document.head.appendChild(styleElement);
  };

  useEffect(() => {
    let isMounted = true;

    const initializeBraintree = async () => {
      if (paymentConfig?.provider === 'braintree' && paymentConfig.clientToken && dropinContainerRef.current) {
        // Clear container first
        if (dropinContainerRef.current) {
          dropinContainerRef.current.innerHTML = '';
        }

        try {
          // Dynamically import Braintree Drop-in
          const dropInModule = await import('braintree-web-drop-in');
          const dropIn = dropInModule.default || dropInModule;
          
          // Check if component is still mounted and container exists
          if (!isMounted || !dropinContainerRef.current) {
            return;
          }

          const instance = await dropIn.create({
            authorization: paymentConfig.clientToken,
            container: dropinContainerRef.current,
            card: {
              cardholderName: {
                required: false
              }
            },
            venmo: {
              allowDesktop: true,
              allowDesktopWebLogin: false,
              allowNewBrowserTab: false,
              mobileWebFallBack: false,
              paymentMethodUsage: 'single_use',
              ignoreHistoricalPaymentMethods: true // Force payment method selection
            },
            googlePay: {
              merchantId: 'BCR2DN4T2B6X3LXT', // Braintree sandbox merchant ID
              transactionInfo: {
                totalPriceStatus: 'FINAL',
                totalPrice: (session.priceCents / 100).toString(),
                currencyCode: 'USD'
              }
            }
          });

          if (isMounted) {
            setDropinInstance(instance);
            setIsDropinReady(true);
            
            // Set up Venmo flow event listeners for mobile optimization
            instance.on('paymentMethodRequestable', (event: any) => {
              if (event.type === 'VenmoAccount' && event.paymentMethodIsSelected) {
                // Venmo is selected, prepare for mobile app redirect
              }
            });

            // Handle Venmo flow completion
            instance.on('paymentOptionSelected', (event: any) => {
              if (event.paymentOption === 'venmo') {
                if (isMobileDevice()) {
                }
              }
            });

            // Handle Venmo payment method flow events
            instance.on('venmoTokenizationStarted', () => {
              setIsProcessing(true);
              
              // Show mobile-specific guidance
              if (isMobileDevice()) {
                // Don't show error immediately, let Venmo app handle the flow
              }
            });

            instance.on('venmoTokenizationCanceled', () => {
              setIsProcessing(false);
            });

            // Handle successful Venmo authorization
            instance.on('venmoTokenized', (payload: any) => {
              setIsProcessing(false);
            });
            
            // Apply dark mode styles to Braintree Drop-in UI after a short delay to ensure DOM is ready
            setTimeout(() => {
              if (dropinContainerRef.current) {
                applyDarkModeStyles(dropinContainerRef.current);
              }
            }, 100);
          } else {
            // Component unmounted during async operation
            instance.teardown();
          }
        } catch (error: any) {
          console.error('Error creating Braintree Drop-in:', error);
          if (isMounted) {
            onError('Failed to initialize payment form');
          }
        }
      }
    };

    initializeBraintree();

    return () => {
      isMounted = false;
      if (dropinInstance) {
        dropinInstance.teardown().catch(console.error);
        setDropinInstance(null);
        setIsDropinReady(false);
      }
    };
  }, [paymentConfig?.clientToken]);

  const handleSubmit = async () => {
    if (!dropinInstance || !isDropinReady) {
      onError('Payment form not ready');
      return;
    }

    setIsProcessing(true);
    
    try {
      // For Venmo on mobile, the requestPaymentMethod will handle the app redirect automatically
      // Add a timeout to prevent hanging on mobile redirects
      const result = await Promise.race([
        dropinInstance.requestPaymentMethod(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Payment timeout - please try again')), 30000)
        )
      ]) as any;
      
      // Check if result is valid
      if (!result || !result.nonce) {
        throw new Error('No payment method was selected or authorized');
      }
      
      const { nonce, type } = result;
      
      // Log payment method type for debugging

      // Log Venmo payment completion
      if (type === 'VenmoAccount') {
      }
      
      const response = await apiRequest('POST', '/api/session-billing/process-payment', {
        signupId: signup.id,
        sessionId: session.id,
        playerId: player.id,
        amount: session.priceCents,
        provider: 'braintree',
        paymentMethodNonce: nonce
      });

      if (response.ok) {
        onSuccess();
      } else {
        const errorData = await response.json();
        onError(errorData.message || "Payment failed");
      }
    } catch (err: any) {
      console.error('Braintree payment error:', err);
      
      // Handle specific Braintree errors
      if (err.message?.includes('No payment method is available') || 
          err.message?.includes('User did not select a payment method')) {
        onError('Please select a payment method and try again');
      } else if (err.message?.includes('User canceled') || 
                 err.message?.includes('venmoTokenizationCanceled')) {
        onError('Payment was canceled');
      } else if (err.message?.includes('Payment timeout')) {
        onError('Venmo payment took too long - please try again');
      } else {
        onError(err.message || "Payment processing failed");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div 
        ref={dropinContainerRef}
        className="min-h-[200px] braintree-container"
        data-testid="braintree-dropin-container"
      />
      {!paymentConfig?.clientToken && (
        <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-sm text-yellow-600 dark:text-yellow-400">
            Loading payment form...
          </p>
          <Button 
            variant="outline" 
            onClick={() => onError('Payment canceled by user')}
            className="mt-4"
            size="sm"
          >
            Cancel
          </Button>
        </div>
      )}
      <Button 
        onClick={handleSubmit}
        disabled={isProcessing || !isDropinReady} 
        className="w-full"
        data-testid="button-complete-braintree-payment"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {isMobileDevice() ? 'Complete in Venmo app...' : 'Processing Payment...'}
          </>
        ) : (
          `Pay $${(session.priceCents / 100).toFixed(2)}`
        )}
      </Button>
    </div>
  );
}

interface PaymentConfig {
  provider: 'stripe' | 'braintree';
  publishableKey?: string;
  clientToken?: string;
}

export function SessionPaymentModal({ isOpen, onClose, session, player, signup }: SessionPaymentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get payment configuration
  const { data: paymentConfig, isLoading: configLoading, error: configError } = useQuery<PaymentConfig>({
    queryKey: ['/api/session-billing/payment-config'],
    enabled: isOpen,
  });

  const handlePaymentSuccess = () => {
    toast({
      title: "Payment successful!",
      description: `${player.firstName} has been enrolled in the session.`,
    });
    queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
    queryClient.invalidateQueries({ queryKey: ['/api/signups'] });
    onClose();
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: "Payment failed",
      description: error || "Please try again or contact support.",
      variant: "destructive",
    });
  };

  const formatStartTime = (startTime: string) => {
    return new Date(startTime).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (startTime: string) => {
    return new Date(startTime).toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Session Payment
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Session Details */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
            <h3 className="font-medium text-sm text-gray-600 dark:text-gray-400">Session Details</h3>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>{formatDate(session.startTime)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-500" />
                <span>{formatStartTime(session.startTime)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span>{session.location}</span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm font-medium">Player: {player.firstName} {player.lastName}</span>
              <div className="flex items-center gap-1 text-lg font-bold">
                <DollarSign className="h-4 w-4" />
                <span>{(session.priceCents / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="space-y-4">
            {configLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="ml-2">Loading payment options...</span>
              </div>
            ) : configError ? (
              <div className="text-center py-8">
                <p className="text-red-600 dark:text-red-400">
                  Payment configuration error. Please contact support.
                </p>
              </div>
            ) : paymentConfig?.provider === 'stripe' ? (
              paymentConfig.publishableKey ? (
                <Elements stripe={loadStripe(paymentConfig.publishableKey)}>
                  <StripePaymentForm
                    session={session}
                    player={player}
                    signup={signup}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />
                </Elements>
              ) : (
                <div className="text-center py-8">
                  <p className="text-red-600 dark:text-red-400">
                    Stripe configuration incomplete. Please contact support.
                  </p>
                </div>
              )
            ) : paymentConfig?.provider === 'braintree' ? (
              <BraintreePaymentForm
                session={session}
                player={player}
                signup={signup}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-yellow-600 dark:text-yellow-400">
                  No payment processor configured. Please contact support.
                </p>
              </div>
            )}
          </div>

          {/* Cancel Button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={onClose}
              className="min-w-[120px]"
              data-testid="button-cancel-payment"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}