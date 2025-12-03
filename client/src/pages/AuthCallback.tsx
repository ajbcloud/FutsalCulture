import { useAuth, useUser } from "@clerk/clerk-react";
import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";

export default function AuthCallback() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const { isSignedIn, isLoaded } = useAuth();
  const { user: clerkUser, isLoaded: userLoaded } = useUser();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [status, setStatus] = useState<'loading' | 'joining' | 'success' | 'error' | 'no-code'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [clubName, setClubName] = useState<string>('');
  const hasProcessed = useRef(false);
  
  const pendingCode = typeof window !== 'undefined' ? localStorage.getItem('pendingClubCode') : null;

  useEffect(() => {
    async function processCallback() {
      if (!isLoaded || !userLoaded) {
        return;
      }
      
      if (!isSignedIn || !clerkUser) {
        navigate("/signup-consumer");
        return;
      }
      
      if (hasProcessed.current) {
        return;
      }
      
      hasProcessed.current = true;
      
      if (!pendingCode) {
        setStatus('no-code');
        setTimeout(() => {
          navigate("/join");
        }, 100);
        return;
      }
      
      setStatus('joining');
      
      try {
        const response = await apiRequest("POST", "/api/beta/clerk-join-by-code", {
          tenant_code: pendingCode,
          first_name: clerkUser.firstName || '',
          last_name: clerkUser.lastName || '',
          role: 'parent'
        });
        
        if (response.ok) {
          const result = await response.json();
          localStorage.removeItem('pendingClubCode');
          setClubName(result.tenantName);
          setStatus('success');
          toast({
            title: "Welcome!",
            description: `You've joined ${result.tenantName}. Redirecting...`,
          });
          
          setTimeout(() => {
            window.location.href = "/app";
          }, 1500);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to join club");
        }
      } catch (error) {
        console.error("Error joining club:", error);
        setErrorMessage(error instanceof Error ? error.message : "Failed to join club");
        setStatus('error');
        localStorage.removeItem('pendingClubCode');
      }
    }
    
    processCallback();
  }, [isLoaded, userLoaded, isSignedIn, clerkUser, pendingCode, navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629] p-4">
      <div className="text-center max-w-md">
        {status === 'loading' && (
          <>
            <Loader2 className={`h-12 w-12 animate-spin mx-auto mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`} />
            <h2 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Setting up your account...
            </h2>
          </>
        )}
        
        {status === 'joining' && (
          <>
            <Loader2 className={`h-12 w-12 animate-spin mx-auto mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`} />
            <h2 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Joining your club...
            </h2>
            <p className={`${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
              Setting up your account
            </p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <h2 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Welcome to {clubName}!
            </h2>
            <p className={`${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
              Redirecting to your dashboard...
            </p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h2 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Unable to join club
            </h2>
            <p className={`mb-4 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
              {errorMessage}
            </p>
            <button
              onClick={() => navigate("/join")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              data-testid="button-try-again"
            >
              Try a different code
            </button>
          </>
        )}
        
        {status === 'no-code' && (
          <>
            <Loader2 className={`h-12 w-12 animate-spin mx-auto mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`} />
            <h2 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Redirecting...
            </h2>
          </>
        )}
      </div>
    </div>
  );
}
