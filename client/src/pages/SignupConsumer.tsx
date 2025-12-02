import { SignUp, useAuth, useOrganizationList } from "@clerk/clerk-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function SignupConsumer() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const { isSignedIn, isLoaded } = useAuth();
  const { userMemberships, isLoaded: orgsLoaded } = useOrganizationList({
    userMemberships: true
  });
  const [, navigate] = useLocation();

  useEffect(() => {
    if (isLoaded && orgsLoaded && isSignedIn) {
      if (userMemberships?.data && userMemberships.data.length > 0) {
        navigate("/app");
      } else {
        navigate("/app-unassigned");
      }
    }
  }, [isLoaded, orgsLoaded, isSignedIn, userMemberships, navigate]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629] p-4">
      <div className="w-full max-w-md">
        <SignUp 
          routing="path" 
          path="/signup-consumer"
          signInUrl="/login-consumer"
          afterSignUpUrl="/signup-consumer"
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
