import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Player } from "@shared/schema";

interface ReservationFormProps {
  sessionId: string;
}

export default function ReservationForm({ sessionId }: ReservationFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");

  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  const createSignupMutation = useMutation({
    mutationFn: async (data: { playerId: string; sessionId: string }) => {
      const response = await apiRequest("POST", "/api/signups", data);
      return response.json();
    },
    onSuccess: (signup) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/signups"] });
      toast({
        title: "Success",
        description: "Spot reserved! Complete payment to confirm.",
      });
      // Redirect to checkout
      window.location.href = `/checkout/${signup.id}`;
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

    createSignupMutation.mutate({
      playerId: selectedPlayerId,
      sessionId,
    });
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="player">Select Player</Label>
        <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a player" />
          </SelectTrigger>
          <SelectContent>
            {players.map((player) => (
              <SelectItem key={player.id} value={player.id}>
                {player.firstName} {player.lastName} (Born {player.birthYear})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Payment Information</h4>
        <p className="text-sm text-gray-600">
          You'll be redirected to secure payment processing after reservation.
        </p>
        <p className="text-lg font-semibold text-futsal-600 mt-2">$10.00</p>
      </div>

      <Button 
        type="submit" 
        className="w-full"
        disabled={createSignupMutation.isPending || !selectedPlayerId}
      >
        {createSignupMutation.isPending ? "Reserving..." : "Reserve Spot & Pay"}
      </Button>
    </form>
  );
}
