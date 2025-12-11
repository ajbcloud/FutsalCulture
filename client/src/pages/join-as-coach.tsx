import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { SignUp, useUser, useAuth as useClerkAuth, useClerk } from "@clerk/clerk-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, CheckCircle2, Loader2, AlertCircle, ArrowLeft, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";

type Step = "validating" | "welcome" | "signup" | "joining" | "success" | "error" | "email_mismatch";

interface ValidateResponse {
  valid: boolean;
  tenantName?: string;
  tenantId?: string;
  recipientEmail?: string;
  error?: string;
}

export default function JoinAsCoach() {
  const [step, setStep] = useState<Step>("validating");
  const [errorMessage, setErrorMessage] = useState("");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const { isSignedIn } = useUser();
  const { getToken } = useClerkAuth();
  const { signOut } = useClerk();
  const { user, isAuthenticated } = useAuth();

  // Get code from URL or sessionStorage (Clerk navigation loses URL params during signup flow)
  const urlParams = new URLSearchParams(window.location.search);
  const urlCode = urlParams.get('code');
  
  // Store code in sessionStorage if we have it in URL, retrieve from storage if not
  const [code] = useState(() => {
    if (urlCode) {
      sessionStorage.setItem('coach_invite_code', urlCode);
      return urlCode;
    }
    return sessionStorage.getItem('coach_invite_code') || "";
  });

  const { data: validateData, isLoading: isValidating, error: validateError } = useQuery<ValidateResponse>({
    queryKey: ['/api/coach/validate-invite', code],
    queryFn: async () => {
      if (!code) {
        throw new Error("No invite code provided");
      }
      const response = await fetch(`/api/coach/validate-invite?code=${encodeURIComponent(code)}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Invalid invite code");
      }
      return data;
    },
    enabled: !!code,
    retry: false,
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      let token = await getToken();
      let retries = 0;
      while (!token && retries < 5) {
        await new Promise(resolve => setTimeout(resolve, 500));
        token = await getToken();
        retries++;
      }
      
      if (!token) {
        throw new Error("Could not authenticate. Please try again.");
      }

      const response = await fetch('/api/coach/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to join as coach");
      }
      return data;
    },
    onSuccess: () => {
      setStep("success");
      // Clear the stored invite code on success
      sessionStorage.removeItem('coach_invite_code');
      toast({
        title: "Welcome!",
        description: `You've successfully joined ${validateData?.tenantName} as a coach.`,
      });
      setTimeout(() => {
        window.location.href = '/coach/dashboard';
      }, 1500);
    },
    onError: (error: Error) => {
      setErrorMessage(error.message);
      setStep("error");
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!code) {
      setErrorMessage("No invite code provided. Please use the link from your invitation email.");
      setStep("error");
      return;
    }

    if (isValidating) {
      setStep("validating");
      return;
    }

    if (validateError) {
      setErrorMessage((validateError as Error).message || "Invalid or expired invite code.");
      setStep("error");
      return;
    }

    if (validateData?.valid) {
      if (isAuthenticated && isSignedIn && user?.email) {
        // Check if logged-in email matches invite email
        const inviteEmail = validateData.recipientEmail?.toLowerCase();
        const currentEmail = user.email?.toLowerCase();
        
        if (inviteEmail && currentEmail && inviteEmail !== currentEmail) {
          setErrorMessage(`This invite was sent to ${validateData.recipientEmail}. You are currently signed in as ${user.email}.`);
          setStep("email_mismatch");
        } else {
          setStep("joining");
          joinMutation.mutate();
        }
      } else {
        setStep("welcome");
      }
    } else if (validateData && !validateData.valid) {
      setErrorMessage(validateData.error || "Invalid or expired invite code.");
      setStep("error");
    }
  }, [code, isValidating, validateError, validateData, isAuthenticated, isSignedIn, user?.email]);

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
              <Button
                onClick={() => {
                  sessionStorage.removeItem('coach_invite_code');
                  navigate("/");
                }}
                variant="outline"
                data-testid="button-back-home"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
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
                {errorMessage}
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-700 dark:text-blue-200">
                  Please sign out and either create a new account with the invited email address, or open this link in a private/incognito browser window.
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

  if (step === "joining") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629] p-4">
        <Card className="w-full max-w-md" data-testid="card-joining">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" data-testid="loader-joining" />
            </div>
            <CardTitle className="text-2xl" data-testid="text-joining-title">
              Joining {validateData?.tenantName}...
            </CardTitle>
            <CardDescription data-testid="text-joining-description">
              Please wait while we set up your coach account.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629] p-4">
        <Card className="w-full max-w-md" data-testid="card-success">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" data-testid="icon-success" />
            </div>
            <CardTitle className="text-2xl" data-testid="text-success-title">
              Welcome to {validateData?.tenantName}!
            </CardTitle>
            <CardDescription data-testid="text-success-description">
              You've successfully joined as a coach. Redirecting to your dashboard...
            </CardDescription>
          </CardHeader>
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
              Join {validateData?.tenantName} as Coach
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Create your account to get started
            </p>
          </div>
          
          <SignUp 
            routing="path" 
            path="/join-as-coach"
            signInUrl="/login"
            forceRedirectUrl={`/join-as-coach?code=${encodeURIComponent(code)}`}
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
              onClick={() => navigate("/")}
              className="text-sm text-gray-600 dark:text-gray-400"
              data-testid="button-cancel-signup"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
            You've been invited to join <span className="font-semibold">{validateData?.tenantName}</span> as a coach.
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
                href={`/login?redirect=/join-as-coach?code=${encodeURIComponent(code)}`}
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
