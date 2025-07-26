import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/navbar";
import ReservationForm from "@/components/reservation-form";
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Session Not Found</h1>
          <p className="text-gray-600">The session you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const session = sessionData;
  const fillPercentage = (session.signupsCount / session.capacity) * 100;
  
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
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Session Details */}
          <Card className="bg-zinc-900 border border-zinc-700">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl text-white">{session.title}</CardTitle>
                  <p className="text-zinc-400 mt-1">{session.ageGroup}</p>
                </div>
                {getStatusBadge()}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center text-zinc-400">
                <Clock className="w-5 h-5 mr-3" />
                <span>
                  {new Date(session.startTime).toLocaleString()} - {new Date(session.endTime).toLocaleTimeString()}
                </span>
              </div>
              
              <div className="flex items-center text-zinc-400">
                <MapPin className="w-5 h-5 mr-3" />
                <span>{session.location}</span>
              </div>
              
              <div className="flex items-center text-zinc-400">
                <DollarSign className="w-5 h-5 mr-3" />
                <span>${(session.priceCents / 100).toFixed(2)}</span>
              </div>
              
              <div className="flex items-center text-zinc-400">
                <Users className="w-5 h-5 mr-3" />
                <span>{session.signupsCount} of {session.capacity} spots filled</span>
              </div>

              {/* Capacity Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Capacity</span>
                  <span>{session.signupsCount}/{session.capacity}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
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
          <Card>
            <CardHeader>
              <CardTitle>Reserve Your Spot</CardTitle>
            </CardHeader>
            <CardContent>
              {!isAuthenticated ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">Please log in to make a reservation.</p>
                  <Button asChild>
                    <a href="/api/login">Login</a>
                  </Button>
                </div>
              ) : !isBookingOpen() ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">
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
