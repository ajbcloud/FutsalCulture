import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { UserCheck, Users, Shield, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ConsentDocumentModal from "@/components/consent/ConsentDocumentModal";

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
  
  // Consent document modal
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [signedConsents, setSignedConsents] = useState<any[]>([]);

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
    // Move to consent step - show consent modal
    setShowConsentModal(true);
  };

  const handleConsentComplete = async (signedDocuments: any[]) => {
    // Mandatory validation: prevent proceeding without signed documents
    if (!signedDocuments || signedDocuments.length === 0) {
      toast({
        title: "Consent Required",
        description: "You must sign all required consent documents to complete registration. Registration cannot proceed without valid consent.",
        variant: "destructive",
      });
      return; // Block further execution
    }
    
    setSignedConsents(signedDocuments);
    setShowConsentModal(false);
    
    // Complete the signup process only with validated documents
    await completeSignup(signedDocuments);
  };

  const completeSignup = async (consentDocuments: any[]) => {
    setLoading(true);
    try {
      // Validate consent documents exist
      if (!consentDocuments || consentDocuments.length === 0) {
        throw new Error("Consent documents are required to complete registration");
      }

      // Create parent account
      const parentResult = await apiRequest("POST", "/api/auth/register", {
        ...parentData,
        role: "parent",
        consentDocuments: consentDocuments.map(doc => doc.id), // Include consent document IDs
      });
      
      // Create child player
      const playerResult = await apiRequest("POST", "/api/players", {
        ...childData,
        dateOfBirth: dob,
        parentId: parentResult.id,
        consentDocuments: consentDocuments.map(doc => doc.id), // Include consent document IDs
      });
      
      // Create guardian link
      await apiRequest("POST", "/api/guardians", {
        parentId: parentResult.id,
        playerId: playerResult.id,
        permissionBook: true,
        permissionPay: true,
      });
      
      // Note: Consent documents are already signed and stored via the ConsentDocumentModal
      // The signed documents are linked to the player via the consent API
      
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
              <CardTitle className="text-2xl">Review Information</CardTitle>
              <CardDescription>
                Please review your information before proceeding to consent documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Parent Information</h3>
                  <p className="text-sm text-muted-foreground">
                    {parentData.firstName} {parentData.lastName} • {parentData.email}
                  </p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Child Information</h3>
                  <p className="text-sm text-muted-foreground">
                    {childData.firstName} {childData.lastName} • Born: {dob ? new Date(dob).toLocaleDateString() : 'Not provided'} • {childData.gender}
                  </p>
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-2">
                  <Shield className="h-4 w-4" />
                  <span className="font-medium">Next: Consent Documents</span>
                </div>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  You'll be asked to review and digitally sign consent documents including medical authorization, 
                  liability waivers, and photo releases for your child.
                </p>
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
                  onClick={handleChildSubmit} 
                  className="flex-1"
                  disabled={loading}
                  data-testid="button-review-consent"
                >
                  {loading ? "Processing..." : "Review & Sign Consent Documents"}
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {/* Consent Document Modal */}
        <ConsentDocumentModal
          isOpen={showConsentModal}
          onClose={() => {
            // Prevent closing without completion - show warning
            toast({
              title: "Consent Required",
              description: "You must complete all consent documents to proceed with registration.",
              variant: "destructive",
            });
          }}
          onComplete={handleConsentComplete}
          playerData={{
            firstName: childData.firstName,
            lastName: childData.lastName,
            birthDate: dob || ''
          }}
          parentData={{
            firstName: parentData.firstName,
            lastName: parentData.lastName
          }}
          isParentSigning={true}
        />
      </Card>
    </div>
  );
}