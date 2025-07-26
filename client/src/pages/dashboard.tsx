import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Navbar from "@/components/navbar";
import PlayerPortalControls from "@/components/player-portal-controls";
import PlayerForm from "@/components/player-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Edit, Trash2, Plus } from "lucide-react";
import { Player, Signup, FutsalSession, NotificationPreferences } from "@shared/schema";
import { calculateAgeGroup, isSessionEligibleForPlayer, isSessionBookingOpen, getSessionStatusColor, getSessionStatusText } from "@shared/utils";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // All useQuery hooks (always called in same order)
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

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<FutsalSession[]>({
    queryKey: ["/api/sessions"],
    enabled: isAuthenticated,
  });

  // All useMutation hooks (always called in same order)
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

  // useEffect hooks (always called in same order)
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

  // Early return after all hooks
  if (isLoading || playersLoading || signupsLoading || prefsLoading || sessionsLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const upcomingSignups = signups.filter(signup => 
    new Date(signup.session.startTime) > new Date()
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Parent Dashboard</h1>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Player
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-700">
              <DialogHeader>
                <DialogTitle className="text-white">Add New Player</DialogTitle>
              </DialogHeader>
              <PlayerForm onSuccess={() => {
                setIsAddDialogOpen(false);
                setEditingPlayer(null);
              }} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Players and their eligible sessions */}
        <div className="space-y-8">
          {players.length === 0 ? (
            <Card className="bg-zinc-900 border border-zinc-700">
              <CardContent className="text-center py-8">
                <p className="text-zinc-400 mb-4">No players added yet.</p>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">Add Your First Player</Button>
                  </DialogTrigger>
                  <DialogContent className="bg-zinc-900 border-zinc-700">
                    <DialogHeader>
                      <DialogTitle className="text-white">Add New Player</DialogTitle>
                    </DialogHeader>
                    <PlayerForm onSuccess={() => {
                      setIsAddDialogOpen(false);
                      setEditingPlayer(null);
                    }} />
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ) : (
            players.map((player) => {
              // Helper function to get eligible sessions for this player
              const eligibleSessions = sessions.filter(session => {
                const isEligible = isSessionEligibleForPlayer(session, player);
                const isBookingOpen = isSessionBookingOpen(session);
                return isEligible && isBookingOpen;
              });
              const playerAgeGroup = calculateAgeGroup(player.birthYear);
              
              return (
                <Card key={player.id} className="bg-zinc-900 border border-zinc-700">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-white text-xl">
                          {player.firstName} {player.lastName}
                        </CardTitle>
                        <p className="text-zinc-400">
                          {playerAgeGroup} • Born {player.birthYear} • {new Date().getFullYear() - player.birthYear} years old
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => {
                              setEditingPlayer(player);
                              setIsEditDialogOpen(true);
                            }}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-zinc-900 border-zinc-700">
                            <DialogHeader>
                              <DialogTitle className="text-white">Edit Player</DialogTitle>
                            </DialogHeader>
                            <PlayerForm 
                              player={editingPlayer} 
                              onSuccess={() => {
                                setIsEditDialogOpen(false);
                                setEditingPlayer(null);
                              }} 
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
                  </CardHeader>
                  <CardContent>
                    <h4 className="text-white font-medium mb-4">Available Sessions Today</h4>
                    {eligibleSessions.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-zinc-400">No eligible sessions available today.</p>
                        <p className="text-sm text-zinc-500 mt-1">
                          Sessions open at 8 AM on the day of training.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {eligibleSessions.map((session) => (
                          <div key={session.id} className="bg-zinc-800 border border-zinc-600 p-4 rounded-xl">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="text-lg font-semibold text-white">{session.title}</h3>
                                <p className="text-zinc-400">{session.location}</p>
                              </div>
                              <Badge className={getSessionStatusColor(session)}>
                                {getSessionStatusText(session)}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <p className="text-zinc-400 text-sm">
                                  {new Date(session.startTime).toLocaleTimeString([], { 
                                    hour: 'numeric', 
                                    minute: '2-digit' 
                                  })} - {new Date(session.endTime).toLocaleTimeString([], { 
                                    hour: 'numeric', 
                                    minute: '2-digit' 
                                  })}
                                </p>
                                <p className="text-zinc-400 text-sm">${(session.priceCents / 100).toFixed(2)}</p>
                              </div>
                              <Button 
                                onClick={() => createSignupMutation.mutate({ 
                                  playerId: player.id, 
                                  sessionId: session.id 
                                })}
                                disabled={createSignupMutation.isPending}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                {createSignupMutation.isPending ? "Reserving..." : "Reserve Spot"}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <PlayerPortalControls player={player} />
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mt-8">
          {/* Upcoming Reservations Section */}
          <Card className="bg-zinc-900 border border-zinc-700">
            <CardHeader>
              <CardTitle className="text-white">Upcoming Reservations</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingSignups.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-zinc-400">No upcoming reservations.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingSignups.map((signup) => (
                    <div key={signup.id} className="bg-zinc-800 border border-zinc-600 p-4 rounded-xl">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-white">{signup.session.title}</h4>
                          <p className="text-zinc-400">
                            {new Date(signup.session.startTime).toLocaleString()}
                          </p>
                          <p className="text-sm text-zinc-500">
                            {signup.player.firstName} {signup.player.lastName}
                          </p>
                        </div>
                        <Badge variant={signup.paid ? "default" : "secondary"} className={signup.paid ? "text-green-400" : "text-yellow-400"}>
                          {signup.paid ? "Paid" : "Pending"}
                        </Badge>
                      </div>
                      <div className="flex space-x-2 mt-3">
                        {!signup.paid && (
                          <Button size="sm" asChild className="bg-blue-600 hover:bg-blue-700">
                            <a href={`/checkout/${signup.id}`}>Pay Now</a>
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => cancelSignupMutation.mutate(signup.id)}
                          disabled={cancelSignupMutation.isPending}
                          className="border-zinc-600 text-zinc-400 hover:text-white"
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

          {/* Notification Preferences */}
          <Card className="bg-zinc-900 border border-zinc-700">
            <CardHeader>
              <CardTitle className="text-white">Notification Preferences</CardTitle>
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
                <Label htmlFor="email-notifications" className="text-white">Email reminders before sessions</Label>
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
                <Label htmlFor="sms-notifications" className="text-white">SMS text reminders</Label>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}