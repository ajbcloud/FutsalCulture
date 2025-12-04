import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import * as braintree from "braintree-web";
import type { Client, HostedFields, HostedFieldsEvent, HostedFieldsStateObject } from "braintree-web";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CreditCard, Calendar, Lock, AlertCircle, MapPin, Home } from "lucide-react";

export interface BraintreeHostedFieldsRef {
  tokenize: () => Promise<{ nonce: string; cardType?: string; lastFour?: string }>;
  clear: () => void;
}

interface BraintreeHostedFieldsProps {
  clientToken: string;
  onReady?: () => void;
  onError?: (error: Error) => void;
  onCardTypeChange?: (cardType: string) => void;
  onValidityChange?: (isValid: boolean) => void;
  className?: string;
}

const BraintreeHostedFields = forwardRef<BraintreeHostedFieldsRef, BraintreeHostedFieldsProps>(
  ({ clientToken, onReady, onError, onCardTypeChange, onValidityChange, className }, ref) => {
    const [hostedFieldsInstance, setHostedFieldsInstance] = useState<braintree.HostedFields | null>(null);
    const hostedFieldsInstanceRef = useRef<braintree.HostedFields | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [cardType, setCardType] = useState<string>("");
    const [fieldStates, setFieldStates] = useState({
      number: { isValid: false, isEmpty: true, isFocused: false },
      expirationDate: { isValid: false, isEmpty: true, isFocused: false },
      cvv: { isValid: false, isEmpty: true, isFocused: false },
      postalCode: { isValid: false, isEmpty: true, isFocused: false },
      streetAddress: { isValid: false, isEmpty: true, isFocused: false },
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
            streetAddress: {
              container: "#street-address",
              placeholder: "123 Main St",
            },
          } as any,
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
          const fields = event.fields as any;
          setFieldStates((prev) => {
            const updated = {
              ...prev,
              [field]: {
                ...prev[field],
                isValid: fields[field]?.isValid ?? false,
                isEmpty: fields[field]?.isEmpty ?? true,
              },
            };
            const allValid = updated.number.isValid && 
                           updated.expirationDate.isValid && 
                           updated.cvv.isValid &&
                           updated.postalCode.isValid &&
                           updated.streetAddress.isValid;
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
      tokenize: async () => {
        if (!hostedFieldsInstance) {
          throw new Error("Hosted Fields not initialized");
        }

        const { nonce, details } = await hostedFieldsInstance.tokenize();
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
          hostedFieldsInstance.clear("streetAddress");
        }
      },
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

        <div className="space-y-2">
          <Label htmlFor="street-address" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Billing Address
          </Label>
          <div
            id="street-address"
            className={getFieldClassName("streetAddress")}
            data-testid="input-street-address"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="postal-code" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Postal Code
          </Label>
          <div
            id="postal-code"
            className={getFieldClassName("postalCode")}
            data-testid="input-postal-code"
          />
        </div>

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
