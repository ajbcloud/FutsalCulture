import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/navbar";
import ReservationForm from "@/components/reservation-form";
import LocationLink from "@/components/LocationLink";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, DollarSign, Users } from "lucide-react";
import { FutsalSession } from "@shared/schema";

export default function SessionDetail() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();

  const { data: sessionData, isLoading } = useQuery<FutsalSession & { signupsCount: number }>({
    queryKey: [`/api/sessions/${id}`],
    enabled: !!id,
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
    if (session.status === "full") {
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
                    <a href="/api/login">Login</a>
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
