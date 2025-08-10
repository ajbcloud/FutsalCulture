import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Save, 
  TestTube,
  Mail,
  MessageSquare,
  Smartphone,
  CreditCard,
  Shield,
  Database,
  Server,
  Globe,
  Key,
  Users,
  Settings as SettingsIcon,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface PlatformSettings {
  general: {
    platformName: string;
    supportEmail: string;
    termsOfService: string;
    privacyPolicy: string;
    maintenanceMode: boolean;
    allowNewTenants: boolean;
    maxTenantsPerPlan: {
      starter: number;
      pro: number;
      enterprise: number;
    };
  };
  plans: Array<{
    id: string;
    name: string;
    price: number;
    features: string[];
    maxUsers: number;
    maxPlayers: number;
    maxSessions: number;
  }>;
  integrations: {
    email: {
      provider: 'sendgrid' | 'mailgun' | 'ses';
      apiKey: string;
      verified: boolean;
    };
    sms: {
      provider: 'twilio' | 'vonage';
      accountSid: string;
      authToken: string;
      verified: boolean;
    };
    payment: {
      stripePublicKey: string;
      stripeSecretKey: string;
      stripeWebhookSecret: string;
      verified: boolean;
    };
    oauth: {
      googleClientId: string;
      googleClientSecret: string;
      microsoftClientId: string;
      microsoftClientSecret: string;
    };
  };
  features: {
    tournaments: boolean;
    analytics: boolean;
    customBranding: boolean;
    apiAccess: boolean;
    whiteLabel: boolean;
    multiLocation: boolean;
  };
}

export default function SuperAdminSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch platform settings
  const { data: settings, isLoading } = useQuery<PlatformSettings>({
    queryKey: ['/api/super-admin/settings'],
    queryFn: async () => {
      const response = await fetch('/api/super-admin/settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      return response.json();
    }
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async ({ section, data }: { section: string; data: any }) => {
      const response = await fetch(`/api/super-admin/settings/${section}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update settings');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/settings'] });
      toast({ title: 'Settings updated successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to update settings', description: error.message, variant: 'destructive' });
    }
  });

  // Test integration mutation
  const testIntegrationMutation = useMutation({
    mutationFn: async ({ type, config }: { type: string; config: any }) => {
      const response = await fetch(`/api/super-admin/integrations/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, config })
      });
      if (!response.ok) throw new Error('Test failed');
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: 'Integration test successful', description: data.message });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/settings'] });
    },
    onError: (error: any) => {
      toast({ title: 'Integration test failed', description: error.message, variant: 'destructive' });
    }
  });

  const handleSaveSettings = (section: string, data: any) => {
    updateSettingsMutation.mutate({ section, data });
  };

  const handleTestIntegration = (type: string, config: any) => {
    testIntegrationMutation.mutate({ type, config });
  };

  if (isLoading || !settings) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Platform Settings</h1>
        </div>
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Platform Settings</h1>
          <p className="text-muted-foreground">Configure global platform settings and integrations</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="plans">Plans & Billing</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="maintenance">System</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Platform Configuration
              </CardTitle>
              <CardDescription>
                Basic platform settings and policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="platformName">Platform Name</Label>
                  <Input
                    id="platformName"
                    value={settings.general.platformName}
                    onChange={(e) => {
                      const newSettings = {
                        ...settings,
                        general: { ...settings.general, platformName: e.target.value }
                      };
                      // Update local state would go here if we had it
                    }}
                    placeholder="PlayHQ"
                  />
                </div>
                <div>
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={settings.general.supportEmail}
                    placeholder="support@playhq.app"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="termsOfService">Terms of Service</Label>
                <Textarea
                  id="termsOfService"
                  value={settings.general.termsOfService}
                  placeholder="Enter terms of service content..."
                  rows={4}
                />
              </div>
              
              <div>
                <Label htmlFor="privacyPolicy">Privacy Policy</Label>
                <Textarea
                  id="privacyPolicy"
                  value={settings.general.privacyPolicy}
                  placeholder="Enter privacy policy content..."
                  rows={4}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Temporarily disable access to all tenant portals
                  </p>
                </div>
                <Switch checked={settings.general.maintenanceMode} />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>Allow New Tenants</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable new organization registrations
                  </p>
                </div>
                <Switch checked={settings.general.allowNewTenants} />
              </div>
              
              <Button onClick={() => handleSaveSettings('general', settings.general)}>
                <Save className="w-4 h-4 mr-2" />
                Save General Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Subscription Plans
              </CardTitle>
              <CardDescription>
                Manage pricing plans and limits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {settings.plans.map((plan) => (
                  <div key={plan.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-medium capitalize">{plan.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          ${plan.price}/month per organization
                        </p>
                      </div>
                      <Badge variant="outline">{plan.name}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <Label>Max Users</Label>
                        <Input
                          type="number"
                          value={plan.maxUsers}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Max Players</Label>
                        <Input
                          type="number"
                          value={plan.maxPlayers}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Max Sessions/Month</Label>
                        <Input
                          type="number"
                          value={plan.maxSessions}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label>Features</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {plan.features.map((feature, index) => (
                          <Badge key={index} variant="secondary">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                
                <Button onClick={() => handleSaveSettings('plans', settings.plans)}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Plan Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="w-5 h-5" />
                Feature Toggles
              </CardTitle>
              <CardDescription>
                Enable or disable features globally
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(settings.features).map(([feature, enabled]) => (
                <div key={feature} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="capitalize">
                      {feature.replace(/([A-Z])/g, ' $1').trim()}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {getFeatureDescription(feature)}
                    </p>
                  </div>
                  <Switch checked={enabled} />
                </div>
              ))}
              
              <Button onClick={() => handleSaveSettings('features', settings.features)}>
                <Save className="w-4 h-4 mr-2" />
                Save Feature Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          {/* Email Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email Service
                {settings.integrations.email.verified && (
                  <Badge className="bg-green-500">Verified</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Configure email delivery service
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Provider</Label>
                  <Input value={settings.integrations.email.provider} disabled />
                </div>
                <div>
                  <Label>API Key</Label>
                  <Input
                    type="password"
                    value={settings.integrations.email.apiKey}
                    placeholder="SG.****"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleTestIntegration('email', settings.integrations.email)}
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  Test Connection
                </Button>
                <Button onClick={() => handleSaveSettings('integrations', settings.integrations)}>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* SMS Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                SMS Service
                {settings.integrations.sms.verified && (
                  <Badge className="bg-green-500">Verified</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Configure SMS notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Provider</Label>
                  <Input value={settings.integrations.sms.provider} disabled />
                </div>
                <div>
                  <Label>Account SID</Label>
                  <Input
                    type="password"
                    value={settings.integrations.sms.accountSid}
                    placeholder="AC****"
                  />
                </div>
                <div>
                  <Label>Auth Token</Label>
                  <Input
                    type="password"
                    value={settings.integrations.sms.authToken}
                    placeholder="****"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleTestIntegration('sms', settings.integrations.sms)}
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  Test Connection
                </Button>
                <Button onClick={() => handleSaveSettings('integrations', settings.integrations)}>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payment Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Processing
                {settings.integrations.payment.verified && (
                  <Badge className="bg-green-500">Verified</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Configure Stripe payment processing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label>Stripe Public Key</Label>
                  <Input
                    value={settings.integrations.payment.stripePublicKey}
                    placeholder="pk_****"
                  />
                </div>
                <div>
                  <Label>Stripe Secret Key</Label>
                  <Input
                    type="password"
                    value={settings.integrations.payment.stripeSecretKey}
                    placeholder="sk_****"
                  />
                </div>
                <div>
                  <Label>Webhook Secret</Label>
                  <Input
                    type="password"
                    value={settings.integrations.payment.stripeWebhookSecret}
                    placeholder="whsec_****"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleTestIntegration('stripe', settings.integrations.payment)}
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  Test Connection
                </Button>
                <Button onClick={() => handleSaveSettings('integrations', settings.integrations)}>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5" />
                System Maintenance
              </CardTitle>
              <CardDescription>
                System health and maintenance tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Database</div>
                        <div className="text-sm text-muted-foreground">PostgreSQL</div>
                      </div>
                      <Badge className="bg-green-500">Online</Badge>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Redis Cache</div>
                        <div className="text-sm text-muted-foreground">In-memory cache</div>
                      </div>
                      <Badge className="bg-green-500">Online</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-2">
                <Button variant="outline" className="w-full">
                  <Database className="w-4 h-4 mr-2" />
                  Run Database Backup
                </Button>
                <Button variant="outline" className="w-full">
                  <Server className="w-4 h-4 mr-2" />
                  Clear Application Cache
                </Button>
                <Button variant="outline" className="w-full">
                  <Users className="w-4 h-4 mr-2" />
                  Generate System Report
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Data Retention & Cleanup
              </CardTitle>
              <CardDescription>
                Configure automatic data cleanup policies across all tenants
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="waitlistExpirationHours" className="text-foreground">
                    Waitlist Data Cleanup (hours)
                  </Label>
                  <Input
                    id="waitlistExpirationHours"
                    type="number"
                    min="1"
                    max="168"
                    defaultValue="24"
                    className="max-w-xs"
                    placeholder="24"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Automatically clean up expired waitlist data after sessions end. This affects all tenants globally.
                  </p>
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        Global Setting
                      </h4>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                        This setting applies to all tenants platform-wide. Changes will affect data retention policies across all organizations.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-start">
                  <Button onClick={() => {/* TODO: Implement save handler */}}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Cleanup Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function getFeatureDescription(feature: string): string {
  const descriptions: Record<string, string> = {
    tournaments: 'Enable tournament management capabilities',
    analytics: 'Advanced analytics and reporting features',
    customBranding: 'Allow tenants to customize their branding',
    apiAccess: 'Enable API access for third-party integrations',
    whiteLabel: 'Remove platform branding for enterprise clients',
    multiLocation: 'Support for multiple training locations'
  };
  
  return descriptions[feature] || 'Feature configuration';
}