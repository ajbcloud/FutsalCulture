import { useState, useEffect } from "react";
import { useParams, useSearch, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Navbar from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, MapPin, DollarSign, AlertCircle, CheckCircle, Users } from "lucide-react";
import { format } from "date-fns";
import { FutsalSession, Player, Waitlist } from "@shared/schema";

interface WaitlistOffer extends Waitlist {
  session: FutsalSession;
  player: Player;
}

export default function SessionPayment() {
  const { id: sessionId } = useParams();
  const searchParams = new URLSearchParams(useSearch());
  const offerId = searchParams.get('offerId');
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [paymentComplete, setPaymentComplete] = useState(false);

  // Fetch all offers and find the one we need
  const { data: offers } = useQuery<WaitlistOffer[]>({
    queryKey: ["/api/player/offers"],
    enabled: !!offerId && isAuthenticated,
  });
  
  const offer = offers?.find((o: WaitlistOffer) => o.id === offerId);
  const offerLoading = !offers;
  const offerError = offerId && offers && !offer ? new Error("Offer not found or expired") : null;

  // Payment mutation
  const processPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!offerId) throw new Error("No offer ID");
      
      // In a real implementation, this would integrate with Braintree or another payment processor
      // For now, we'll simulate the payment process
      return await apiRequest("POST", `/api/signups`, {
        playerId: offer?.playerId,
        sessionId: offer?.sessionId,
        fromWaitlistOffer: true,
        offerId: offerId,
      });
    },
    onSuccess: () => {
      setPaymentComplete(true);
      queryClient.invalidateQueries({ queryKey: ["/api/player/offers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/signups"] });
      toast({
        title: "Payment Successful!",
        description: "Your spot has been confirmed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Payment Failed",
        description: error.message || "There was an error processing your payment.",
        variant: "destructive",
      });
    },
  });

  // Timer effect for payment window
  useEffect(() => {
    if (!offer?.offerExpiresAt) return;

    const updateTimer = () => {
      const now = new Date();
      const expires = new Date(offer.offerExpiresAt!);
      const timeLeft = expires.getTime() - now.getTime();
      
      if (timeLeft <= 0) {
        setTimeLeft("Expired");
        return;
      }

      const minutes = Math.floor(timeLeft / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
      
      if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [offer?.offerExpiresAt]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to complete your payment.",
        variant: "destructive",
      });
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation, toast]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!offerId) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No offer ID provided. Please use the link from your waitlist notification.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (offerLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-8 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (offerError || !offer) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {offerError?.message || "Offer not found or has expired."}
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={() => setLocation("/dashboard")}>
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (paymentComplete) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-green-400">Payment Successful!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-muted-foreground">
                Your spot has been confirmed for <strong>{offer.session.title}</strong>
              </p>
              <div className="bg-background/60 border border-green-500/30 rounded-lg p-4 space-y-2">
                <p><strong>Player:</strong> {offer.player.firstName} {offer.player.lastName}</p>
                <p><strong>Session:</strong> {format(new Date(offer.session.startTime), 'MMM d, yyyy • h:mm a')}</p>
                <p><strong>Location:</strong> {offer.session.locationName || offer.session.location}</p>
                <p><strong>Amount:</strong> ${(offer.session.priceCents / 100).toFixed(2)}</p>
              </div>
              <div className="space-y-2">
                <Button className="w-full" onClick={() => setLocation("/dashboard")}>
                  Return to Dashboard
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setLocation("/sessions")}>
                  View All Sessions
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isExpired = timeLeft === "Expired";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Complete Your Payment</h1>
            <p className="text-muted-foreground">
              You've been promoted from the waitlist! Complete your payment to secure your spot.
            </p>
          </div>

          {/* Timer Alert */}
          {!isExpired ? (
            <Alert className="bg-amber-500/10 border-amber-500/20">
              <Clock className="h-4 w-4 text-amber-400" />
              <AlertDescription className="text-amber-300">
                <strong>Time remaining:</strong> {timeLeft}
                <br />
                Complete your payment before this timer expires or your spot will be offered to the next person.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your payment window has expired. This offer is no longer valid.
              </AlertDescription>
            </Alert>
          )}

          {/* Session Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Session Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {offer.session.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    <strong>Player:</strong> {offer.player.firstName} {offer.player.lastName}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{format(new Date(offer.session.startTime), 'MMM d, yyyy • h:mm a')}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{offer.session.locationName || offer.session.location}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span>${(offer.session.priceCents / 100).toFixed(2)}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-muted-foreground">Age Groups:</span>
                    <span>{offer.session.ageGroups?.join(', ') || 'All Ages'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Section */}
          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg">Total Amount:</span>
                    <span className="text-2xl font-bold text-primary">
                      ${(offer.session.priceCents / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
                  size="lg"
                  onClick={() => processPaymentMutation.mutate()}
                  disabled={processPaymentMutation.isPending || isExpired}
                  data-testid="button-complete-payment"
                >
                  {processPaymentMutation.isPending ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Complete Payment
                    </>
                  )}
                </Button>
                
                <p className="text-xs text-muted-foreground text-center">
                  In a production environment, this would integrate with Braintree for secure payment processing.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}