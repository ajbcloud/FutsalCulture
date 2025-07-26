// Utility functions shared between client and server

export function calculateAgeGroup(birthYear: number): string {
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;
  return `U${age + 1}`;
}

export function isSessionEligibleForPlayer(session: any, player: any): boolean {
  const playerAgeGroup = calculateAgeGroup(player.birthYear);
  const ageMatch = session.ageGroup === playerAgeGroup;
  const genderMatch = session.gender === player.gender;
  return ageMatch && genderMatch;
}

export function isSessionBookingOpen(session: any): boolean {
  const now = new Date();
  const sessionDate = new Date(session.startTime);
  const bookingOpenTime = new Date(sessionDate);
  bookingOpenTime.setHours(8, 0, 0, 0);
  
  // Check if it's today and after 8 AM
  const isToday = sessionDate.toDateString() === now.toDateString();
  const isAfter8AM = now >= bookingOpenTime;
  
  return isToday && isAfter8AM && session.status === "open" && session.status !== "full";
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