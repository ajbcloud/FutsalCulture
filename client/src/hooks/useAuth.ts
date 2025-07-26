import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

let cachedAuthState: { user: any; timestamp: number } | null = null;
const CACHE_DURATION = 300000; // 5 minutes

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      // Check local cache first
      if (cachedAuthState && Date.now() - cachedAuthState.timestamp < CACHE_DURATION) {
        return cachedAuthState.user;
      }

      try {
        const response = await apiRequest("GET", "/api/auth/user");
        const userData = await response.json();
        
        // Update local cache
        cachedAuthState = {
          user: userData,
          timestamp: Date.now()
        };
        
        return userData;
      } catch (error: any) {
        // If user is not authenticated, cache null result
        if (error.message?.includes("401")) {
          cachedAuthState = {
            user: null,
            timestamp: Date.now()
          };
          return null;
        }
        throw error;
      }
    },
    retry: false,
    staleTime: Infinity, // Never consider stale - we handle our own caching
    gcTime: Infinity, // Keep in cache forever
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !error,
  };
}
