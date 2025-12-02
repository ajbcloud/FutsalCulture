import React, { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Link as LinkIcon, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useUser, useClerk, useAuth } from "@clerk/clerk-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Join() {
  const [, params] = useRoute("/join");
  const [formData, setFormData] = useState({
    code: "",
    email: "",
    name: "",
    dateOfBirth: "",
    role: "player",
    guardianEmail: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user: clerkUser, isLoaded: clerkUserLoaded } = useUser();
  const { signOut } = useClerk();
  const { isSignedIn } = useAuth();

  // Check for invite token and need_code flag in URL
  const urlParams = new URLSearchParams(window.location.search);
  const inviteToken = urlParams.get('token');
  const needCode = urlParams.get('need_code') === 'true';

  useEffect(() => {
    // If there's an invite token, show the invite panel as primary
    if (inviteToken) {
      handleInviteAccept();
    }
  }, [inviteToken]);

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

  // Handle Clerk-authenticated user joining with a code
  async function handleClerkJoin(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.code) {
      toast({
        title: "Missing information",
        description: "Please enter a team code",
        variant: "destructive",
      });
      return;
    }

    if (!clerkUser) {
      toast({
        title: "Not authenticated",
        description: "Please log in first",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      // Note: clerk_user_id and email are derived server-side from the authenticated session
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
        
        // Sign out and redirect to login so user gets fresh session with org
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

  async function handleCodeJoin(e: React.FormEvent) {
    e.preventDefault();
    
    // If user is signed in via Clerk, use the Clerk join flow
    if (isSignedIn && clerkUser) {
      return handleClerkJoin(e);
    }
    
    if (!formData.code || !formData.email) {
      toast({
        title: "Missing information",
        description: "Please enter both a team code and your email",
        variant: "destructive",
      });
      return;
    }

    // Get current user from session (if logged in)
    const userResponse = await apiRequest("GET", "/api/user");
    let userId = null;
    
    if (userResponse.ok) {
      const userData = await userResponse.json();
      userId = userData?.id;
    }

    if (!userId) {
      toast({
        title: "Not authenticated",
        description: "Please log in or sign up first before joining with a code",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      const requestBody: any = {
        tenant_code: formData.code,
        email: formData.email,
        role: formData.role,
        user_id: userId
      };

      // Add optional fields
      if (formData.dateOfBirth) {
        requestBody.date_of_birth = formData.dateOfBirth;
      }
      if (formData.guardianEmail) {
        requestBody.guardian_email = formData.guardianEmail;
      }

      const response = await apiRequest("POST", "/api/beta/join-by-code", requestBody);

      if (response.ok) {
        const result = await response.json();
        
        if (result.requiresApproval) {
          setSuccess(true);
          toast({
            title: "Approval required",
            description: result.message || "Your request is pending approval",
          });
        } else {
          toast({
            title: "Successfully joined!",
            description: "Welcome to your organization. Redirecting...",
          });
          setTimeout(() => navigate("/app"), 1500);
        }
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

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Users className="h-12 w-12 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Pending approval</CardTitle>
            <CardDescription>
              Your request to join has been submitted to your club administrators.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                We'll email you when you've been approved and can access your club.
              </p>
              <Button 
                onClick={() => navigate("/")}
                className="w-full"
              >
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show simplified UI for Clerk users who need to enter a code
  if (needCode && isSignedIn && clerkUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Users className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">Join Your Club</CardTitle>
            <CardDescription>
              Hi {clerkUser.firstName || 'there'}! Enter your club's access code to continue.
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
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g., ABC12345"
                  required
                  autoFocus
                  data-testid="input-clerk-team-code"
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
                  data-testid="select-clerk-role"
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
                data-testid="button-clerk-join"
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
              >
                Sign out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-6">
        
        {/* Invite Link Panel */}
        <Card className={inviteToken ? "border-primary" : ""}>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <LinkIcon className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl">Have an invite link?</CardTitle>
            <CardDescription>
              {inviteToken 
                ? "Click below to accept your invitation" 
                : "If you received an invite link, click it to join automatically"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {inviteToken ? (
              <Button 
                onClick={handleInviteAccept}
                className="w-full"
                disabled={loading}
                data-testid="button-accept-invite"
              >
                {loading ? "Accepting invite..." : "Accept invite"}
              </Button>
            ) : (
              <div className="text-center text-sm text-muted-foreground">
                Invite links work automatically when you click them from your email.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Code Panel */}
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl">Have a team code?</CardTitle>
            <CardDescription>
              Enter your club's team code to join
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCodeJoin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Team/Club Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g., ABC12345"
                  required
                  data-testid="input-team-code"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your@email.com"
                  required
                  data-testid="input-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Joining as *</Label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  required
                  data-testid="select-role"
                >
                  <option value="player">Player</option>
                  <option value="parent">Parent</option>
                  <option value="coach">Coach</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth (optional)</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  data-testid="input-date-of-birth"
                />
                <p className="text-xs text-muted-foreground">
                  Required for players under 18. Minors will need approval.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="guardianEmail">Guardian Email (optional)</Label>
                <Input
                  id="guardianEmail"
                  type="email"
                  value={formData.guardianEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, guardianEmail: e.target.value }))}
                  placeholder="parent@email.com"
                  data-testid="input-guardian-email"
                />
                <p className="text-xs text-muted-foreground">
                  For minors: parent/guardian will be notified of approval status
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
                data-testid="button-join-code"
              >
                {loading ? "Joining..." : "Join with code"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <p className="text-sm text-muted-foreground text-center">
          Don't have a code?{" "}
          <a href="/signup" className="text-primary hover:underline">
            Create a personal account
          </a>
        </p>
      </div>
    </div>
  );
}