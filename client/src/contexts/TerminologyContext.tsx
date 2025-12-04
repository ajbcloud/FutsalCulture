import { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';

type TerminologyPolicy = {
  audienceMode: "youth_only" | "mixed" | "adult_only";
  adultAge: number;
  parentRequiredBelow: number;
  teenSelfAccessAt: number;
  labels: {
    adultColumnLabel: "Parent" | "Guardian" | null;
    adult1: string | null;
    adult2: string | null;
    userTerm: "Parent" | "Player";
    guardianTerm: "Parent" | "Guardian" | null;
  };
  showGuardianColumns: boolean;
};

type TerminologyContextType = {
  policy: TerminologyPolicy | null;
  isLoading: boolean;
  getAdult1Label: () => string | null;
  getAdult2Label: () => string | null;
  showGuardianColumns: () => boolean;
  getUserTerm: () => "Parent" | "Player";
  getGuardianTerm: () => string | null;
};

const TerminologyContext = createContext<TerminologyContextType | undefined>(undefined);

export function TerminologyProvider({ children }: { children: React.ReactNode }) {
  const { data: policy, isLoading } = useQuery<TerminologyPolicy>({
    queryKey: ['/api/terminology/policy'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: (failureCount, error) => {
      if (error instanceof Error && 'status' in error) {
        const status = (error as any).status;
        if (status === 400 || status === 401) return false;
      }
      return failureCount < 2;
    },
  });

  const getAdult1Label = (): string | null => {
    return policy?.labels?.adult1 ?? "Guardian 1";
  };

  const getAdult2Label = (): string | null => {
    return policy?.labels?.adult2 ?? "Guardian 2";
  };

  const showGuardianColumns = (): boolean => {
    return policy?.showGuardianColumns ?? true;
  };

  const getUserTerm = (): "Parent" | "Player" => {
    return policy?.labels?.userTerm || "Player";
  };

  const getGuardianTerm = (): string | null => {
    return policy?.labels?.guardianTerm || "Guardian";
  };

  const value: TerminologyContextType = {
    policy: policy || null,
    isLoading,
    getAdult1Label,
    getAdult2Label,
    showGuardianColumns,
    getUserTerm,
    getGuardianTerm,
  };

  return (
    <TerminologyContext.Provider value={value}>
      {children}
    </TerminologyContext.Provider>
  );
}

export function useTerminology() {
  const context = useContext(TerminologyContext);
  if (context === undefined) {
    throw new Error('useTerminology must be used within a TerminologyProvider');
  }
  return context;
}
