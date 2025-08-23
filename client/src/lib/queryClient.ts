import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// Safe fetch wrapper for analytics and other endpoints
export async function get<T>(url: string): Promise<T> {
  try {
    const res = await fetch(url, {
      credentials: "include",
    });
    
    if (!res.ok) {
      const text = (await res.text()) || res.statusText;
      throw new Error(`${res.status}: ${text}`);
    }
    
    return await res.json();
  } catch (error) {
    console.warn(`Fetch error for ${url}:`, error);
    // Return safe defaults for different endpoint types
    if (url.includes('/stats')) {
      return { totals: { revenue: 0, players: 0, activeTenants: 0, sessionsThisMonth: 0, pendingPayments: 0 }, topTenants: [], recentActivity: [] } as T;
    } else if (url.includes('/series')) {
      return { series: [] } as T;
    } else if (url.includes('/tenants') || url.includes('/payments') || url.includes('/sessions')) {
      return { rows: [], page: 1, pageSize: 25, totalRows: 0 } as T;
    }
    // Generic safe default
    return {} as T;
  }
}

export async function patch<T>(url: string, data: any): Promise<T> {
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
  
  return await res.json();
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true, // Refetch when user returns to window
      refetchOnMount: true, // Always refetch when component mounts
      refetchOnReconnect: false,
      staleTime: 30000, // Consider data stale after 30 seconds
      gcTime: 300000, // Keep in cache for 5 minutes
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
