import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { SignUp, useUser } from "@clerk/clerk-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";

type Step = "enter_code" | "signup" | "already_signed_in";

export default function Join() {
  const [step, setStep] = useState<Step>("enter_code");
  const [inviteCode, setInviteCode] = useState("");
  const [clubName, setClubName] = useState("");
  const [loading, setLoading] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const { isSignedIn } = useUser();

  // Handle code from URL in useEffect to avoid render-loop issues
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromUrl = urlParams.get('code');
    if (codeFromUrl && !inviteCode) {
      setInviteCode(codeFromUrl.toUpperCase());
    }
  }, []);

  async function handleValidateCode(e: React.FormEvent) {
    e.preventDefault();
    
    if (!inviteCode.trim()) {
      toast({
        title: "Please enter a code",
        description: "Enter the invite code from your club",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/auth/validate-invite-code?code=${encodeURIComponent(inviteCode.toUpperCase())}`);
      const data = await response.json();

      if (response.ok && data.valid) {
        setClubName(data.clubName);
        
        if (isSignedIn) {
          setStep("already_signed_in");
        } else {
          setStep("signup");
        }
      } else {
        toast({
          title: "Invalid code",
          description: data.error || "That invite code doesn't match any club. Please check and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error validating code:", error);
      toast({
        title: "Error",
        description: "Failed to validate code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinAsExistingUser() {
    setLoading(true);
    try {
      navigate(`/join-setup?code=${encodeURIComponent(inviteCode)}`);
    } finally {
      setLoading(false);
    }
  }

  if (step === "already_signed_in") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629] p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Join {clubName}</CardTitle>
            <CardDescription>
              You're already signed in. Continue to complete your profile and join the club.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleJoinAsExistingUser}
              className="w-full"
              disabled={loading}
              data-testid="button-continue-join"
            >
              {loading ? "Continuing..." : "Continue to Join"}
            </Button>
            <Button 
              variant="outline"
              onClick={() => setStep("enter_code")}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Use a different code
            </Button>
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
              Join {clubName}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Create your account to join with code: <span className="font-mono font-bold">{inviteCode}</span>
            </p>
          </div>
          
          <SignUp 
            routing="path" 
            path="/join"
            signInUrl="/login"
            forceRedirectUrl={`/join-setup?code=${encodeURIComponent(inviteCode)}`}
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
              onClick={() => setStep("enter_code")}
              className="text-sm text-gray-600 dark:text-gray-400"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Use a different code
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1629] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-4"
          data-testid="button-back-dashboard"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Users className="h-12 w-12 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Join Your Club</CardTitle>
            <CardDescription>
              Enter the invite code from your club to get started
            </CardDescription>
          </CardHeader>
        <CardContent>
          <form onSubmit={handleValidateCode} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inviteCode">Club Invite Code</Label>
              <Input
                id="inviteCode"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="e.g., WELCOME2025"
                required
                data-testid="input-invite-code"
                className="font-mono uppercase"
              />
              <p className="text-xs text-muted-foreground">
                This is the unique code your club shared with you
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
              data-testid="button-validate-code"
            >
              {loading ? "Validating..." : "Continue"}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t text-center">
            <p className="text-sm text-muted-foreground">
              Want to create your own club?{" "}
              <a href="/club-signup" className="text-blue-600 dark:text-blue-400 hover:underline">
                Get started free
              </a>
            </p>
          </div>
        </CardContent>
        </Card>
      </div>
    </div>
  );
}
