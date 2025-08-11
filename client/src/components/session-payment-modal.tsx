import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, DollarSign, Calendar, MapPin, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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

export function SessionPaymentModal({ isOpen, onClose, session, player, signup }: SessionPaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const paymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      return await apiRequest('POST', `/api/session-billing/process-payment`, {
        signupId: signup.id,
        sessionId: session.id,
        playerId: player.id,
        amount: session.priceCents,
        paymentMethod: paymentData
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Payment successful!",
        description: `${player.firstName} has been enrolled in the session.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/signups'] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Payment failed",
        description: error.message || "Please try again or contact support.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsProcessing(false);
    },
  });

  const handlePayment = async () => {
    if (!cardNumber || !expiryMonth || !expiryYear || !cvv || !cardholderName) {
      toast({
        title: "Missing information",
        description: "Please fill in all payment details.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    // For demo purposes, simulate payment processing
    // In production, this would integrate with Stripe Elements or Braintree Drop-in UI
    await new Promise(resolve => setTimeout(resolve, 2000));

    paymentMutation.mutate({
      cardNumber,
      expiryMonth,
      expiryYear,
      cvv,
      cardholderName
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
            <div>
              <Label htmlFor="cardholderName">Cardholder Name</Label>
              <Input
                id="cardholderName"
                placeholder="John Doe"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                data-testid="input-cardholder-name"
              />
            </div>
            
            <div>
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                maxLength={19}
                data-testid="input-card-number"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="expiryMonth">MM</Label>
                <Input
                  id="expiryMonth"
                  placeholder="12"
                  value={expiryMonth}
                  onChange={(e) => setExpiryMonth(e.target.value)}
                  maxLength={2}
                  data-testid="input-expiry-month"
                />
              </div>
              <div>
                <Label htmlFor="expiryYear">YY</Label>
                <Input
                  id="expiryYear"
                  placeholder="28"
                  value={expiryYear}
                  onChange={(e) => setExpiryYear(e.target.value)}
                  maxLength={2}
                  data-testid="input-expiry-year"
                />
              </div>
              <div>
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  placeholder="123"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  maxLength={4}
                  data-testid="input-cvv"
                />
              </div>
            </div>
          </div>

          {/* Payment Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isProcessing}
              data-testid="button-cancel-payment"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              className="flex-1"
              disabled={isProcessing}
              data-testid="button-complete-payment"
            >
              {isProcessing ? "Processing..." : `Pay $${(session.priceCents / 100).toFixed(2)}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}