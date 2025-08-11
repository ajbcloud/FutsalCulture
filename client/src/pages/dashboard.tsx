import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Navbar from "@/components/navbar";
import PlayerPortalControls from "@/components/player-portal-controls";
import PlayerForm from "@/components/player-form";
import SessionCard from "@/components/session-card";
import EnhancedSessionCard from "@/components/enhanced-session-card";
import WaitlistOffers from "@/components/waitlist-offers";
import { SessionPaymentModal } from "@/components/session-payment-modal";


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Edit, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";
import { Player, Signup, FutsalSession, NotificationPreferences } from "@shared/schema";
import { calculateAgeGroup, isSessionEligibleForPlayer, isSessionBookingOpen, getSessionStatusColor, getSessionStatusText } from "@shared/utils";
import { ReservationCountdown } from "@/components/reservation-countdown";
import { AGE_GROUPS } from "@shared/constants";

export default function Dashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [localReservedSessions, setLocalReservedSessions] = useState<Set<string>>(new Set());
  const [, setLocation] = useLocation();
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPaymentSession, setSelectedPaymentSession] = useState<{
    session: FutsalSession;
    player: Player;
    signup: any;
  } | null>(null);

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
    queryKey: ["/api/sessions", "includePast"],
    queryFn: async () => {
      const response = await fetch("/api/sessions?includePast=true");
      if (!response.ok) {
        throw new Error("Failed to fetch sessions");
      }
      return response.json();
    },
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const upcomingSignups = signups.filter(signup => 
    new Date(signup.session.startTime) > new Date()
  );



  // Filter today's sessions - only show sessions eligible for parent's players AND not yet started
  const todaySessions = sessions.filter(session => {
    const sessionDate = new Date(session.startTime);
    const now = new Date();
    const today = new Date();
    const isToday = sessionDate.toDateString() === today.toDateString();
    
    // Only show today's sessions
    if (!isToday) return false;
    
    // Only show sessions that haven't started yet
    if (sessionDate <= now) return false;
    
    // If parent has NO players, show nothing
    if (players.length === 0) {
      return false;
    }
    
    // If parent has players, only show sessions eligible for their players
    return players.some(player => isSessionEligibleForPlayer(session, player));
  });

  // Build set of session IDs that the user has already reserved today
  const reservedSessionIds = new Set(
    signups
      .filter(signup => {
        const sessionDate = new Date(signup.session.startTime);
        const today = new Date();
        return sessionDate.toDateString() === today.toDateString();
      })
      .map(signup => signup.sessionId)
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Welcome Section - Mobile First */}
      <section className="from-futsal-600 to-brand-600 text-foreground bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4 sm:text-3xl md:text-4xl">
              Welcome Back{user?.firstName ? `, ${user.firstName}` : ''}!
            </h1>
            <p className="text-base text-foreground sm:text-lg md:text-xl">
              Ready to book today's training sessions?
            </p>
          </div>
        </div>
      </section>


      {/* Waitlist Offers Section */}
      <section className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <WaitlistOffers />
      </section>

      {/* Today's Sessions - Mobile First */}
      <section className="py-6 bg-background sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2 mb-6 sm:flex-row sm:justify-between sm:items-center sm:mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Today's Sessions</h2>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base sm:mt-2">Available for booking at 8:00 AM</p>
            </div>
            <Button 
              variant="outline" 
              className="w-full sm:w-auto"
              onClick={() => {
                // View Full Schedule - always go without filters to show everything
                setLocation('/sessions');
              }}
            >
              View Full Schedule
            </Button>
          </div>

          {todaySessions.length === 0 ? (
            <div className="text-center py-12">
              {players.length === 0 ? (
                <>
                  <p className="text-muted-foreground text-lg">Add a player to see available sessions</p>
                  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="mt-4 bg-green-600 hover:bg-green-700">Add Your First Player</Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-border">
                      <DialogHeader>
                        <DialogTitle className="text-foreground">Add New Player</DialogTitle>
                      </DialogHeader>
                      <PlayerForm onSuccess={() => {
                        setIsAddDialogOpen(false);
                        setEditingPlayer(null);
                      }} />
                    </DialogContent>
                  </Dialog>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground text-lg">No eligible sessions scheduled for today.</p>
                  <Button 
                    className="mt-4"
                    onClick={() => {
                      // Build URL with filters based on players' eligibility
                      const playerAgeGroups = Array.from(new Set(players.map(player => calculateAgeGroup(player.birthYear))));
                      const playerGenders = Array.from(new Set(players.map(player => player.gender)));
                      
                      // For multiple players, pass all their age groups and genders as comma-separated values
                      const params = new URLSearchParams();
                      if (playerAgeGroups.length > 0) {
                        params.set('ages', playerAgeGroups.join(','));
                      }
                      if (playerGenders.length > 0) {
                        params.set('genders', playerGenders.join(','));
                      }
                      
                      // Add eligibleOnly flag to indicate this came from the eligible sessions button
                      params.set('eligibleOnly', 'true');
                      
                      const url = `/sessions${params.toString() ? `?${params.toString()}` : ''}`;
                      setLocation(url);
                    }}
                  >
                    View All Eligible Sessions
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0 lg:grid-cols-3 lg:gap-6">
              {todaySessions.map((session) => {
                // Find matching reservation/signup for this session
                const reservationSignup = signups.find(signup => 
                  signup.sessionId === session.id && 
                  !signup.paid && (
                    // Either has valid expiration time or no expiration (legacy reservations)
                    !signup.reservationExpiresAt || 
                    new Date(signup.reservationExpiresAt) > new Date()
                  )
                );



                return (
                  <EnhancedSessionCard 
                    key={session.id} 
                    session={session} 
                    isReserved={reservedSessionIds.has(session.id) || localReservedSessions.has(session.id)}
                    reservationSignup={reservationSignup}
                    onReservationChange={(sessionId, reserved) => {
                      if (reserved) {
                        setLocalReservedSessions(prev => new Set(Array.from(prev).concat(sessionId)));
                      } else {
                        setLocalReservedSessions(prev => {
                          const next = new Set(prev);
                          next.delete(sessionId);
                          return next;
                        });
                      }
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Player Management Section - Mobile First */}
      <section className="py-6 bg-background sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2 mb-6 sm:flex-row sm:justify-between sm:items-center sm:mb-8">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Your Players</h2>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-green-600 hover:bg-green-700 sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Player
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Add New Player</DialogTitle>
                </DialogHeader>
                <PlayerForm onSuccess={() => {
                  setIsAddDialogOpen(false);
                  setEditingPlayer(null);
                }} />
              </DialogContent>
            </Dialog>
          </div>

        {/* Player Management Cards */}
        <div className="space-y-6 sm:space-y-8">
          {players.length === 0 ? (
            <Card className="bg-card border border-border">
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground mb-4">No players added yet.</p>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">Add Your First Player</Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border">
                    <DialogHeader>
                      <DialogTitle className="text-foreground">Add New Player</DialogTitle>
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
              const playerAgeGroup = calculateAgeGroup(player.birthYear);
              
              // Get upcoming reservations for this specific player
              const playerUpcomingReservations = upcomingSignups.filter(signup => 
                signup.playerId === player.id
              );
              
              return (
                <Card key={player.id} className="bg-card border border-border">
                  <CardHeader>
                    <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center sm:gap-0">
                      <div>
                        <CardTitle className="text-foreground text-lg sm:text-xl">
                          {player.firstName} {player.lastName}
                        </CardTitle>
                        <p className="text-muted-foreground text-sm sm:text-base">
                          {playerAgeGroup} • Born {player.birthYear} • {new Date().getFullYear() - player.birthYear} years old • {player.gender}
                        </p>
                      </div>
                      <div className="flex space-x-2 self-start sm:self-center">
                        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              className="h-11 w-11 sm:h-8 sm:w-8" 
                              onClick={() => {
                                setEditingPlayer(player);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-card border-border">
                            <DialogHeader>
                              <DialogTitle className="text-foreground">Edit Player</DialogTitle>
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
                          className="h-11 w-11 sm:h-8 sm:w-8" 
                          onClick={() => deletePlayerMutation.mutate(player.id)}
                          disabled={deletePlayerMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Upcoming Reservations Section */}
                    <div className="mt-4">
                      <h4 className="text-lg font-semibold text-foreground mb-4">Upcoming Reservations</h4>
                      {playerUpcomingReservations.length > 0 ? (
                        <div className="space-y-3">
                          {playerUpcomingReservations.map(reservation => (
                            <div key={reservation.id} className="bg-muted border border-border rounded p-3">
                              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center sm:gap-0">
                                <div className="flex-1">
                                  <p className="font-medium text-foreground">{reservation.session.title}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {format(new Date(reservation.session.startTime), 'EEEE, MMMM d')} at {format(new Date(reservation.session.startTime), 'h:mm a')}
                                  </p>
                                  <p className="text-sm text-muted-foreground">{reservation.session.location}</p>
                                  
                                  {!reservation.paid && reservation.reservationExpiresAt && (
                                    <div className="mt-2">
                                      <ReservationCountdown 
                                        expiresAt={new Date(reservation.reservationExpiresAt).toISOString()}
                                        onExpired={() => {
                                          // Refresh signups when reservation expires
                                          queryClient.invalidateQueries({ queryKey: ['/api/signups'] });
                                        }}
                                      />
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-3">
                                  {reservation.paid && (
                                    <span className="px-2 py-1 rounded text-sm font-medium text-center sm:text-left bg-green-500 text-black">
                                      Paid
                                    </span>
                                  )}
                                  
                                  {!reservation.paid && (
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedPaymentSession({
                                          session: reservation.session,
                                          player: player,
                                          signup: reservation
                                        });
                                        setPaymentModalOpen(true);
                                      }}
                                      className="w-full bg-green-600 hover:bg-green-700 sm:w-auto"
                                      data-testid="button-pay-now"
                                    >
                                      Pay Now
                                    </Button>
                                  )}
                                  
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      cancelSignupMutation.mutate(reservation.id);
                                      // Update local state to re-enable reserve button
                                      setLocalReservedSessions(prev => {
                                        const next = new Set(prev);
                                        next.delete(reservation.sessionId);
                                        return next;
                                      });
                                    }}
                                    disabled={cancelSignupMutation.isPending}
                                    className="w-full border-red-600 text-red-400 hover:bg-red-600 hover:text-white sm:w-auto"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground italic">No upcoming reservations.</p>
                      )}
                    </div>
                    
                    <PlayerPortalControls player={player} />
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
        </div>
      </section>

      {/* Payment Modal */}
      {selectedPaymentSession && (
        <SessionPaymentModal
          isOpen={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setSelectedPaymentSession(null);
          }}
          session={{
            id: selectedPaymentSession.session.id,
            location: selectedPaymentSession.session.location,
            startTime: typeof selectedPaymentSession.session.startTime === 'string' 
              ? selectedPaymentSession.session.startTime 
              : selectedPaymentSession.session.startTime.toISOString(),
            ageGroup: selectedPaymentSession.session.ageGroups?.[0] || 'Unknown',
            priceCents: selectedPaymentSession.session.priceCents,
            title: selectedPaymentSession.session.title
          }}
          player={selectedPaymentSession.player}
          signup={selectedPaymentSession.signup}
        />
      )}

    </div>
  );
}