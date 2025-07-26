import { storage } from "../storage";

// Background job to update session status based on time
export async function updateSessionStatus() {
  try {
    const now = new Date();
    
    // Get all upcoming sessions
    const upcomingSessions = await storage.getSessions({ status: "upcoming" });
    
    for (const session of upcomingSessions) {
      const sessionDate = new Date(session.startTime);
      const bookingOpenTime = new Date(sessionDate);
      bookingOpenTime.setHours(8, 0, 0, 0);
      
      // If it's 8 AM on session day, open booking
      if (now >= bookingOpenTime && now < session.startTime) {
        await storage.updateSessionStatus(session.id, "open");
        console.log(`Session ${session.id} opened for booking`);
      }
      
      // If session start time has passed, mark as closed
      if (now >= session.startTime) {
        await storage.updateSessionStatus(session.id, "closed");
        console.log(`Session ${session.id} marked as closed`);
      }
    }
    
    // Also check open sessions that should be closed
    const openSessions = await storage.getSessions({ status: "open" });
    
    for (const session of openSessions) {
      if (now >= session.startTime) {
        await storage.updateSessionStatus(session.id, "closed");
        console.log(`Session ${session.id} marked as closed`);
      }
    }
  } catch (error) {
    console.error("Error updating session status:", error);
  }
}

// Run every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(updateSessionStatus, 5 * 60 * 1000);
}
