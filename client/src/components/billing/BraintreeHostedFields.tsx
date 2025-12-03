import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import * as braintree from "braintree-web";
import type { Client, HostedFields, HostedFieldsEvent, HostedFieldsStateObject } from "braintree-web";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CreditCard, Calendar, Lock, AlertCircle, MapPin, Hash } from "lucide-react";

export interface BillingAddress {
  streetAddress: string;
  locality?: string;
  region?: string;
  postalCode: string;
  countryCodeAlpha2?: string;
}

export interface BraintreeHostedFieldsRef {
  tokenize: (billingAddress?: BillingAddress) => Promise<{ nonce: string; cardType?: string; lastFour?: string }>;
  clear: () => void;
  getBillingAddress: () => BillingAddress;
}

interface BraintreeHostedFieldsProps {
  clientToken: string;
  onReady?: () => void;
  onError?: (error: Error) => void;
  onCardTypeChange?: (cardType: string) => void;
  onValidityChange?: (isValid: boolean) => void;
  className?: string;
  showBillingAddress?: boolean;
}

const BraintreeHostedFields = forwardRef<BraintreeHostedFieldsRef, BraintreeHostedFieldsProps>(
  ({ clientToken, onReady, onError, onCardTypeChange, onValidityChange, className, showBillingAddress = true }, ref) => {
    const [hostedFieldsInstance, setHostedFieldsInstance] = useState<braintree.HostedFields | null>(null);
    const hostedFieldsInstanceRef = useRef<braintree.HostedFields | null>(null);
    const [isReady, setIsReady] = useState(false);
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
    const [initError, setInitError] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const initializingRef = useRef(false);

    useEffect(() => {
      if (!clientToken || initializingRef.current) return;

      initializingRef.current = true;
      setInitError(null);

      braintree.client.create({
        authorization: clientToken,
      }).then((clientInstance) => {
        return braintree.hostedFields.create({
          client: clientInstance,
          styles: {
            "input": {
              "font-size": "16px",
              "font-family": "Inter, system-ui, sans-serif",
              "font-weight": "400",
              "color": "hsl(var(--foreground))",
              "line-height": "1.5",
            },
            "input.valid": {
              "color": "hsl(142.1 76.2% 36.3%)",
            },
            "input.invalid": {
              "color": "hsl(0 84.2% 60.2%)",
            },
            ":focus": {
              "color": "hsl(var(--foreground))",
            },
            "::placeholder": {
              "color": "hsl(var(--muted-foreground))",
            },
          },
          fields: {
            number: {
              container: "#card-number",
              placeholder: "4111 1111 1111 1111",
            },
            expirationDate: {
              container: "#expiration-date",
              placeholder: "MM/YY",
            },
            cvv: {
              container: "#cvv",
              placeholder: "123",
            },
            postalCode: {
              container: "#postal-code",
              placeholder: "12345",
            },
          },
        });
      }).then((instance) => {
        hostedFieldsInstanceRef.current = instance;
        setHostedFieldsInstance(instance);
        setIsReady(true);
        initializingRef.current = false;
        onReady?.();

        const hostedFieldsInstance = instance;

        hostedFieldsInstance.on("cardTypeChange", (event) => {
          if (event.cards.length === 1) {
            const type = event.cards[0].type;
            setCardType(type);
            onCardTypeChange?.(type);
          } else {
            setCardType("");
            onCardTypeChange?.("");
          }
        });

        hostedFieldsInstance.on("validityChange", (event) => {
          const field = event.emittedBy as keyof typeof fieldStates;
          setFieldStates((prev) => {
            const updated = {
              ...prev,
              [field]: {
                ...prev[field],
                isValid: event.fields[field].isValid,
                isEmpty: event.fields[field].isEmpty,
              },
            };
            const allValid = updated.number.isValid && 
                           updated.expirationDate.isValid && 
                           updated.cvv.isValid &&
                           updated.postalCode.isValid;
            onValidityChange?.(allValid);
            return updated;
          });
        });

        hostedFieldsInstance.on("focus", (event) => {
          const field = event.emittedBy as keyof typeof fieldStates;
          setFieldStates((prev) => ({
            ...prev,
            [field]: { ...prev[field], isFocused: true },
          }));
        });

        hostedFieldsInstance.on("blur", (event) => {
          const field = event.emittedBy as keyof typeof fieldStates;
          setFieldStates((prev) => ({
            ...prev,
            [field]: { ...prev[field], isFocused: false },
          }));
        });
      }).catch((err) => {
        console.error("Braintree Hosted Fields initialization error:", err);
        setInitError(err.message || "Failed to initialize payment form");
        initializingRef.current = false;
        onError?.(err);
      });

      return () => {
        if (hostedFieldsInstanceRef.current) {
          hostedFieldsInstanceRef.current.teardown();
          hostedFieldsInstanceRef.current = null;
        }
      };
    }, [clientToken]);

    useImperativeHandle(ref, () => ({
      tokenize: async (overrideBillingAddress?: BillingAddress) => {
        if (!hostedFieldsInstance) {
          throw new Error("Hosted Fields not initialized");
        }

        const addressToUse = overrideBillingAddress || billingAddress;
        
        if (!addressToUse.streetAddress) {
          throw new Error("Street address is required");
        }

        const tokenizeOptions: any = {
          billingAddress: {
            streetAddress: addressToUse.streetAddress,
            locality: addressToUse.locality || "",
            region: addressToUse.region || "",
            postalCode: addressToUse.postalCode || "",
            countryCodeAlpha2: addressToUse.countryCodeAlpha2 || "US",
          },
        };

        const { nonce, details } = await hostedFieldsInstance.tokenize(tokenizeOptions);
        return {
          nonce,
          cardType: (details as any)?.cardType,
          lastFour: (details as any)?.lastFour,
        };
      },
      clear: () => {
        if (hostedFieldsInstance) {
          hostedFieldsInstance.clear("number");
          hostedFieldsInstance.clear("expirationDate");
          hostedFieldsInstance.clear("cvv");
          hostedFieldsInstance.clear("postalCode");
        }
        setBillingAddress({
          streetAddress: "",
          locality: "",
          region: "",
          postalCode: "",
          countryCodeAlpha2: "US",
        });
      },
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
      <div ref={containerRef} className={cn("space-y-4", className)}>
        <div className="space-y-2">
          <Label htmlFor="card-number" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Card Number
            {cardType && (
              <span className="text-xs text-muted-foreground capitalize">
                ({cardType.replace("-", " ")})
              </span>
            )}
          </Label>
          <div
            id="card-number"
            className={getFieldClassName("number")}
            data-testid="input-card-number"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="expiration-date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Expiration Date
            </Label>
            <div
              id="expiration-date"
              className={getFieldClassName("expirationDate")}
              data-testid="input-expiration-date"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cvv" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              CVV
            </Label>
            <div
              id="cvv"
              className={getFieldClassName("cvv")}
              data-testid="input-cvv"
            />
          </div>
        </div>

        {showBillingAddress && (
          <>
            <div className="border-t pt-4 mt-4">
              <Label className="text-sm font-medium mb-3 block">Billing Address</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="street-address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Street Address
              </Label>
              <Input
                id="street-address"
                placeholder="123 Main St"
                value={billingAddress.streetAddress}
                onChange={(e) => setBillingAddress(prev => ({ ...prev, streetAddress: e.target.value }))}
                className="h-12"
                data-testid="input-street-address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="locality">City</Label>
                <Input
                  id="locality"
                  placeholder="Boston"
                  value={billingAddress.locality}
                  onChange={(e) => setBillingAddress(prev => ({ ...prev, locality: e.target.value }))}
                  className="h-12"
                  data-testid="input-city"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">State</Label>
                <Input
                  id="region"
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
                <Label htmlFor="postal-code" className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Postal Code
                </Label>
                <div
                  id="postal-code"
                  className={getFieldClassName("postalCode")}
                  data-testid="input-postal-code"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value="United States"
                  disabled
                  className="h-12 bg-muted"
                  data-testid="input-country"
                />
              </div>
            </div>
          </>
        )}

        {!isReady && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Loading payment form...</span>
          </div>
        )}
      </div>
    );
  }
);

BraintreeHostedFields.displayName = "BraintreeHostedFields";

export default BraintreeHostedFields;
