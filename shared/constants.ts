// Shared constants for the Futsal Culture application

export const AGE_GROUPS = ['U8', 'U10', 'U12', 'U14', 'U16', 'U18'] as const;

export const GENDERS = ['boys', 'girls'] as const;

export const LOCATIONS = [
  'Sugar Sand Park',
  'Boca Raton Community Center', 
  'Delray Beach Sports Complex',
  'West Boca Sports Complex',
  'Coconut Creek Community Center'
] as const;

export function calculateAgeGroupFromAge(age: number): string {
  if (age <= 8) return 'U8';
  if (age <= 10) return 'U10';
  if (age <= 11) return 'U11';
  if (age <= 12) return 'U12';
  if (age <= 14) return 'U14';
  if (age <= 16) return 'U16';
  return 'U18';
}