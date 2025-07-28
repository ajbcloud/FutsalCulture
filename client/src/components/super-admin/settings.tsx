import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Settings, 
  Mail, 
  MessageSquare, 
  Key, 
  Webhook, 
  TestTube,
  Check,
  X,
  AlertCircle,
  Shield,
  Globe
} from "lucide-react";

interface IntegrationSettings {
  email: {
    provider: string;
    apiKey: string;
    enabled: boolean;
  };
  sms: {
    accountSid: string;
    authToken: string;
    phoneNumber: string;
    enabled: boolean;
  };
  oauth: {
    googleClientId: string;
    googleClientSecret: string;
    microsoftClientId: string;
    microsoftClientSecret: string;
    enabled: boolean;
  };
  webhooks: {
    crmEndpoint: string;
    biEndpoint: string;
    secretKey: string;
    enabled: boolean;
  };
}

interface PlatformSettings {
  platformName: string;
  supportEmail: string;
  supportPhone: string;
  maxTenantsPerRegion: number;
  defaultSessionDuration: number;
  maintenanceMode: boolean;
}

export default function SuperAdminSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [testingProvider, setTestingProvider] = useState<string | null>(null);

  // Fetch current settings
  const { data: integrations, isLoading: integrationsLoading } = useQuery<IntegrationSettings>({
    queryKey: ["/api/super-admin/integrations"],
    queryFn: async () => {
      // Mock data for now - replace with actual API call
      return {
        email: {
          provider: "sendgrid",
          apiKey: "SG.***.***",
          enabled: true,
        },
        sms: {
          accountSid: "AC***",
          authToken: "***",
          phoneNumber: "+1234567890",
          enabled: true,
        },
        oauth: {
          googleClientId: "***-google.apps.googleusercontent.com",
          googleClientSecret: "***",
          microsoftClientId: "***",
          microsoftClientSecret: "***",
          enabled: false,
        },
        webhooks: {
          crmEndpoint: "https://api.example.com/webhook",
          biEndpoint: "https://bi.example.com/webhook",
          secretKey: "wh_***",
          enabled: false,
        },
      };
    },
  });

  const { data: platformSettings, isLoading: platformLoading } = useQuery<PlatformSettings>({
    queryKey: ["/api/super-admin/platform-settings"],
    queryFn: async () => {
      // Mock data for now - replace with actual API call
      return {
        platformName: "Futsal Platform",
        supportEmail: "support@futsalplatform.com",
        supportPhone: "+1-800-FUTSAL",
        maxTenantsPerRegion: 100,
        defaultSessionDuration: 90,
        maintenanceMode: false,
      };
    },
  });

  // Test integration function
  const testIntegration = async (provider: string) => {
    setTestingProvider(provider);
    try {
      // Mock test - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: "Test Successful",
        description: `${provider} integration is working correctly`,
      });
    } catch (error) {
      toast({
        title: "Test Failed",
        description: `${provider} integration test failed`,
        variant: "destructive",
      });
    } finally {
      setTestingProvider(null);
    }
  };

  if (integrationsLoading || platformLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Platform Settings & Integrations</h1>
        <p className="text-muted-foreground">Configure global platform settings and third-party integrations</p>
      </div>

      <Tabs defaultValue="platform" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="platform" className="flex items-center">
            <Globe className="w-4 h-4 mr-2" />
            Platform Settings
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center">
            <Shield className="w-4 h-4 mr-2" />
            Integrations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="platform" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="w-5 h-5 mr-2" />
                Global Platform Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="platformName">Platform Name</Label>
                  <Input
                    id="platformName"
                    defaultValue={platformSettings?.platformName}
                    placeholder="e.g., Futsal Platform"
                  />
                </div>
                <div>
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    defaultValue={platformSettings?.supportEmail}
                    placeholder="support@platform.com"
                  />
                </div>
                <div>
                  <Label htmlFor="supportPhone">Support Phone</Label>
                  <Input
                    id="supportPhone"
                    defaultValue={platformSettings?.supportPhone}
                    placeholder="+1-800-SUPPORT"
                  />
                </div>
                <div>
                  <Label htmlFor="maxTenants">Max Tenants Per Region</Label>
                  <Input
                    id="maxTenants"
                    type="number"
                    defaultValue={platformSettings?.maxTenantsPerRegion}
                    placeholder="100"
                  />
                </div>
                <div>
                  <Label htmlFor="sessionDuration">Default Session Duration (minutes)</Label>
                  <Input
                    id="sessionDuration"
                    type="number"
                    defaultValue={platformSettings?.defaultSessionDuration}
                    placeholder="90"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="maintenanceMode"
                    defaultChecked={platformSettings?.maintenanceMode}
                  />
                  <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                </div>
              </div>
              <Button>Save Platform Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          {/* Email Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Mail className="w-5 h-5 mr-2" />
                  Email Integration
                </div>
                <Badge variant={integrations?.email.enabled ? "default" : "secondary"}>
                  {integrations?.email.enabled ? "Active" : "Inactive"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emailProvider">Provider</Label>
                  <Input
                    id="emailProvider"
                    defaultValue={integrations?.email.provider}
                    placeholder="sendgrid"
                  />
                </div>
                <div>
                  <Label htmlFor="emailApiKey">API Key</Label>
                  <Input
                    id="emailApiKey"
                    type="password"
                    defaultValue={integrations?.email.apiKey}
                    placeholder="SG.***"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="emailEnabled"
                  defaultChecked={integrations?.email.enabled}
                />
                <Label htmlFor="emailEnabled">Enable Email Integration</Label>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => testIntegration("Email")}
                  disabled={testingProvider === "Email"}
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  {testingProvider === "Email" ? "Testing..." : "Test Connection"}
                </Button>
                <Button>Save Email Settings</Button>
              </div>
            </CardContent>
          </Card>

          {/* SMS Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  SMS Integration (Twilio)
                </div>
                <Badge variant={integrations?.sms.enabled ? "default" : "secondary"}>
                  {integrations?.sms.enabled ? "Active" : "Inactive"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="twilioSid">Account SID</Label>
                  <Input
                    id="twilioSid"
                    type="password"
                    defaultValue={integrations?.sms.accountSid}
                    placeholder="AC***"
                  />
                </div>
                <div>
                  <Label htmlFor="twilioToken">Auth Token</Label>
                  <Input
                    id="twilioToken"
                    type="password"
                    defaultValue={integrations?.sms.authToken}
                    placeholder="***"
                  />
                </div>
                <div>
                  <Label htmlFor="twilioPhone">Phone Number</Label>
                  <Input
                    id="twilioPhone"
                    defaultValue={integrations?.sms.phoneNumber}
                    placeholder="+1234567890"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="smsEnabled"
                  defaultChecked={integrations?.sms.enabled}
                />
                <Label htmlFor="smsEnabled">Enable SMS Integration</Label>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => testIntegration("SMS")}
                  disabled={testingProvider === "SMS"}
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  {testingProvider === "SMS" ? "Testing..." : "Test Connection"}
                </Button>
                <Button>Save SMS Settings</Button>
              </div>
            </CardContent>
          </Card>

          {/* OAuth Providers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Key className="w-5 h-5 mr-2" />
                  OAuth Providers
                </div>
                <Badge variant={integrations?.oauth.enabled ? "default" : "secondary"}>
                  {integrations?.oauth.enabled ? "Active" : "Inactive"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label className="font-medium">Google OAuth</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div>
                      <Label htmlFor="googleClientId">Client ID</Label>
                      <Input
                        id="googleClientId"
                        defaultValue={integrations?.oauth.googleClientId}
                        placeholder="***-google.apps.googleusercontent.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="googleClientSecret">Client Secret</Label>
                      <Input
                        id="googleClientSecret"
                        type="password"
                        defaultValue={integrations?.oauth.googleClientSecret}
                        placeholder="***"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label className="font-medium">Microsoft Azure AD</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div>
                      <Label htmlFor="microsoftClientId">Client ID</Label>
                      <Input
                        id="microsoftClientId"
                        defaultValue={integrations?.oauth.microsoftClientId}
                        placeholder="***"
                      />
                    </div>
                    <div>
                      <Label htmlFor="microsoftClientSecret">Client Secret</Label>
                      <Input
                        id="microsoftClientSecret"
                        type="password"
                        defaultValue={integrations?.oauth.microsoftClientSecret}
                        placeholder="***"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="oauthEnabled"
                  defaultChecked={integrations?.oauth.enabled}
                />
                <Label htmlFor="oauthEnabled">Enable OAuth Providers</Label>
              </div>
              <Button>Save OAuth Settings</Button>
            </CardContent>
          </Card>

          {/* Webhooks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Webhook className="w-5 h-5 mr-2" />
                  Webhook Endpoints
                </div>
                <Badge variant={integrations?.webhooks.enabled ? "default" : "secondary"}>
                  {integrations?.webhooks.enabled ? "Active" : "Inactive"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="crmEndpoint">CRM Webhook Endpoint</Label>
                  <Input
                    id="crmEndpoint"
                    defaultValue={integrations?.webhooks.crmEndpoint}
                    placeholder="https://api.example.com/webhook"
                  />
                </div>
                <div>
                  <Label htmlFor="biEndpoint">BI Webhook Endpoint</Label>
                  <Input
                    id="biEndpoint"
                    defaultValue={integrations?.webhooks.biEndpoint}
                    placeholder="https://bi.example.com/webhook"
                  />
                </div>
                <div>
                  <Label htmlFor="webhookSecret">Webhook Secret Key</Label>
                  <Input
                    id="webhookSecret"
                    type="password"
                    defaultValue={integrations?.webhooks.secretKey}
                    placeholder="wh_***"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="webhooksEnabled"
                  defaultChecked={integrations?.webhooks.enabled}
                />
                <Label htmlFor="webhooksEnabled">Enable Webhooks</Label>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => testIntegration("Webhooks")}
                  disabled={testingProvider === "Webhooks"}
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  {testingProvider === "Webhooks" ? "Testing..." : "Test Endpoints"}
                </Button>
                <Button>Save Webhook Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}