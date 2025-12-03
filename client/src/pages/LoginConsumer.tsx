import { SignIn, useAuth, useUser, useOrganizationList } from "@clerk/clerk-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

export default function LoginConsumer() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const { isSignedIn, isLoaded } = useAuth();
  const { user: clerkUser } = useUser();
  const { userMemberships, isLoaded: orgsLoaded, setActive } = useOrganizationList({
    userMemberships: true
  });
  const [, navigate] = useLocation();

  useEffect(() => {
    async function handlePostLogin() {
      if (!isLoaded || !orgsLoaded || !isSignedIn || !clerkUser) {
        return;
      }
      
      // If user has org memberships, set the first one active and go to app
      if (userMemberships?.data && userMemberships.data.length > 0) {
        if (setActive) {
          try {
            await setActive({ organization: userMemberships.data[0].organization.id });
          } catch (error) {
            console.error("Error setting active organization:", error);
            // Continue anyway - just go to app
          }
        }
        navigate("/app");
        return;
      }
      
      // If user has no org memberships, still go to app
      // The JoinClubModal in the dashboard will prompt them to join a club
      navigate("/app");
    }
    
    handlePostLogin();
  }, [isLoaded, orgsLoaded, isSignedIn, clerkUser, userMemberships, setActive, navigate]);
  
  // Show loading while processing post-login
  if (isLoaded && isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629] p-4">
        <div className="text-center max-w-md">
          <Loader2 className={`h-12 w-12 animate-spin mx-auto mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`} />
          <h2 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Signing you in...
          </h2>
          <p className={`${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Please wait a moment
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629] p-4">
      <div className="w-full max-w-md">
        <SignIn 
          routing="path" 
          path="/login-consumer"
          signUpUrl="/signup-consumer"
          forceRedirectUrl="/login-consumer"
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
              formButtonPrimary: "!bg-blue-600 hover:!bg-blue-700 !text-white",
              footerActionLink: "!text-blue-500 hover:!text-blue-600",
              identityPreview: isDarkMode ? "!bg-slate-700 !border-slate-600" : "",
              identityPreviewText: isDarkMode ? "!text-white" : "",
              identityPreviewEditButton: isDarkMode ? "!text-blue-400 hover:!text-blue-300" : "",
              formFieldInputShowPasswordButton: isDarkMode ? "!text-slate-400 hover:!text-slate-300" : "",
              dividerLine: isDarkMode ? "!bg-slate-600" : "",
              dividerText: isDarkMode ? "!text-slate-400" : "",
            },
          }}
        />
      </div>
    </div>
  );
}
