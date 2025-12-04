import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/navbar";
import ReservationForm from "@/components/reservation-form";
import LocationLink from "@/components/LocationLink";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, DollarSign, Users, UserPlus, UserMinus } from "lucide-react";
import { FutsalSession } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function SessionDetail() {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sessionData, isLoading } = useQuery<FutsalSession & { signupsCount: number }>({
    queryKey: [`/api/sessions/${id}`],
    enabled: !!id,
  });

  // Fetch user's players
  const { data: players } = useQuery({
    queryKey: ["/api/players"],
    enabled: isAuthenticated,
  });

  // Fetch waitlist for this session (admin only)
  const { data: waitlistData } = useQuery({
    queryKey: [`/api/sessions/${id}/waitlist`],
    enabled: isAuthenticated && !!id && (user?.isAdmin || user?.isAssistant),
  });

  // Fetch user's waitlist entries
  const { data: waitlistEntries } = useQuery({
    queryKey: ["/api/waitlists"],
    enabled: !!isAuthenticated,
  });

  // Waitlist mutations
  const joinWaitlistMutation = useMutation({
    mutationFn: async ({ sessionId, playerId, notifyOnJoin = true, notifyOnPositionChange = false }: {
      sessionId: string;
      playerId: string;
      notifyOnJoin?: boolean;
      notifyOnPositionChange?: boolean;
    }) => {
      return apiRequest("POST", `/api/sessions/${sessionId}/waitlist/join`, { playerId, notifyOnJoin, notifyOnPositionChange });
    },
    onSuccess: async (response) => {
      const data = await response.json();
      queryClient.invalidateQueries({ queryKey: ["/api/waitlists"] });
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${id}/waitlist`] });
      toast({
        title: "Added to Waitlist",
        description: `Position ${data.position} on the waitlist`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to join waitlist",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const leaveWaitlistMutation = useMutation({
    mutationFn: async ({ sessionId, playerId }: { sessionId: string; playerId: string }) => {
      return apiRequest("DELETE", `/api/sessions/${sessionId}/waitlist/leave`, { playerId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/waitlists"] });
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${id}/waitlist`] });
      toast({
        title: "Left Waitlist",
        description: "Successfully removed from the waitlist",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to leave waitlist",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Fetch admin settings to get location address data
  const { data: adminSettings } = useQuery({
    queryKey: ['/api/admin/settings'],
    queryFn: () => fetch('/api/admin/settings').then(res => res.json())
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Session Not Found</h1>
          <p className="text-muted-foreground">The session you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const session = sessionData;
  const fillPercentage = (session.signupsCount / session.capacity) * 100;
  const isFull = session.status === "full" || fillPercentage >= 100;

  // Check if any of the user's players are on the waitlist for this session
  const getPlayerWaitlistStatus = (playerId: string) => {
    if (!waitlistEntries) return null;
    return waitlistEntries.find((entry: any) => 
      entry.sessionId === session.id && entry.playerId === playerId && entry.status === 'active'
    );
  };

  const hasAnyPlayerOnWaitlist = players?.some((player: any) => 
    getPlayerWaitlistStatus(player.id)
  );

  // Find matching location from admin settings to get address data
  const getLocationData = (locationName: string) => {
    if (!adminSettings?.availableLocations) return { name: locationName };
    
    const matchedLocation = adminSettings.availableLocations.find((loc: any) => {
      const locName = typeof loc === 'object' ? loc.name : loc;
      return locName === locationName;
    });
    
    if (matchedLocation && typeof matchedLocation === 'object') {
      return {
        name: matchedLocation.name,
        address: [matchedLocation.addressLine1, matchedLocation.addressLine2, matchedLocation.city, matchedLocation.state, matchedLocation.postalCode]
          .filter(Boolean)
          .join(', ')
      };
    }
    
    return { name: locationName };
  };
  
  const getStatusBadge = () => {
    if (session.status === "full" || fillPercentage >= 100) {
      if (session.waitlistEnabled) {
        return <Badge variant="destructive">Full - Waitlist Available</Badge>;
      }
      return <Badge variant="destructive">Full</Badge>;
    }
    if (fillPercentage >= 80) {
      return <Badge className="bg-yellow-500">Filling Fast</Badge>;
    }
    return <Badge className="bg-green-500">Open</Badge>;
  };

  const isBookingOpen = () => {
    const now = new Date();
    const sessionDate = new Date(session.startTime);
    const bookingOpenTime = new Date(sessionDate);
    bookingOpenTime.setHours(8, 0, 0, 0);
    
    return now >= bookingOpenTime && session.status !== "full" && session.status !== "closed";
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Session Details */}
          <Card className="bg-card border border-border">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl text-foreground">{session.title}</CardTitle>
                  <p className="text-muted-foreground mt-1">{session.ageGroups?.join(', ') || 'All Ages'}</p>
                </div>
                {getStatusBadge()}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center text-muted-foreground">
                <Clock className="w-5 h-5 mr-3" />
                <span>
                  {new Date(session.startTime).toLocaleString()} - {new Date(session.endTime).toLocaleTimeString()}
                </span>
              </div>
              
              <div className="flex items-center text-muted-foreground">
                <MapPin className="w-5 h-5 mr-3" />
                {(() => {
                  const locationData = getLocationData(session.locationName || session.location);
                  return (
                    <LocationLink 
                      name={locationData.name}
                      address={locationData.address}
                      className="text-muted-foreground"
                    />
                  );
                })()}
              </div>
              
              <div className="flex items-center text-muted-foreground">
                <DollarSign className="w-5 h-5 mr-3" />
                <span>${(session.priceCents / 100).toFixed(2)}</span>
              </div>
              
              <div className="flex items-center text-muted-foreground">
                <Users className="w-5 h-5 mr-3" />
                <span>{session.signupsCount} of {session.capacity} spots filled</span>
              </div>

              {/* Capacity Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Capacity</span>
                  <span className="text-muted-foreground">{session.signupsCount}/{session.capacity}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      fillPercentage >= 100 ? 'bg-red-500' : 
                      fillPercentage >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(fillPercentage, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reservation Form */}
          <Card className="bg-card border border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Reserve Your Spot</CardTitle>
            </CardHeader>
            <CardContent>
              {!isAuthenticated ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Please log in to make a reservation.</p>
                  <Button asChild>
                    <a href="/login">Login</a>
                  </Button>
                </div>
              ) : !isBookingOpen() ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    {session.status === "full" ? "This session is full." : 
                     session.status === "closed" ? "This session is closed." :
                     "Booking opens at 8:00 AM on session day."}
                  </p>
                </div>
              ) : isFull && session.waitlistEnabled ? (
                // Waitlist interface when session is full
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Session Waitlist</h3>
                  
                  {/* Current waitlist status */}
                  {hasAnyPlayerOnWaitlist ? (
                    <div className="p-4 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg">
                      <h4 className="font-medium text-orange-700 dark:text-orange-300 mb-2">You're on the waitlist</h4>
                      {players?.map((player: any) => {
                        const waitlistStatus = getPlayerWaitlistStatus(player.id);
                        if (!waitlistStatus) return null;
                        return (
                          <div key={player.id} className="text-sm text-orange-600 dark:text-orange-400">
                            {player.firstName} - Position #{waitlistStatus.position}
                          </div>
                        );
                      })}
                      <Button
                        variant="outline"
                        className="mt-3 border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-950"
                        onClick={() => {
                          players?.forEach((player: any) => {
                            const waitlistStatus = getPlayerWaitlistStatus(player.id);
                            if (waitlistStatus) {
                              leaveWaitlistMutation.mutate({
                                sessionId: session.id,
                                playerId: player.id,
                              });
                            }
                          });
                        }}
                        disabled={leaveWaitlistMutation.isPending}
                      >
                        <UserMinus className="w-4 h-4 mr-2" />
                        Leave Waitlist
                      </Button>
                    </div>
                  ) : (
                    // Join waitlist interface
                    <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">Join the Waitlist</h4>
                      <p className="text-sm text-blue-600 dark:text-blue-400 mb-4">
                        This session is full, but you can join the waitlist. You'll be notified if a spot becomes available.
                      </p>
                      
                      {players && players.length > 0 ? (
                        <div className="space-y-2">
                          {players.map((player: any) => (
                            <Button
                              key={player.id}
                              variant="outline"
                              className="w-full justify-start border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-950"
                              onClick={() => {
                                joinWaitlistMutation.mutate({
                                  sessionId: session.id,
                                  playerId: player.id,
                                });
                              }}
                              disabled={joinWaitlistMutation.isPending}
                            >
                              <UserPlus className="w-4 h-4 mr-2" />
                              Join waitlist for {player.firstName}
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No players found. Please add a player to join the waitlist.</p>
                      )}
                    </div>
                  )}
                  
                  {/* Admin waitlist management */}
                  {(user?.isAdmin || user?.isAssistant) && waitlistData && waitlistData.length > 0 && (
                    <div className="p-4 bg-muted border border-border rounded-lg">
                      <h4 className="font-medium text-foreground mb-3">Waitlist Management</h4>
                      <div className="space-y-2">
                        {waitlistData.map((entry: any, index: number) => (
                          <div key={entry.id} className="flex items-center justify-between p-3 bg-background border border-border rounded">
                            <div>
                              <span className="font-medium">{entry.player.firstName} {entry.player.lastName}</span>
                              <span className="text-sm text-muted-foreground ml-2">
                                Position #{entry.position}
                              </span>
                              {entry.status === 'offered' && (
                                <Badge variant="secondary" className="ml-2">Offer Sent</Badge>
                              )}
                            </div>
                            {entry.status === 'active' && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  // Implement promote functionality
                                }}
                              >
                                Promote
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <ReservationForm 
                  sessionId={session.id} 
                  session={session}
                  preSelectedPlayerId={new URLSearchParams(window.location.search).get('playerId') || undefined}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
