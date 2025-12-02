import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SignUp, useAuth, useUser } from "@clerk/clerk-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Loader2, AlertCircle, ArrowLeft } from "lucide-react";

interface TokenResponse {
  success: boolean;
  message?: string;
  prefill?: {
    firstName: string;
    lastName: string;
    email: string;
    orgName: string;
  };
}

export default function ClerkBusinessSignup() {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const [location, setLocation] = useLocation();
  const { isSignedIn, userId } = useAuth();
  const { user } = useUser();
  
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token") || "";

  const { data, isLoading, error } = useQuery<TokenResponse>({
    queryKey: ["/api/auth/business-signup/token", token],
    queryFn: async () => {
      const res = await fetch(`/api/auth/business-signup/token/${token}`);
      return res.json();
    },
    enabled: !!token,
    retry: false,
  });

  useEffect(() => {
    if (isSignedIn && userId && token && data?.success) {
      setLocation(`/signup/clerk/callback?token=${token}`);
    }
  }, [isSignedIn, userId, token, data?.success, setLocation]);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629] p-4">
        <Card className={`w-full max-w-md ${isDarkMode ? "bg-slate-800 border-slate-700" : ""}`}>
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
            <h2 className={`text-xl font-semibold mb-2 ${isDarkMode ? "text-white" : ""}`}>
              Missing Signup Token
            </h2>
            <p className={`mb-4 ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}>
              Please start the signup process from the beginning.
            </p>
            <Button onClick={() => setLocation("/signup-business")} data-testid="button-restart-signup">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Start Over
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629]">
        <div className="text-center">
          <Loader2 className={`h-8 w-8 animate-spin mx-auto mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`} />
          <p className={isDarkMode ? "text-slate-400" : "text-gray-600"}>Loading your information...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629] p-4">
        <Card className={`w-full max-w-md ${isDarkMode ? "bg-slate-800 border-slate-700" : ""}`}>
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h2 className={`text-xl font-semibold mb-2 ${isDarkMode ? "text-white" : ""}`}>
              Invalid or Expired Link
            </h2>
            <p className={`mb-4 ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}>
              {data?.message || "This signup link is no longer valid. Please start the signup process again."}
            </p>
            <Button onClick={() => setLocation("/signup-business")} data-testid="button-restart-signup">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Start Over
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const prefill = data.prefill;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629] p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 ${
            isDarkMode ? "bg-blue-900/30 text-blue-400" : "bg-blue-50 text-blue-700"
          }`}>
            <Building2 className="h-4 w-4" />
            <span className="text-sm font-medium">{prefill?.orgName}</span>
          </div>
          <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Create Your Account
          </h1>
          <p className={`text-sm mt-2 ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}>
            Step 2 of 2: Set up your login credentials
          </p>
        </div>

        <Card className={isDarkMode ? "bg-slate-800 border-slate-700" : ""}>
          <CardContent className="pt-6 flex justify-center">
            <SignUp
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none p-0 bg-transparent",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton: "hidden",
                  dividerRow: "hidden",
                  formFieldInput: isDarkMode 
                    ? "bg-slate-700 border-slate-600 text-white" 
                    : "",
                  formButtonPrimary: "bg-blue-600 hover:bg-blue-700",
                  footerActionLink: "text-blue-600 hover:text-blue-700",
                  identityPreviewEditButton: "text-blue-600",
                },
                variables: {
                  colorPrimary: "#2563eb",
                  colorBackground: isDarkMode ? "#1e293b" : "#ffffff",
                  colorText: isDarkMode ? "#f1f5f9" : "#0f172a",
                  colorInputBackground: isDarkMode ? "#334155" : "#ffffff",
                  colorInputText: isDarkMode ? "#f1f5f9" : "#0f172a",
                },
              }}
              initialValues={{
                emailAddress: prefill?.email || "",
                firstName: prefill?.firstName || "",
                lastName: prefill?.lastName || "",
              }}
              signInUrl="/login-business"
              forceRedirectUrl={`/signup/clerk/callback?token=${token}`}
            />
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/signup-business")}
            className={isDarkMode ? "text-slate-400 hover:text-slate-200" : "text-gray-600 hover:text-gray-900"}
            data-testid="button-back"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to club details
          </Button>
        </div>
      </div>
    </div>
  );
}
