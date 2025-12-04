import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useUser, useAuth } from "@clerk/clerk-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Users, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type JoinStatus = "loading" | "select_role" | "joining" | "pending_approval" | "success" | "error";

export default function JoinSetup() {
  const [status, setStatus] = useState<JoinStatus>("loading");
  const [role, setRole] = useState<"parent" | "player">("parent");
  const [clubName, setClubName] = useState("");
  const [error, setError] = useState("");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { isSignedIn, isLoaded } = useUser();
  const { getToken } = useAuth();

  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      navigate(`/join${code ? `?code=${code}` : ''}`);
      return;
    }

    if (!code) {
      toast({
        title: "Missing invite code",
        description: "Please enter your club's invite code",
        variant: "destructive",
      });
      navigate('/join');
      return;
    }

    validateCode();
  }, [isLoaded, isSignedIn, code]);

  async function validateCode() {
    try {
      const response = await fetch(`/api/auth/validate-invite-code?code=${encodeURIComponent(code!)}`);
      const data = await response.json();

      if (response.ok && data.valid) {
        setClubName(data.clubName);
        setStatus("select_role");
      } else {
        setError(data.error || "Invalid invite code");
        setStatus("error");
      }
    } catch (err) {
      console.error("Error validating code:", err);
      setError("Failed to validate code");
      setStatus("error");
    }
  }

  async function handleJoin() {
    setStatus("joining");
    
    try {
      const token = await getToken();
      
      const response = await fetch('/api/auth/join-club', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          code,
          role,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.requiresApproval) {
          setStatus("pending_approval");
        } else {
          setStatus("success");
          toast({
            title: "Welcome!",
            description: `You've joined ${clubName}`,
          });
          setTimeout(() => navigate('/app'), 1500);
        }
      } else {
        throw new Error(data.error || "Failed to join club");
      }
    } catch (err: any) {
      console.error("Error joining club:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to join club",
        variant: "destructive",
      });
      setStatus("select_role");
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629] p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-red-600">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/join')}
              className="w-full"
            >
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "pending_approval") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629] p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Request Submitted</CardTitle>
            <CardDescription>
              Your request to join {clubName} has been submitted. You'll receive an email when an admin approves your membership.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/')}
              className="w-full"
            >
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629] p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Welcome!</CardTitle>
            <CardDescription>
              You've successfully joined {clubName}. Redirecting to your dashboard...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Users className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Join {clubName}</CardTitle>
          <CardDescription>
            Choose how you'd like to join this club
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup value={role} onValueChange={(v) => setRole(v as "parent" | "player")}>
            <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800">
              <RadioGroupItem value="parent" id="parent" />
              <Label htmlFor="parent" className="flex-1 cursor-pointer">
                <div className="font-medium">Parent/Guardian</div>
                <div className="text-sm text-muted-foreground">
                  I'm registering children for the club
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800">
              <RadioGroupItem value="player" id="player" />
              <Label htmlFor="player" className="flex-1 cursor-pointer">
                <div className="font-medium">Player</div>
                <div className="text-sm text-muted-foreground">
                  I'm joining as a player myself
                </div>
              </Label>
            </div>
          </RadioGroup>

          <Button 
            onClick={handleJoin}
            className="w-full"
            disabled={status === "joining"}
            data-testid="button-join-club"
          >
            {status === "joining" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Joining...
              </>
            ) : (
              "Join Club"
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Your membership may require admin approval before you can access all features.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
