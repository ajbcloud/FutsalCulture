import { QueryClient, QueryFunction } from "@tanstack/react-query";

let getTokenFunction: (() => Promise<string | null>) | null = null;

export function setClerkTokenGetter(fn: () => Promise<string | null>) {
  getTokenFunction = fn;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  
  if (getTokenFunction) {
    try {
      const token = await getTokenFunction();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Failed to get Clerk token:', error);
    }
  }
  
  return headers;
}

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
  const authHeaders = await getAuthHeaders();
  
  const res = await fetch(url, {
    method,
    headers: {
      ...authHeaders,
      ...(data ? { "Content-Type": "application/json" } : {}),
    },
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
    const authHeaders = await getAuthHeaders();
    
    const res = await fetch(queryKey.join("/") as string, {
      headers: authHeaders,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export async function get<T>(url: string): Promise<T> {
  try {
    const authHeaders = await getAuthHeaders();
    
    const res = await fetch(url, {
      headers: authHeaders,
      credentials: "include",
    });
    
    if (!res.ok) {
      const text = (await res.text()) || res.statusText;
      throw new Error(`${res.status}: ${text}`);
    }
    
    return await res.json();
  } catch (error) {
    console.warn(`Fetch error for ${url}:`, error);
    if (url.includes('/stats')) {
      return { totals: { revenue: 0, players: 0, activeTenants: 0, sessionsThisMonth: 0, pendingPayments: 0 }, topTenants: [], recentActivity: [] } as T;
    } else if (url.includes('/series')) {
      return { series: [] } as T;
    } else if (url.includes('/tenants') || url.includes('/payments') || url.includes('/sessions')) {
      return { rows: [], page: 1, pageSize: 25, totalRows: 0 } as T;
    }
    return {} as T;
  }
}

export async function patch<T>(url: string, data: any): Promise<T> {
  const authHeaders = await getAuthHeaders();
  
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 
      ...authHeaders,
      'Content-Type': 'application/json' 
    },
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
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: false,
      staleTime: 30000,
      gcTime: 300000,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
