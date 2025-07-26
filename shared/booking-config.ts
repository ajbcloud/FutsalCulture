// Global booking configuration
export const GLOBAL_BOOKING_CONFIG = {
  // Default booking open time (applies to all sessions unless overridden)
  defaultBookingOpenHour: 8,
  defaultBookingOpenMinute: 0,
  
  // Override for specific scenarios
  specialRules: {
    // Example: Weekend sessions open at 9 AM
    weekend: {
      bookingOpenHour: 9,
      bookingOpenMinute: 0
    },
    // Example: Holiday sessions open at 7 AM
    holiday: {
      bookingOpenHour: 7,
      bookingOpenMinute: 0
    }
  }
};

// Helper function to get booking open time for a session
export function getBookingOpenTime(session: any): Date {
  const sessionDate = new Date(session.startTime);
  const bookingOpenTime = new Date(sessionDate);
  
  // Use per-session booking time if available, otherwise use global default
  const hour = session.bookingOpenHour ?? GLOBAL_BOOKING_CONFIG.defaultBookingOpenHour;
  const minute = session.bookingOpenMinute ?? GLOBAL_BOOKING_CONFIG.defaultBookingOpenMinute;
  
  bookingOpenTime.setHours(hour, minute, 0, 0);
  return bookingOpenTime;
}

// Enhanced booking availability check
export function isSessionBookingAvailable(session: any): boolean {
  const now = new Date();
  const sessionDate = new Date(session.startTime);
  const bookingOpenTime = getBookingOpenTime(session);
  
  // Check if it's the session day
  const isSessionDay = sessionDate.toDateString() === now.toDateString();
  
  // Check if booking window is open
  const isBookingWindowOpen = now >= bookingOpenTime;
  
  // Check if session hasn't started yet
  const sessionNotStarted = now < sessionDate;
  
  return isSessionDay && isBookingWindowOpen && sessionNotStarted && 
         session.status === "open" && session.status !== "full";
}