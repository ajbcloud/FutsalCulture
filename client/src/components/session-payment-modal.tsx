import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CreditCard, DollarSign, Calendar, MapPin, Clock, Loader2, Wallet, Tag, ChevronDown, ChevronUp, Check, X, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUserTerminology } from "@/hooks/use-user-terminology";
import { formatVenueDisplay } from "@shared/constants";
import { apiRequest } from "@/lib/queryClient";

type CreditBalanceResponse = {
  balance: number;
  balanceDollars: string;
  personalCreditsCents: number;
  personalCreditsDollars: string;
  householdCreditsCents: number;
  householdCreditsDollars: string;
};

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
    venueType?: string | null;
    venueDetail?: string | null;
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

// Braintree Form Component
function BraintreePaymentForm({ session, player, signup, useCredits, finalAmount, discountCodeId, discountAmountCents, onSuccess, onError }: {
  session: any;
  player: any;
  signup: any;
  useCredits: boolean;
  finalAmount: number;
  discountCodeId?: string | null;
  discountAmountCents?: number;
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
              // Force payment method selection - removed unsupported option
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
        amount: finalAmount,
        provider: 'braintree',
        paymentMethodNonce: nonce,
        useCredits,
        discountCodeId,
        discountAmountCents: discountAmountCents || 0
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
          `Pay $${(finalAmount / 100).toFixed(2)}`
        )}
      </Button>
    </div>
  );
}

interface PaymentConfig {
  provider: 'braintree';
  clientToken?: string;
}

export function SessionPaymentModal({ isOpen, onClose, session, player, signup }: SessionPaymentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { term } = useUserTerminology();

  // Get payment configuration
  const { data: paymentConfig, isLoading: configLoading, error: configError } = useQuery<PaymentConfig>({
    queryKey: ['/api/session-billing/payment-config'],
    enabled: isOpen,
  });

  // Fetch available credits balance with household-augmented balances
  const { data: creditsBalance, isLoading: creditsLoading } = useQuery<CreditBalanceResponse>({
    queryKey: ['/api/credits/balance'],
    enabled: isOpen,
  });

  // Map balance endpoint response fields to personal and household totals
  const personalCreditsCents = creditsBalance?.personalCreditsCents || 0;
  const householdCreditsCents = creditsBalance?.householdCreditsCents || 0;
  const totalAvailableCreditsCents = creditsBalance?.balance || 0;

  // State for useCredits toggle - default to true if credits are available
  const [useCredits, setUseCredits] = useState(totalAvailableCreditsCents > 0);

  // Discount code state
  const [discountCode, setDiscountCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState<{ discountType: string; discountValue: number; discountCodeId: string } | null>(null);
  const [isValidatingDiscount, setIsValidatingDiscount] = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [isDiscountExpanded, setIsDiscountExpanded] = useState(false);

  // Update useCredits when credits data changes
  useEffect(() => {
    if (totalAvailableCreditsCents > 0) {
      setUseCredits(true);
    }
  }, [totalAvailableCreditsCents]);

  // Calculate discount amount based on discount type
  const calculateDiscountAmount = (): number => {
    if (!discountApplied) return 0;
    const originalPrice = session.priceCents;
    
    if (discountApplied.discountType === 'full') {
      return originalPrice;
    } else if (discountApplied.discountType === 'percentage') {
      return Math.floor(originalPrice * discountApplied.discountValue / 100);
    } else if (discountApplied.discountType === 'fixed') {
      return Math.min(discountApplied.discountValue, originalPrice);
    }
    return 0;
  };

  // Calculate payment amounts
  const originalPrice = session.priceCents;
  const discountAmount = calculateDiscountAmount();
  const creditsApplied = useCredits ? Math.min(totalAvailableCreditsCents, originalPrice - discountAmount) : 0;
  const finalAmount = Math.max(0, originalPrice - creditsApplied - discountAmount);
  const isFullyCoveredByCredits = useCredits && finalAmount <= 0;

  // Handle applying discount code
  const handleApplyDiscountCode = async () => {
    if (!discountCode.trim()) {
      setDiscountError("Please enter a discount code");
      return;
    }

    setIsValidatingDiscount(true);
    setDiscountError(null);

    try {
      const response = await apiRequest('POST', '/api/session-billing/validate-discount-code', {
        code: discountCode.trim()
      });

      if (response.ok) {
        const data = await response.json();
        setDiscountApplied({
          discountType: data.discountType,
          discountValue: data.discountValue,
          discountCodeId: data.discountCodeId
        });
        setDiscountError(null);
      } else {
        const errorData = await response.json();
        setDiscountError(errorData.message || "Invalid discount code");
        setDiscountApplied(null);
      }
    } catch (err: any) {
      setDiscountError(err.message || "Failed to validate discount code");
      setDiscountApplied(null);
    } finally {
      setIsValidatingDiscount(false);
    }
  };

  // Handle removing applied discount
  const handleRemoveDiscount = () => {
    setDiscountApplied(null);
    setDiscountCode("");
    setDiscountError(null);
  };

  const handlePaymentSuccess = () => {
    toast({
      title: "Payment successful!",
      description: `${player.firstName} has been enrolled in the session.`,
    });
    queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
    queryClient.invalidateQueries({ queryKey: ['/api/signups'] });
    queryClient.invalidateQueries({ queryKey: ['/api/credits/balance'] });
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
          {/* Available Credits Section */}
          {!creditsLoading && totalAvailableCreditsCents > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-medium text-blue-900 dark:text-blue-100">Available Credits</h3>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-blue-700 dark:text-blue-300">
                  <span>{term} Credits:</span>
                  <span data-testid="text-personal-credits">${(personalCreditsCents / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-blue-700 dark:text-blue-300">
                  <span>Household Credits:</span>
                  <span data-testid="text-household-credits">${(householdCreditsCents / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-blue-900 dark:text-blue-100 pt-2 border-t border-blue-200 dark:border-blue-800">
                  <span>Total Available:</span>
                  <span data-testid="text-total-credits">${(totalAvailableCreditsCents / 100).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="use-credits"
                  checked={useCredits}
                  onCheckedChange={(checked) => setUseCredits(checked as boolean)}
                  data-testid="checkbox-use-credits"
                />
                <label
                  htmlFor="use-credits"
                  className="text-sm font-medium text-blue-900 dark:text-blue-100 cursor-pointer"
                >
                  Use available credits (${(totalAvailableCreditsCents / 100).toFixed(2)})
                </label>
              </div>
            </div>
          )}

          {/* Discount Code Section */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setIsDiscountExpanded(!isDiscountExpanded)}
              className="w-full flex items-center justify-between p-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              data-testid="button-toggle-discount"
            >
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                <span>Have a discount code?</span>
              </div>
              {isDiscountExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            
            {isDiscountExpanded && (
              <div className="p-3 pt-0 space-y-3">
                {discountApplied ? (
                  <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                      <Check className="h-4 w-4" />
                      <span className="text-sm font-medium" data-testid="text-discount-applied">
                        Discount applied: {discountApplied.discountType === 'full' ? '100%' : 
                          discountApplied.discountType === 'percentage' ? `${discountApplied.discountValue}%` : 
                          `$${(discountApplied.discountValue / 100).toFixed(2)}`} off
                      </span>
                    </div>
                    <button
                      onClick={handleRemoveDiscount}
                      className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                      data-testid="button-remove-discount"
                      aria-label="Remove discount"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="Enter code"
                        value={discountCode}
                        onChange={(e) => {
                          setDiscountCode(e.target.value);
                          if (discountError) setDiscountError(null);
                        }}
                        className="flex-1"
                        data-testid="input-discount-code"
                        disabled={isValidatingDiscount}
                      />
                      <Button
                        onClick={handleApplyDiscountCode}
                        disabled={isValidatingDiscount || !discountCode.trim()}
                        size="sm"
                        data-testid="button-apply-discount"
                      >
                        {isValidatingDiscount ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Apply"
                        )}
                      </Button>
                    </div>
                    {discountError && (
                      <p className="text-sm text-red-500 dark:text-red-400" data-testid="text-discount-error">
                        {discountError}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Payment Breakdown */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
            <h3 className="font-medium text-sm text-gray-600 dark:text-gray-400">Payment Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Original Price:</span>
                <span data-testid="text-original-price">${(originalPrice / 100).toFixed(2)}</span>
              </div>
              {discountApplied && discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                  <span>Discount Code Applied:</span>
                  <span data-testid="text-discount-amount">-${(discountAmount / 100).toFixed(2)}</span>
                </div>
              )}
              {useCredits && creditsApplied > 0 && (
                <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                  <span>Credits Applied:</span>
                  <span data-testid="text-credits-applied">-${(creditsApplied / 100).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200 dark:border-gray-700">
                <span>Final Amount to Pay:</span>
                <span data-testid="text-final-amount">${(Math.max(0, finalAmount) / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>

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
              {(session.venueType || session.venueDetail) && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-gray-500" />
                  <span>{formatVenueDisplay(session.venueType, session.venueDetail)}</span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm font-medium">Player: {player.firstName} {player.lastName}</span>
              <div className="flex items-center gap-1 text-lg font-bold">
                <DollarSign className="h-4 w-4" />
                <span>{(session.priceCents / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Form or Fully Covered Message */}
          <div className="space-y-4">
            {isFullyCoveredByCredits ? (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-6 rounded-lg text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-300">
                  <Wallet className="h-6 w-6" />
                  <h3 className="text-lg font-semibold">Payment Fully Covered by Credits</h3>
                </div>
                <p className="text-sm text-green-600 dark:text-green-400" data-testid="text-fully-covered">
                  Your available credits will cover the full cost of this session. Click Complete to enroll.
                </p>
                <Button
                  onClick={async () => {
                    try {
                      const response = await apiRequest('POST', '/api/session-billing/process-payment', {
                        signupId: signup.id,
                        sessionId: session.id,
                        playerId: player.id,
                        amount: Math.max(0, finalAmount),
                        provider: null,
                        useCredits: true,
                        discountCodeId: discountApplied?.discountCodeId,
                        discountAmountCents: discountAmount || 0
                      });
                      
                      if (response.ok) {
                        handlePaymentSuccess();
                      } else {
                        const errorData = await response.json();
                        handlePaymentError(errorData.message || "Failed to apply credits");
                      }
                    } catch (err: any) {
                      handlePaymentError(err.message || "Failed to process payment");
                    }
                  }}
                  className="w-full"
                  data-testid="button-complete-with-credits"
                >
                  Complete Enrollment{discountApplied ? " with Discount" : " with Credits"}
                </Button>
              </div>
            ) : configLoading ? (
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
            ) : paymentConfig?.provider === 'braintree' && paymentConfig?.clientToken ? (
              <BraintreePaymentForm
                session={session}
                player={player}
                signup={signup}
                useCredits={useCredits}
                finalAmount={Math.max(0, finalAmount)}
                discountCodeId={discountApplied?.discountCodeId}
                discountAmountCents={discountAmount}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-yellow-600 dark:text-yellow-400">
                  Braintree payment processor not configured. Please contact support.
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