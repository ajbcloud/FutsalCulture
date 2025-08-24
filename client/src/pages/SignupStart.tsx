import React, { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function SignupStart() {
  const [dob, setDob] = useState("");
  const [loading, setLoading] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  async function handleNext() {
    if (!dob) {
      toast({
        title: "Date of birth required",
        description: "Please enter your date of birth to continue",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest("/api/signup/evaluate", {
        method: "POST",
        body: JSON.stringify({ 
          dob,
          tenantId: localStorage.getItem("tenantId") || undefined 
        }),
      });

      const { outcome, policy } = response;
      
      // Store policy outcome for use in next screens
      sessionStorage.setItem("signupPolicy", JSON.stringify(outcome));
      sessionStorage.setItem("signupDob", dob);
      
      if (outcome.parentRequired) {
        // User is a child, needs parent signup
        navigate(`/signup/parent?dob=${encodeURIComponent(dob)}`);
      } else if (outcome.teenSelf) {
        // User is a teen with self-access
        navigate(`/signup/player?dob=${encodeURIComponent(dob)}&teen=true&pay=${outcome.whoCanPay}`);
      } else {
        // User is an adult
        navigate(`/signup/player?dob=${encodeURIComponent(dob)}&adult=true`);
      }
    } catch (error) {
      console.error("Error evaluating signup:", error);
      toast({
        title: "Error",
        description: "Failed to process signup. Please try again.",
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Calendar className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Create Your Account</CardTitle>
          <CardDescription>
            Let's start with your date of birth to personalize your experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dob">Date of Birth</Label>
            <Input
              id="dob"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              min={minDateStr}
              max={maxDateStr}
              className="w-full"
              data-testid="input-dob"
            />
            <p className="text-xs text-muted-foreground">
              We use this to determine the appropriate signup process for you
            </p>
          </div>
          
          <Button 
            onClick={handleNext} 
            className="w-full" 
            disabled={loading || !dob}
            data-testid="button-continue"
          >
            {loading ? "Processing..." : "Continue"}
          </Button>
          
          <div className="text-center">
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