// Utility functions shared between client and server

export function calculateAgeGroup(birthYear: number): string {
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;
  return `U${age + 1}`;
}

export function isSessionEligibleForPlayer(session: any, player: any): boolean {
  const playerAgeGroup = calculateAgeGroup(player.birthYear);
  
  // Check if player's age group is in the session's age groups array
  const ageMatch = session.ageGroups?.includes(playerAgeGroup) || session.ageGroup === playerAgeGroup;
  
  // Check if player's gender is in the session's genders array or if session accepts "mixed"
  const genderMatch = session.genders?.includes(player.gender) || 
                     session.genders?.includes('mixed') || 
                     session.gender === player.gender;
                     
  return ageMatch && genderMatch;
}

export function isSessionBookingOpen(session: any): boolean {
  const now = new Date();
  const sessionDate = new Date(session.startTime);
  
  // Sessions must not have started yet (basic rule)
  if (sessionDate <= now) return false;
  
  // If session status is full or closed, it's not bookable
  if (session.status === "full" || session.status === "closed") return false;
  
  // Check for no time constraints - can book anytime
  if (session.noTimeConstraints) {
    return true;
  }
  
  // Check for days before booking constraint
  if (session.daysBeforeBooking && session.daysBeforeBooking > 0) {
    const daysBeforeMs = session.daysBeforeBooking * 24 * 60 * 60 * 1000;
    const bookingOpenTime = new Date(sessionDate.getTime() - daysBeforeMs);
    return now >= bookingOpenTime;
  }
  
  // Default 8 AM rule - check if session is on the same day as today
  const isToday = sessionDate.toDateString() === now.toDateString();
  
  // If it's today, check if we're past the booking open time (default 8 AM)
  if (isToday) {
    const bookingOpenTime = new Date(sessionDate);
    const hour = session.bookingOpenHour ?? 8;
    const minute = session.bookingOpenMinute ?? 0;
    bookingOpenTime.setHours(hour, minute, 0, 0);
    
    return now >= bookingOpenTime;
  }
  
  // For future days, sessions are not yet bookable (must wait until 8 AM on session day)
  return false;
}

export function getSessionStatusColor(session: any, signupsCount?: number): string {
  if (session.status === "full") return "text-red-400";
  
  const fillPercentage = signupsCount ? (signupsCount / session.capacity) * 100 : 0;
  if (fillPercentage >= 80) return "text-yellow-400";
  
  return "text-green-400";
}

export function getSessionStatusText(session: any, signupsCount?: number): string {
  if (session.status === "full") return "Full";
  
  const fillPercentage = signupsCount ? (signupsCount / session.capacity) * 100 : 0;
  if (fillPercentage >= 80) return "Filling Fast";
  
  return "Available";
}

// Beta onboarding utility functions
export function randomToken(length = 48): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from(bytes, b => alphabet[b % alphabet.length]).join("");
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function generateTenantCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}