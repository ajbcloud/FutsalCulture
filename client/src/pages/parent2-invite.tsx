import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { SignUp, useUser, useAuth } from "@clerk/clerk-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Users, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useTheme } from "@/contexts/ThemeContext";

interface Parent2InviteData {
  valid: boolean;
  parent1?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  invitedEmail?: string;
  message?: string;
}

type Step = "validating" | "show_invite" | "signup" | "invalid";

export default function Parent2Invite() {
  const [token, setToken] = useState<string>("");
  const [inviteData, setInviteData] = useState<Parent2InviteData | null>(null);
  const [step, setStep] = useState<Step>("validating");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const { isSignedIn, isLoaded } = useUser();
  const { getToken } = useAuth();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get("token");
    const pathToken = window.location.pathname.split('/').pop();
    
    const extractedToken = urlToken || (pathToken && pathToken !== "parent2-invite" ? pathToken : "");
    
    if (extractedToken) {
      setToken(extractedToken);
      validateToken(extractedToken);
    } else {
      setStep("invalid");
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    
    if (isSignedIn && token && inviteData?.valid) {
      handleJoinHousehold();
    }
  }, [isSignedIn, isLoaded, token, inviteData]);

  const validateToken = async (tokenToValidate: string) => {
    try {
      const response = await apiRequest("GET", `/api/parent2-invite/validate/${tokenToValidate}`);
      const data = await response.json();
      setInviteData(data);
      
      if (data.valid) {
        setStep("show_invite");
      } else {
        setStep("invalid");
        toast({
          title: "Invalid invitation",
          description: data.message || "This invitation is not valid or has expired.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error validating token:", error);
      setInviteData({
        valid: false,
        message: "Unable to validate invitation. Please check the link and try again."
      });
      setStep("invalid");
    }
  };

  const handleJoinHousehold = async () => {
    try {
      let authToken = await getToken();
      let retries = 0;
      while (!authToken && retries < 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        authToken = await getToken();
        retries++;
      }
      
      if (!authToken) {
        throw new Error("Could not authenticate. Please try again.");
      }
      
      const response = await fetch(`/api/parent2-invite/join/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        window.location.href = '/dashboard?joined=household';
      } else {
        throw new Error(data.message || "Failed to join household");
      }
    } catch (error: any) {
      console.error("Error joining household:", error);
      toast({
        title: "Error joining household",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
      navigate('/dashboard');
    }
  };

  const handleAcceptInvite = () => {
    setStep("signup");
  };

  if (step === "validating") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629]">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600 dark:text-gray-300">Validating invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "invalid") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629]">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Invalid Invitation</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {inviteData?.message || "This invitation is not valid or has expired."}
              </p>
              <Button onClick={() => navigate('/')} data-testid="button-go-home">
                Go to Homepage
              </Button>
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
              Create Your Account
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Join {inviteData?.parent1?.firstName}'s household
            </p>
          </div>
          
          <SignUp 
            routing="path" 
            path="/parent2-invite"
            signInUrl="/login"
            forceRedirectUrl={`/parent2-setup?token=${encodeURIComponent(token)}`}
            initialValues={{
              emailAddress: inviteData?.invitedEmail || '',
            }}
            unsafeMetadata={{
              signupType: 'parent2_invite',
              parent2InviteToken: token,
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
              onClick={() => setStep("show_invite")}
              className="text-sm text-gray-600 dark:text-gray-400"
              data-testid="button-back"
            >
              Back to invitation
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            <CardTitle>Join as Second Adult</CardTitle>
          </div>
          <CardDescription>
            You've been invited to co-manage a household
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {inviteData?.parent1 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 dark:text-blue-100">Invitation from</h3>
              <p className="text-blue-700 dark:text-blue-200">
                {inviteData.parent1.firstName} {inviteData.parent1.lastName}
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                {inviteData.parent1.email}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">What you'll get access to:</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>• View and manage all players in the household</li>
                <li>• Book training sessions</li>
                <li>• View upcoming schedules</li>
                <li>• Receive notifications about activities</li>
              </ul>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Note:</strong> You'll need to complete consent forms for the players 
                after creating your account.
              </p>
            </div>
          </div>

          <Button
            onClick={handleAcceptInvite}
            className="w-full"
            data-testid="button-accept-invite"
          >
            Create Account & Join
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => navigate(`/login?redirect=/parent2-setup?token=${encodeURIComponent(token)}`)}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium"
                data-testid="link-sign-in"
              >
                Sign in instead
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
