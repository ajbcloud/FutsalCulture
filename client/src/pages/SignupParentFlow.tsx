import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useSearch } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { UserCheck, Users, Shield, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function SignupParentFlow() {
  const searchParams = new URLSearchParams(window.location.search);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const dob = searchParams.get("dob");
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Parent info
  const [parentData, setParentData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  
  // Child info  
  const [childData, setChildData] = useState({
    firstName: "",
    lastName: "",
    gender: "boys" as "boys" | "girls",
  });
  
  // Consents
  const [consents, setConsents] = useState({
    medical: false,
    liability: false,
    photo: false,
    privacy: false,
  });

  const handleParentSubmit = () => {
    if (parentData.password !== parentData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      });
      return;
    }
    setStep(2);
  };

  const handleChildSubmit = () => {
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
      // Create parent account
      const parentResponse = await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          ...parentData,
          role: "parent",
        }),
      });
      
      // Create child player
      const playerResponse = await apiRequest("/api/players", {
        method: "POST",
        body: JSON.stringify({
          ...childData,
          dateOfBirth: dob,
          parentId: parentResponse.id,
        }),
      });
      
      // Create guardian link
      await apiRequest("/api/guardians", {
        method: "POST",
        body: JSON.stringify({
          parentId: parentResponse.id,
          playerId: playerResponse.id,
          permissionBook: true,
          permissionPay: true,
        }),
      });
      
      // Record consents
      for (const [key, value] of Object.entries(consents)) {
        if (value) {
          await apiRequest("/api/consent", {
            method: "POST",
            body: JSON.stringify({
              subjectId: playerResponse.id,
              subjectRole: "player",
              policyKey: key,
              policyVersion: "1.0",
              acceptedBy: parentResponse.id,
            }),
          });
        }
      }
      
      toast({
        title: "Account created!",
        description: "You can now book sessions for your child",
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
                <UserCheck className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-2xl">Parent Information</CardTitle>
              <CardDescription>
                Let's start with your information as the parent or guardian
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={parentData.firstName}
                    onChange={(e) => setParentData({...parentData, firstName: e.target.value})}
                    data-testid="input-parent-first-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={parentData.lastName}
                    onChange={(e) => setParentData({...parentData, lastName: e.target.value})}
                    data-testid="input-parent-last-name"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={parentData.email}
                  onChange={(e) => setParentData({...parentData, email: e.target.value})}
                  data-testid="input-parent-email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={parentData.phone}
                  onChange={(e) => setParentData({...parentData, phone: e.target.value})}
                  data-testid="input-parent-phone"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={parentData.password}
                  onChange={(e) => setParentData({...parentData, password: e.target.value})}
                  data-testid="input-parent-password"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={parentData.confirmPassword}
                  onChange={(e) => setParentData({...parentData, confirmPassword: e.target.value})}
                  data-testid="input-parent-confirm-password"
                />
              </div>
              
              <Button 
                onClick={handleParentSubmit} 
                className="w-full"
                data-testid="button-continue-to-child"
              >
                Continue
              </Button>
            </CardContent>
          </>
        )}
        
        {step === 2 && (
          <>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Users className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-2xl">Child Information</CardTitle>
              <CardDescription>
                Now let's add your child's information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="childFirstName">First Name</Label>
                  <Input
                    id="childFirstName"
                    value={childData.firstName}
                    onChange={(e) => setChildData({...childData, firstName: e.target.value})}
                    data-testid="input-child-first-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="childLastName">Last Name</Label>
                  <Input
                    id="childLastName"
                    value={childData.lastName}
                    onChange={(e) => setChildData({...childData, lastName: e.target.value})}
                    data-testid="input-child-last-name"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Gender</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="gender"
                      value="boys"
                      checked={childData.gender === "boys"}
                      onChange={(e) => setChildData({...childData, gender: "boys"})}
                    />
                    Boys
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="gender"
                      value="girls"
                      checked={childData.gender === "girls"}
                      onChange={(e) => setChildData({...childData, gender: "girls"})}
                    />
                    Girls
                  </label>
                </div>
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
                  onClick={handleChildSubmit} 
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
                    I consent to emergency medical treatment for my child if needed
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
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setStep(2)}
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