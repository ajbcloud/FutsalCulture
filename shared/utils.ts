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
  const bookingOpenTime = new Date(sessionDate);
  
  // Use per-session booking time if available, otherwise default to 8 AM
  const hour = session.bookingOpenHour ?? 8;
  const minute = session.bookingOpenMinute ?? 0;
  
  bookingOpenTime.setHours(hour, minute, 0, 0);
  
  // Check if it's today and after the specified booking time
  const isToday = sessionDate.toDateString() === now.toDateString();
  const isAfterBookingTime = now >= bookingOpenTime;
  
  return isToday && isAfterBookingTime && session.status === "open" && session.status !== "full";
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