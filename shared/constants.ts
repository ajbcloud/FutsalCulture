// Shared constants for the PlayHQ application

export const AGE_GROUPS = ['U8', 'U9', 'U10', 'U11', 'U12', 'U13', 'U14', 'U15', 'U16', 'U17', 'U18'] as const;

export const GENDERS = ['boys', 'girls'] as const;

// Business rules
export const MINIMUM_PORTAL_AGE = 13; // Players must be 13+ for portal access

export const LOCATIONS = [
  'Sugar Sand Park',
  'Boca Raton Community Center', 
  'Delray Beach Sports Complex',
  'West Boca Sports Complex',
  'Coconut Creek Community Center'
] as const;

export function calculateAgeGroupFromAge(age: number): string {
  if (age <= 8) return 'U8';
  if (age <= 9) return 'U9';
  if (age <= 10) return 'U10';
  if (age <= 11) return 'U11';
  if (age <= 12) return 'U12';
  if (age <= 13) return 'U13';
  if (age <= 14) return 'U14';
  if (age <= 15) return 'U15';
  if (age <= 16) return 'U16';
  if (age <= 17) return 'U17';
  return 'U18';
}

export function calculateAge(birthYear: number): number {
  return new Date().getFullYear() - birthYear;
}

export function canAccessPortal(birthYear: number): boolean {
  return calculateAge(birthYear) >= MINIMUM_PORTAL_AGE;
}