import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Ticket, Check, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function SignupStart() {
  const [dob, setDob] = useState("");
  const [loading, setLoading] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Invite code state
  const [inviteCode, setInviteCode] = useState("");
  const [validatingCode, setValidatingCode] = useState(false);
  const [codeValidated, setCodeValidated] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [codeData, setCodeData] = useState<any>(null);
  const [showInviteCode, setShowInviteCode] = useState(false);

  // Check for invite code in URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const codeParam = urlParams.get('code');
    if (codeParam) {
      setInviteCode(codeParam.toUpperCase());
      setShowInviteCode(true);
      // Auto-validate the code from URL
      validateInviteCode(codeParam.toUpperCase());
    }
  }, []);

  async function validateInviteCode(code: string) {
    if (!code || code.length < 3) {
      setCodeError("");
      setCodeValidated(false);
      setCodeData(null);
      return;
    }

    setValidatingCode(true);
    setCodeError("");
    
    try {
      const response = await fetch(`/api/invite-codes/validate/${code}`);
      const result = await response.json();
      
      if (result.valid) {
        setCodeValidated(true);
        setCodeData(result);
        
        // Store in sessionStorage for use in next pages
        const inviteCodeData = {
          codeId: result.code?.id,
          code: result.code?.code,
          preFillData: result.preFillData,
          discountInfo: {
            discountType: result.preFillData?.discountType,
            discountValue: result.preFillData?.discountValue,
          }
        };
        sessionStorage.setItem('inviteCodeData', JSON.stringify(inviteCodeData));
        
        // Build success message
        const preFillItems = [];
        if (result.preFillData?.ageGroup) preFillItems.push('age group');
        if (result.preFillData?.gender) preFillItems.push('gender');
        if (result.preFillData?.location) preFillItems.push('location');
        if (result.preFillData?.club) preFillItems.push('club');
        
        let successMsg = 'Code accepted!';
        if (preFillItems.length > 0) {
          successMsg += ` ${preFillItems.join(', ')} will be pre-filled.`;
        }
        
        toast({
          title: "Invite code validated",
          description: successMsg,
        });
      } else {
        setCodeValidated(false);
        setCodeData(null);
        setCodeError(result.message || "Invalid invite code");
        sessionStorage.removeItem('inviteCodeData');
      }
    } catch (error) {
      console.error("Error validating invite code:", error);
      setCodeValidated(false);
      setCodeData(null);
      setCodeError("Failed to validate code. Please try again.");
      sessionStorage.removeItem('inviteCodeData');
    } finally {
      setValidatingCode(false);
    }
  }

  function handleInviteCodeChange(value: string) {
    const upperValue = value.toUpperCase();
    setInviteCode(upperValue);
    setCodeError("");
    setCodeValidated(false);
    
    // Validate when user stops typing (debounce would be better but keeping it simple)
    if (upperValue.length >= 3) {
      validateInviteCode(upperValue);
    } else {
      sessionStorage.removeItem('inviteCodeData');
      setCodeData(null);
    }
  }

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
      const response = await apiRequest("POST", "/api/signup/evaluate", { 
        dob,
        tenantId: localStorage.getItem("tenantId") || undefined 
      });

      const result = await response.json();
      const { outcome, policy } = result;
      
      // Store policy outcome for use in next screens
      sessionStorage.setItem("signupPolicy", JSON.stringify(outcome));
      sessionStorage.setItem("signupDob", dob);
      
      // Build URL with code parameter if validated
      const codeParam = codeValidated && inviteCode ? `&code=${inviteCode}` : '';
      
      if (outcome.parentRequired) {
        // User is a child, needs parent signup
        navigate(`/signup/parent?dob=${encodeURIComponent(dob)}${codeParam}`);
      } else if (outcome.teenSelf) {
        // User is a teen with self-access
        navigate(`/signup/player?dob=${encodeURIComponent(dob)}&teen=true&pay=${outcome.whoCanPay}${codeParam}`);
      } else {
        // User is an adult
        navigate(`/signup/player?dob=${encodeURIComponent(dob)}&adult=true${codeParam}`);
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
          {/* Invite Code Section */}
          <Collapsible open={showInviteCode} onOpenChange={setShowInviteCode}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-between"
                type="button"
                data-testid="button-toggle-invite-code"
              >
                <span className="flex items-center gap-2">
                  <Ticket className="h-4 w-4" />
                  Have an invite code?
                </span>
                {codeValidated && <Check className="h-4 w-4 text-green-600" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-2">
              <div className="space-y-2">
                <Label htmlFor="inviteCode">Invite Code</Label>
                <div className="relative">
                  <Input
                    id="inviteCode"
                    value={inviteCode}
                    onChange={(e) => handleInviteCodeChange(e.target.value)}
                    placeholder="Enter code (e.g., WELCOME2024)"
                    className="uppercase pr-10"
                    data-testid="input-invite-code"
                  />
                  {validatingCode && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  {codeValidated && !validatingCode && (
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-600" />
                  )}
                </div>
                
                {codeValidated && codeData && (
                  <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                    <Check className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      {codeData.message}
                      {codeData.preFillData?.discountType && (
                        <div className="mt-1 font-medium">
                          {codeData.preFillData.discountType === 'percentage' && 
                            `You'll receive ${codeData.preFillData.discountValue}% off!`}
                          {codeData.preFillData.discountType === 'fixed' && 
                            `You'll receive $${(codeData.preFillData.discountValue / 100).toFixed(2)} off!`}
                          {codeData.preFillData.discountType === 'full' && 
                            `You'll receive 100% off!`}
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
                
                {codeError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{codeError}</AlertDescription>
                  </Alert>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

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
