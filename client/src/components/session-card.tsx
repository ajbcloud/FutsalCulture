import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, DollarSign, ShoppingCart, Users, UserPlus, UserMinus, Building2 } from "lucide-react";
import { FutsalSession } from "@shared/schema";
import LocationLink from "@/components/LocationLink";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatVenueDisplay } from "@shared/constants";

interface SessionCardProps {
  session: FutsalSession;
  onAddToCart?: (session: FutsalSession) => void;
  showAddToCart?: boolean;
}

export default function SessionCard({ session, onAddToCart, showAddToCart = false }: SessionCardProps) {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: sessionData } = useQuery<FutsalSession & { signupsCount: number }>({
    queryKey: ["/api/sessions", session.id],
  });

  // Fetch user's players
  const { data: players } = useQuery({
    queryKey: ["/api/players"],
    enabled: isAuthenticated,
  });

  // Fetch user's waitlist entries
  const { data: waitlistEntries } = useQuery({
    queryKey: ["/api/waitlists"],
    enabled: isAuthenticated,
  });

  // Fetch waitlist count for this session (for admin visibility)
  const { data: waitlistCount } = useQuery({
    queryKey: ["/api/admin/sessions", session.id, "waitlist-count"],
    enabled: Boolean(isAuthenticated && user?.isAdmin),
  });

  // Fetch waitlist entries for this session (for admin click-through)
  const { data: sessionWaitlist } = useQuery({
    queryKey: ["/api/admin/sessions", session.id, "waitlist"],
    enabled: Boolean(isAuthenticated && user?.isAdmin),
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
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/waitlists"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", session.id] });
      toast({
        title: "Added to Waitlist",
        description: `You're position ${data?.position || 'unknown'} on the waitlist`,
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
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", session.id] });
      toast({
        title: "Left Waitlist",
        description: "You have been removed from the waitlist",
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

  // Fetch tenant settings to get location address data
  const { data: adminSettings } = useQuery({
    queryKey: ['/api/tenant/settings'],
    queryFn: () => fetch('/api/tenant/settings').then(res => res.json())
  });

  const signupsCount = sessionData?.signupsCount || 0;
  const fillPercentage = (signupsCount / session.capacity) * 100;
  
  // Check if any of the user's players are on the waitlist for this session
  const getPlayerWaitlistStatus = (playerId: string) => {
    if (!Array.isArray(waitlistEntries)) return null;
    return waitlistEntries.find((entry: any) => 
      entry.sessionId === session.id && entry.playerId === playerId && entry.status === 'active'
    );
  };

  const hasAnyPlayerOnWaitlist = Array.isArray(players) ? players.some((player: any) => 
    getPlayerWaitlistStatus(player.id)
  ) : false;
  
  const getStatusBadge = () => {
    if (session.status === "full" || fillPercentage >= 100) {
      if (session.waitlistEnabled) {
        return <Badge variant="destructive">Full - Waitlist Available</Badge>;
      }
      return <Badge variant="destructive">Full</Badge>;
    }
    if (fillPercentage >= 80) {
      return <Badge className="bg-yellow-600 text-white dark:text-yellow-950">Filling Fast</Badge>;
    }
    return <Badge className="bg-green-600 text-green-950">Open</Badge>;
  };

  const getProgressBarColor = () => {
    if (fillPercentage >= 100) return "bg-destructive";
    if (fillPercentage >= 80) return "bg-yellow-600";
    return "bg-green-600";
  };

  const isBookingOpen = () => {
    const now = new Date();
    const sessionDate = new Date(session.startTime);
    
    // Check if session has already started or is closed/full
    if (now >= sessionDate || session.status === "full" || session.status === "closed") {
      return false;
    }
    
    // If no time constraints, can book anytime before session starts
    if (session.noTimeConstraints) {
      return true;
    }
    
    // If has days before booking constraint
    if (session.daysBeforeBooking) {
      const daysBeforeMs = session.daysBeforeBooking * 24 * 60 * 60 * 1000;
      const bookingOpenTime = new Date(sessionDate.getTime() - daysBeforeMs);
      return now >= bookingOpenTime;
    }
    
    // Default: use booking open hour/minute (8 AM rule)
    const bookingHour = session.bookingOpenHour ?? 8;
    const bookingMinute = session.bookingOpenMinute ?? 0;
    const bookingOpenTime = new Date(sessionDate);
    bookingOpenTime.setHours(bookingHour, bookingMinute, 0, 0);
    
    return now >= bookingOpenTime;
  };

  const isFull = session.status === "full" || fillPercentage >= 100;

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

  return (
    <Card className={`bg-card border border-border hover:shadow-md transition-shadow ${isFull ? 'opacity-75' : ''}`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-semibold text-foreground">{session.title}</h3>
            <p className="text-muted-foreground">
              {new Date(session.startTime).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} • <LocationLink 
                name={getLocationData(session.locationName || session.location).name}
                address={getLocationData(session.locationName || session.location).address}
                className="text-muted-foreground"
              />
            </p>
          </div>
          {getStatusBadge()}
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-muted-foreground">
            <Clock className="w-4 h-4 mr-2" />
            <span>
              {new Date(session.startTime).toLocaleTimeString([], { 
                hour: 'numeric', 
                minute: '2-digit' 
              })} - {new Date(session.endTime).toLocaleTimeString([], { 
                hour: 'numeric', 
                minute: '2-digit' 
              })}
            </span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <MapPin className="w-4 h-4 mr-2" />
            <span>{session.ageGroups?.join(', ') || 'All Ages'} • {session.genders?.join(', ') || 'All Genders'}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <DollarSign className="w-4 h-4 mr-2" />
            <span>${(session.priceCents / 100).toFixed(2)}</span>
          </div>
          {(session.venueType || session.venueDetail) && (
            <div className="flex items-center text-muted-foreground">
              <Building2 className="w-4 h-4 mr-2" />
              <span>{formatVenueDisplay(session.venueType, session.venueDetail)}</span>
            </div>
          )}
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Capacity</span>
            <span>{signupsCount} of {session.capacity} spots filled</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${getProgressBarColor()}`}
              style={{ width: `${Math.min(fillPercentage, 100)}%` }}
            />
          </div>
          
          {/* Admin waitlist visibility */}
          {user?.isAdmin && session.waitlistEnabled && typeof waitlistCount === 'number' && waitlistCount > 0 && (
            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <Link href={`/admin/sessions/${session.id}/waitlist`}>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start p-0 h-auto text-blue-700 dark:text-blue-300 hover:bg-transparent"
                  data-testid={`button-view-waitlist-${session.id}`}
                >
                  <Users className="w-4 h-4 mr-2" />
                  <span className="font-medium">
                    {waitlistCount} {waitlistCount === 1 ? 'person' : 'people'} on waitlist
                  </span>
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Waitlist status display */}
        {hasAnyPlayerOnWaitlist && (
          <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg">
            <div className="flex items-center text-orange-700 dark:text-orange-300">
              <Users className="w-4 h-4 mr-2" />
              <span className="font-medium">On Waitlist</span>
            </div>
            {Array.isArray(players) ? players.map((player: any) => {
              const waitlistStatus = getPlayerWaitlistStatus(player.id);
              if (!waitlistStatus) return null;
              return (
                <div key={player.id} className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                  {player.firstName} - Position #{waitlistStatus.position}
                </div>
              );
            }) : null}
          </div>
        )}

        <div className="flex space-x-2">
          {showAddToCart && onAddToCart && isBookingOpen() && !isFull && (
            <Button 
              variant="outline" 
              onClick={() => onAddToCart(session)}
              className="flex-1 border-border text-muted-foreground hover:text-foreground"
            >
              <ShoppingCart className="w-4 h-4 mr-1" />
              Add to Cart
            </Button>
          )}
          
          {/* Main booking/waitlist button */}
          <Button 
            asChild={!isFull && isBookingOpen() && isAuthenticated}
            disabled={isFull || !isBookingOpen()}
            className={`${showAddToCart ? 'flex-1' : 'w-full'} bg-blue-600 hover:bg-blue-700 text-white`}
            variant={isFull ? "secondary" : "default"}
            onClick={!isAuthenticated && isBookingOpen() && !isFull ? () => window.location.href = '/login' : undefined}
          >
            {isFull ? (
              session.waitlistEnabled ? (
                <Link href={`/sessions/${session.id}`}>View Waitlist</Link>
              ) : (
                <span>Session Full</span>
              )
            ) : !isBookingOpen() ? (
              <span>Booking Opens at 8 AM</span>
            ) : !isAuthenticated ? (
              <span>Login to Book</span>
            ) : (
              <Link href={`/sessions/${session.id}`}>Reserve Spot</Link>
            )}
          </Button>

          {/* Waitlist controls for when session is full */}
          {isFull && session.waitlistEnabled && isAuthenticated && Array.isArray(players) && !hasAnyPlayerOnWaitlist && (
            <Button
              variant="outline"
              className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-950"
              onClick={() => {
                // For simplicity, join with the first player
                if (Array.isArray(players) && players.length > 0) {
                  joinWaitlistMutation.mutate({
                    sessionId: session.id,
                    playerId: players[0].id,
                  });
                }
              }}
              disabled={joinWaitlistMutation.isPending}
            >
              <UserPlus className="w-4 h-4 mr-1" />
              Join Waitlist
            </Button>
          )}

          {/* Leave waitlist button */}
          {hasAnyPlayerOnWaitlist && (
            <Button
              variant="outline"
              className="flex-1 border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-950"
              onClick={() => {
                // Leave waitlist for all players on this session
                if (Array.isArray(players)) {
                  players.forEach((player: any) => {
                    const waitlistStatus = getPlayerWaitlistStatus(player.id);
                    if (waitlistStatus) {
                      leaveWaitlistMutation.mutate({
                        sessionId: session.id,
                        playerId: player.id,
                      });
                    }
                  });
                }
              }}
              disabled={leaveWaitlistMutation.isPending}
            >
              <UserMinus className="w-4 h-4 mr-1" />
              Leave Waitlist
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
