import { useQuery } from "@tanstack/react-query";

type UserTerminology = {
  term: "Parent" | "Player";
};

export function useUserTerminology() {
  const { data, isLoading } = useQuery<UserTerminology>({
    queryKey: ["/api/terminology/user-term"],
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    retry: (failureCount, error) => {
      // Check if it's a response error with status
      if (error instanceof Error && 'status' in error) {
        const status = (error as any).status;
        if (status === 400 || status === 401) return false;
      }
      // Otherwise allow 2 retries for network errors
      return failureCount < 2;
    },
  });

  return {
    term: data?.term || "Player", // Default to "Player" while loading or on error
    isLoading,
  };
}
