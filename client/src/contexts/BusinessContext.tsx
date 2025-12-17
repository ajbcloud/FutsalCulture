import { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';

interface PublicBranding {
  businessName: string;
  businessLogo?: string;
}

interface BusinessContextType {
  businessName: string;
  businessLogo?: string;
  isLoading: boolean;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const { data: branding, isLoading } = useQuery<PublicBranding>({
    queryKey: ['/api/branding'],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  const businessName = branding?.businessName || 'SkoreHQ';
  const businessLogo = branding?.businessLogo;

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