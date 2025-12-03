import { useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export default function AuthCallback() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    if (!isLoaded) {
      return;
    }
    
    if (isSignedIn) {
      window.location.href = "/app";
    } else {
      window.location.href = "/signup-consumer";
    }
  }, [isLoaded, isSignedIn]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629] p-4">
      <div className="text-center max-w-md">
        <Loader2 className={`h-12 w-12 animate-spin mx-auto mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`} />
        <h2 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Setting up your account...
        </h2>
      </div>
    </div>
  );
}
