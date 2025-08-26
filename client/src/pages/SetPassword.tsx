import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, CheckCircle, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function SetPassword() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  
  // Get token from URL params
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") || "";

  useEffect(() => {
    // Verify token validity
    async function checkToken() {
      if (!token) {
        setError("Invalid verification link");
        setChecking(false);
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify_email?token=${encodeURIComponent(token)}`);
        const data = await response.json();
        
        if (data.ok) {
          setTokenValid(true);
        } else {
          setError(data.error || "Invalid or expired verification link");
        }
      } catch (err) {
        setError("Failed to verify link. Please try again.");
      } finally {
        setChecking(false);
      }
    }
    
    checkToken();
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validate passwords
    if (password.length < 10) {
      setError("Password must be at least 10 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    
    try {
      const response = await apiRequest("POST", "/api/auth/set_password", {
        token: token,
        password: password
      });
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success!",
          description: "Your password has been set and your account is verified.",
        });
        
        // Redirect to appropriate dashboard
        setTimeout(() => {
          navigate(data.redirect || "/admin");
        }, 1000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to set password");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-pulse">Verifying your link...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !tokenValid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Verification Failed</CardTitle>
            <CardDescription className="text-destructive">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Your verification link may have expired or is invalid. 
                Please request a new verification email.
              </p>
              <Button 
                onClick={() => navigate("/get-started")} 
                className="w-full"
                data-testid="button-request-new"
              >
                Request New Link
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Set Your Password</CardTitle>
          <CardDescription>
            Create a secure password to complete your account setup
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={10}
                data-testid="input-password"
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 10 characters
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={10}
                data-testid="input-confirm-password"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
              data-testid="button-set-password"
            >
              {loading ? "Setting Password..." : "Complete Setup"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}