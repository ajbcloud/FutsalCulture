import { SignIn, useAuth, useUser } from "@clerk/clerk-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

interface ResolveUserResponse {
  success: boolean;
  found: boolean;
  linked?: boolean;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    tenantId: string | null;
    isAdmin: boolean;
    role: string;
  };
  tenant?: {
    id: string;
    name: string;
    subdomain: string;
  } | null;
  message?: string;
}

export default function LoginBusiness() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const { isSignedIn, isLoaded, userId } = useAuth();
  const { user: clerkUser } = useUser();
  const [, navigate] = useLocation();
  const [resolving, setResolving] = useState(false);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    async function resolveUser() {
      if (!isLoaded || !isSignedIn || !userId || resolving || resolved) {
        return;
      }

      setResolving(true);

      try {
        const email = clerkUser?.primaryEmailAddress?.emailAddress;
        
        const response = await fetch('/api/auth/resolve-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            clerkUserId: userId,
            email: email,
          }),
        });

        const data: ResolveUserResponse = await response.json();

        if (data.success && data.found) {
          if (data.user?.isAdmin || data.user?.role === 'tenant_admin') {
            navigate("/admin/dashboard");
          } else if (data.user?.tenantId) {
            navigate("/");
          } else {
            navigate("/get-started");
          }
        } else {
          navigate("/get-started");
        }
        
        setResolved(true);
      } catch (error) {
        console.error('Error resolving user:', error);
        navigate("/get-started");
        setResolved(true);
      }
    }

    resolveUser();
  }, [isLoaded, isSignedIn, userId, clerkUser, resolving, resolved, navigate]);

  if (isLoaded && isSignedIn && (resolving || resolved)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629]">
        <div className="text-center">
          <Loader2 className={`h-8 w-8 animate-spin mx-auto mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`} />
          <p className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>
            Setting up your account...
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
          path="/login-business"
          signUpUrl="/signup-business"
          afterSignInUrl="/login-business"
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
          New here? <a className="underline text-blue-600 dark:text-blue-400" href="/get-started" data-testid="link-create-club">Create your club</a>
        </div>
      </div>
    </div>
  );
}
