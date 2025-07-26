// Global booking configuration
export const GLOBAL_BOOKING_CONFIG = {
  // Default booking open time (applies to all sessions unless overridden)
  defaultBookingOpenHour: 8,
  defaultBookingOpenMinute: 0,
  
  // Booking time constraints
  minBookingHour: 6,    // 6:00 AM
  maxBookingHour: 21,   // 9:00 PM
  
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

// Helper function to convert 24-hour to 12-hour format
export function format12Hour(hour24: number, minute: number = 0): string {
  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
  const ampm = hour24 < 12 ? 'AM' : 'PM';
  return `${hour12}:${minute.toString().padStart(2, '0')} ${ampm}`;
}

// Helper function to convert 12-hour to 24-hour format
export function convert12To24Hour(hour12: number, ampm: 'AM' | 'PM'): number {
  if (ampm === 'AM') {
    return hour12 === 12 ? 0 : hour12;
  } else {
    return hour12 === 12 ? 12 : hour12 + 12;
  }
}

// Validate booking time is within allowed range
export function isValidBookingTime(hour24: number): boolean {
  return hour24 >= GLOBAL_BOOKING_CONFIG.minBookingHour && 
         hour24 <= GLOBAL_BOOKING_CONFIG.maxBookingHour;
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