import { useEffect } from 'react';
import { queryClient } from '@/lib/queryClient';

/**
 * Hook to handle page refresh scenarios for admin pages
 * Automatically invalidates specified queries when:
 * - Component mounts
 * - Window gains focus (user returns from another tab/window)
 * - Page becomes visible (user returns from another tab)
 */
export function usePageRefresh(queryKeys: string[]) {
  useEffect(() => {
    // Function to invalidate all specified queries
    const invalidateQueries = () => {
      queryKeys.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      });
    };

    // Handlers for various refresh scenarios
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        invalidateQueries();
      }
    };

    const handleWindowFocus = () => {
      invalidateQueries();
    };

    // Set up event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    
    // Force immediate refresh on mount (for navigation scenarios)
    invalidateQueries();
    
    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [queryKeys]);
}