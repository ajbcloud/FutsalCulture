import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Player, FutsalSession } from "@shared/schema";
import { calculateAgeGroup } from "@shared/utils";
import VenmoPrompt from "@/components/venmo-prompt";

interface ReservationFormProps {
  sessionId: string;
  session: FutsalSession;
  preSelectedPlayerId?: string;
}

export default function ReservationForm({ sessionId, session, preSelectedPlayerId }: ReservationFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [venmoData, setVenmoData] = useState<any>(null);
  const [showVenmoPrompt, setShowVenmoPrompt] = useState(false);

  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  // Set pre-selected player if provided via URL
  useEffect(() => {
    if (preSelectedPlayerId && players.length > 0) {
      const player = players.find(p => p.id === preSelectedPlayerId);
      if (player) {
        const isEligible = player.gender === session.gender && 
                          calculateAgeGroup(player.birthYear) === session.ageGroup;
        if (isEligible) {
          setSelectedPlayerId(preSelectedPlayerId);
        }
      }
    }
  }, [preSelectedPlayerId, players, session]);

  const createSignupMutation = useMutation({
    mutationFn: async (data: { playerId: string; sessionId: string }) => {
      const response = await apiRequest("POST", "/api/signups", data);
      return response.json();
    },
    onSuccess: (signupData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/signups"] });
      
      // Show Venmo prompt with reservation details
      setVenmoData(signupData);
      setShowVenmoPrompt(true);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
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

    // Verify player eligibility
    const selectedPlayer = players.find(p => p.id === selectedPlayerId);
    if (!selectedPlayer) {
      toast({
        title: "Error",
        description: "Selected player not found",
        variant: "destructive",
      });
      return;
    }

    const isEligible = selectedPlayer.gender === session.gender && 
                      calculateAgeGroup(selectedPlayer.birthYear) === session.ageGroup;

    if (!isEligible) {
      toast({
        title: "Error",
        description: `Player not eligible: requires ${session.gender} ${session.ageGroup}`,
        variant: "destructive",
      });
      return;
    }

    createSignupMutation.mutate({
      playerId: selectedPlayerId,
      sessionId,
    });
  };

  const isPlayerEligible = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return false;
    return player.gender === session.gender && 
           calculateAgeGroup(player.birthYear) === session.ageGroup;
  };

  if (players.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 mb-4">You need to add a player first.</p>
        <Button asChild>
          <a href="/dashboard">Go to Dashboard</a>
        </Button>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="player">Select Player</Label>
          <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a player" />
            </SelectTrigger>
            <SelectContent>
              {players.map((player) => {
                const playerAgeGroup = calculateAgeGroup(player.birthYear);
                const isEligible = player.gender === session.gender && 
                                  playerAgeGroup === session.ageGroup;
                
                return (
                  <SelectItem 
                    key={player.id} 
                    value={player.id}
                    disabled={!isEligible}
                    className={!isEligible ? "text-zinc-600 cursor-not-allowed" : ""}
                    title={!isEligible ? `Not eligible: requires ${session.gender} ${session.ageGroup}` : ""}
                  >
                    {player.firstName} {player.lastName} ({playerAgeGroup}) 
                    {!isEligible && " - Not Eligible"}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Reserve & Pay via Venmo</h4>
          <p className="text-sm text-gray-600">
            Your spot will be reserved immediately. Complete payment via Venmo within 1 hour to secure your booking.
          </p>
          <p className="text-lg font-semibold text-futsal-600 mt-2">$10.00</p>
        </div>

        <Button 
          type="submit" 
          className={`w-full ${!selectedPlayerId || !isPlayerEligible(selectedPlayerId) ? 
            'bg-zinc-700 text-zinc-400 cursor-not-allowed' : 
            'bg-green-600 hover:bg-green-700'}`}
          disabled={createSignupMutation.isPending || !selectedPlayerId || !isPlayerEligible(selectedPlayerId)}
        >
          {createSignupMutation.isPending ? "Reserving..." : "Reserve Spot & Pay"}
        </Button>
      </form>

      <VenmoPrompt
        isOpen={showVenmoPrompt}
        onClose={() => setShowVenmoPrompt(false)}
        signupData={venmoData}
      />
    </>
  );
}
