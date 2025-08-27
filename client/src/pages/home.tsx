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
        window.location.href = "/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<FutsalSession[]>({
    queryKey: ["/api/sessions", { includePast: false }],
    enabled: isAuthenticated,
  });

  if (isLoading || sessionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Show only today's sessions on the main page - future sessions are handled by calendar
  const todaysSessions = sessions.filter(session => {
    const now = new Date();
    const sessionDate = new Date(session.startTime);
    const today = new Date();
    
    // Only show today's sessions
    const isToday = sessionDate.toDateString() === today.toDateString();
    if (!isToday) return false;
    
    // Don't show past sessions
    if (sessionDate < now) return false;
    
    // Don't show full or closed sessions
    if (session.status === "full" || session.status === "closed") return false;
    
    // Check if today's session is currently bookable
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
    const bookingHour = session.bookingOpenHour ?? 8;
    const bookingMinute = session.bookingOpenMinute ?? 0;
    const bookingOpenTime = new Date(sessionDate);
    bookingOpenTime.setHours(bookingHour, bookingMinute, 0, 0);
    
    return now >= bookingOpenTime;
  }).slice(0, 6); // Limit to 6 sessions to avoid overwhelming the UI
  
  // Debug logging

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

            <Button asChild size="lg" variant="outline">
              <Link href="/calendar">View Calendar</Link>
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
              Future Sessions
            </Button>
          </div>
        </div>
      </section>
      {/* Today's Sessions */}
      <section className="py-8 bg-[#18181b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold bg-[#ffffff00] text-[#ffffff]">Today's Sessions 📚</h2>
              <p className="text-gray-600 mt-2">Sessions you can book today</p>
            </div>
          </div>

          {todaysSessions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No sessions available for booking today.</p>
              <p className="text-gray-400 mt-2">Sessions may open at different times based on their booking rules. Check the calendar for future sessions.</p>
              <Button asChild className="mt-4">
                <Link href="/calendar">View Future Sessions</Link>
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {todaysSessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Future Sessions - Calendar CTA */}
      <section className="py-12 bg-[#2a2a2a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold mb-4 text-foreground">Book Future Sessions</h2>
          <p className="text-lg text-muted-foreground mb-6">
            Sessions with flexible booking times are available through our calendar view.
          </p>
          <Button asChild size="lg">
            <Link href="/calendar">View Calendar & Book Sessions</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
