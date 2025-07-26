/**
 * Date formatting utilities that use the system timezone setting
 */

let systemTimezone: string = 'America/New_York'; // Default timezone

// Function to get the current system timezone
export const getSystemTimezone = (): string => {
  return systemTimezone;
};

// Function to set the system timezone (called when settings are loaded)
export const setSystemTimezone = (timezone: string): void => {
  systemTimezone = timezone;
};

// Format date according to system timezone
export const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    timeZone: systemTimezone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(dateObj);
};

// Format time according to system timezone (12-hour format)
export const formatTime = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    timeZone: systemTimezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    ...options,
  }).format(dateObj);
};

// Format date and time according to system timezone
export const formatDateTime = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    timeZone: systemTimezone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    ...options,
  }).format(dateObj);
};

// Format just the time part for display (e.g., "4:00 PM")
export const formatTimeOnly = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    timeZone: systemTimezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(dateObj);
};

// Format date for calendar display
export const formatCalendarDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    timeZone: systemTimezone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(dateObj);
};

// Get timezone abbreviation (e.g., "EST", "PST")
export const getTimezoneAbbr = (): string => {
  const now = new Date();
  return new Intl.DateTimeFormat('en-US', {
    timeZone: systemTimezone,
    timeZoneName: 'short',
  }).formatToParts(now).find(part => part.type === 'timeZoneName')?.value || '';
};

// Check if a date is today in the system timezone
export const isToday = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  const dateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: systemTimezone,
  }).format(dateObj);
  
  const todayStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: systemTimezone,
  }).format(today);
  
  return dateStr === todayStr;
};

// Check if a date is tomorrow in the system timezone
export const isTomorrow = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const dateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: systemTimezone,
  }).format(dateObj);
  
  const tomorrowStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: systemTimezone,
  }).format(tomorrow);
  
  return dateStr === tomorrowStr;
};

// Format relative time (e.g., "Today at 4:00 PM", "Tomorrow at 10:00 AM")
export const formatRelativeDateTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isToday(dateObj)) {
    return `Today at ${formatTimeOnly(dateObj)}`;
  }
  
  if (isTomorrow(dateObj)) {
    return `Tomorrow at ${formatTimeOnly(dateObj)}`;
  }
  
  return formatDateTime(dateObj);
};