import React, { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function PersonalSignup() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "parent" as "parent" | "player",
    dob: "",
    guardian_email: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Calculate if player is under 13
  const isUnder13 = formData.role === "player" && formData.dob && 
    new Date().getFullYear() - new Date(formData.dob).getFullYear() < 13;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.email || (!formData.password && !isUnder13) || 
        (formData.role === "player" && !formData.dob) ||
        (isUnder13 && !formData.guardian_email)) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest("POST", "/api/users/self-signup", {
        email: formData.email,
        password: isUnder13 ? undefined : formData.password,
        role: formData.role,
        dob: formData.role === "player" ? formData.dob : undefined,
        guardian_email: isUnder13 ? formData.guardian_email : undefined
      });

      if (response.ok) {
        setSuccess(true);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create account");
      }
    } catch (error) {
      console.error("Error creating account:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  // Calculate max date (must be at least 5 years old)
  const today = new Date();
  const maxDate = new Date(today.getFullYear() - 5, today.getMonth(), today.getDate());
  const maxDateStr = maxDate.toISOString().split('T')[0];
  
  // Calculate min date (maximum 100 years old)
  const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
  const minDateStr = minDate.toISOString().split('T')[0];

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <User className="h-12 w-12 text-green-600" />
            </div>
            <CardTitle className="text-2xl">You're all set!</CardTitle>
            <CardDescription>
              {isUnder13 
                ? "We've sent verification instructions to your guardian's email."
                : "Check your email to verify your account."
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Now join your club when you get an invite or team code.
              </p>
              <div className="space-y-2">
                <Button 
                  onClick={() => navigate("/join")}
                  className="w-full"
                >
                  Join your club
                </Button>
                <Button 
                  onClick={() => navigate("/login")}
                  variant="outline"
                  className="w-full"
                >
                  Go to Login
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <User className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Create your PlayHQ account</CardTitle>
          <CardDescription>
            Set up a personal account that you can use to join clubs later
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <Label htmlFor="role">I am a *</Label>
              <Select value={formData.role} onValueChange={(value: "parent" | "player") => 
                setFormData(prev => ({ ...prev, role: value, dob: "", guardian_email: "", password: "" }))
              }>
                <SelectTrigger data-testid="select-role">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="player">Player</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.role === "player" && (
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth *</Label>
                <Input
                  id="dob"
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData(prev => ({ ...prev, dob: e.target.value }))}
                  min={minDateStr}
                  max={maxDateStr}
                  required
                  data-testid="input-dob"
                />
                {isUnder13 && (
                  <p className="text-xs text-muted-foreground">
                    Since you're under 13, your guardian will need to verify this account.
                  </p>
                )}
              </div>
            )}

            {isUnder13 ? (
              <div className="space-y-2">
                <Label htmlFor="guardian_email">Guardian's Email *</Label>
                <Input
                  id="guardian_email"
                  type="email"
                  value={formData.guardian_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, guardian_email: e.target.value }))}
                  placeholder="parent@email.com"
                  required
                  data-testid="input-guardian-email"
                />
                <p className="text-xs text-muted-foreground">
                  Your guardian will receive verification instructions.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Choose a secure password"
                  required
                  data-testid="input-password"
                />
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
              data-testid="button-create-account"
            >
              {loading ? "Creating account..." : "Create account"}
            </Button>

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Or sign up with:
              </p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" asChild className="flex-1">
                  <a href="/api/auth/google">Google</a>
                </Button>
                <Button type="button" variant="outline" size="sm" asChild className="flex-1">
                  <a href="/api/auth/microsoft">Microsoft</a>
                </Button>
              </div>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <a href="/login" className="text-primary hover:underline">
                Sign in
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}