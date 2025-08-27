import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PlayerInviteData {
  valid: boolean;
  player?: {
    firstName: string;
    lastName: string;
    parentName: string;
  };
  message?: string;
}

export default function PlayerInvite() {
  const [token, setToken] = useState<string>("");
  const [inviteData, setInviteData] = useState<PlayerInviteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Extract token from URL on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get("token");
    const pathToken = window.location.pathname.split('/').pop();
    
    const extractedToken = urlToken || (pathToken && pathToken !== "player-invite" ? pathToken : "");
    
    if (extractedToken) {
      setToken(extractedToken);
      validateToken(extractedToken);
    }
  }, []);

  const validateToken = async (tokenToValidate: string) => {
    if (!tokenToValidate) return;
    
    setValidating(true);
    try {
      const response = await apiRequest("GET", `/api/player-invite/validate/${tokenToValidate}`);
      const data = await response.json();
      setInviteData(data);
      
      if (!data.valid) {
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
      toast({
        title: "Validation failed",
        description: "Unable to validate invitation. Please check the link and try again.",
        variant: "destructive",
      });
    } finally {
      setValidating(false);
    }
  };

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token || !inviteData?.valid) {
      toast({
        title: "Invalid invitation",
        description: "Please use a valid invitation link.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest("POST", `/api/player-invite/accept/${token}`, {
        password,
        email,
      });

      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: "Account created successfully!",
          description: "You can now sign in with your new account.",
          variant: "default",
        });
        
        // Redirect to login after successful account creation
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        throw new Error(result.message || "Failed to create account");
      }
    } catch (error) {
      console.error("Error accepting invite:", error);
      toast({
        title: "Account creation failed",
        description: error instanceof Error ? error.message : "Unable to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">Validating invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!inviteData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Invalid Invitation</h2>
              <p className="text-gray-600">
                Please check your invitation link and try again.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!inviteData.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Invitation Expired</h2>
              <p className="text-gray-600">
                {inviteData.message || "This invitation is no longer valid."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <CardTitle>Create Your Player Account</CardTitle>
          </div>
          <CardDescription>
            Complete your account setup to access the player portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          {inviteData.player && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-blue-900">Player Information</h3>
              <p className="text-blue-700">
                {inviteData.player.firstName} {inviteData.player.lastName}
              </p>
              <p className="text-sm text-blue-600">
                Invited by: {inviteData.player.parentName}
              </p>
            </div>
          )}

          <form onSubmit={handleAcceptInvite} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                data-testid="input-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                minLength={8}
                required
                data-testid="input-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                minLength={8}
                required
                data-testid="input-confirm-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !password || !confirmPassword || !email}
              data-testid="button-create-account"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Sign in here
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}