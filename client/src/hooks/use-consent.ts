import { useQuery } from '@tanstack/react-query';

export function useMissingConsentForms(playerId: string | null) {
  return useQuery({
    queryKey: ['/api/consent/missing', playerId],
    enabled: !!playerId,
    retry: false,
  });
}

export function useCheckMissingConsent(playerId: string) {
  const { data: missingForms, isLoading } = useMissingConsentForms(playerId);
  
  const formsArray = Array.isArray(missingForms) ? missingForms : [];
  
  return {
    hasMissingConsent: Boolean(formsArray.length > 0),
    missingForms: formsArray,
    isLoading,
  };
}