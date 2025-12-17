import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Player, FutsalSession } from "@shared/schema";
import { calculateAgeGroup } from "@shared/utils";
import { SessionPaymentModal } from "@/components/session-payment-modal";
import { CreditCard, DollarSign, CheckCircle, MapPin } from "lucide-react";

interface ReservationFormProps {
  sessionId: string;
  session: FutsalSession & { requirePayment?: boolean | null };
  preSelectedPlayerId?: string;
}

interface TenantSettings {
  requireOnlinePayment?: boolean;
}

export default function ReservationForm({ sessionId, session, preSelectedPlayerId }: ReservationFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [accessCode, setAccessCode] = useState<string>("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingSignup, setPendingSignup] = useState<any>(null);

  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  const { data: tenantSettings } = useQuery<TenantSettings>({
    queryKey: ["/api/tenant/settings"],
  });

  const isPaymentRequired = (): boolean => {
    if (session.requirePayment === true) return true;
    if (session.requirePayment === false) return false;
    return tenantSettings?.requireOnlinePayment !== false;
  };

  const paymentRequired = isPaymentRequired();

  useEffect(() => {
    if (preSelectedPlayerId && players.length > 0) {
      const player = players.find(p => p.id === preSelectedPlayerId);
      if (player) {
        const isEligible = (!session.genders || session.genders.includes(player.gender)) && 
                          (!session.ageGroups || session.ageGroups.includes(calculateAgeGroup(player.birthYear)));
        if (isEligible) {
          setSelectedPlayerId(preSelectedPlayerId);
        }
      }
    }
  }, [preSelectedPlayerId, players, session]);

  const createSignupMutation = useMutation({
    mutationFn: async (data: { playerId: string; sessionId: string; accessCode?: string; reserveOnly?: boolean }) => {
      const response = await apiRequest("POST", "/api/signups", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to reserve spot");
      }
      return response.json();
    },
    onSuccess: (signupData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/signups"] });
      
      if (paymentRequired) {
        const selectedPlayer = players.find(p => p.id === selectedPlayerId);
        setPendingSignup({
          ...signupData,
          player: selectedPlayer,
          session: session
        });
        setShowPaymentModal(true);
      } else {
        toast({
          title: "Spot Reserved!",
          description: "Your spot has been successfully booked. Payment can be completed on-site.",
        });
      }
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to reserve spot",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPlayerId) {
      toast({
        title: "Error",
        description: "Please select a player",
        variant: "destructive",
      });
      return;
    }

    const selectedPlayer = players.find(p => p.id === selectedPlayerId);
    if (!selectedPlayer) {
      toast({
        title: "Error",
        description: "Selected player not found",
        variant: "destructive",
      });
      return;
    }

    const isEligible = (!session.genders || session.genders.includes(selectedPlayer.gender)) && 
                      (!session.ageGroups || session.ageGroups.includes(calculateAgeGroup(selectedPlayer.birthYear)));

    if (!isEligible) {
      toast({
        title: "Error",
        description: `Player not eligible: requires ${session.genders?.join(', ') || 'Any Gender'} ${session.ageGroups?.join(', ') || 'Any Age'}`,
        variant: "destructive",
      });
      return;
    }

    if (session.hasAccessCode && !accessCode.trim()) {
      toast({
        title: "Error",
        description: "Access code is required for this session",
        variant: "destructive",
      });
      return;
    }

    createSignupMutation.mutate({
      playerId: selectedPlayerId,
      sessionId,
      reserveOnly: paymentRequired,
      ...(session.hasAccessCode && { accessCode: accessCode.trim().toUpperCase() })
    });
  };

  const handlePaymentClose = () => {
    setShowPaymentModal(false);
    setPendingSignup(null);
    queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
    queryClient.invalidateQueries({ queryKey: ["/api/signups"] });
  };

  const isPlayerEligible = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return false;
    return (!session.genders || session.genders.includes(player.gender)) && 
           (!session.ageGroups || session.ageGroups.includes(calculateAgeGroup(player.birthYear)));
  };

  if (players.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">You need to add a player first.</p>
        <Button asChild>
          <a href="/dashboard">Go to Dashboard</a>
        </Button>
      </div>
    );
  }

  const selectedPlayer = players.find(p => p.id === selectedPlayerId);

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="player">Select Player</Label>
          <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
            <SelectTrigger data-testid="select-player-trigger">
              <SelectValue placeholder="Choose a player" />
            </SelectTrigger>
            <SelectContent>
              {players.map((player) => {
                const playerAgeGroup = calculateAgeGroup(player.birthYear);
                const isEligible = (!session.genders || session.genders.includes(player.gender)) && 
                                  (!session.ageGroups || session.ageGroups.includes(playerAgeGroup));
                
                return (
                  <SelectItem 
                    key={player.id} 
                    value={player.id}
                    disabled={!isEligible}
                    className={!isEligible ? "text-muted-foreground cursor-not-allowed" : ""}
                    title={!isEligible ? `Not eligible: requires ${session.genders?.join(', ') || 'Any Gender'} ${session.ageGroups?.join(', ') || 'Any Age'}` : ""}
                    data-testid={`select-player-${player.id}`}
                  >
                    {player.firstName} {player.lastName} ({playerAgeGroup}) 
                    {!isEligible && " - Not Eligible"}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {session.hasAccessCode && (
          <div className="space-y-2">
            <Label htmlFor="accessCode">Access Code</Label>
            <Input
              id="accessCode"
              type="text"
              placeholder="Enter access code"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              maxLength={20}
              data-testid="input-access-code"
            />
            <p className="text-sm text-muted-foreground">
              This session requires an access code to book
            </p>
          </div>
        )}

        {paymentRequired ? (
          <div className="bg-card border border-border p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <h4 className="font-medium text-foreground">Payment Required</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Complete your payment immediately to secure your booking. You can pay with credit card, PayPal, or Venmo.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <DollarSign className="h-5 w-5 text-green-500" />
              <p className="text-lg font-semibold text-foreground">
                ${(session.priceCents / 100).toFixed(2)}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
              <h4 className="font-medium text-green-800 dark:text-green-200">Pay On-Site</h4>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300">
              No online payment required. Payment can be collected on-site or outside the application.
            </p>
            {session.priceCents > 0 && (
              <div className="flex items-center gap-2 mt-3">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                <p className="text-lg font-semibold text-green-800 dark:text-green-200">
                  ${(session.priceCents / 100).toFixed(2)} (due on-site)
                </p>
              </div>
            )}
          </div>
        )}

        <Button 
          type="submit" 
          className={`w-full ${!selectedPlayerId || !isPlayerEligible(selectedPlayerId) ? 
            'bg-muted text-muted-foreground cursor-not-allowed' : 
            'bg-green-600 hover:bg-green-700 text-white'}`}
          disabled={createSignupMutation.isPending || !selectedPlayerId || !isPlayerEligible(selectedPlayerId) || (session.hasAccessCode === true && !accessCode.trim())}
          data-testid="button-reserve-and-pay"
        >
          {createSignupMutation.isPending ? "Reserving..." : (paymentRequired ? "Reserve Spot & Pay" : "Reserve Spot")}
        </Button>
      </form>

      {pendingSignup && selectedPlayer && (
        <SessionPaymentModal
          isOpen={showPaymentModal}
          onClose={handlePaymentClose}
          session={{
            id: session.id,
            location: session.location || '',
            startTime: session.startTime instanceof Date ? session.startTime.toISOString() : String(session.startTime),
            ageGroup: session.ageGroups?.join(', ') || '',
            priceCents: session.priceCents,
            title: session.title || 'Session'
          }}
          player={{
            id: selectedPlayer.id,
            firstName: selectedPlayer.firstName,
            lastName: selectedPlayer.lastName
          }}
          signup={{
            id: pendingSignup.id,
            reservationExpiresAt: pendingSignup.reservationExpiresAt || new Date(Date.now() + 60 * 60 * 1000).toISOString()
          }}
        />
      )}
    </>
  );
}
