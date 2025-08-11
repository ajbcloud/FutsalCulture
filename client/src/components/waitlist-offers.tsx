import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Clock, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { Waitlist, FutsalSession, Player } from "@shared/schema";

interface WaitlistOffer extends Waitlist {
  session: FutsalSession;
  player: Player;
}

export default function WaitlistOffers() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data: offers = [], isLoading } = useQuery<WaitlistOffer[]>({
    queryKey: ["/api/player/offers"],
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refetch every 30 seconds to check for new offers
  });

  const acceptOfferMutation = useMutation({
    mutationFn: async (offerId: string): Promise<{ paymentUrl: string }> => {
      const response = await apiRequest("POST", `/api/player/offers/${offerId}/accept`);
      return response.json();
    },
    onSuccess: (data: { paymentUrl: string }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/player/offers"] });
      toast({
        title: "Offer Accepted",
        description: "You have 5 minutes to complete payment. Redirecting to payment...",
      });
      // Redirect to payment page
      window.location.href = data.paymentUrl;
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to accept offer",
        variant: "destructive",
      });
    },
  });

  const cancelOfferMutation = useMutation({
    mutationFn: async (offerId: string) => {
      return await apiRequest("POST", `/api/player/offers/${offerId}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/player/offers"] });
      toast({
        title: "Offer Declined",
        description: "You have declined the waitlist offer.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to decline offer",
        variant: "destructive",
      });
    },
  });

  if (!isAuthenticated || isLoading) {
    return null;
  }

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const timeLeft = expires.getTime() - now.getTime();
    
    if (timeLeft <= 0) {
      return "Expired";
    }

    const minutes = Math.floor(timeLeft / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const isOfferExpired = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    return expires.getTime() - now.getTime() <= 0;
  };

  // Filter out offers that have been expired for more than 30 seconds
  const activeOffers = offers.filter(offer => {
    if (!offer.offerExpiresAt) return true;
    const now = new Date();
    const expires = new Date(offer.offerExpiresAt.toString());
    const timeSinceExpired = now.getTime() - expires.getTime();
    return timeSinceExpired < 30000; // Remove after 30 seconds of being expired
  });

  if (activeOffers.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-amber-700 dark:text-amber-400">
          <AlertCircle className="w-5 h-5" />
          <span>Waitlist Offers</span>
          <Badge variant="secondary" className="bg-amber-500/20 text-amber-700 dark:text-amber-300">
            {activeOffers.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeOffers.map((offer) => {
          const expired = offer.offerExpiresAt ? isOfferExpired(offer.offerExpiresAt.toString()) : false;
          
          return (
          <div
            key={offer.id}
            className="bg-background/60 border border-amber-500/30 rounded-lg p-4 space-y-3"
            data-testid={`offer-card-${offer.id}`}
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h4 className="font-medium text-foreground">
                  {offer.session.title}
                </h4>
                <p className="text-sm text-muted-foreground">
                  Player: {offer.player.firstName} {offer.player.lastName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(offer.session.startTime), 'MMM d, yyyy • h:mm a')}
                </p>
                <p className="text-sm text-muted-foreground">
                  Location: {offer.session.locationName || offer.session.location}
                </p>
                <p className="text-sm text-muted-foreground">
                  Price: ${(offer.session.priceCents / 100).toFixed(2)}
                </p>
              </div>
              
              <div className="text-right space-y-1">
                <Badge 
                  variant="outline" 
                  className={expired 
                    ? "border-red-500 text-red-700 dark:text-red-400 bg-red-500/10" 
                    : "border-amber-500 text-amber-700 dark:text-amber-400 bg-amber-500/10"
                  }
                >
                  <Clock className="w-3 h-3 mr-1" />
                  {offer.offerExpiresAt ? getTimeRemaining(offer.offerExpiresAt.toString()) : "No limit"}
                </Badge>
              </div>
            </div>

            {!expired && (
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => acceptOfferMutation.mutate(offer.id)}
                  disabled={acceptOfferMutation.isPending || cancelOfferMutation.isPending}
                  data-testid={`button-accept-${offer.id}`}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Accept & Pay
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-zinc-600 text-zinc-400 hover:text-white"
                  onClick={() => cancelOfferMutation.mutate(offer.id)}
                  disabled={acceptOfferMutation.isPending || cancelOfferMutation.isPending}
                  data-testid={`button-decline-${offer.id}`}
                >
                  Decline
                </Button>
              </div>
            )}

            {expired && (
              <div className="text-center p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                  This offer has expired and is no longer available.
                </p>
              </div>
            )}

            {!expired && (
              <div className="text-xs text-muted-foreground bg-amber-500/5 p-2 rounded border border-amber-500/20">
                <strong>Important:</strong> You have until {offer.offerExpiresAt ? format(new Date(offer.offerExpiresAt.toString()), 'h:mm a') : 'unlimited time'} to accept this offer. 
                After accepting, you'll have 5 minutes to complete payment.
              </div>
            )}
          </div>
          );
        })}
      </CardContent>
    </Card>
  );
}