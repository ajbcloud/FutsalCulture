import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { FutsalSession } from "@shared/schema";
import { getSessionStatusColor, getSessionStatusText } from "@shared/utils";

interface EnhancedSessionCardProps {
  session: FutsalSession;
  isReserved: boolean;
  onReservationChange?: (sessionId: string, reserved: boolean) => void;
}

export default function EnhancedSessionCard({ 
  session, 
  isReserved,
  onReservationChange 
}: EnhancedSessionCardProps) {
  const { toast } = useToast();

  const createSignupMutation = useMutation({
    mutationFn: async (data: { playerId: string; sessionId: string }) => {
      return await apiRequest("POST", "/api/signups", data);
    },
    onSuccess: (signup) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/signups"] });
      onReservationChange?.(session.id, true);
      toast({
        title: "Success",
        description: "Spot reserved successfully!",
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
    // For now, we'll use the first available player
    // In a real app, you might want to show a player selection dialog
    const players = queryClient.getQueryData<Array<{ id: string; firstName: string; lastName: string }>>(["/api/players"]);
    const firstPlayer = players?.[0];
    if (!firstPlayer) {
      toast({
        title: "Error",
        description: "No players found. Please add a player first.",
        variant: "destructive",
      });
      return;
    }
    
    createSignupMutation.mutate({
      playerId: firstPlayer.id,
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
  const isDisabled = isReserved || isFull || createSignupMutation.isPending;

  const getButtonText = () => {
    if (createSignupMutation.isPending) return "Reserving...";
    if (isReserved) return "Reserved";
    if (isFull) return "Full";
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
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-white text-lg">{session.title}</CardTitle>
            <p className="text-zinc-400">{session.location}</p>
          </div>
          <Badge className={getSessionStatusColor(session)}>
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
            <span className="text-white">{session.ageGroup}</span>
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
            className={`w-full ${getButtonStyles()}`}
          >
            {getButtonText()}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}