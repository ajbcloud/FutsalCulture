import { useQuery } from "@tanstack/react-query";

export function useHelpRequestsEnabled() {
  const { data: settings } = useQuery<{ enableHelpRequests?: boolean }>({
    queryKey: ['/api/admin/settings'],
  });

  return settings?.enableHelpRequests ?? true; // Default to true if not set
}
