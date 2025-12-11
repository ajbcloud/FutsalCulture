import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { SignUp, useUser, useAuth as useClerkAuth, useClerk } from "@clerk/clerk-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Loader2, AlertCircle, ArrowLeft, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";

type Step = "validating" | "welcome" | "signup" | "error" | "email_mismatch";

// Check if we're on a Clerk sub-route (verification, continue, etc.)
function isClerkSubRoute(): boolean {
  const path = window.location.pathname;
  return path.includes('/join-as-coach/') && 
         (path.includes('verify') || path.includes('continue') || path.includes('sso'));
}

interface ValidateResponse {
  valid: boolean;
  tenantName?: string;
  tenantId?: string;
  recipientEmail?: string;
  error?: string;
}

const CACHE_KEY = 'coach_invite_data';

function cacheInviteData(code: string, data: ValidateResponse) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ code, ...data }));
  } catch (e) {
    console.log('[Coach Invite] Cache write error:', e);
  }
}

function getCachedInviteData(code: string): ValidateResponse | null {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      const data = JSON.parse(cached);
      if (data.code === code && data.valid) {
        return data;
      }
    }
  } catch (e) {
    console.log('[Coach Invite] Cache parse error:', e);
  }
  return null;
}

export function clearCoachInviteCache() {
  sessionStorage.removeItem(CACHE_KEY);
  sessionStorage.removeItem('coach_invite_code');
}

export default function JoinAsCoach() {
  const [step, setStep] = useState<Step>("validating");
  const [inviteData, setInviteData] = useState<ValidateResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [mismatchEmails, setMismatchEmails] = useState<{ invite: string; user: string } | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const { user: clerkUser, isSignedIn, isLoaded } = useUser();
  const { getToken } = useClerkAuth();
  const { signOut } = useClerk();
  const { user, isAuthenticated } = useAuth();

  // Get code from URL or sessionStorage (Clerk navigation loses URL params during verification)
  const urlParams = new URLSearchParams(window.location.search);
  const urlCode = urlParams.get('code');
  
  // Store code in sessionStorage if we have it in URL, retrieve from storage if not
  const code = (() => {
    if (urlCode) {
      sessionStorage.setItem('coach_invite_code', urlCode);
      return urlCode;
    }
    return sessionStorage.getItem('coach_invite_code') || '';
  })();

  // Validate invite code on mount
  useEffect(() => {
    // If we're on a Clerk sub-route (verification), stay in signup mode and don't interfere
    if (isClerkSubRoute()) {
      console.log('[Coach Invite] On Clerk sub-route, staying in signup mode');
      // Try to load cached data for display purposes
      const cached = code ? getCachedInviteData(code) : null;
      if (cached) {
        setInviteData(cached);
      }
      setStep("signup");
      return;
    }

    if (!code) {
      setErrorMessage("No invite code provided. Please use the link from your invitation email.");
      setStep("error");
      return;
    }

    // Check cache first
    const cached = getCachedInviteData(code);
    if (cached) {
      setInviteData(cached);
      setStep("welcome");
      return;
    }

    validateInvite();
  }, [code]);

  async function validateInvite() {
    try {
      const response = await fetch(`/api/coach/validate-invite?code=${encodeURIComponent(code)}`);
      const data = await response.json();
      
      if (!response.ok || !data.valid) {
        setErrorMessage(data.error || "Invalid or expired invite code.");
        setStep("error");
        return;
      }

      // Cache the valid response
      cacheInviteData(code, data);
      setInviteData(data);
      setStep("welcome");
    } catch (error) {
      console.error("Error validating invite:", error);
      setErrorMessage("Unable to validate invitation. Please try again.");
      setStep("error");
    }
  }

  // If user is already signed in, check email match then redirect to coach-setup
  useEffect(() => {
    if (!isLoaded) return;
    
    // Don't redirect during Clerk's verification flow - let Clerk handle it
    if (isClerkSubRoute()) {
      console.log('[Coach Invite] On Clerk sub-route, skipping redirect check');
      return;
    }
    
    if (isSignedIn && inviteData?.valid && code) {
      // Check email match first
      const currentEmail = clerkUser?.primaryEmailAddress?.emailAddress?.toLowerCase();
      const expectedEmail = inviteData.recipientEmail?.toLowerCase();
      
      if (expectedEmail && currentEmail && expectedEmail !== currentEmail) {
        // Email mismatch - show error instead of redirecting
        setMismatchEmails({ invite: inviteData.recipientEmail!, user: currentEmail });
        setStep("email_mismatch");
        return;
      }
      
      // User is already signed in with correct email, redirect to setup page
      window.location.href = `/coach-setup?code=${encodeURIComponent(code)}`;
    }
  }, [isLoaded, isSignedIn, inviteData, code, clerkUser]);

  if (step === "validating") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629] p-4">
        <Card className="w-full max-w-md" data-testid="card-validating">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" data-testid="loader-validating" />
            <p className="text-gray-600 dark:text-gray-300" data-testid="text-validating">
              Validating your invite code...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629] p-4">
        <Card className="w-full max-w-md" data-testid="card-error">
          <CardContent className="p-8">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" data-testid="icon-error" />
              <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100" data-testid="text-error-title">
                Invalid Invitation
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6" data-testid="text-error-message">
                {errorMessage}
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => {
                    setStep("validating");
                    setErrorMessage("");
                    validateInvite();
                  }}
                  className="w-full"
                  data-testid="button-retry"
                >
                  Try Again
                </Button>
                <Button
                  onClick={() => navigate("/")}
                  variant="outline"
                  className="w-full"
                  data-testid="button-back-home"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "email_mismatch") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629] p-4">
        <Card className="w-full max-w-md" data-testid="card-email-mismatch">
          <CardContent className="p-8">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" data-testid="icon-email-mismatch" />
              <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100" data-testid="text-mismatch-title">
                Wrong Account
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6" data-testid="text-mismatch-message">
                This invite was sent to <span className="font-semibold">{mismatchEmails?.invite}</span>. 
                You are currently signed in as <span className="font-semibold">{mismatchEmails?.user}</span>.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-700 dark:text-blue-200">
                  Please sign out and either create a new account with the invited email address, 
                  or open this link in a private/incognito browser window.
                </p>
              </div>
              <div className="space-y-3">
                <Button
                  onClick={() => signOut(() => window.location.reload())}
                  className="w-full"
                  data-testid="button-signout-mismatch"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out & Try Again
                </Button>
                <Button
                  onClick={() => navigate("/")}
                  variant="outline"
                  className="w-full"
                  data-testid="button-cancel-mismatch"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "signup") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629] p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Join {inviteData?.tenantName} as Coach
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Create your account to get started
            </p>
          </div>
          
          <SignUp 
            routing="path" 
            path="/join-as-coach"
            signInUrl="/login"
            forceRedirectUrl={`/coach-setup?code=${encodeURIComponent(code)}`}
            initialValues={{
              emailAddress: inviteData?.recipientEmail || '',
            }}
            unsafeMetadata={{
              signupType: 'coach_invite',
              inviteCode: code,
            }}
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
          
          <div className="text-center mt-6">
            <Button 
              variant="ghost"
              onClick={() => setStep("welcome")}
              className="text-sm text-gray-600 dark:text-gray-400"
              data-testid="button-back-welcome"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to invitation
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Welcome step (default after validation)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629] p-4">
      <Card className="w-full max-w-md" data-testid="card-welcome">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Users className="h-12 w-12 text-blue-600" data-testid="icon-welcome" />
          </div>
          <CardTitle className="text-2xl" data-testid="text-welcome-title">
            You're Invited!
          </CardTitle>
          <CardDescription data-testid="text-welcome-description">
            You've been invited to join <span className="font-semibold">{inviteData?.tenantName}</span> as a coach.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-700 dark:text-blue-200 text-center">
              Create an account or sign in to accept this invitation and start coaching.
            </p>
          </div>
          
          <Button 
            onClick={() => setStep("signup")}
            className="w-full"
            size="lg"
            data-testid="button-signup-continue"
          >
            Sign Up to Continue
          </Button>
          
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Already have an account?{" "}
              <a
                href={`/login?redirect=${encodeURIComponent(`/coach-setup?code=${code}`)}`}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                data-testid="link-signin"
              >
                Sign in here
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
