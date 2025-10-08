import { useTerminology } from "@/contexts/TerminologyContext";

export function useUserTerminology() {
  const { getUserTerm, isLoading } = useTerminology();

  return {
    term: getUserTerm(),
    isLoading,
  };
}
