import { storage } from "../storage";
import { nanoid } from "nanoid";

// Process expired waitlist offers every 5 minutes
export function startWaitlistProcessor() {

  const processExpiredOffers = async () => {
    try {
      // Process expired offers using the new storage method
      const processedCount = await storage.processExpiredOffers();
      
      if (processedCount > 0) {
      }
    } catch (error) {
      console.error("Error processing expired waitlist offers:", error);
    }
  };

  const cleanupExpiredWaitlists = async () => {
    try {
      // Clean up waitlist data for sessions that ended more than 24 hours ago
      const cleanupCount = await storage.cleanupExpiredWaitlists();
      
      if (cleanupCount > 0) {
      }
    } catch (error) {
      console.error("Error cleaning up expired waitlists:", error);
    }
  };

  // Process immediately on startup
  processExpiredOffers();
  cleanupExpiredWaitlists();

  // Process expired offers every 5 minutes
  setInterval(processExpiredOffers, 5 * 60 * 1000);
  
  // Clean up expired waitlists every hour
  setInterval(cleanupExpiredWaitlists, 60 * 60 * 1000);
}