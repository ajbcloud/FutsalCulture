import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useUser, useClerk, useAuth } from "@clerk/clerk-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Join() {
  const [formData, setFormData] = useState({
    code: "",
    role: "parent"
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user: clerkUser, isLoaded: clerkUserLoaded } = useUser();
  const { signOut } = useClerk();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();

  const urlParams = new URLSearchParams(window.location.search);
  const inviteToken = urlParams.get('token');

  useEffect(() => {
    if (inviteToken && isSignedIn) {
      handleInviteAccept();
    }
  }, [inviteToken, isSignedIn]);

  useEffect(() => {
    if (!authLoaded) return;
    
    if (!isSignedIn && !inviteToken) {
      navigate("/login");
    }
  }, [authLoaded, isSignedIn, inviteToken, navigate]);

  async function handleInviteAccept() {
    if (!inviteToken) return;
    
    setLoading(true);
    try {
      const response = await apiRequest("POST", "/api/join/by-token", {
        token: inviteToken
      });

      if (response.ok) {
        toast({
          title: "Invite accepted!",
          description: "Welcome to your club. Redirecting...",
        });
        setTimeout(() => navigate("/app"), 1500);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to accept invite");
      }
    } catch (error) {
      console.error("Error accepting invite:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to accept invite. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleClerkJoin(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.code) {
      toast({
        title: "Missing information",
        description: "Please enter a club access code",
        variant: "destructive",
      });
      return;
    }

    if (!clerkUser) {
      toast({
        title: "Not authenticated",
        description: "Please sign in first",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest("POST", "/api/beta/clerk-join-by-code", {
        tenant_code: formData.code,
        first_name: clerkUser.firstName || '',
        last_name: clerkUser.lastName || '',
        role: formData.role
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Successfully joined!",
          description: `Welcome to ${result.tenantName}. Please sign in again to continue.`,
        });
        
        await signOut();
        setTimeout(() => navigate("/login"), 1500);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to join with code");
      }
    } catch (error) {
      console.error("Error joining with code:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to join. Please check your code and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  if (!authLoaded || !clerkUserLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (inviteToken) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Users className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">Accept Invitation</CardTitle>
            <CardDescription>
              {isSignedIn 
                ? "Accepting your club invitation..." 
                : "Please sign in to accept your invitation"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            {isSignedIn ? (
              <div className="flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Processing...</span>
              </div>
            ) : (
              <Button onClick={() => navigate("/login")} className="w-full">
                Sign in to continue
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Users className="h-12 w-12 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Request Submitted</CardTitle>
            <CardDescription>
              Your request to join has been submitted to the club administrators.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                We'll notify you when you've been approved.
              </p>
              <Button 
                onClick={() => navigate("/")}
                className="w-full"
                data-testid="button-back-home"
              >
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Users className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Join Your Club</CardTitle>
          <CardDescription>
            Hi {clerkUser?.firstName || 'there'}! Enter your club's access code to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You're signed in but not yet part of a club. Enter the code your club provided to get started.
            </AlertDescription>
          </Alert>
          
          <form onSubmit={handleClerkJoin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Club Access Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                placeholder="e.g., futsal-culture"
                required
                autoFocus
                data-testid="input-club-code"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">I am a *</Label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                required
                data-testid="select-role"
              >
                <option value="parent">Parent/Guardian</option>
                <option value="player">Player</option>
                <option value="coach">Coach</option>
              </select>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
              data-testid="button-join-club"
            >
              {loading ? "Joining..." : "Join Club"}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t text-center">
            <p className="text-sm text-muted-foreground">
              Don't have a code?{" "}
              <a href="/get-started" className="text-primary hover:underline">
                Create your own club
              </a>
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => signOut()}
              data-testid="button-sign-out"
            >
              Sign out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
