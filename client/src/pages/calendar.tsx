import SessionCalendar from "@/components/session-calendar";
import Navbar from "@/components/navbar";
import AdminLayout from "@/components/admin-layout";
import { useAuth } from "@/contexts/AuthContext";

export default function Calendar() {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin || user?.isAssistant;

  const handleSessionClick = (session: any) => {
    window.location.href = `/sessions/${session.id}`;
  };

  const content = (
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
  );

  if (isAdmin) {
    return <AdminLayout>{content}</AdminLayout>;
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#18181b] text-white">
        {content}
      </div>
    </>
  );
}