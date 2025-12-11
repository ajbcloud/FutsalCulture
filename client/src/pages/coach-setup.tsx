import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useUser, useAuth, useClerk } from "@clerk/clerk-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle, GraduationCap, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { clearCoachInviteCache } from "@/pages/join-as-coach";

type SetupStatus = "loading" | "validating" | "joining" | "success" | "error" | "email_mismatch";

interface ValidateResponse {
  valid: boolean;
  tenantName?: string;
  tenantId?: string;
  recipientEmail?: string;
  error?: string;
}

const CACHE_KEY = 'coach_invite_data';

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
    console.log('[Coach Setup] Cache parse error:', e);
  }
  return null;
}

export default function CoachSetup() {
  const [status, setStatus] = useState<SetupStatus>("loading");
  const [error, setError] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user: clerkUser, isSignedIn, isLoaded } = useUser();
  const { getToken } = useAuth();
  const { signOut } = useClerk();

  const urlParams = new URLSearchParams(window.location.search);
  const urlCode = urlParams.get('code');
  // Fall back to sessionStorage if not in URL (in case of redirect)
  const code = urlCode || sessionStorage.getItem('coach_invite_code');

  // Give Clerk time to establish session after email verification redirect
  // This prevents redirect loop when isLoaded=true but isSignedIn briefly=false
  useEffect(() => {
    if (!isLoaded) return;
    
    // If already signed in, proceed immediately
    if (isSignedIn) {
      setAuthCheckComplete(true);
      return;
    }
    
    // Not signed in yet - wait up to 2 seconds for Clerk session to establish
    // This handles the brief moment after email verification when isLoaded=true but isSignedIn=false
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) {
        setAuthCheckComplete(true);
      }
    }, 2000);
    
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    if (!authCheckComplete) return;

    if (!isSignedIn) {
      navigate(`/join-as-coach${code ? `?code=${code}` : ''}`);
      return;
    }

    if (!code) {
      toast({
        title: "Missing invite code",
        description: "Please use the link from your invitation email",
        variant: "destructive",
      });
      navigate('/');
      return;
    }

    validateAndJoin();
  }, [authCheckComplete, isSignedIn, code]);

  async function validateAndJoin() {
    setStatus("validating");
    
    try {
      // Check cache first, then fetch if needed
      let validateData: ValidateResponse | null = getCachedInviteData(code!);
      
      if (!validateData) {
        const validateResponse = await fetch(`/api/coach/validate-invite?code=${encodeURIComponent(code!)}`);
        validateData = await validateResponse.json();
        
        if (!validateResponse.ok || !validateData?.valid) {
          setError(validateData?.error || "Invalid or expired invite code.");
          setStatus("error");
          return;
        }
      }

      setTenantName(validateData.tenantName || "the organization");
      
      // Check email match
      const currentEmail = clerkUser?.primaryEmailAddress?.emailAddress?.toLowerCase();
      const expectedEmail = validateData.recipientEmail?.toLowerCase();
      
      if (expectedEmail && currentEmail && expectedEmail !== currentEmail) {
        setInviteEmail(validateData.recipientEmail || "");
        setUserEmail(currentEmail);
        setStatus("email_mismatch");
        return;
      }

      // Proceed to join
      await joinAsCoach();
    } catch (err: any) {
      console.error("Error validating invite:", err);
      setError(err.message || "Failed to validate invite");
      setStatus("error");
    }
  }

  async function joinAsCoach() {
    setStatus("joining");
    
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

      const response = await fetch('/api/coach/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (response.ok) {
        setTenantName(data.tenantName || tenantName || "the organization");
        setStatus("success");
        clearCoachInviteCache();
        
        toast({
          title: "Welcome!",
          description: `You've successfully joined as a coach.`,
        });
        
        setTimeout(() => {
          window.location.href = '/coach/dashboard';
        }, 2000);
      } else {
        throw new Error(data.message || data.error || "Failed to join as coach");
      }
    } catch (err: any) {
      console.error("Error joining as coach:", err);
      setError(err.message || "Failed to join as coach");
      setStatus("error");
    }
  }

  if (status === "loading" || status === "validating" || status === "joining") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            </div>
            <CardTitle className="text-2xl">
              {status === "joining" ? "Joining as Coach..." : "Validating..."}
            </CardTitle>
            <CardDescription>
              Please wait while we set up your coach account.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (status === "email_mismatch") {
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
                This invite was sent to <span className="font-semibold">{inviteEmail}</span>. 
                You are currently signed in as <span className="font-semibold">{userEmail}</span>.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-700 dark:text-blue-200">
                  Please sign out and either create a new account with the invited email address, 
                  or open this link in a private/incognito browser window.
                </p>
              </div>
              <div className="space-y-3">
                <Button
                  onClick={() => signOut(() => navigate(`/join-as-coach?code=${encodeURIComponent(code!)}`))}
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

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629] p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-red-600" />
            </div>
            <CardTitle className="text-xl text-red-600">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => {
                setStatus("loading");
                setError("");
                validateAndJoin();
              }}
              className="w-full"
              data-testid="button-retry"
            >
              Try Again
            </Button>
            <Button 
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full"
              data-testid="button-go-home"
            >
              Go to Homepage
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              If you continue to have issues, please contact the administrator who invited you.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Welcome to {tenantName}!</CardTitle>
          <CardDescription>
            You've successfully joined as a coach. Redirecting to your dashboard...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center">
            <GraduationCap className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-blue-800 dark:text-blue-200">
              You can now access your coach dashboard and manage sessions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
