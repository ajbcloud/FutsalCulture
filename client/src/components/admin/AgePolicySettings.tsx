import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Users, Shield, AlertCircle, Save, RefreshCw } from "lucide-react";

interface TenantPolicy {
  id: string;
  tenantId: string;
  audience: "youth" | "mixed" | "adult";
  minAge: number;
  maxAge?: number;
  requireParent: number;
  teenSelfMin?: number;
  teenPayMin?: number;
  enforceAgeGating: boolean;
  requireConsent: boolean;
  consentPolicies?: string[];
  createdAt: string;
  updatedAt: string;
}

export default function AgePolicySettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Fetch current policy
  const { data: currentPolicy, isLoading: loadingPolicy } = useQuery<TenantPolicy>({
    queryKey: ["/api/admin/age-policy"],
    queryFn: () => fetch("/api/admin/age-policy", { credentials: 'include' }).then(res => res.json()),
  });

  // Local state for form
  const [policy, setPolicy] = useState<Partial<TenantPolicy>>({
    audience: "youth",
    minAge: 5,
    maxAge: 18,
    requireParent: 13,
    teenSelfMin: 13,
    teenPayMin: 16,
    enforceAgeGating: true,
    requireConsent: true,
    consentPolicies: ["medical", "liability", "photo", "privacy"]
  });

  // Update local state when policy loads
  useEffect(() => {
    if (currentPolicy) {
      setPolicy(currentPolicy);
    }
  }, [currentPolicy]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<TenantPolicy>) => {
      return apiRequest("PUT", "/api/admin/age-policy", data);
    },
    onSuccess: () => {
      toast({
        title: "Policy saved",
        description: "Age policy settings have been updated successfully",
      });
      // Invalidate both age policy and settings queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ["/api/admin/age-policy"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      
      // Force refetch to ensure immediate UI update
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["/api/admin/age-policy"] });
      }, 100);
    },
    onError: (error) => {
      toast({
        title: "Error saving policy",
        description: error.message || "Failed to save policy settings",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    // Validation
    if (policy.audience === "youth" && (!policy.maxAge || policy.maxAge > 18)) {
      toast({
        title: "Invalid age range",
        description: "Youth programs must have a maximum age of 18 or less",
        variant: "destructive",
      });
      return;
    }

    // Validate parent requirement age
    if (policy.requireParent && policy.requireParent < policy.minAge!) {
      toast({
        title: "Invalid parent requirement",
        description: "Parent requirement age must be greater than or equal to minimum age",
        variant: "destructive",
      });
      return;
    }

    // Validate teen self-access relationship with parent requirement
    if (policy.requireParent && policy.teenSelfMin && policy.requireParent > policy.teenSelfMin) {
      toast({
        title: "Invalid configuration",
        description: "Parent requirement age cannot be greater than teen self-signup age",
        variant: "destructive",
      });
      return;
    }

    // Validate teen payment age relationship
    if (policy.teenSelfMin && policy.teenPayMin && policy.teenPayMin < policy.teenSelfMin) {
      toast({
        title: "Invalid payment age",
        description: "Teen payment age must be greater than or equal to teen self-signup age",
        variant: "destructive",
      });
      return;
    }

    // Validate logical age progression
    if (policy.audience !== "adult" && policy.maxAge && policy.teenPayMin && policy.teenPayMin > policy.maxAge) {
      toast({
        title: "Invalid configuration",
        description: "Teen payment age cannot exceed maximum program age",
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate(policy);
  };

  const handleReset = () => {
    if (currentPolicy) {
      setPolicy(currentPolicy);
      toast({
        title: "Changes reset",
        description: "Form has been reset to current saved values",
      });
    }
  };

  if (loadingPolicy) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Age Policy Settings</CardTitle>
          </div>
          <CardDescription>
            Configure age requirements and parental consent policies for your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Audience Type */}
          <div className="space-y-3">
            <Label>Program Audience</Label>
            <RadioGroup
              value={policy.audience}
              onValueChange={(value: "youth" | "mixed" | "adult") => 
                setPolicy({ ...policy, audience: value })
              }
            >
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="youth" id="youth" />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="youth"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Youth Only
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Programs exclusively for children and teens (under 18)
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="mixed" id="mixed" />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="mixed"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Mixed Ages
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Programs for both youth and adults
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="adult" id="adult" />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="adult"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Adult Only
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Programs exclusively for adults (18+)
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Age Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minAge">Minimum Age</Label>
              <Input
                id="minAge"
                type="number"
                min="3"
                max="100"
                value={policy.minAge}
                onChange={(e) => setPolicy({ ...policy, minAge: parseInt(e.target.value) })}
                data-testid="input-min-age"
              />
            </div>
            {policy.audience !== "adult" && (
              <div className="space-y-2">
                <Label htmlFor="maxAge">Maximum Age</Label>
                <Input
                  id="maxAge"
                  type="number"
                  min={policy.minAge}
                  max="100"
                  value={policy.maxAge || 18}
                  onChange={(e) => setPolicy({ ...policy, maxAge: parseInt(e.target.value) })}
                  data-testid="input-max-age"
                />
              </div>
            )}
          </div>

          {/* Parent Requirements */}
          {policy.audience !== "adult" && (
            <div className="space-y-3">
              <Label htmlFor="requireParent">
                Require Parent Account Under Age
              </Label>
              <Input
                id="requireParent"
                type="number"
                min={policy.minAge}
                max="18"
                value={policy.requireParent}
                onChange={(e) => setPolicy({ ...policy, requireParent: parseInt(e.target.value) })}
                data-testid="input-require-parent"
              />
              <p className="text-sm text-muted-foreground">
                Players under this age must have a parent create their account
              </p>
            </div>
          )}

          {/* Teen Self-Access */}
          {policy.audience !== "adult" && (
            <div className="space-y-3">
              <Label htmlFor="teenSelfMin">
                Teen Self-Signup Minimum Age
              </Label>
              <Input
                id="teenSelfMin"
                type="number"
                min={policy.requireParent || 13}
                max="18"
                value={policy.teenSelfMin || 13}
                onChange={(e) => setPolicy({ ...policy, teenSelfMin: parseInt(e.target.value) })}
                data-testid="input-teen-self-min"
              />
              <p className="text-sm text-muted-foreground">
                Teens this age and older can create their own account with parent notification
              </p>
            </div>
          )}

          {/* Teen Payment */}
          {policy.audience !== "adult" && (
            <div className="space-y-3">
              <Label htmlFor="teenPayMin">
                Teen Payment Minimum Age
              </Label>
              <Input
                id="teenPayMin"
                type="number"
                min={policy.teenSelfMin || 13}
                max="18"
                value={policy.teenPayMin || 16}
                onChange={(e) => setPolicy({ ...policy, teenPayMin: parseInt(e.target.value) })}
                data-testid="input-teen-pay-min"
              />
              <p className="text-sm text-muted-foreground">
                Teens this age and older can make their own payments
              </p>
            </div>
          )}

          {/* Enforcement Options */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enforceAgeGating">Enforce Age Gating</Label>
                <p className="text-sm text-muted-foreground">
                  Require date of birth verification during signup
                </p>
              </div>
              <Switch
                id="enforceAgeGating"
                checked={policy.enforceAgeGating}
                onCheckedChange={(checked) => 
                  setPolicy({ ...policy, enforceAgeGating: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="requireConsent">Require Consent Forms</Label>
                <p className="text-sm text-muted-foreground">
                  Require medical, liability, and photo consent during signup
                </p>
              </div>
              <Switch
                id="requireConsent"
                checked={policy.requireConsent}
                onCheckedChange={(checked) => 
                  setPolicy({ ...policy, requireConsent: checked })
                }
              />
            </div>
          </div>

          {/* Warning for changes */}
          {currentPolicy && JSON.stringify(currentPolicy) !== JSON.stringify(policy) && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You have unsaved changes. These will affect how new users sign up for your programs.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              data-testid="button-save-policy"
            >
              {saveMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Policy
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!currentPolicy || JSON.stringify(currentPolicy) === JSON.stringify(policy)}
            >
              Reset Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Policy Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Policy Preview</CardTitle>
          <CardDescription>
            How your current settings will affect user signup
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {policy.audience === "youth" && (
              <>
                <p>• Ages {policy.minAge}-{policy.maxAge || 18} can participate</p>
                <p>• Under age {policy.requireParent}: Parent must create account</p>
                <p>• Ages {policy.teenSelfMin || 13}-{policy.maxAge || 18}: Can self-signup with parent notification</p>
                <p>• Ages {policy.teenPayMin || 16}+: Can make their own payments</p>
              </>
            )}
            {policy.audience === "mixed" && (
              <>
                <p>• Ages {policy.minAge}+ can participate</p>
                <p>• Under age {policy.requireParent}: Parent must create account</p>
                <p>• Ages {policy.teenSelfMin || 13}-17: Can self-signup with parent notification</p>
                <p>• Ages {policy.teenPayMin || 16}-17: Can make their own payments</p>
                <p>• Ages 18+: Full adult access</p>
              </>
            )}
            {policy.audience === "adult" && (
              <>
                <p>• Ages {policy.minAge}+ only (adult program)</p>
                <p>• No parental involvement required</p>
                <p>• Full self-service signup and payment</p>
              </>
            )}
            {policy.enforceAgeGating && <p>• Date of birth verification required</p>}
            {policy.requireConsent && <p>• Consent forms required during signup</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}