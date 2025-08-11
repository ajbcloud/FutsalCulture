import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { FutsalSession, Signup, Player } from "@shared/schema";
import { getSessionStatusColor, getSessionStatusText, isSessionBookingOpen, calculateAgeGroup } from "@shared/utils";
import VenmoPrompt from "./venmo-prompt";
import { ReservationCountdown } from "./reservation-countdown";
import { SessionPaymentModal } from "./session-payment-modal";

interface EnhancedSessionCardProps {
  session: FutsalSession;
  isReserved: boolean;
  reservationSignup?: Signup & { player: Player };
  onReservationChange?: (sessionId: string, reserved: boolean) => void;
}

export default function EnhancedSessionCard({ 
  session, 
  isReserved,
  reservationSignup,
  onReservationChange 
}: EnhancedSessionCardProps) {
  const { toast } = useToast();
  const [venmoData, setVenmoData] = useState<any>(null);
  const [showVenmoPrompt, setShowVenmoPrompt] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const cancelSignupMutation = useMutation({
    mutationFn: async (signupId: string) => {
      await apiRequest("DELETE", `/api/signups/${signupId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/signups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      onReservationChange?.(session.id, false);
      toast({
        title: "Success",
        description: "Reservation cancelled successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel reservation",
        variant: "destructive",
      });
    },
  });

  const createReservationMutation = useMutation({
    mutationFn: async (data: { playerId: string; sessionId: string }) => {
      const response = await apiRequest("POST", "/api/signups", {
        ...data,
        reserveOnly: true // Create temporary reservation, not confirmed signup
      });
      return await response.json();
    },
    onSuccess: (reservationData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/signups"] });
      onReservationChange?.(session.id, true);
      
      toast({
        title: "Spot Reserved!",
        description: `You have 1 hour to complete payment for ${reservationData.player?.firstName || 'your player'}.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reserve spot",
        variant: "destructive",
      });
    },
  });

  const handleReserveSpot = () => {
    const players = queryClient.getQueryData<Array<{ id: string; firstName: string; lastName: string; birthYear: number; gender: string }>>(["/api/players"]);
    
    if (!players || players.length === 0) {
      toast({
        title: "Error",
        description: "No players found. Please add a player first.",
        variant: "destructive",
      });
      return;
    }
    
    // Find the first eligible player for this session
    const eligiblePlayers = players.filter(player => {
      const playerAgeGroup = calculateAgeGroup(player.birthYear);
      const ageMatch = session.ageGroups?.includes(playerAgeGroup);
      const genderMatch = session.genders?.includes(player.gender) || session.genders?.includes('mixed');
      return ageMatch && genderMatch;
    });
    
    if (eligiblePlayers.length === 0) {
      toast({
        title: "Error", 
        description: "No eligible players found for this session.",
        variant: "destructive",
      });
      return;
    }
    
    // Use the first eligible player
    const selectedPlayer = eligiblePlayers[0];
    
    createReservationMutation.mutate({
      playerId: selectedPlayer.id,
      sessionId: session.id
    });
  };

  // Calculate spots and color indicators
  const filled = session.signupsCount ?? 0;
  const total = session.capacity;
  const fillRatio = filled / total;
  const isFull = filled >= total;

  const getSpotCountColor = () => {
    if (fillRatio >= 1) return "text-red-500";
    if (fillRatio >= 0.7) return "text-yellow-400";
    return "text-green-400";
  };

  const getProgressBarColor = () => {
    if (fillRatio >= 1) return "bg-red-500";
    if (fillRatio >= 0.7) return "bg-yellow-400";
    return "bg-green-400";
  };
  const isBookingOpen = isSessionBookingOpen(session);
  const isDisabled = isReserved || isFull || createReservationMutation.isPending || !isBookingOpen;

  // Check if this reservation has a pending payment
  const hasPendingPayment = reservationSignup && !reservationSignup.paid;
  const reservationExpires = reservationSignup?.reservationExpiresAt ? new Date(reservationSignup.reservationExpiresAt) : null;

  const getButtonText = () => {
    if (createReservationMutation.isPending) return "Reserving...";
    if (isReserved) return "Reserved";
    if (isFull) return "Full";
    if (!isBookingOpen) {
      const sessionDate = new Date(session.startTime);
      const now = new Date();
      if (sessionDate <= now) return "Session Ended";
      const isToday = sessionDate.toDateString() === now.toDateString();
      if (isToday) return "Opens at 8:00 AM";
      return "Not Yet Available";
    }
    return "Reserve Spot";
  };

  const getButtonStyles = () => {
    if (isDisabled) {
      return "bg-zinc-700 text-zinc-400 cursor-not-allowed hover:bg-zinc-700";
    }
    return "bg-blue-600 hover:bg-blue-700 text-white";
  };

  return (
    <Card className="bg-zinc-900 border border-zinc-700">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start sm:gap-0">
          <div className="flex-1">
            <CardTitle className="text-white text-lg">{session.title}</CardTitle>
            <p className="text-zinc-400 text-sm">
              {format(new Date(session.startTime), 'EEEE, MMM d')} • {session.location}
            </p>
          </div>
          <Badge className={`${getSessionStatusColor(session)} self-start`}>
            {getSessionStatusText(session)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-zinc-400">Time:</span>
            <span className="text-white">
              {format(new Date(session.startTime), 'h:mm a')} - {format(new Date(session.endTime), 'h:mm a')}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-zinc-400">Age Group:</span>
            <span className="text-white">{session.ageGroups?.join(', ') || 'All Ages'}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-zinc-400">Price:</span>
            <span className="text-white">${(session.priceCents / 100).toFixed(2)}</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-400">Spots:</span>
              <span className={`font-medium ${getSpotCountColor()}`}>
                {filled}/{total} filled
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor()}`}
                style={{ width: `${Math.min(fillRatio, 1) * 100}%` }}
              />
            </div>
          </div>
          
          <Button
            onClick={handleReserveSpot}
            disabled={isDisabled}
            className={`w-full h-12 sm:h-auto ${getButtonStyles()}`}
            data-testid="button-reserve-spot"
          >
            {getButtonText()}
          </Button>

          {/* Pending Payment Section */}
          {hasPendingPayment && reservationSignup && (
            <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200">
                    Pending Payment
                  </Badge>
                </div>
                {reservationExpires && (
                  <ReservationCountdown
                    expiresAt={reservationExpires.toISOString()}
                    onExpired={() => {
                      queryClient.invalidateQueries({ queryKey: ["/api/signups"] });
                      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
                      onReservationChange?.(session.id, false);
                    }}
                  />
                )}
                {!reservationExpires && reservationSignup.reservationExpiresAt && (
                  <ReservationCountdown
                    expiresAt={new Date(reservationSignup.reservationExpiresAt).toISOString()}
                    onExpired={() => {
                      queryClient.invalidateQueries({ queryKey: ["/api/signups"] });
                      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
                      onReservationChange?.(session.id, false);
                    }}
                  />
                )}
              </div>
              
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Complete your payment for <strong>{reservationSignup.player?.firstName || 'the player'}</strong> to confirm the spot.
              </p>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => setPaymentModalOpen(true)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  data-testid="button-pay-now"
                >
                  Pay Now
                </Button>
                <Button
                  onClick={() => cancelSignupMutation.mutate(reservationSignup.id)}
                  disabled={cancelSignupMutation.isPending}
                  variant="outline"
                  className="flex-1 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  data-testid="button-cancel-reservation"
                >
                  {cancelSignupMutation.isPending ? "Cancelling..." : "Cancel"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      <VenmoPrompt
        isOpen={showVenmoPrompt}
        onClose={() => setShowVenmoPrompt(false)}
        signupData={venmoData}
      />

      {/* Payment Modal */}
      {paymentModalOpen && reservationSignup && (
        <SessionPaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          session={{
            id: session.id,
            location: session.location,
            startTime: new Date(session.startTime).toISOString(),
            ageGroup: session.ageGroups?.join(', ') || 'All Ages',
            priceCents: session.priceCents,
            title: session.title
          }}
          player={reservationSignup.player}
          signup={{
            id: reservationSignup.id,
            reservationExpiresAt: reservationSignup.reservationExpiresAt?.toISOString() || ""
          }}
        />
      )}
    </Card>
  );
}