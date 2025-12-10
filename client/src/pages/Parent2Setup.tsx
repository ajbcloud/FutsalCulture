import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useUser, useAuth } from "@clerk/clerk-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type SetupStatus = "loading" | "joining" | "success" | "error";

export default function Parent2Setup() {
  const [status, setStatus] = useState<SetupStatus>("loading");
  const [error, setError] = useState("");
  const [parent1Name, setParent1Name] = useState("");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { isSignedIn, isLoaded } = useUser();
  const { getToken } = useAuth();

  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      navigate(`/parent2-invite${token ? `?token=${token}` : ''}`);
      return;
    }

    if (!token) {
      toast({
        title: "Missing invitation token",
        description: "Please use the link from your invitation email",
        variant: "destructive",
      });
      navigate('/dashboard');
      return;
    }

    validateAndJoin();
  }, [isLoaded, isSignedIn, token]);

  async function validateAndJoin() {
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

      const response = await fetch(`/api/parent2-invite/join/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setParent1Name(data.parent1Name || "the primary parent");
        setStatus("success");
        
        setTimeout(() => {
          window.location.href = '/dashboard?joined=household';
        }, 2000);
      } else {
        throw new Error(data.message || "Failed to join household");
      }
    } catch (err: any) {
      console.error("Error joining household:", err);
      setError(err.message || "Failed to join household");
      setStatus("error");
    }
  }

  if (status === "loading" || status === "joining") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1629]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Joining Household...</CardTitle>
            <CardDescription>
              Please wait while we set up your account.
            </CardDescription>
          </CardHeader>
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
              onClick={() => navigate('/dashboard')}
              className="w-full"
              data-testid="button-go-dashboard"
            >
              Go to Dashboard
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              If you continue to have issues, please contact the person who invited you.
            </p>
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
          <CardTitle className="text-2xl">Welcome to the Household!</CardTitle>
          <CardDescription>
            You've successfully joined {parent1Name}'s household. Redirecting to your dashboard...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center">
            <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-blue-800 dark:text-blue-200">
              You can now view and manage players in this household.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
