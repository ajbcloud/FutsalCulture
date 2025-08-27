import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, AlertCircle, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface InviteData {
  valid: boolean;
  invitation?: {
    id: string;
    type: string;
    recipientEmail: string;
    recipientName: string;
    role: string;
    tenantName: string;
    customMessage?: string;
    expiresAt: string;
  };
  message?: string;
}

export default function AcceptInvite() {
  const [token, setToken] = useState<string>("");
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Extract token from URL on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get("token");
    
    if (urlToken) {
      setToken(urlToken);
      validateToken(urlToken);
    }
  }, []);

  const validateToken = async (tokenToValidate: string) => {
    if (!tokenToValidate) return;
    
    setValidating(true);
    try {
      const response = await apiRequest("GET", `/api/invitations/${tokenToValidate}/validate`);
      const data = await response.json();
      setInviteData(data);
      
      if (!data.valid) {
        toast({
          title: "Invalid invitation",
          description: data.message || "This invitation is not valid or has expired.",
          variant: "destructive",
        });
      } else if (data.invitation) {
        // Pre-fill form with invitation data
        setFormData(prev => ({
          ...prev,
          firstName: data.invitation.recipientName?.split(' ')[0] || "",
          lastName: data.invitation.recipientName?.split(' ').slice(1).join(' ') || "",
          email: data.invitation.recipientEmail || "",
        }));
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

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest("POST", `/api/invitations/${token}/accept`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      });

      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: "Account created successfully!",
          description: `Welcome to ${inviteData.invitation?.tenantName}! You can now sign in with your new account.`,
          variant: "default",
        });
        
        // Redirect to login after successful account creation
        setTimeout(() => {
          navigate("/login?message=account-created");
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600 dark:text-gray-300">Validating invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!inviteData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Invalid Invitation</h2>
              <p className="text-gray-600 dark:text-gray-300">
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Invitation Expired</h2>
              <p className="text-gray-600 dark:text-gray-300">
                {inviteData.message || "This invitation is no longer valid."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const invitation = inviteData.invitation;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="w-6 h-6 text-blue-600" />
            <CardTitle className="text-gray-900 dark:text-gray-100">Accept Your Invitation</CardTitle>
          </div>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            Complete your account setup to join {invitation?.tenantName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invitation && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-blue-900 dark:text-blue-100">Invitation Details</h3>
              <p className="text-blue-700 dark:text-blue-200">
                <strong>Organization:</strong> {invitation.tenantName}
              </p>
              <p className="text-blue-700 dark:text-blue-200">
                <strong>Role:</strong> {invitation.role}
              </p>
              {invitation.customMessage && (
                <p className="text-sm text-blue-600 dark:text-blue-300 mt-2">
                  <strong>Message:</strong> {invitation.customMessage}
                </p>
              )}
              <p className="text-xs text-blue-500 dark:text-blue-400 mt-2">
                Expires: {new Date(invitation.expiresAt).toLocaleDateString()}
              </p>
            </div>
          )}

          <form onSubmit={handleAcceptInvite} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleFormChange("firstName", e.target.value)}
                  placeholder="Your first name"
                  required
                  data-testid="input-first-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleFormChange("lastName", e.target.value)}
                  placeholder="Your last name"
                  required
                  data-testid="input-last-name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleFormChange("email", e.target.value)}
                placeholder="your.email@example.com"
                required
                data-testid="input-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleFormChange("password", e.target.value)}
                placeholder="Create a secure password"
                minLength={8}
                required
                data-testid="input-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleFormChange("confirmPassword", e.target.value)}
                placeholder="Confirm your password"
                minLength={8}
                required
                data-testid="input-confirm-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword}
              data-testid="button-accept-invite"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Create Account & Join
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
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