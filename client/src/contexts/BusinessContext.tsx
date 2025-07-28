import React, { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';

interface AdminSettings {
  businessName: string;
  businessLogo?: string;
  autoApproveRegistrations: boolean;
  paymentReminderMinutes: number;
  sessionDurationMinutes: number;
  requireSessionAccessCode: boolean;
}

interface BusinessContextType {
  businessName: string;
  businessLogo?: string;
  isLoading: boolean;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const { data: settings, isLoading } = useQuery<AdminSettings>({
    queryKey: ['/api/admin/settings'],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  const businessName = settings?.businessName || 'Futsal Culture';
  const businessLogo = settings?.businessLogo;

  return (
    <BusinessContext.Provider value={{ businessName, businessLogo, isLoading }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
}

// Hook for getting just the business name with fallback
export function useBusinessName() {
  const { businessName } = useBusiness();
  return businessName;
}