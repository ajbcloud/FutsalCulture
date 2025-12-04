import React, { createContext, useContext, useEffect, useState } from 'react';
import { setSystemTimezone } from '@/lib/dateUtils';

interface TimezoneContextType {
  timezone: string;
  setTimezone: (timezone: string) => void;
  formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string;
  formatTime: (date: Date, options?: Intl.DateTimeFormatOptions) => string;
  formatDateTime: (date: Date, options?: Intl.DateTimeFormatOptions) => string;
}

const TimezoneContext = createContext<TimezoneContextType | undefined>(undefined);

interface TimezoneProviderProps {
  children: React.ReactNode;
}

export function TimezoneProvider({ children }: TimezoneProviderProps) {
  const [timezone, setTimezone] = useState<string>('America/New_York'); // Default timezone

  // Load timezone from system settings on mount
  useEffect(() => {
    const fetchTimezone = async () => {
      try {
        const response = await fetch('/api/admin/settings');
        if (response.ok) {
          const settings = await response.json();
          if (settings.timezone) {
            setTimezone(settings.timezone);
            setSystemTimezone(settings.timezone); // Update the global timezone utility
          }
        }
      } catch (error) {
        console.error('Failed to fetch timezone from settings:', error);
      }
    };

    fetchTimezone();
  }, []);

  const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions) => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options,
    }).format(date);
  };

  const formatTime = (date: Date, options?: Intl.DateTimeFormatOptions) => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      ...options,
    }).format(date);
  };

  const formatDateTime = (date: Date, options?: Intl.DateTimeFormatOptions) => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      ...options,
    }).format(date);
  };

  return (
    <TimezoneContext.Provider
      value={{
        timezone,
        setTimezone,
        formatDate,
        formatTime,
        formatDateTime,
      }}
    >
      {children}
    </TimezoneContext.Provider>
  );
}

export function useTimezone() {
  const context = useContext(TimezoneContext);
  if (context === undefined) {
    throw new Error('useTimezone must be used within a TimezoneProvider');
  }
  return context;
}