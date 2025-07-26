import { useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
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

  const todaySessions = sessions.filter(session => {
    const sessionDate = new Date(session.startTime);
    const today = new Date();
    return sessionDate.toDateString() === today.toDateString();
  });

  return (
    <div className="min-h-screen bg-[#18181b]">
      <Navbar />
      {/* Welcome Section */}
      <section className="from-futsal-600 to-brand-600 text-white bg-[#18181b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Welcome Back!</h1>
            <p className="text-lg md:text-xl text-futsal-100">
              Ready to book today's training sessions?
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
            <Button asChild variant="outline" size="lg">
              <Link href="/sessions">Browse All Sessions</Link>
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => {
                document.getElementById('calendar')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              View Schedule
            </Button>
          </div>
        </div>
      </section>
      {/* Today's Sessions */}
      <section className="py-8 bg-[#18181b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold bg-[#ffffff00] text-[#ffffff]">Today's Sessions</h2>
              <p className="text-gray-600 mt-2">Available for booking at 8:00 AM</p>
            </div>
          </div>

          {todaySessions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No sessions scheduled for today.</p>
              <Button asChild className="mt-4">
                <Link href="/sessions">View All Sessions</Link>
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {todaySessions.map((session) => (
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
            onSessionClick={(session) => {
              window.location.href = `/sessions/${session.id}`;
            }}
          />
        </div>
      </section>
    </div>
  );
}
