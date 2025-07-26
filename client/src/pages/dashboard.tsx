import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Navbar from "@/components/navbar";
import PlayerForm from "@/components/player-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Edit, Trash2, Plus } from "lucide-react";
import { Player, Signup, FutsalSession, NotificationPreferences } from "@shared/schema";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  const { data: players = [], isLoading: playersLoading } = useQuery<Player[]>({
    queryKey: ["/api/players"],
    enabled: isAuthenticated,
  });

  const { data: signups = [], isLoading: signupsLoading } = useQuery<Array<Signup & { player: Player; session: FutsalSession }>>({
    queryKey: ["/api/signups"],
    enabled: isAuthenticated,
  });

  const { data: notificationPrefs, isLoading: prefsLoading } = useQuery<NotificationPreferences>({
    queryKey: ["/api/notification-preferences"],
    enabled: isAuthenticated,
  });

  const deletePlayerMutation = useMutation({
    mutationFn: async (playerId: string) => {
      await apiRequest("DELETE", `/api/players/${playerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      toast({
        title: "Success",
        description: "Player deleted successfully",
      });
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
        description: "Failed to delete player",
        variant: "destructive",
      });
    },
  });

  const cancelSignupMutation = useMutation({
    mutationFn: async (signupId: string) => {
      await apiRequest("DELETE", `/api/signups/${signupId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/signups"] });
      toast({
        title: "Success",
        description: "Reservation cancelled successfully",
      });
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
        description: "Failed to cancel reservation",
        variant: "destructive",
      });
    },
  });

  const updateNotificationsMutation = useMutation({
    mutationFn: async (preferences: { email: boolean; sms: boolean }) => {
      const response = await apiRequest("POST", "/api/notification-preferences", preferences);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-preferences"] });
      toast({
        title: "Success",
        description: "Notification preferences updated",
      });
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
        description: "Failed to update preferences",
        variant: "destructive",
      });
    },
  });

  if (isLoading || playersLoading || signupsLoading || prefsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const upcomingSignups = signups.filter(signup => 
    new Date(signup.session.startTime) > new Date()
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Parent Dashboard</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Player
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Player</DialogTitle>
              </DialogHeader>
              <PlayerForm onSuccess={() => setEditingPlayer(null)} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* My Players Section */}
          <Card>
            <CardHeader>
              <CardTitle>My Players</CardTitle>
            </CardHeader>
            <CardContent>
              {players.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No players added yet.</p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="mt-4">Add Your First Player</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Player</DialogTitle>
                      </DialogHeader>
                      <PlayerForm onSuccess={() => setEditingPlayer(null)} />
                    </DialogContent>
                  </Dialog>
                </div>
              ) : (
                <div className="space-y-4">
                  {players.map((player) => (
                    <div key={player.id} className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{player.firstName} {player.lastName}</h4>
                        <p className="text-gray-600">Born {player.birthYear} ({new Date().getFullYear() - player.birthYear} years old)</p>
                      </div>
                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setEditingPlayer(player)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Player</DialogTitle>
                            </DialogHeader>
                            <PlayerForm 
                              player={editingPlayer} 
                              onSuccess={() => setEditingPlayer(null)} 
                            />
                          </DialogContent>
                        </Dialog>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => deletePlayerMutation.mutate(player.id)}
                          disabled={deletePlayerMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Reservations Section */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Reservations</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingSignups.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No upcoming reservations.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingSignups.map((signup) => (
                    <div key={signup.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{signup.session.title}</h4>
                          <p className="text-gray-600">
                            {new Date(signup.session.startTime).toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-500">
                            {signup.player.firstName} {signup.player.lastName}
                          </p>
                        </div>
                        <Badge variant={signup.paid ? "default" : "secondary"}>
                          {signup.paid ? "Paid" : "Pending"}
                        </Badge>
                      </div>
                      <div className="flex space-x-2 mt-3">
                        {!signup.paid && (
                          <Button size="sm" asChild>
                            <a href={`/checkout/${signup.id}`}>Pay Now</a>
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => cancelSignupMutation.mutate(signup.id)}
                          disabled={cancelSignupMutation.isPending}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Notification Preferences */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch 
                id="email-notifications"
                checked={notificationPrefs?.email ?? true}
                onCheckedChange={(checked) => {
                  updateNotificationsMutation.mutate({
                    email: checked,
                    sms: notificationPrefs?.sms ?? false,
                  });
                }}
              />
              <Label htmlFor="email-notifications">Email reminders before sessions</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                id="sms-notifications"
                checked={notificationPrefs?.sms ?? false}
                onCheckedChange={(checked) => {
                  updateNotificationsMutation.mutate({
                    email: notificationPrefs?.email ?? true,
                    sms: checked,
                  });
                }}
              />
              <Label htmlFor="sms-notifications">SMS text reminders</Label>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
