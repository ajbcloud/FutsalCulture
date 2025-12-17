import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Copy,
  ExternalLink,
  ArrowLeft,
  ArrowRight,
  Shield,
  Key,
  TestTube,
  Save,
  Webhook,
  Eye,
  EyeOff,
} from "lucide-react";

export interface GatewayStatus {
  sandbox?: {
    configured: boolean;
    lastTestedAt?: string;
    testStatus?: 'success' | 'failure' | 'pending';
  };
  production?: {
    configured: boolean;
    lastTestedAt?: string;
    testStatus?: 'success' | 'failure' | 'pending';
  };
}

interface BraintreeWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  existingStatus?: GatewayStatus;
}

interface Credentials {
  merchantId: string;
  publicKey: string;
  privateKey: string;
}

interface TestResult {
  success: boolean;
  error?: string;
  suggestions?: string[];
}

const STEPS = [
  { number: 1, title: "Environment", icon: Shield },
  { number: 2, title: "Credentials", icon: Key },
  { number: 3, title: "Test", icon: TestTube },
  { number: 4, title: "Save", icon: Save },
  { number: 5, title: "Webhooks", icon: Webhook },
];

const BRAINTREE_DOCS = {
  merchantId: "https://developer.paypal.com/braintree/articles/control-panel/important-gateway-credentials#merchant-id",
  publicKey: "https://developer.paypal.com/braintree/articles/control-panel/important-gateway-credentials#public-key",
  privateKey: "https://developer.paypal.com/braintree/articles/control-panel/important-gateway-credentials#private-key",
};

const RECOMMENDED_WEBHOOK_EVENTS = [
  "subscription_charged_successfully",
  "subscription_charged_unsuccessfully",
  "subscription_canceled",
  "subscription_went_active",
  "subscription_went_past_due",
  "subscription_expired",
  "subscription_trial_ended",
  "customer_created",
  "customer_updated",
  "payment_method_revoked_by_customer",
  "dispute_opened",
  "dispute_lost",
  "dispute_won",
];

export function BraintreeWizard({
  isOpen,
  onClose,
  onComplete,
  existingStatus,
}: BraintreeWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [environment, setEnvironment] = useState<"sandbox" | "production">("sandbox");
  const [credentials, setCredentials] = useState<Credentials>({
    merchantId: "",
    publicKey: "",
    privateKey: "",
  });
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [webhookData, setWebhookData] = useState<{ url: string; webhookKey: string } | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [hasEnteredPrivateKey, setHasEnteredPrivateKey] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "POST",
        `/api/tenant/billing/gateway/${environment}/test`,
        credentials
      );
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setTestResult({ success: true });
        toast({
          title: "Connection Successful",
          description: "Your Braintree credentials are valid.",
        });
      } else {
        setTestResult({
          success: false,
          error: data.error || "Connection test failed",
          suggestions: data.suggestions || [],
        });
      }
    },
    onError: (error: Error) => {
      setTestResult({
        success: false,
        error: error.message || "Failed to test connection",
        suggestions: [
          "Verify your Merchant ID is correct",
          "Check that Public Key and Private Key match",
          "Ensure your Braintree account is active",
          "Try using Sandbox credentials first",
        ],
      });
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const saveCredentialsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "POST",
        `/api/tenant/billing/gateway/${environment}`,
        credentials
      );
      return response.json();
    },
    onSuccess: (data) => {
      setWebhookData({
        url: data.webhookUrl || `${window.location.origin}/api/webhooks/braintree/${environment}/${data.webhookKey}`,
        webhookKey: data.webhookKey,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/billing/gateway/status"] });
      toast({
        title: "Credentials Saved",
        description: `Braintree ${environment} credentials have been saved successfully.`,
      });
      setCurrentStep(5);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Save",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      if (currentStep === 3) {
        setTestResult(null);
      }
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setEnvironment("sandbox");
    setCredentials({ merchantId: "", publicKey: "", privateKey: "" });
    setTestResult(null);
    setWebhookData(null);
    setHasEnteredPrivateKey(false);
    onClose();
  };

  const handleComplete = () => {
    handleClose();
    onComplete();
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: "Webhook URL copied to clipboard.",
      });
    } catch {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const isCredentialsValid =
    credentials.merchantId.trim() !== "" &&
    credentials.publicKey.trim() !== "" &&
    credentials.privateKey.trim() !== "";

  const maskMerchantId = (id: string) => {
    if (id.length <= 4) return "****";
    return id.slice(0, 4) + "****" + id.slice(-4);
  };

  const progressValue = (currentStep / 5) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Connect Braintree Account
          </DialogTitle>
          <DialogDescription>
            Set up your Braintree payment gateway to accept payments.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Step {currentStep} of 5</span>
              <span>{STEPS[currentStep - 1].title}</span>
            </div>
            <Progress value={progressValue} className="h-2" />
            <div className="flex justify-between">
              {STEPS.map((step) => {
                const Icon = step.icon;
                const isActive = step.number === currentStep;
                const isComplete = step.number < currentStep;
                return (
                  <div
                    key={step.number}
                    className={cn(
                      "flex flex-col items-center gap-1",
                      isActive && "text-primary",
                      isComplete && "text-green-500",
                      !isActive && !isComplete && "text-muted-foreground"
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors",
                        isActive && "border-primary bg-primary/10",
                        isComplete && "border-green-500 bg-green-500/10",
                        !isActive && !isComplete && "border-muted-foreground/30"
                      )}
                    >
                      {isComplete ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    <span className="text-xs hidden sm:block">{step.title}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {currentStep === 1 && (
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-4">
                  <Label className="text-base font-medium">
                    Select Environment
                  </Label>
                  <RadioGroup
                    value={environment}
                    onValueChange={(value) =>
                      setEnvironment(value as "sandbox" | "production")
                    }
                    className="space-y-3"
                  >
                    <div
                      className={cn(
                        "flex items-start space-x-3 p-4 rounded-lg border cursor-pointer transition-colors",
                        environment === "sandbox"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground"
                      )}
                      onClick={() => setEnvironment("sandbox")}
                      data-testid="radio-sandbox"
                    >
                      <RadioGroupItem value="sandbox" id="sandbox" className="mt-1" />
                      <div className="flex-1">
                        <Label
                          htmlFor="sandbox"
                          className="text-sm font-medium cursor-pointer"
                        >
                          Sandbox (Testing)
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Use test credentials to simulate transactions. No real money is
                          processed. Recommended for initial setup.
                        </p>
                      </div>
                    </div>
                    <div
                      className={cn(
                        "flex items-start space-x-3 p-4 rounded-lg border cursor-pointer transition-colors",
                        environment === "production"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground"
                      )}
                      onClick={() => setEnvironment("production")}
                      data-testid="radio-production"
                    >
                      <RadioGroupItem value="production" id="production" className="mt-1" />
                      <div className="flex-1">
                        <Label
                          htmlFor="production"
                          className="text-sm font-medium cursor-pointer"
                        >
                          Production (Live)
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Use live credentials to process real transactions. Only use after
                          testing in sandbox.
                        </p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {environment === "production" && (
                  <Alert variant="warning">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Production Environment</AlertTitle>
                    <AlertDescription>
                      We recommend testing with Sandbox first to ensure your integration
                      works correctly before processing live payments.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end">
                  <Button onClick={handleNext} data-testid="button-next-step1">
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 2 && (
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="merchantId">Merchant ID</Label>
                      <a
                        href={BRAINTREE_DOCS.merchantId}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                        data-testid="link-merchant-id-help"
                      >
                        Where do I find this?
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <Input
                      id="merchantId"
                      value={credentials.merchantId}
                      onChange={(e) =>
                        setCredentials({ ...credentials, merchantId: e.target.value })
                      }
                      placeholder="Enter your Merchant ID"
                      data-testid="input-merchant-id"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="publicKey">Public Key</Label>
                      <a
                        href={BRAINTREE_DOCS.publicKey}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                        data-testid="link-public-key-help"
                      >
                        Where do I find this?
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <Input
                      id="publicKey"
                      value={credentials.publicKey}
                      onChange={(e) =>
                        setCredentials({ ...credentials, publicKey: e.target.value })
                      }
                      placeholder="Enter your Public Key"
                      data-testid="input-public-key"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="privateKey">Private Key</Label>
                      <a
                        href={BRAINTREE_DOCS.privateKey}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                        data-testid="link-private-key-help"
                      >
                        Where do I find this?
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <div className="relative">
                      <Input
                        id="privateKey"
                        type={showPrivateKey ? "text" : "password"}
                        value={
                          hasEnteredPrivateKey && !showPrivateKey
                            ? "••••••••••••••••"
                            : credentials.privateKey
                        }
                        onChange={(e) => {
                          setCredentials({ ...credentials, privateKey: e.target.value });
                          setHasEnteredPrivateKey(e.target.value.length > 0);
                        }}
                        onFocus={() => {
                          if (hasEnteredPrivateKey && !showPrivateKey) {
                            setCredentials({ ...credentials, privateKey: "" });
                          }
                        }}
                        placeholder="Enter your Private Key"
                        data-testid="input-private-key"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                        onClick={() => setShowPrivateKey(!showPrivateKey)}
                        data-testid="button-toggle-private-key"
                      >
                        {showPrivateKey ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your private key is encrypted and securely stored. It will not be
                      displayed after saving.
                    </p>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={handleBack} data-testid="button-back-step2">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={!isCredentialsValid}
                    data-testid="button-next-step2"
                  >
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 3 && (
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <TestTube className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">Test Your Connection</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Verify that your {environment} credentials are correct before
                      saving.
                    </p>
                  </div>
                </div>

                {!testResult && (
                  <div className="flex justify-center">
                    <Button
                      onClick={() => testConnectionMutation.mutate()}
                      disabled={testConnectionMutation.isPending}
                      size="lg"
                      data-testid="button-test-connection"
                    >
                      {testConnectionMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <TestTube className="h-4 w-4 mr-2" />
                          Test Connection
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {testResult && (
                  <div className="space-y-4">
                    {testResult.success ? (
                      <Alert variant="success">
                        <CheckCircle className="h-4 w-4" />
                        <AlertTitle>Connection Successful!</AlertTitle>
                        <AlertDescription>
                          Your Braintree {environment} credentials are valid and working.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertTitle>Connection Failed</AlertTitle>
                        <AlertDescription className="space-y-2">
                          <p>{testResult.error}</p>
                          {testResult.suggestions && testResult.suggestions.length > 0 && (
                            <div className="mt-2">
                              <p className="font-medium text-sm">Suggested fixes:</p>
                              <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                                {testResult.suggestions.map((suggestion, index) => (
                                  <li key={index}>{suggestion}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}

                    {!testResult.success && (
                      <div className="flex justify-center">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setTestResult(null);
                            testConnectionMutation.mutate();
                          }}
                          disabled={testConnectionMutation.isPending}
                          data-testid="button-retry-test"
                        >
                          {testConnectionMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Retrying...
                            </>
                          ) : (
                            "Retry Test"
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between">
                  <Button variant="outline" onClick={handleBack} data-testid="button-back-step3">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={!testResult?.success}
                    data-testid="button-continue-step3"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 4 && (
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Review & Save</h3>
                  <div className="bg-muted rounded-lg p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Environment</span>
                      <span className="font-medium capitalize">{environment}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Merchant ID</span>
                      <span className="font-mono">{maskMerchantId(credentials.merchantId)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Connection Test</span>
                      <span className="flex items-center gap-1 text-green-500">
                        <CheckCircle className="h-4 w-4" />
                        Passed
                      </span>
                    </div>
                  </div>
                </div>

                {environment === "production" &&
                  !existingStatus?.sandbox?.configured && (
                    <Alert variant="warning">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Sandbox Not Configured</AlertTitle>
                      <AlertDescription>
                        You haven't set up Sandbox credentials yet. Consider testing with
                        Sandbox first before going live with production.
                      </AlertDescription>
                    </Alert>
                  )}

                <div className="flex justify-center">
                  <Button
                    onClick={() => saveCredentialsMutation.mutate()}
                    disabled={saveCredentialsMutation.isPending}
                    size="lg"
                    data-testid="button-save-credentials"
                  >
                    {saveCredentialsMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Credentials
                      </>
                    )}
                  </Button>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={handleBack} data-testid="button-back-step4">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 5 && (
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="text-center space-y-2">
                  <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                  <h3 className="text-lg font-medium">Credentials Saved!</h3>
                  <p className="text-sm text-muted-foreground">
                    Now configure webhooks to receive payment notifications.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Webhook URL</Label>
                    <div className="flex gap-2">
                      <Input
                        value={
                          webhookData?.url ||
                          `${window.location.origin}/api/webhooks/braintree/${environment}/[key]`
                        }
                        readOnly
                        className="font-mono text-xs"
                        data-testid="input-webhook-url"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => webhookData?.url && copyToClipboard(webhookData.url)}
                        data-testid="button-copy-webhook"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="bg-muted rounded-lg p-4 space-y-3">
                    <h4 className="font-medium text-sm">
                      Configure in Braintree Control Panel:
                    </h4>
                    <ol className="list-decimal list-inside text-sm space-y-2 text-muted-foreground">
                      <li>
                        Log into{" "}
                        <a
                          href={
                            environment === "sandbox"
                              ? "https://sandbox.braintreegateway.com"
                              : "https://www.braintreegateway.com"
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Braintree Control Panel
                          <ExternalLink className="h-3 w-3 inline ml-1" />
                        </a>
                      </li>
                      <li>Navigate to Settings → Webhooks</li>
                      <li>Click "Create New Webhook"</li>
                      <li>Paste the webhook URL above</li>
                      <li>Select the events to subscribe to</li>
                    </ol>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Recommended Events:</Label>
                    <div className="flex flex-wrap gap-1">
                      {RECOMMENDED_WEBHOOK_EVENTS.map((event) => (
                        <span
                          key={event}
                          className="text-xs bg-muted px-2 py-1 rounded font-mono"
                        >
                          {event}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleComplete} data-testid="button-done">
                    Done
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default BraintreeWizard;
