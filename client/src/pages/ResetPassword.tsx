import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Get token from URL params
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") || "";

  useEffect(() => {
    // Verify token validity
    async function checkToken() {
      if (!token) {
        setError("Invalid password reset link");
        setChecking(false);
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify_email?token=${encodeURIComponent(token)}`);
        const data = await response.json();
        
        if (data.ok) {
          setTokenValid(true);
        } else {
          setError(data.error || "Invalid or expired password reset link");
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
        if (data.ok) {
          setSuccess(true);
          toast({
            title: "Password Reset Successful",
            description: "Your password has been updated. You can now log in with your new password.",
          });
          
          // Redirect to login after 2 seconds
          setTimeout(() => {
            navigate("/login");
          }, 2000);
        } else {
          setError(data.error || "Failed to reset password");
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to reset password");
      }
    } catch (err) {
      console.error("Password reset error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
            <span className="ml-3">Verifying reset link...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-2xl">Link Invalid</CardTitle>
            <CardDescription>
              {error || "This password reset link is invalid or has expired."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/forgot">
              <Button className="w-full" data-testid="button-request-new-reset">
                Request New Reset Link
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="w-full" data-testid="link-back-to-login">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </Link>
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
            <div className="mx-auto mb-4 w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl">Password Reset Complete</CardTitle>
            <CardDescription>
              Your password has been successfully updated. You can now log in with your new password.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              You will be redirected to the login page shortly...
            </p>
            <Link href="/login">
              <Button className="w-full" data-testid="button-go-to-login">
                Go to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
            <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl">Create New Password</CardTitle>
          <CardDescription>
            Enter your new password below. Make sure it's secure and at least 10 characters long.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={10}
                placeholder="Enter new password (min 10 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="input-new-password"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                data-testid="input-confirm-password"
              />
            </div>
            
            <Button
              type="submit"
              disabled={loading || password.length < 10 || password !== confirmPassword}
              className="w-full"
              data-testid="button-reset-password"
            >
              {loading ? "Updating Password..." : "Update Password"}
            </Button>
          </form>

          <div className="text-center">
            <Link href="/login">
              <Button variant="ghost" className="text-sm" data-testid="link-back-to-login">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}