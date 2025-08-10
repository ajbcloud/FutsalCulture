import { storage } from "../storage";
import { nanoid } from "nanoid";

// Process expired waitlist offers every 5 minutes
export function startWaitlistProcessor() {
  console.log("Starting waitlist processor...");

  const processExpiredOffers = async () => {
    try {
      // Get all expired offers
      const expiredOffers = await storage.getExpiredOffers();
      
      console.log(`Found ${expiredOffers.length} expired waitlist offers`);
      
      for (const offer of expiredOffers) {
        console.log(`Processing expired offer for waitlist entry ${offer.id}`);
        
        // Mark offer as expired
        await storage.expireWaitlistOffer(offer.id);
        
        // Auto-promote next person if enabled
        const session = await storage.getSession(offer.sessionId, offer.tenantId);
        if (session?.autoPromote) {
          console.log(`Auto-promoting next person for session ${offer.sessionId}`);
          
          // Check if there's still capacity
          const signupsCount = await storage.getSignupsCount(offer.sessionId);
          if (signupsCount < session.capacity) {
            await storage.promoteFromWaitlist(offer.sessionId);
          }
        }
      }
      
      if (expiredOffers.length > 0) {
        console.log(`Processed ${expiredOffers.length} expired waitlist offers`);
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
        console.log(`Cleaned up ${cleanupCount} expired waitlist entries`);
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