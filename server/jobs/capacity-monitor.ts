import { storage } from "../storage";

// Background job to monitor session capacity and update status
export async function monitorCapacity() {
  try {
    const sessions = await storage.getSessions({ status: "open" });
    
    for (const session of sessions) {
      const signupsCount = await storage.getSignupsCount(session.id);
      
      if (signupsCount >= session.capacity) {
        await storage.updateSessionStatus(session.id, "full");
        console.log(`Session ${session.id} marked as full`);
      }
    }
  } catch (error) {
    console.error("Error monitoring capacity:", error);
  }
}

// Run every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(monitorCapacity, 5 * 60 * 1000);
}
