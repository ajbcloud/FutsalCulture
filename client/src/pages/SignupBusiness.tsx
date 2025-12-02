import { SignUp, useAuth, useSession } from "@clerk/clerk-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useEffect, useRef, useCallback } from "react";

export default function SignupBusiness() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const { isSignedIn, isLoaded } = useAuth();
  const { session } = useSession();
  const hasRedirected = useRef(false);

  const redirectToGetStarted = useCallback(() => {
    if (!hasRedirected.current) {
      hasRedirected.current = true;
      window.location.href = "/get-started";
    }
  }, []);

  // Redirect when signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      redirectToGetStarted();
    }
  }, [isLoaded, isSignedIn, redirectToGetStarted]);

  // Skip Clerk's organization creation step if it appears
  useEffect(() => {
    const currentTask = (session as any)?.currentTask;
    if (currentTask?.key === 'choose-organization' || currentTask?.key === 'create-organization') {
      redirectToGetStarted();
    }
  }, [session, redirectToGetStarted]);

  // Monitor for organization creation modal and skip it
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          const orgElements = document.querySelectorAll('[data-localization-key*="organization"], [class*="cl-organizationSwitcher"], [class*="cl-createOrganization"]');
          if (orgElements.length > 0 && isSignedIn && isLoaded) {
            redirectToGetStarted();
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [isSignedIn, isLoaded, redirectToGetStarted]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Create Your Account
          </h1>
          <p className={`text-sm mt-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            First, create your account. Then you'll set up your club.
          </p>
        </div>
        <SignUp 
          routing="path" 
          path="/signup-business"
          signInUrl="/login-business"
          forceRedirectUrl="/get-started"
          signInForceRedirectUrl="/get-started"
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
          Already have an account? <a className="underline text-blue-600 dark:text-blue-400" href="/login-business" data-testid="link-login">Log in</a>
        </div>
      </div>
    </div>
  );
}
