import SessionCalendar from "@/components/session-calendar";
import Navbar from "@/components/navbar";
import { useLocation } from "wouter";

export default function Calendar() {
  const [location] = useLocation();
  
  // Check if we're in admin context by looking at the URL
  const isAdminContext = location.startsWith('/admin/calendar');

  const handleSessionClick = (session: any) => {
    window.location.href = `/sessions/${session.id}`;
  };

  // Always show the parent/player portal calendar view
  // Admin calendar should be at /admin/calendar
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#18181b] text-white">
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Session Calendar</h1>
            <p className="text-zinc-400 text-lg">View all upcoming futsal training sessions</p>
          </div>
          <SessionCalendar 
            showBookingButtons={true}
            onSessionClick={handleSessionClick}
          />
        </div>
      </div>
    </>
  );
}