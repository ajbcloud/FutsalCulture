import { useQuery } from "@tanstack/react-query";

export function useHelpRequestsEnabled() {
  const { data: settings, isLoading } = useQuery<{ enableHelpRequests?: boolean }>({
    queryKey: ['/api/admin/settings'],
  });

  // While loading, default to true to prevent flickering
  if (isLoading || !settings) {
    return true;
  }

  // Once loaded, check if explicitly set to false
  // Only default to true when undefined (not set), not when explicitly false
  return settings.enableHelpRequests !== false;
}
