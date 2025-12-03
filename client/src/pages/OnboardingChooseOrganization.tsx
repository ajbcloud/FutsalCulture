import { useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

/**
 * This page is deprecated. The new flow uses JoinClubModal in the dashboard.
 * This page now just redirects to /app where the JoinClubModal will appear
 * for users without a club membership.
 */
export default function OnboardingChooseOrganization() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [, navigate] = useLocation();
  
  useEffect(() => {
    // Clear any stale localStorage data from the old flow
    localStorage.removeItem('pendingClubCode');
    
    // Redirect to app - the JoinClubModal will handle club joining
    navigate("/app");
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629] p-4">
      <div className="text-center max-w-md">
        <Loader2 className={`h-12 w-12 animate-spin mx-auto mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`} />
        <h2 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Redirecting...
        </h2>
        <p className={`${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
          Please wait a moment
        </p>
      </div>
    </div>
  );
}
