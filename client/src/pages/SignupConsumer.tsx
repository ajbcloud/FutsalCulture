import { SignUp, useAuth, useUser, useOrganizationList } from "@clerk/clerk-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function SignupConsumer() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const { isSignedIn, isLoaded } = useAuth();
  const { user: clerkUser } = useUser();
  const { userMemberships, isLoaded: orgsLoaded } = useOrganizationList({
    userMemberships: true
  });
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [joiningClub, setJoiningClub] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState(false);
  
  // Check for pending club code
  const pendingCode = typeof window !== 'undefined' ? localStorage.getItem('pendingClubCode') : null;

  useEffect(() => {
    async function handlePostSignup() {
      if (!isLoaded || !orgsLoaded || !isSignedIn || !clerkUser) {
        return;
      }
      
      // If user already has org memberships, they're already set up
      if (userMemberships?.data && userMemberships.data.length > 0) {
        localStorage.removeItem('pendingClubCode');
        navigate("/app");
        return;
      }
      
      // If there's a pending club code, use it to join
      if (pendingCode && !joiningClub && !joinSuccess) {
        setJoiningClub(true);
        setJoinError(null);
        
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
            setJoinSuccess(true);
            toast({
              title: "Welcome!",
              description: `You've joined ${result.tenantName}. Redirecting...`,
            });
            
            // Give Clerk a moment to sync the org membership, then redirect
            setTimeout(() => {
              window.location.href = "/app";
            }, 1500);
          } else {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to join club");
          }
        } catch (error) {
          console.error("Error joining club:", error);
          setJoinError(error instanceof Error ? error.message : "Failed to join club");
          localStorage.removeItem('pendingClubCode');
          setJoiningClub(false);
        }
      } else if (!pendingCode) {
        // No pending code, redirect to unassigned or join page
        navigate("/app-unassigned");
      }
    }
    
    handlePostSignup();
  }, [isLoaded, orgsLoaded, isSignedIn, clerkUser, userMemberships, pendingCode, joiningClub, joinSuccess, navigate, toast]);
  
  // Show joining progress
  if (isLoaded && isSignedIn && (joiningClub || joinSuccess)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629] p-4">
        <div className="text-center max-w-md">
          {joinSuccess ? (
            <>
              <CheckCircle className={`h-12 w-12 mx-auto mb-4 text-green-500`} />
              <h2 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Welcome to your club!
              </h2>
              <p className={`${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                Redirecting to your dashboard...
              </p>
            </>
          ) : joinError ? (
            <>
              <AlertCircle className={`h-12 w-12 mx-auto mb-4 text-red-500`} />
              <h2 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Unable to join club
              </h2>
              <p className={`mb-4 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                {joinError}
              </p>
              <button
                onClick={() => navigate("/join")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                data-testid="button-try-again"
              >
                Try a different code
              </button>
            </>
          ) : (
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
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629] p-4">
      <div className="w-full max-w-md">
        {pendingCode && (
          <div className={`mb-4 p-3 rounded-lg text-center ${isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
            <p className="text-sm">
              Club code: <strong>{pendingCode}</strong>
            </p>
            <p className="text-xs mt-1 opacity-75">
              Complete signup to join your club
            </p>
          </div>
        )}
        <SignUp 
          routing="path" 
          path="/signup-consumer"
          signInUrl="/login-consumer"
          forceRedirectUrl="/signup-consumer"
          appearance={{
            variables: {
              colorPrimary: "#3b82f6",
              colorBackground: isDarkMode ? "#1e293b" : "#ffffff",
              colorInputBackground: isDarkMode ? "#334155" : "#f8fafc",
              colorInputText: isDarkMode ? "#ffffff" : "#0f172a",
              colorText: isDarkMode ? "#ffffff" : "#0f172a",
              colorTextSecondary: isDarkMode ? "#cbd5e1" : "#64748b",
              colorNeutral: isDarkMode ? "#cbd5e1" : "#64748b",
              colorTextOnPrimaryBackground: "#ffffff",
            },
            elements: {
              rootBox: "mx-auto",
              card: isDarkMode 
                ? "shadow-lg rounded-xl !bg-[#1e293b] border border-slate-700" 
                : "shadow-lg rounded-xl",
              headerTitle: isDarkMode ? "!text-white" : "",
              headerSubtitle: isDarkMode ? "!text-slate-300" : "",
              socialButtonsBlockButton: isDarkMode 
                ? "!bg-slate-700 !border-slate-600 !text-white hover:!bg-slate-600" 
                : "",
              socialButtonsBlockButtonText: isDarkMode ? "!text-white" : "",
              formFieldLabel: isDarkMode ? "!text-slate-300" : "",
              formFieldInput: isDarkMode 
                ? "!bg-slate-700 !border-slate-600 !text-white placeholder:!text-slate-400" 
                : "",
              formButtonPrimary: "!bg-blue-600 hover:!bg-blue-700",
              footerActionLink: isDarkMode ? "!text-blue-400 hover:!text-blue-300" : "",
              dividerLine: isDarkMode ? "!bg-slate-600" : "",
              dividerText: isDarkMode ? "!text-slate-400" : "",
              formFieldInputShowPasswordButton: isDarkMode ? "!text-slate-400" : "",
              identityPreviewText: isDarkMode ? "!text-white" : "",
              identityPreviewEditButton: isDarkMode ? "!text-blue-400" : "",
              footer: isDarkMode ? "!bg-[#1e293b]" : "",
              footerActionText: isDarkMode ? "!text-slate-300" : "",
            }
          }}
        />
        <div className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
          Have a club code? <a className="underline text-blue-600 dark:text-blue-400" href="/join" data-testid="link-join-club">Join your club</a>
        </div>
      </div>
    </div>
  );
}
