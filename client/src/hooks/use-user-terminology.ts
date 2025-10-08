import { useQuery } from "@tanstack/react-query";

type UserTerminology = {
  term: "Parent" | "Player";
};

export function useUserTerminology() {
  const { data, isLoading } = useQuery<UserTerminology>({
    queryKey: ["/api/terminology/user-term"],
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });

  return {
    term: data?.term || "Player", // Default to "Player" while loading or on error
    isLoading,
  };
}
