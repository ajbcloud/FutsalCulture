import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Shield, CreditCard, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function SignupPlayerFlow() {
  const searchParams = new URLSearchParams(window.location.search);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const dob = searchParams.get("dob");
  const isTeen = searchParams.get("teen") === "true";
  const isAdult = searchParams.get("adult") === "true";
  const whoCanPay = searchParams.get("pay");
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Player info
  const [playerData, setPlayerData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    gender: "boys" as "boys" | "girls",
  });
  
  // Consents
  const [consents, setConsents] = useState({
    medical: false,
    liability: false,
    photo: false,
    privacy: false,
  });
  
  // Parent contact (for teens)
  const [parentContact, setParentContact] = useState({
    parentName: "",
    parentEmail: "",
    parentPhone: "",
  });

  const handlePlayerSubmit = () => {
    if (playerData.password !== playerData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      });
      return;
    }
    
    if (isTeen) {
      setStep(2); // Go to parent contact
    } else {
      setStep(3); // Go directly to consent
    }
  };

  const handleParentContactSubmit = () => {
    if (!parentContact.parentEmail) {
      toast({
        title: "Parent email required",
        description: "We need your parent's email to send them important information",
        variant: "destructive",
      });
      return;
    }
    setStep(3);
  };

  const handleConsentSubmit = async () => {
    if (!Object.values(consents).every(v => v)) {
      toast({
        title: "Consent required",
        description: "Please accept all terms to continue",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      // Create player account
      const response = await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          ...playerData,
          dateOfBirth: dob,
          role: "player",
          parentContact: isTeen ? parentContact : undefined,
        }),
      });
      
      // Record consents
      for (const [key, value] of Object.entries(consents)) {
        if (value) {
          await apiRequest("/api/consent", {
            method: "POST",
            body: JSON.stringify({
              subjectId: response.id,
              subjectRole: "player",
              policyKey: key,
              policyVersion: "1.0",
              acceptedBy: response.id,
            }),
          });
        }
      }
      
      // If teen, send notification to parent
      if (isTeen && parentContact.parentEmail) {
        await apiRequest("/api/notifications/parent-consent", {
          method: "POST",
          body: JSON.stringify({
            playerId: response.id,
            parentEmail: parentContact.parentEmail,
            parentName: parentContact.parentName,
          }),
        });
      }
      
      toast({
        title: "Account created!",
        description: isTeen 
          ? "Your parent will receive an email to complete setup" 
          : "You can now book sessions",
      });
      
      navigate("/dashboard");
    } catch (error) {
      console.error("Error creating account:", error);
      toast({
        title: "Error",
        description: "Failed to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        {step === 1 && (
          <>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <User className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-2xl">Your Information</CardTitle>
              <CardDescription>
                {isTeen ? "Create your teen account" : "Create your account"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isTeen && whoCanPay === "parent" && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You can view and book sessions, but a parent must handle payments
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={playerData.firstName}
                    onChange={(e) => setPlayerData({...playerData, firstName: e.target.value})}
                    data-testid="input-player-first-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={playerData.lastName}
                    onChange={(e) => setPlayerData({...playerData, lastName: e.target.value})}
                    data-testid="input-player-last-name"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={playerData.email}
                  onChange={(e) => setPlayerData({...playerData, email: e.target.value})}
                  data-testid="input-player-email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={playerData.phone}
                  onChange={(e) => setPlayerData({...playerData, phone: e.target.value})}
                  data-testid="input-player-phone"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Gender</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="gender"
                      value="boys"
                      checked={playerData.gender === "boys"}
                      onChange={(e) => setPlayerData({...playerData, gender: "boys"})}
                    />
                    Boys
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="gender"
                      value="girls"
                      checked={playerData.gender === "girls"}
                      onChange={(e) => setPlayerData({...playerData, gender: "girls"})}
                    />
                    Girls
                  </label>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={playerData.password}
                  onChange={(e) => setPlayerData({...playerData, password: e.target.value})}
                  data-testid="input-player-password"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={playerData.confirmPassword}
                  onChange={(e) => setPlayerData({...playerData, confirmPassword: e.target.value})}
                  data-testid="input-player-confirm-password"
                />
              </div>
              
              <Button 
                onClick={handlePlayerSubmit} 
                className="w-full"
                data-testid="button-continue"
              >
                Continue
              </Button>
            </CardContent>
          </>
        )}
        
        {step === 2 && isTeen && (
          <>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <User className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-2xl">Parent Contact</CardTitle>
              <CardDescription>
                We need your parent's contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your parent will receive an email to verify and manage your account
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label htmlFor="parentName">Parent's Name</Label>
                <Input
                  id="parentName"
                  value={parentContact.parentName}
                  onChange={(e) => setParentContact({...parentContact, parentName: e.target.value})}
                  placeholder="Full name"
                  data-testid="input-parent-name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="parentEmail">Parent's Email *</Label>
                <Input
                  id="parentEmail"
                  type="email"
                  value={parentContact.parentEmail}
                  onChange={(e) => setParentContact({...parentContact, parentEmail: e.target.value})}
                  placeholder="parent@example.com"
                  required
                  data-testid="input-parent-email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="parentPhone">Parent's Phone (Optional)</Label>
                <Input
                  id="parentPhone"
                  type="tel"
                  value={parentContact.parentPhone}
                  onChange={(e) => setParentContact({...parentContact, parentPhone: e.target.value})}
                  placeholder="(555) 123-4567"
                  data-testid="input-parent-phone"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleParentContactSubmit} 
                  className="flex-1"
                  data-testid="button-continue-to-consent"
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </>
        )}
        
        {step === 3 && (
          <>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Shield className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-2xl">Terms & Consent</CardTitle>
              <CardDescription>
                Please review and accept our terms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-start gap-2">
                  <Checkbox
                    checked={consents.medical}
                    onCheckedChange={(checked) => setConsents({...consents, medical: checked as boolean})}
                  />
                  <span className="text-sm">
                    {isTeen 
                      ? "I understand emergency medical procedures may be necessary"
                      : "I consent to emergency medical treatment if needed"}
                  </span>
                </label>
                
                <label className="flex items-start gap-2">
                  <Checkbox
                    checked={consents.liability}
                    onCheckedChange={(checked) => setConsents({...consents, liability: checked as boolean})}
                  />
                  <span className="text-sm">
                    I understand and accept the liability waiver
                  </span>
                </label>
                
                <label className="flex items-start gap-2">
                  <Checkbox
                    checked={consents.photo}
                    onCheckedChange={(checked) => setConsents({...consents, photo: checked as boolean})}
                  />
                  <span className="text-sm">
                    I consent to photos/videos being taken for promotional purposes
                  </span>
                </label>
                
                <label className="flex items-start gap-2">
                  <Checkbox
                    checked={consents.privacy}
                    onCheckedChange={(checked) => setConsents({...consents, privacy: checked as boolean})}
                  />
                  <span className="text-sm">
                    I have read and accept the privacy policy
                  </span>
                </label>
              </div>
              
              {isTeen && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your parent will need to confirm these consents via email
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setStep(isTeen ? 2 : 1)}
                  className="flex-1"
                  disabled={loading}
                >
                  Back
                </Button>
                <Button 
                  onClick={handleConsentSubmit} 
                  className="flex-1"
                  disabled={loading || !Object.values(consents).every(v => v)}
                  data-testid="button-create-account"
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}