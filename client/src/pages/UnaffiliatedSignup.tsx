import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { SignUp, useUser, useAuth } from "@clerk/clerk-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Users, ArrowRight, Home, CheckCircle2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";

type Step = "role_select" | "signup";

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
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  
  const [selectedRole, setSelectedRole] = useState<"parent" | "player">(getInitialRole);
  const [step, setStep] = useState<Step>(() => getInitialStep(selectedRole));
  
  const handleRoleSelect = (role: "parent" | "player") => {
    setSelectedRole(role);
    sessionStorage.setItem(ROLE_STORAGE_KEY, role);
  };

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
          <h1 className="text-3xl font-bold text-foreground">Join SkoreHQ</h1>
          <p className="text-muted-foreground">
            Create your account to manage players and join clubs
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
                  Register to manage your children's activities, book sessions, and handle payments.
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
                  Register as an adult player to book sessions and manage your own activities.
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
  const [isSyncing, setIsSyncing] = useState(false);
  const [needsBirthYear, setNeedsBirthYear] = useState<boolean | null>(null);
  const [birthYear, setBirthYear] = useState<string>("");
  const [birthYearError, setBirthYearError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentYear = new Date().getFullYear();
  const maxBirthYear = currentYear - 18;
  const minBirthYear = 1920;

  useEffect(() => {
    if (!isLoaded || !user) return;
    
    const role = user.unsafeMetadata?.role as string | undefined;
    
    if (role === "player") {
      setNeedsBirthYear(true);
    } else {
      setNeedsBirthYear(false);
    }
  }, [isLoaded, user]);

  useEffect(() => {
    if (needsBirthYear !== false || isSyncing) return;
    if (!isLoaded || !user) return;
    
    setIsSyncing(true);
    
    async function syncAndRedirect() {
      try {
        const token = await getToken();
        
        const response = await fetch("/api/user", {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          sessionStorage.removeItem(ROLE_STORAGE_KEY);
          sessionStorage.removeItem(FROM_GET_STARTED_KEY);
          
          toast({
            title: "Account created!",
            description: "Welcome to SkoreHQ. You can now manage your household and join clubs.",
          });
          
          navigate("/dashboard");
        } else {
          setTimeout(syncAndRedirect, 500);
        }
      } catch (error) {
        console.error("Error syncing user:", error);
        setTimeout(syncAndRedirect, 500);
      }
    }
    
    syncAndRedirect();
  }, [isLoaded, user, isSyncing, needsBirthYear, getToken, navigate, toast]);

  async function handleBirthYearSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBirthYearError("");
    
    const yearNum = parseInt(birthYear, 10);
    
    if (isNaN(yearNum)) {
      setBirthYearError("Please enter a valid birth year");
      return;
    }
    
    if (yearNum < minBirthYear || yearNum > maxBirthYear) {
      setBirthYearError(`Birth year must be between ${minBirthYear} and ${maxBirthYear}`);
      return;
    }
    
    const age = currentYear - yearNum;
    if (age < 18) {
      setBirthYearError("You must be 18 or older to register as a player");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const token = await getToken();
      
      const response = await fetch("/api/users/update-birth-year", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ birthYear: yearNum }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        setBirthYearError(data.error || "Failed to save birth year");
        setIsSubmitting(false);
        return;
      }
      
      setNeedsBirthYear(false);
    } catch (error) {
      console.error("Error submitting birth year:", error);
      setBirthYearError("An error occurred. Please try again.");
      setIsSubmitting(false);
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
              data-testid="button-go-to-signup"
            >
              Go to Signup
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (needsBirthYear) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629] p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <User className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">Verify Your Age</CardTitle>
            <CardDescription>
              As a player (18+), please confirm your birth year to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBirthYearSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="birthYear" className="text-sm font-medium text-foreground">
                  Birth Year
                </label>
                <input
                  id="birthYear"
                  type="number"
                  min={minBirthYear}
                  max={maxBirthYear}
                  value={birthYear}
                  onChange={(e) => {
                    setBirthYear(e.target.value);
                    setBirthYearError("");
                  }}
                  placeholder={`e.g., ${currentYear - 25}`}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  data-testid="input-birth-year"
                />
                <p className="text-xs text-muted-foreground">
                  You must be 18 or older (born in {maxBirthYear} or earlier)
                </p>
              </div>
              
              {birthYearError && (
                <p className="text-sm text-destructive" data-testid="text-birth-year-error">
                  {birthYearError}
                </p>
              )}
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting || !birthYear}
                data-testid="button-continue-birth-year"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
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
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Welcome to SkoreHQ!</CardTitle>
          <CardDescription>
            Your account is ready. Redirecting to your dashboard...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    </div>
  );
}
