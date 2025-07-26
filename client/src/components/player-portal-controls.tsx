import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageSquare, UserCheck } from "lucide-react";
import { Player } from "@shared/schema";

interface PlayerPortalControlsProps {
  player: Player;
}

export default function PlayerPortalControls({ player }: PlayerPortalControlsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isInviting, setIsInviting] = useState(false);

  // Calculate player age
  const currentYear = new Date().getFullYear();
  const playerAge = currentYear - player.birthYear;
  const isEligible = playerAge >= 13;

  const updateSettingsMutation = useMutation({
    mutationFn: async ({ setting, value }: { setting: string; value: boolean }) => {
      const response = await apiRequest("PATCH", `/api/players/${player.id}/settings`, {
        [setting]: value
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      toast({
        title: "Settings updated",
        description: "Player portal settings have been saved",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const sendInviteMutation = useMutation({
    mutationFn: async (method: 'email' | 'sms') => {
      const response = await apiRequest("POST", `/api/players/${player.id}/invite`, {
        method
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      toast({
        title: "Invite sent",
        description: `Player invite sent via ${data.method}`,
      });
      setIsInviting(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send invite",
        variant: "destructive",
      });
      setIsInviting(false);
    },
  });

  if (!isEligible) {
    return (
      <div className="mt-3 p-3 bg-zinc-800 border border-zinc-700 rounded-lg">
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-zinc-400">
            Age {playerAge}
          </Badge>
          <span className="text-sm text-zinc-400">
            Player portal access available at age 13+
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 p-4 bg-zinc-800 border border-zinc-700 rounded-lg space-y-4">
      <div className="flex items-center space-x-2 mb-3">
        <Badge className="bg-green-600">
          Age {playerAge} - Portal Eligible
        </Badge>
        {player.userAccountCreated && (
          <Badge variant="outline" className="border-green-600 text-green-400">
            <UserCheck className="w-3 h-3 mr-1" />
            Account Active
          </Badge>
        )}
      </div>

      {/* Portal Access Toggle */}
      <div className="flex justify-between items-center">
        <Label htmlFor={`portal-${player.id}`} className="text-white text-sm">
          Allow player to access portal
        </Label>
        <Switch
          id={`portal-${player.id}`}
          checked={player.canAccessPortal || false}
          onCheckedChange={(value) =>
            updateSettingsMutation.mutate({ setting: 'canAccessPortal', value })
          }
          disabled={updateSettingsMutation.isPending}
        />
      </div>

      {/* Booking & Payment Toggle */}
      <div className="flex justify-between items-center">
        <Label htmlFor={`booking-${player.id}`} className="text-white text-sm">
          Allow player to book and pay for sessions
        </Label>
        <Switch
          id={`booking-${player.id}`}
          checked={player.canBookAndPay || false}
          onCheckedChange={(value) =>
            updateSettingsMutation.mutate({ setting: 'canBookAndPay', value })
          }
          disabled={updateSettingsMutation.isPending}
        />
      </div>

      {/* Invite Section */}
      <div className="pt-2 border-t border-zinc-600">
        <div className="text-sm text-zinc-400 mb-2">Send account invite:</div>
        
        {player.invitedAt && (
          <div className="text-xs text-zinc-500 mb-2">
            Last invited {new Date(player.invitedAt).toLocaleDateString()} via {player.inviteSentVia}
          </div>
        )}
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => sendInviteMutation.mutate('email')}
            disabled={sendInviteMutation.isPending || !player.email}
            className="border-zinc-600 text-zinc-400 hover:text-white"
          >
            <Mail className="w-4 h-4 mr-1" />
            Email
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => sendInviteMutation.mutate('sms')}
            disabled={sendInviteMutation.isPending || !player.phoneNumber}
            className="border-zinc-600 text-zinc-400 hover:text-white"
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            SMS
          </Button>
        </div>
        
        {(!player.email && !player.phoneNumber) && (
          <div className="text-xs text-amber-400 mt-2">
            Add player email or phone number to send invites
          </div>
        )}
      </div>
    </div>
  );
}