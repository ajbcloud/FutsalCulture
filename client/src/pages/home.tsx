import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navbar from "@/components/navbar";
import SessionCard from "@/components/session-card";
import SessionCalendar from "@/components/session-calendar";
import { Button } from "@/components/ui/button";
import { FutsalSession } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

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

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<FutsalSession[]>({
    queryKey: ["/api/sessions"],
    enabled: isAuthenticated,
  });

  if (isLoading || sessionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Show all currently bookable sessions, not just today's
  const availableSessions = sessions.filter(session => {
    const now = new Date();
    const sessionDate = new Date(session.startTime);
    
    // Don't show past sessions
    if (sessionDate < now) return false;
    
    // Don't show full or closed sessions
    if (session.status === "full" || session.status === "closed") return false;
    
    // Check booking availability based on constraints
    if (session.noTimeConstraints) {
      // Can book anytime - show it
      return true;
    }
    
    if (session.daysBeforeBooking) {
      // Days before booking constraint
      const daysBeforeMs = session.daysBeforeBooking * 24 * 60 * 60 * 1000;
      const bookingOpenTime = new Date(sessionDate.getTime() - daysBeforeMs);
      return now >= bookingOpenTime;
    }
    
    // Default 8 AM rule - only show if it's today and after 8 AM
    const today = new Date();
    const isToday = sessionDate.toDateString() === today.toDateString();
    if (!isToday) return false;
    
    const bookingHour = session.bookingOpenHour ?? 8;
    const bookingMinute = session.bookingOpenMinute ?? 0;
    const bookingOpenTime = new Date(sessionDate);
    bookingOpenTime.setHours(bookingHour, bookingMinute, 0, 0);
    
    return now >= bookingOpenTime;
  }).slice(0, 6); // Limit to 6 sessions to avoid overwhelming the UI

  return (
    <div className="min-h-screen bg-[#18181b]">
      <Navbar />
      {/* Welcome Section */}
      <section className="from-futsal-600 to-brand-600 text-white bg-[#18181b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Welcome Back!</h1>
            <p className="text-lg md:text-xl text-foreground">
              Ready to book your training sessions?
            </p>
          </div>
        </div>
      </section>
      {/* Quick Actions */}
      <section className="py-8 bg-[#18181b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/dashboard">My Dashboard</Link>
            </Button>

            <Button 
              variant="outline" 
              size="lg"
              onClick={() => {
                const calendarSection = document.getElementById('calendar');
                if (calendarSection) {
                  calendarSection.scrollIntoView({ behavior: 'smooth' });
                } else {
                  // Navigate to calendar page using proper routing
                  setLocation('/calendar');
                }
              }}
            >
              View Full Schedule
            </Button>
          </div>
        </div>
      </section>
      {/* Available Sessions */}
      <section className="py-8 bg-[#18181b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold bg-[#ffffff00] text-[#ffffff]">Available Sessions</h2>
              <p className="text-gray-600 mt-2">Sessions you can book right now</p>
            </div>
          </div>

          {availableSessions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No sessions available for booking at this time.</p>
              <Button asChild className="mt-4">
                <Link href="/calendar">View Full Schedule</Link>
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableSessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Calendar Section */}
      <section className="py-16 bg-[#18181b]" id="calendar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">Upcoming Sessions Calendar</h2>
            <p className="text-zinc-400">View your personalized schedule based on your players' age groups</p>
          </div>
          <SessionCalendar 
            showBookingButtons={true}
            onSessionClick={(session) => {
              window.location.href = `/sessions/${session.id}`;
            }}
          />
        </div>
      </section>
    </div>
  );
}
