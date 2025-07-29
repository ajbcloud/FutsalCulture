import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, DollarSign, ShoppingCart } from "lucide-react";
import { FutsalSession } from "@shared/schema";

interface SessionCardProps {
  session: FutsalSession;
  onAddToCart?: (session: FutsalSession) => void;
  showAddToCart?: boolean;
}

export default function SessionCard({ session, onAddToCart, showAddToCart = false }: SessionCardProps) {
  const { isAuthenticated } = useAuth();
  const { data: sessionData } = useQuery<FutsalSession & { signupsCount: number }>({
    queryKey: ["/api/sessions", session.id],
  });

  const signupsCount = sessionData?.signupsCount || 0;
  const fillPercentage = (signupsCount / session.capacity) * 100;
  
  const getStatusBadge = () => {
    if (session.status === "full" || fillPercentage >= 100) {
      return <Badge variant="destructive">Full</Badge>;
    }
    if (fillPercentage >= 80) {
      return <Badge className="bg-yellow-500">Filling Fast</Badge>;
    }
    return <Badge className="bg-green-500">Open</Badge>;
  };

  const getProgressBarColor = () => {
    if (fillPercentage >= 100) return "bg-red-500";
    if (fillPercentage >= 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  const isBookingOpen = () => {
    const now = new Date();
    const sessionDate = new Date(session.startTime);
    const bookingOpenTime = new Date(sessionDate);
    bookingOpenTime.setHours(8, 0, 0, 0);
    
    return now >= bookingOpenTime && session.status !== "full" && session.status !== "closed";
  };

  const isFull = session.status === "full" || fillPercentage >= 100;

  return (
    <Card className={`bg-card border border-border hover:shadow-md transition-shadow ${isFull ? 'opacity-75' : ''}`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-semibold text-foreground">{session.title}</h3>
            <p className="text-muted-foreground">
              {new Date(session.startTime).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} • {session.location}
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
        </div>

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
          
          <Button 
            asChild={!isFull && isBookingOpen() && isAuthenticated}
            disabled={isFull || !isBookingOpen()}
            className={`${showAddToCart ? 'flex-1' : 'w-full'} bg-blue-600 hover:bg-blue-700 text-white`}
            variant={isFull ? "secondary" : "default"}
            onClick={!isAuthenticated && isBookingOpen() && !isFull ? () => window.location.href = '/api/login' : undefined}
          >
            {isFull ? (
              <span>Session Full</span>
            ) : !isBookingOpen() ? (
              <span>Booking Opens at 8 AM</span>
            ) : !isAuthenticated ? (
              <span>Login to Book</span>
            ) : (
              <Link href={`/sessions/${session.id}`}>Reserve Spot</Link>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
