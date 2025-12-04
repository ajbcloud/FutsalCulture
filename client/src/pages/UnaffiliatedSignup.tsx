import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { SignUp, useUser, useAuth } from "@clerk/clerk-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Users, ArrowRight, Home, CheckCircle2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";
import { apiRequest } from "@/lib/queryClient";

type Step = "role_select" | "signup" | "completing";

const ROLE_STORAGE_KEY = "unaffiliatedSignupRole";
const FROM_GET_STARTED_KEY = "unaffiliatedFromGetStarted";

function getInitialRole(): "parent" | "player" {
  const searchParams = new URLSearchParams(window.location.search);
  const urlRole = searchParams.get("role") as "parent" | "player" | null;
  
  if (urlRole) {
    sessionStorage.setItem(ROLE_STORAGE_KEY, urlRole);
    sessionStorage.setItem(FROM_GET_STARTED_KEY, "true");
    return urlRole;
  }
  
  const storedRole = sessionStorage.getItem(ROLE_STORAGE_KEY) as "parent" | "player" | null;
  return storedRole || "parent";
}

function getInitialStep(role: "parent" | "player" | null): Step {
  const pathname = window.location.pathname;
  const isClerkSubRoute = pathname.startsWith("/signup/unaffiliated/") && 
                          !pathname.includes("/complete");
  
  if (isClerkSubRoute) {
    return "signup";
  }
  
  const searchParams = new URLSearchParams(window.location.search);
  const urlRole = searchParams.get("role");
  const storedRole = sessionStorage.getItem(ROLE_STORAGE_KEY);
  
  if (urlRole || storedRole) {
    return "signup";
  }
  
  return "role_select";
}

function cameFromGetStarted(): boolean {
  const searchParams = new URLSearchParams(window.location.search);
  const urlRole = searchParams.get("role");
  return !!urlRole || sessionStorage.getItem(FROM_GET_STARTED_KEY) === "true";
}

export default function UnaffiliatedSignup() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const { isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  
  const [selectedRole, setSelectedRole] = useState<"parent" | "player">(getInitialRole);
  const [step, setStep] = useState<Step>(() => getInitialStep(selectedRole));
  
  const handleRoleSelect = (role: "parent" | "player") => {
    setSelectedRole(role);
    sessionStorage.setItem(ROLE_STORAGE_KEY, role);
  };

  async function completeUnaffiliatedSignup() {
    if (!user) return;
    
    setStep("completing");
    
    try {
      const token = await getToken();
      
      const response = await fetch("/api/auth/unaffiliated-signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: user.primaryEmailAddress?.emailAddress,
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          clerkUserId: user.id,
          role: selectedRole,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        sessionStorage.removeItem(ROLE_STORAGE_KEY);
        sessionStorage.removeItem(FROM_GET_STARTED_KEY);
        
        toast({
          title: "Account created!",
          description: "Welcome to PlayHQ. You can now manage your household and join clubs.",
        });
        
        navigate("/dashboard");
      } else {
        throw new Error(data.error || "Failed to complete signup");
      }
    } catch (error) {
      console.error("Error completing signup:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to complete registration. Please try again.",
        variant: "destructive",
      });
      setStep("signup");
    }
  }

  if (step === "completing") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629] p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Setting up your account...</CardTitle>
            <CardDescription>
              Please wait while we complete your registration.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "signup") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629] p-4">
        <div className="w-full max-w-md">
          <Button
            variant="ghost"
            onClick={() => {
              if (cameFromGetStarted()) {
                sessionStorage.removeItem(ROLE_STORAGE_KEY);
                sessionStorage.removeItem(FROM_GET_STARTED_KEY);
                navigate("/get-started");
              } else {
                sessionStorage.removeItem(ROLE_STORAGE_KEY);
                setStep("role_select");
              }
            }}
            className="mb-2"
            data-testid="button-back-role"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Create your account
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Signing up as a {selectedRole === "parent" ? "Parent/Guardian" : "Player"}
            </p>
          </div>
          
          <SignUp
            routing="path"
            path="/signup/unaffiliated"
            signInUrl="/login"
            afterSignUpUrl={`/signup/unaffiliated/complete?role=${selectedRole}`}
            afterSignInUrl="/dashboard"
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
              },
            }}
            unsafeMetadata={{
              signupType: "unaffiliated",
              role: selectedRole,
            }}
          />

          <div className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
            Have an invite code?{" "}
            <a className="underline text-blue-600 dark:text-blue-400" href="/join">
              Join a club
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629] p-4">
      <div className="w-full max-w-lg space-y-4">
        <div className="text-center space-y-2 mb-6">
          <h1 className="text-3xl font-bold text-foreground">Join PlayHQ</h1>
          <p className="text-muted-foreground">
            Create your account to manage players and join futsal clubs
          </p>
        </div>

        <div className="grid gap-4">
          <Card 
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedRole === "parent" 
                ? "ring-2 ring-primary border-primary" 
                : "hover:border-primary/50"
            }`}
            onClick={() => handleRoleSelect("parent")}
            data-testid="card-role-parent"
          >
            <CardContent className="flex items-start gap-4 p-6">
              <div className={`p-3 rounded-full ${
                selectedRole === "parent" 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted"
              }`}>
                <Users className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">I'm a Parent/Guardian</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Register to manage your children's futsal activities, book sessions, and handle payments.
                </p>
              </div>
              {selectedRole === "parent" && (
                <CheckCircle2 className="h-6 w-6 text-primary" />
              )}
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedRole === "player" 
                ? "ring-2 ring-primary border-primary" 
                : "hover:border-primary/50"
            }`}
            onClick={() => handleRoleSelect("player")}
            data-testid="card-role-player"
          >
            <CardContent className="flex items-start gap-4 p-6">
              <div className={`p-3 rounded-full ${
                selectedRole === "player" 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted"
              }`}>
                <User className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">I'm a Player (18+)</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Register as an adult player to book sessions and manage your own futsal activities.
                </p>
              </div>
              {selectedRole === "player" && (
                <CheckCircle2 className="h-6 w-6 text-primary" />
              )}
            </CardContent>
          </Card>
        </div>

        <Button 
          className="w-full mt-6"
          size="lg"
          onClick={() => {
            sessionStorage.setItem(ROLE_STORAGE_KEY, selectedRole);
            setStep("signup");
          }}
          data-testid="button-continue-signup"
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        <div className="text-center space-y-3 pt-4">
          <div className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Button 
              variant="link" 
              className="p-0 h-auto font-semibold"
              onClick={() => navigate("/login")}
              data-testid="link-login-existing"
            >
              Sign in
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            Have an invite code from a club?{" "}
            <Button 
              variant="link" 
              className="p-0 h-auto font-semibold"
              onClick={() => navigate("/join")}
              data-testid="link-join-with-code"
            >
              Join with invite code
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="text-muted-foreground"
            data-testid="button-back-home"
          >
            <Home className="mr-2 h-4 w-4" />
            Back to home
          </Button>
        </div>
      </div>
    </div>
  );
}

export function UnaffiliatedSignupComplete() {
  const [, navigate] = useLocation();
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const { toast } = useToast();
  const [isCompleting, setIsCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const searchParams = new URLSearchParams(window.location.search);
  const role = (searchParams.get("role") as "parent" | "player") || "parent";

  async function completeSignup() {
    if (!user || isCompleting || completed) return;
    
    setIsCompleting(true);
    
    try {
      const token = await getToken();
      
      const response = await fetch("/api/auth/unaffiliated-signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: user.primaryEmailAddress?.emailAddress,
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          clerkUserId: user.id,
          role,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setCompleted(true);
        toast({
          title: "Account created!",
          description: "Welcome to PlayHQ. You can now manage your household and join clubs.",
        });
        
        setTimeout(() => navigate("/dashboard"), 1000);
      } else {
        throw new Error(data.error || "Failed to complete signup");
      }
    } catch (error) {
      console.error("Error completing signup:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to complete registration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCompleting(false);
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629] p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Loading...</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629] p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Session not found</CardTitle>
            <CardDescription>
              Please sign up again to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full"
              onClick={() => navigate("/signup/unaffiliated")}
            >
              Go to Signup
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {completed ? (
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            ) : (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            )}
          </div>
          <CardTitle className="text-2xl">
            {completed ? "Welcome to PlayHQ!" : "Completing your registration..."}
          </CardTitle>
          <CardDescription>
            {completed 
              ? "Your account is ready. Redirecting to your dashboard..." 
              : "Please wait while we set up your account."
            }
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          {!isCompleting && !completed && (
            <Button onClick={completeSignup} data-testid="button-complete-signup">
              Complete Signup
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
