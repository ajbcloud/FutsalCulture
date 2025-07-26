import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/auth/user");
        return await response.json();
      } catch (error: any) {
        // If user is not authenticated, return null instead of throwing
        if (error.message?.includes("401")) {
          return null;
        }
        throw error;
      }
    },
    retry: false,
    staleTime: 60000, // Consider data fresh for 1 minute
    refetchInterval: false, // Don't refetch automatically
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !error,
  };
}
