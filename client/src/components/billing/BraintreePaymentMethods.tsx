import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import * as braintree from "braintree-web";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { 
  CreditCard, 
  Calendar, 
  Lock, 
  AlertCircle, 
  MapPin, 
  Hash, 
  Building,
  Smartphone,
  Wallet
} from "lucide-react";
import { SiVenmo, SiPaypal } from "react-icons/si";

export type PaymentMethodType = 'card' | 'venmo' | 'paypal' | 'ach';

export interface BillingAddress {
  streetAddress: string;
  locality?: string;
  region?: string;
  postalCode: string;
  countryCodeAlpha2?: string;
}

export interface BankAccount {
  accountNumber: string;
  routingNumber: string;
  accountType: 'checking' | 'savings';
  ownershipType: 'personal' | 'business';
  firstName: string;
  lastName: string;
  businessName?: string;
}

export interface BraintreePaymentMethodsRef {
  tokenize: () => Promise<{ nonce: string; type: PaymentMethodType; details?: any }>;
  getSelectedMethod: () => PaymentMethodType;
  getBillingAddress: () => BillingAddress;
}

interface BraintreePaymentMethodsProps {
  clientToken: string;
  onReady?: () => void;
  onError?: (error: Error) => void;
  onMethodChange?: (method: PaymentMethodType) => void;
  enabledMethods?: PaymentMethodType[];
  className?: string;
}

const BraintreePaymentMethods = forwardRef<BraintreePaymentMethodsRef, BraintreePaymentMethodsProps>(
  ({ 
    clientToken, 
    onReady, 
    onError, 
    onMethodChange,
    enabledMethods = ['card', 'venmo', 'paypal', 'ach'],
    className 
  }, ref) => {
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('card');
    const [clientInstance, setClientInstance] = useState<braintree.Client | null>(null);
    const [hostedFieldsInstance, setHostedFieldsInstance] = useState<braintree.HostedFields | null>(null);
    const [venmoInstance, setVenmoInstance] = useState<braintree.Venmo | null>(null);
    const [paypalInstance, setPaypalInstance] = useState<braintree.PayPalCheckout | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [initError, setInitError] = useState<string | null>(null);
    const [venmoSupported, setVenmoSupported] = useState(false);
    const [venmoNonce, setVenmoNonce] = useState<string | null>(null);
    const [paypalNonce, setPaypalNonce] = useState<string | null>(null);
    
    const [cardType, setCardType] = useState<string>("");
    const [fieldStates, setFieldStates] = useState({
      number: { isValid: false, isEmpty: true, isFocused: false },
      expirationDate: { isValid: false, isEmpty: true, isFocused: false },
      cvv: { isValid: false, isEmpty: true, isFocused: false },
      postalCode: { isValid: false, isEmpty: true, isFocused: false },
    });
    
    const [billingAddress, setBillingAddress] = useState<BillingAddress>({
      streetAddress: "",
      locality: "",
      region: "",
      postalCode: "",
      countryCodeAlpha2: "US",
    });
    
    const [bankAccount, setBankAccount] = useState<BankAccount>({
      accountNumber: "",
      routingNumber: "",
      accountType: "checking",
      ownershipType: "personal",
      firstName: "",
      lastName: "",
      businessName: "",
    });
    
    const initializingRef = useRef(false);

    useEffect(() => {
      if (!clientToken || initializingRef.current) return;
      initializingRef.current = true;
      setInitError(null);

      braintree.client.create({ authorization: clientToken })
        .then((client) => {
          setClientInstance(client);
          return initializePaymentMethods(client);
        })
        .then(() => {
          setIsReady(true);
          initializingRef.current = false;
          onReady?.();
        })
        .catch((err) => {
          console.error("Braintree initialization error:", err);
          setInitError(err.message || "Failed to initialize payment methods");
          initializingRef.current = false;
          onError?.(err);
        });

      return () => {
        hostedFieldsInstance?.teardown();
        venmoInstance?.teardown();
      };
    }, [clientToken]);

    const initializePaymentMethods = async (client: braintree.Client) => {
      const promises: Promise<any>[] = [];

      if (enabledMethods.includes('card')) {
        promises.push(initializeHostedFields(client));
      }

      if (enabledMethods.includes('venmo')) {
        promises.push(initializeVenmo(client));
      }

      if (enabledMethods.includes('paypal')) {
        promises.push(initializePayPal(client));
      }

      await Promise.all(promises);
    };

    const initializeHostedFields = async (client: braintree.Client) => {
      const instance = await braintree.hostedFields.create({
        client,
        styles: {
          "input": {
            "font-size": "16px",
            "font-family": "Inter, system-ui, sans-serif",
            "font-weight": "400",
            "color": "hsl(var(--foreground))",
            "line-height": "1.5",
          },
          "input.valid": { "color": "hsl(142.1 76.2% 36.3%)" },
          "input.invalid": { "color": "hsl(0 84.2% 60.2%)" },
          ":focus": { "color": "hsl(var(--foreground))" },
          "::placeholder": { "color": "hsl(var(--muted-foreground))" },
        },
        fields: {
          number: { container: "#card-number-multi", placeholder: "4111 1111 1111 1111" },
          expirationDate: { container: "#expiration-date-multi", placeholder: "MM/YY" },
          cvv: { container: "#cvv-multi", placeholder: "123" },
          postalCode: { container: "#postal-code-multi", placeholder: "12345" },
        },
      });

      setHostedFieldsInstance(instance);

      instance.on("cardTypeChange", (event) => {
        if (event.cards.length === 1) {
          setCardType(event.cards[0].type);
        } else {
          setCardType("");
        }
      });

      instance.on("validityChange", (event) => {
        const field = event.emittedBy as keyof typeof fieldStates;
        setFieldStates((prev) => ({
          ...prev,
          [field]: {
            ...prev[field],
            isValid: event.fields[field].isValid,
            isEmpty: event.fields[field].isEmpty,
          },
        }));
      });

      instance.on("focus", (event) => {
        const field = event.emittedBy as keyof typeof fieldStates;
        setFieldStates((prev) => ({
          ...prev,
          [field]: { ...prev[field], isFocused: true },
        }));
      });

      instance.on("blur", (event) => {
        const field = event.emittedBy as keyof typeof fieldStates;
        setFieldStates((prev) => ({
          ...prev,
          [field]: { ...prev[field], isFocused: false },
        }));
      });
    };

    const initializeVenmo = async (client: braintree.Client) => {
      try {
        const instance = await braintree.venmo.create({
          client,
          allowDesktop: true,
          paymentMethodUsage: 'multi_use',
        });
        
        const isSupported = instance.isBrowserSupported();
        setVenmoSupported(isSupported);
        
        if (isSupported) {
          setVenmoInstance(instance);
        }
      } catch (err) {
        console.warn("Venmo not available:", err);
        setVenmoSupported(false);
      }
    };

    const initializePayPal = async (client: braintree.Client) => {
      try {
        const instance = await braintree.paypalCheckout.create({ client });
        setPaypalInstance(instance);
      } catch (err) {
        console.warn("PayPal not available:", err);
      }
    };

    const handleVenmoClick = async () => {
      if (!venmoInstance) return;
      
      try {
        const payload = await venmoInstance.tokenize();
        setVenmoNonce(payload.nonce);
      } catch (err: any) {
        if (err.code !== 'VENMO_CANCELED') {
          onError?.(err);
        }
      }
    };

    const handlePayPalClick = async () => {
      if (!paypalInstance) return;
      
      try {
        const payload = await paypalInstance.createPayment({
          flow: 'vault',
          intent: 'tokenize',
        });
        
        const tokenizePayload = await paypalInstance.tokenizePayment(payload);
        setPaypalNonce(tokenizePayload.nonce);
      } catch (err: any) {
        if (err.code !== 'PAYPAL_POPUP_CLOSED') {
          onError?.(err);
        }
      }
    };

    useImperativeHandle(ref, () => ({
      tokenize: async () => {
        if (selectedMethod === 'card' && hostedFieldsInstance) {
          if (!billingAddress.streetAddress) {
            throw new Error("Street address is required");
          }
          
          const { nonce, details } = await hostedFieldsInstance.tokenize({
            billingAddress: {
              streetAddress: billingAddress.streetAddress,
              locality: billingAddress.locality || "",
              region: billingAddress.region || "",
              postalCode: billingAddress.postalCode || "",
              countryCodeAlpha2: billingAddress.countryCodeAlpha2 || "US",
            },
          });
          
          return { 
            nonce, 
            type: 'card' as PaymentMethodType,
            details: {
              cardType: (details as any)?.cardType,
              lastFour: (details as any)?.lastFour,
            }
          };
        }
        
        if (selectedMethod === 'venmo') {
          if (venmoNonce) {
            return { nonce: venmoNonce, type: 'venmo' as PaymentMethodType };
          }
          throw new Error("Please authorize with Venmo first");
        }
        
        if (selectedMethod === 'paypal') {
          if (paypalNonce) {
            return { nonce: paypalNonce, type: 'paypal' as PaymentMethodType };
          }
          throw new Error("Please authorize with PayPal first");
        }
        
        if (selectedMethod === 'ach') {
          if (!bankAccount.accountNumber || !bankAccount.routingNumber) {
            throw new Error("Bank account details are required");
          }
          if (!bankAccount.firstName || !bankAccount.lastName) {
            throw new Error("Account holder name is required");
          }
          
          return {
            nonce: 'ach_pending',
            type: 'ach' as PaymentMethodType,
            details: { ...bankAccount }
          };
        }
        
        throw new Error("No payment method selected");
      },
      getSelectedMethod: () => selectedMethod,
      getBillingAddress: () => billingAddress,
    }));

    const getFieldClassName = (field: keyof typeof fieldStates) => {
      const state = fieldStates[field];
      return cn(
        "h-12 px-3 rounded-md border bg-background transition-colors",
        state.isFocused && "ring-2 ring-ring ring-offset-2",
        !state.isEmpty && state.isValid && "border-green-500",
        !state.isEmpty && !state.isValid && "border-destructive"
      );
    };

    const handleMethodChange = (method: string) => {
      setSelectedMethod(method as PaymentMethodType);
      onMethodChange?.(method as PaymentMethodType);
    };

    if (initError) {
      return (
        <Card className={cn("border-destructive", className)}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>{initError}</span>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className={cn("space-y-4", className)}>
        <Tabs value={selectedMethod} onValueChange={handleMethodChange}>
          <TabsList className="grid w-full grid-cols-4 h-auto">
            {enabledMethods.includes('card') && (
              <TabsTrigger value="card" className="flex flex-col gap-1 py-3" data-testid="tab-card">
                <CreditCard className="h-5 w-5" />
                <span className="text-xs">Card</span>
              </TabsTrigger>
            )}
            {enabledMethods.includes('venmo') && venmoSupported && (
              <TabsTrigger value="venmo" className="flex flex-col gap-1 py-3" data-testid="tab-venmo">
                <SiVenmo className="h-5 w-5" />
                <span className="text-xs">Venmo</span>
              </TabsTrigger>
            )}
            {enabledMethods.includes('paypal') && paypalInstance && (
              <TabsTrigger value="paypal" className="flex flex-col gap-1 py-3" data-testid="tab-paypal">
                <SiPaypal className="h-5 w-5" />
                <span className="text-xs">PayPal</span>
              </TabsTrigger>
            )}
            {enabledMethods.includes('ach') && (
              <TabsTrigger value="ach" className="flex flex-col gap-1 py-3" data-testid="tab-ach">
                <Building className="h-5 w-5" />
                <span className="text-xs">Bank</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="card" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="card-number-multi" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Card Number
                {cardType && (
                  <span className="text-xs text-muted-foreground capitalize">
                    ({cardType.replace("-", " ")})
                  </span>
                )}
              </Label>
              <div id="card-number-multi" className={getFieldClassName("number")} data-testid="input-card-number" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiration-date-multi" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Expiration
                </Label>
                <div id="expiration-date-multi" className={getFieldClassName("expirationDate")} data-testid="input-expiration" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvv-multi" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  CVV
                </Label>
                <div id="cvv-multi" className={getFieldClassName("cvv")} data-testid="input-cvv" />
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <Label className="text-sm font-medium mb-3 block">Billing Address</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="street-address-multi" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Street Address
              </Label>
              <Input
                id="street-address-multi"
                placeholder="123 Main St"
                value={billingAddress.streetAddress}
                onChange={(e) => setBillingAddress(prev => ({ ...prev, streetAddress: e.target.value }))}
                className="h-12"
                data-testid="input-street-address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="locality-multi">City</Label>
                <Input
                  id="locality-multi"
                  placeholder="Boston"
                  value={billingAddress.locality}
                  onChange={(e) => setBillingAddress(prev => ({ ...prev, locality: e.target.value }))}
                  className="h-12"
                  data-testid="input-city"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region-multi">State</Label>
                <Input
                  id="region-multi"
                  placeholder="MA"
                  value={billingAddress.region}
                  onChange={(e) => setBillingAddress(prev => ({ ...prev, region: e.target.value }))}
                  className="h-12"
                  data-testid="input-state"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postal-code-multi" className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Postal Code
                </Label>
                <div id="postal-code-multi" className={getFieldClassName("postalCode")} data-testid="input-postal-code" />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input value="United States" disabled className="h-12 bg-muted" />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="venmo" className="space-y-4 mt-4">
            <div className="text-center py-8">
              {venmoNonce ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <SiVenmo className="h-8 w-8" />
                    <span className="font-medium">Venmo Connected</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your Venmo account is ready to use for payment.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setVenmoNonce(null)}
                    data-testid="button-disconnect-venmo"
                  >
                    Use Different Account
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <SiVenmo className="h-16 w-16 mx-auto text-[#3D95CE]" />
                  <p className="text-muted-foreground">
                    Pay securely with your Venmo account
                  </p>
                  <Button 
                    onClick={handleVenmoClick}
                    className="bg-[#3D95CE] hover:bg-[#2d85be]"
                    data-testid="button-connect-venmo"
                  >
                    <SiVenmo className="h-4 w-4 mr-2" />
                    Connect Venmo
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="paypal" className="space-y-4 mt-4">
            <div className="text-center py-8">
              {paypalNonce ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <SiPaypal className="h-8 w-8" />
                    <span className="font-medium">PayPal Connected</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your PayPal account is ready to use for payment.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setPaypalNonce(null)}
                    data-testid="button-disconnect-paypal"
                  >
                    Use Different Account
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <SiPaypal className="h-16 w-16 mx-auto text-[#003087]" />
                  <p className="text-muted-foreground">
                    Pay securely with your PayPal account
                  </p>
                  <Button 
                    onClick={handlePayPalClick}
                    className="bg-[#0070BA] hover:bg-[#005ea6]"
                    data-testid="button-connect-paypal"
                  >
                    <SiPaypal className="h-4 w-4 mr-2" />
                    Connect PayPal
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="ach" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
                <Building className="h-5 w-5 text-blue-600" />
                <span>Pay directly from your bank account (ACH)</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first-name-ach">First Name</Label>
                  <Input
                    id="first-name-ach"
                    placeholder="John"
                    value={bankAccount.firstName}
                    onChange={(e) => setBankAccount(prev => ({ ...prev, firstName: e.target.value }))}
                    data-testid="input-ach-first-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name-ach">Last Name</Label>
                  <Input
                    id="last-name-ach"
                    placeholder="Doe"
                    value={bankAccount.lastName}
                    onChange={(e) => setBankAccount(prev => ({ ...prev, lastName: e.target.value }))}
                    data-testid="input-ach-last-name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="routing-number">Routing Number</Label>
                <Input
                  id="routing-number"
                  placeholder="021000021"
                  value={bankAccount.routingNumber}
                  onChange={(e) => setBankAccount(prev => ({ ...prev, routingNumber: e.target.value.replace(/\D/g, '').slice(0, 9) }))}
                  data-testid="input-routing-number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-number">Account Number</Label>
                <Input
                  id="account-number"
                  placeholder="1234567890"
                  value={bankAccount.accountNumber}
                  onChange={(e) => setBankAccount(prev => ({ ...prev, accountNumber: e.target.value.replace(/\D/g, '') }))}
                  data-testid="input-account-number"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Account Type</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={bankAccount.accountType === 'checking' ? 'default' : 'outline'}
                      className="flex-1"
                      onClick={() => setBankAccount(prev => ({ ...prev, accountType: 'checking' }))}
                      data-testid="button-checking"
                    >
                      Checking
                    </Button>
                    <Button
                      type="button"
                      variant={bankAccount.accountType === 'savings' ? 'default' : 'outline'}
                      className="flex-1"
                      onClick={() => setBankAccount(prev => ({ ...prev, accountType: 'savings' }))}
                      data-testid="button-savings"
                    >
                      Savings
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Ownership</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={bankAccount.ownershipType === 'personal' ? 'default' : 'outline'}
                      className="flex-1"
                      onClick={() => setBankAccount(prev => ({ ...prev, ownershipType: 'personal' }))}
                      data-testid="button-personal"
                    >
                      Personal
                    </Button>
                    <Button
                      type="button"
                      variant={bankAccount.ownershipType === 'business' ? 'default' : 'outline'}
                      className="flex-1"
                      onClick={() => setBankAccount(prev => ({ ...prev, ownershipType: 'business' }))}
                      data-testid="button-business"
                    >
                      Business
                    </Button>
                  </div>
                </div>
              </div>

              {bankAccount.ownershipType === 'business' && (
                <div className="space-y-2">
                  <Label htmlFor="business-name-ach">Business Name</Label>
                  <Input
                    id="business-name-ach"
                    placeholder="Your Business LLC"
                    value={bankAccount.businessName}
                    onChange={(e) => setBankAccount(prev => ({ ...prev, businessName: e.target.value }))}
                    data-testid="input-business-name"
                  />
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                By providing your bank account details, you authorize us to debit the account for subscription payments.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {!isReady && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Loading payment options...</span>
          </div>
        )}
      </div>
    );
  }
);

BraintreePaymentMethods.displayName = "BraintreePaymentMethods";

export default BraintreePaymentMethods;
