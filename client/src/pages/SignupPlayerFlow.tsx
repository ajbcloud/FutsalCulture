import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Shield, CreditCard, AlertCircle, Ticket } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ConsentDocumentModal from "@/components/consent/ConsentDocumentModal";
import { useUserTerminology } from "@/hooks/use-user-terminology";
import { Badge } from "@/components/ui/badge";

export default function SignupPlayerFlow() {
  const { term } = useUserTerminology();
  const searchParams = new URLSearchParams(window.location.search);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const dob = searchParams.get("dob");
  const isTeen = searchParams.get("teen") === "true";
  const isAdult = searchParams.get("adult") === "true";
  const whoCanPay = searchParams.get("pay");
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Invite code data
  const [inviteCodeData, setInviteCodeData] = useState<any>(null);
  const [preFilledFields, setPreFilledFields] = useState<string[]>([]);
  
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
  
  // Consent document modal
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [signedConsents, setSignedConsents] = useState<any[]>([]);
  
  // Parent contact (for teens)
  const [parentContact, setParentContact] = useState({
    parentName: "",
    parentEmail: "",
    parentPhone: "",
  });

  // Load invite code data from sessionStorage on mount
  useEffect(() => {
    const storedCodeData = sessionStorage.getItem('inviteCodeData');
    if (storedCodeData) {
      try {
        const codeData = JSON.parse(storedCodeData);
        setInviteCodeData(codeData);
        
        const preFilled: string[] = [];
        
        // Auto-populate gender if available
        if (codeData.preFillData?.gender) {
          setPlayerData(prev => ({ ...prev, gender: codeData.preFillData.gender }));
          preFilled.push('gender');
        }
        
        setPreFilledFields(preFilled);
        
        // Show toast about pre-filled data
        if (preFilled.length > 0) {
          toast({
            title: "Invite code applied",
            description: `${preFilled.join(', ')} has been pre-filled from your invite code`,
          });
        }
      } catch (error) {
        console.error('Error parsing invite code data:', error);
      }
    }
  }, []);

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

  const handleConsentStep = () => {
    // Show consent modal instead of old checkbox system
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

      // Create player account with invite code ID
      const response = await apiRequest("POST", "/api/auth/register", {
        ...playerData,
        dateOfBirth: dob,
        role: "player",
        parentContact: isTeen ? parentContact : undefined,
        consentDocuments: consentDocuments.map(doc => doc.id),
        inviteCodeId: inviteCodeData?.codeId, // Include invite code ID
      });
      const result = await response.json();
      
      // Note: Consent documents are already signed and stored via the ConsentDocumentModal
      // The signed documents are linked to the player via the consent API
      
      // If teen, send notification to parent
      if (isTeen && parentContact.parentEmail) {
        await apiRequest("POST", "/api/notifications/parent-consent", {
          playerId: result.id,
          parentEmail: parentContact.parentEmail,
          parentName: parentContact.parentName,
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
              {inviteCodeData && (
                <div className="mt-2 flex items-center justify-center gap-2">
                  <Ticket className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">
                    Using invite code: <span className="font-medium text-foreground">{inviteCodeData.code}</span>
                  </span>
                </div>
              )}
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
                <div className="flex items-center gap-2">
                  <Label>Gender</Label>
                  {preFilledFields.includes('gender') && (
                    <Badge variant="secondary" className="text-xs" data-testid="badge-prefilled-gender">
                      <Ticket className="h-3 w-3 mr-1" />
                      Pre-filled from invite code
                    </Badge>
                  )}
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="gender"
                      value="boys"
                      checked={playerData.gender === "boys"}
                      onChange={(e) => setPlayerData({...playerData, gender: "boys"})}
                      data-testid="radio-gender-boys"
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
                      data-testid="radio-gender-girls"
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
              <CardTitle className="text-2xl">Adult Contact</CardTitle>
              <CardDescription>
                We need your adult's contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your adult will receive an email to verify and manage your account
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label htmlFor="parentName">Adult's Name</Label>
                <Input
                  id="parentName"
                  value={parentContact.parentName}
                  onChange={(e) => setParentContact({...parentContact, parentName: e.target.value})}
                  placeholder="Full name"
                  data-testid="input-parent-name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="parentEmail">Adult's Email *</Label>
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
                <Label htmlFor="parentPhone">Adult's Phone (Optional)</Label>
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
              <CardTitle className="text-2xl">Review Information</CardTitle>
              <CardDescription>
                Please review your information before proceeding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Your Information</h3>
                  <p className="text-sm text-muted-foreground">
                    {playerData.firstName} {playerData.lastName} • {playerData.email}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Gender: {playerData.gender} • DOB: {dob ? new Date(dob).toLocaleDateString() : 'Not provided'}
                  </p>
                </div>
                
                {isTeen && parentContact.parentEmail && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-2">Adult Contact</h3>
                    <p className="text-sm text-muted-foreground">
                      {parentContact.parentName || 'Name not provided'} • {parentContact.parentEmail}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setStep(isTeen ? 2 : 1)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleConsentStep} 
                  className="flex-1"
                  data-testid="button-continue-to-consent"
                >
                  Continue to Consent
                </Button>
              </div>
            </CardContent>
          </>
        )}
      </Card>
      
      {showConsentModal && (
        <ConsentDocumentModal
          isOpen={showConsentModal}
          onClose={() => setShowConsentModal(false)}
          onComplete={handleConsentComplete}
          isParentSigning={!isTeen}
          playerData={{
            firstName: playerData.firstName,
            lastName: playerData.lastName,
            birthDate: dob || '',
          }}
          parentData={isTeen ? {
            firstName: parentContact.parentName.split(' ')[0] || '',
            lastName: parentContact.parentName.split(' ')[1] || '',
          } : undefined}
        />
      )}
    </div>
  );
}
