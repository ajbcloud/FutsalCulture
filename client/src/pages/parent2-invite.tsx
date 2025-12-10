import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, AlertCircle, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Parent2InviteData {
  valid: boolean;
  parent1?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  message?: string;
}

export default function Parent2Invite() {
  const [token, setToken] = useState<string>("");
  const [inviteData, setInviteData] = useState<Parent2InviteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Extract token from URL on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get("token");
    const pathToken = window.location.pathname.split('/').pop();
    
    const extractedToken = urlToken || (pathToken && pathToken !== "parent2-invite" ? pathToken : "");
    
    if (extractedToken) {
      setToken(extractedToken);
      validateToken(extractedToken);
    }
  }, []);

  const validateToken = async (tokenToValidate: string) => {
    if (!tokenToValidate) return;
    
    setValidating(true);
    try {
      const response = await apiRequest("GET", `/api/parent2-invite/validate/${tokenToValidate}`);
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

    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
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

    // Proceed with account creation (consent forms will be collected after login)
    setLoading(true);
    try {
      const response = await apiRequest("POST", `/api/parent2-invite/accept/${token}`, formData);

      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: "Account created successfully!",
          description: "You are now connected as the second parent/guardian.",
          variant: "default",
        });
        
        // Redirect to login page
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            <CardTitle>Join as Second Adult</CardTitle>
          </div>
          <CardDescription>
            Create your account to manage your children's activities together
          </CardDescription>
        </CardHeader>
        <CardContent>
          {inviteData.parent1 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-blue-900 dark:text-blue-100">Invitation from</h3>
              <p className="text-blue-700 dark:text-blue-200">
                {inviteData.parent1.firstName} {inviteData.parent1.lastName}
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                {inviteData.parent1.email}
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
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleFormChange("phone", e.target.value)}
                placeholder="Your phone number (optional)"
                data-testid="input-phone"
              />
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Note:</strong> By accepting this invitation, you'll be added as a second 
                parent/guardian and will have access to manage all players associated with{" "}
                {inviteData.parent1?.firstName}'s account.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !formData.firstName || !formData.lastName || !formData.email}
              data-testid="button-accept-invite"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Accept Invitation
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Need help?{" "}
              <button
                type="button"
                onClick={() => navigate("/help")}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Contact support
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}