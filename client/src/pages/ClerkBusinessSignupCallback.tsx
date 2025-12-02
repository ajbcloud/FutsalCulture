import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertCircle, ArrowLeft, PartyPopper } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface AttachResponse {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    tenantId: string;
  };
  tenant?: {
    id: string;
    name: string;
    subdomain: string;
  };
}

export default function ClerkBusinessSignupCallback() {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const [, setLocation] = useLocation();
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const [attachmentAttempted, setAttachmentAttempted] = useState(false);
  
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token") || "";

  const attachMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/business-signup/attach", {
        token,
        clerkUserId: userId,
      });
      return response.json() as Promise<AttachResponse>;
    },
    onSuccess: (data) => {
      if (data.success) {
        setTimeout(() => {
          setLocation("/admin");
        }, 2000);
      }
    },
  });

  useEffect(() => {
    if (isLoaded && isSignedIn && userId && token && !attachmentAttempted) {
      setAttachmentAttempted(true);
      attachMutation.mutate();
    }
  }, [isLoaded, isSignedIn, userId, token, attachmentAttempted]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629]">
        <div className="text-center">
          <Loader2 className={`h-8 w-8 animate-spin mx-auto mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`} />
          <p className={isDarkMode ? "text-slate-400" : "text-gray-600"}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629] p-4">
        <Card className={`w-full max-w-md ${isDarkMode ? "bg-slate-800 border-slate-700" : ""}`}>
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
            <h2 className={`text-xl font-semibold mb-2 ${isDarkMode ? "text-white" : ""}`}>
              Not Signed In
            </h2>
            <p className={`mb-4 ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}>
              Please complete the signup process to continue.
            </p>
            <Button onClick={() => setLocation(`/signup/clerk?token=${token}`)} data-testid="button-back-to-signup">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Signup
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629] p-4">
        <Card className={`w-full max-w-md ${isDarkMode ? "bg-slate-800 border-slate-700" : ""}`}>
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h2 className={`text-xl font-semibold mb-2 ${isDarkMode ? "text-white" : ""}`}>
              Missing Token
            </h2>
            <p className={`mb-4 ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}>
              Something went wrong. Please restart the signup process.
            </p>
            <Button onClick={() => setLocation("/signup-business")} data-testid="button-restart">
              Start Over
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (attachMutation.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629]">
        <div className="text-center">
          <Loader2 className={`h-8 w-8 animate-spin mx-auto mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`} />
          <h2 className={`text-xl font-semibold mb-2 ${isDarkMode ? "text-white" : ""}`}>
            Setting Up Your Club
          </h2>
          <p className={isDarkMode ? "text-slate-400" : "text-gray-600"}>
            Just a moment while we finalize everything...
          </p>
        </div>
      </div>
    );
  }

  if (attachMutation.error || (attachMutation.data && !attachMutation.data.success)) {
    const errorMessage = attachMutation.data?.message || 
      (attachMutation.error as any)?.message || 
      "Failed to complete setup";
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629] p-4">
        <Card className={`w-full max-w-md ${isDarkMode ? "bg-slate-800 border-slate-700" : ""}`}>
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h2 className={`text-xl font-semibold mb-2 ${isDarkMode ? "text-white" : ""}`}>
              Setup Failed
            </h2>
            <p className={`mb-4 ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}>
              {errorMessage}
            </p>
            <div className="space-y-2">
              <Button onClick={() => attachMutation.mutate()} className="w-full" data-testid="button-retry">
                Try Again
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setLocation("/signup-business")} 
                className="w-full"
                data-testid="button-start-over"
              >
                Start Over
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (attachMutation.data?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629] p-4">
        <Card className={`w-full max-w-md ${isDarkMode ? "bg-slate-800 border-slate-700" : ""}`}>
          <CardContent className="pt-6 text-center">
            <div className="relative inline-block mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <PartyPopper className="h-6 w-6 absolute -top-1 -right-1 text-amber-500" />
            </div>
            <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? "text-white" : ""}`}>
              Welcome to PlayHQ!
            </h2>
            <p className={`mb-2 ${isDarkMode ? "text-slate-300" : "text-gray-700"}`}>
              Your club <strong>{attachMutation.data.tenant?.name}</strong> is ready.
            </p>
            <p className={`text-sm mb-6 ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}>
              Redirecting you to your dashboard...
            </p>
            <div className="flex justify-center">
              <Loader2 className={`h-5 w-5 animate-spin ${isDarkMode ? "text-slate-400" : "text-gray-400"}`} />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629]">
      <div className="text-center">
        <Loader2 className={`h-8 w-8 animate-spin mx-auto mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`} />
        <p className={isDarkMode ? "text-slate-400" : "text-gray-600"}>Processing...</p>
      </div>
    </div>
  );
}
