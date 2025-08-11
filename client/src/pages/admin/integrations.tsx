import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePlanFeatures, useHasFeature } from '@/hooks/use-feature-flags';
import { FEATURE_KEYS } from '@shared/schema';
import { 
  Settings2, 
  Mail, 
  MessageSquare, 
  Calendar, 
  Cloud,
  CheckCircle,
  XCircle,
  AlertCircle,
  TestTube,
  CreditCard,
  DollarSign,
  Lock
} from 'lucide-react';

interface Integration {
  id: string;
  provider: string;
  enabled: boolean;
  lastTestedAt?: string;
  testStatus?: 'success' | 'failure' | 'pending';
  createdAt: string;
  updatedAt: string;
}

interface ProviderConfig {
  name: string;
  icon: React.ReactNode;
  description: string;
  category: 'email' | 'sms' | 'calendar' | 'storage' | 'payment' | 'accounting';
  fields: Array<{
    key: string;
    label: string;
    type: 'text' | 'password' | 'email' | 'url';
    placeholder?: string;
    required: boolean;
  }>;
}

const providerConfigs: Record<string, ProviderConfig> = {
  twilio: {
    name: 'Twilio',
    icon: <MessageSquare className="w-4 h-4" />,
    description: 'SMS messaging and phone verification',
    category: 'sms',
    fields: [
      { key: 'accountSid', label: 'Account SID', type: 'text', required: true },
      { key: 'authToken', label: 'Auth Token', type: 'password', required: true },
      { key: 'fromNumber', label: 'From Number', type: 'text', placeholder: '+1234567890', required: true },
    ],
  },
  sendgrid: {
    name: 'SendGrid',
    icon: <Mail className="w-4 h-4" />,
    description: 'Email delivery and marketing platform',
    category: 'email',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'verifiedSender', label: 'Verified Sender Email', type: 'email', required: true },
    ],
  },
  google: {
    name: 'Google Workspace',
    icon: <Calendar className="w-4 h-4" />,
    description: 'Gmail, Calendar, and Drive integration',
    category: 'calendar',
    fields: [
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
      { key: 'redirectUri', label: 'Redirect URI', type: 'url', required: true },
    ],
  },
  microsoft: {
    name: 'Microsoft 365',
    icon: <Cloud className="w-4 h-4" />,
    description: 'Outlook, Teams, and SharePoint integration',
    category: 'calendar',
    fields: [
      { key: 'tenantId', label: 'Tenant ID', type: 'text', required: true },
      { key: 'clientId', label: 'Client ID', type: 'text', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
    ],
  },
  stripe: {
    name: 'Stripe',
    icon: <CreditCard className="w-4 h-4" />,
    description: 'Payment processing and subscription management',
    category: 'payment',
    fields: [
      { key: 'publishableKey', label: 'Publishable Key', type: 'text', placeholder: 'pk_test_...', required: true },
      { key: 'secretKey', label: 'Secret Key', type: 'password', placeholder: 'sk_test_...', required: true },
      { key: 'webhookSecret', label: 'Webhook Secret', type: 'password', placeholder: 'whsec_...', required: false },
    ],
  },
  mailchimp: {
    name: 'Mailchimp',
    icon: <Mail className="w-4 h-4" />,
    description: 'Email marketing and newsletter management for parent communications',
    category: 'email',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Your Mailchimp API key', required: true },
      { key: 'audienceId', label: 'Audience ID', type: 'text', placeholder: 'Your default audience/list ID', required: true },
      { key: 'serverPrefix', label: 'Server Prefix', type: 'text', placeholder: 'us1, us2, etc. (from your API key)', required: true },
    ],
  },
  quickbooks: {
    name: 'QuickBooks Online',
    icon: <DollarSign className="w-4 h-4" />,
    description: 'Accounting and financial management for revenue tracking and invoicing',
    category: 'accounting',
    fields: [
      { key: 'clientId', label: 'Client ID', type: 'text', placeholder: 'Your QuickBooks app Client ID', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'Your QuickBooks app Client Secret', required: true },
      { key: 'redirectUri', label: 'Redirect URI', type: 'url', placeholder: 'https://yourapp.com/auth/quickbooks/callback', required: true },
      { key: 'companyId', label: 'Company ID', type: 'text', placeholder: 'QuickBooks Company ID (obtained after OAuth)', required: false },
      { key: 'sandbox', label: 'Sandbox Mode', type: 'text', placeholder: 'true or false', required: false },
    ],
  },
  braintree: {
    name: 'Braintree',
    icon: <CreditCard className="w-4 h-4" />,
    description: 'Alternative payment processing with advanced fraud protection and global support',
    category: 'payment',
    fields: [
      { key: 'merchantId', label: 'Merchant ID', type: 'text', placeholder: 'Your Braintree Merchant ID', required: true },
      { key: 'publicKey', label: 'Public Key', type: 'text', placeholder: 'Your Braintree Public Key', required: true },
      { key: 'privateKey', label: 'Private Key', type: 'password', placeholder: 'Your Braintree Private Key', required: true },
      { key: 'environment', label: 'Environment', type: 'text', placeholder: 'sandbox or production', required: true },
    ],
  },
};

export default function AdminIntegrations() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [configureDialog, setConfigureDialog] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Feature flags
  const { data: planData } = usePlanFeatures();
  const { hasFeature: hasQuickBooks } = useHasFeature(FEATURE_KEYS.INTEGRATIONS_QUICKBOOKS);
  const { hasFeature: hasBraintree } = useHasFeature(FEATURE_KEYS.INTEGRATIONS_BRAINTREE);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const response = await fetch('/api/admin/integrations');
      if (!response.ok) throw new Error('Failed to fetch integrations');
      const data = await response.json();
      setIntegrations(data);
    } catch (error) {
      console.error('Error fetching integrations:', error);
      toast({
        title: "Error",
        description: "Failed to load integrations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfigure = async (provider: string) => {
    try {
      // Fetch existing credentials if editing
      const existing = integrations.find(i => i.provider === provider);
      if (existing) {
        const response = await fetch(`/api/admin/integrations/${existing.id}`);
        if (response.ok) {
          const data = await response.json();
          setCredentials(data.credentials || {});
        }
      } else {
        setCredentials({});
      }
      setConfigureDialog(provider);
    } catch (error) {
      console.error('Error loading integration:', error);
    }
  };

  const handleSave = async () => {
    if (!configureDialog) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/admin/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: configureDialog,
          credentials,
          enabled: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save integration');
      }

      toast({
        title: "Success",
        description: "Integration saved successfully",
      });
      
      setConfigureDialog(null);
      setCredentials({});
      fetchIntegrations();
    } catch (error) {
      console.error('Error saving integration:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save integration",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (integration: Integration) => {
    try {
      const response = await fetch(`/api/admin/integrations/${integration.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !integration.enabled }),
      });

      if (!response.ok) throw new Error('Failed to update integration');

      toast({
        title: "Success",
        description: `Integration ${integration.enabled ? 'disabled' : 'enabled'}`,
      });
      
      fetchIntegrations();
    } catch (error) {
      console.error('Error updating integration:', error);
      toast({
        title: "Error",
        description: "Failed to update integration",
        variant: "destructive",
      });
    }
  };

  const handleTest = async (integration: Integration) => {
    setTesting(integration.id);
    try {
      const response = await fetch(`/api/admin/integrations/${integration.id}/test`, {
        method: 'POST',
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Test Successful",
          description: "Integration is working correctly",
        });
      } else {
        toast({
          title: "Test Failed",
          description: result.error || "Integration test failed",
          variant: "destructive",
        });
      }
      
      fetchIntegrations();
    } catch (error) {
      console.error('Error testing integration:', error);
      toast({
        title: "Error",
        description: "Failed to test integration",
        variant: "destructive",
      });
    } finally {
      setTesting(null);
    }
  };

  const getStatusIcon = (integration: Integration) => {
    if (!integration.enabled) return <XCircle className="w-4 h-4 text-gray-400" />;
    
    switch (integration.testStatus) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failure':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-zinc-400">Loading integrations...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Integrations</h1>
          <p className="text-zinc-400 mt-1">
            Connect third-party services for SMS, email, calendar, file storage, payments, and accounting.
          </p>
        </div>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Settings2 className="w-5 h-5 mr-2" />
              Available Integrations
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Configure and manage your third-party service connections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-700">
                  <TableHead className="text-zinc-300">Provider</TableHead>
                  <TableHead className="text-zinc-300">Status</TableHead>
                  <TableHead className="text-zinc-300">Last Tested</TableHead>
                  <TableHead className="text-zinc-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(providerConfigs).filter(([provider, config]) => {
                  // Filter integrations based on plan features
                  if (provider === 'quickbooks' && !hasQuickBooks) return false;
                  if (provider === 'braintree' && !hasBraintree) return false;
                  return true;
                }).map(([provider, config]) => {
                  const integration = integrations.find(i => i.provider === provider);
                  
                  return (
                    <TableRow key={provider} className="border-zinc-700">
                      <TableCell className="text-white">
                        <div className="flex items-center space-x-3">
                          {config.icon}
                          <div>
                            <div className="font-medium">{config.name}</div>
                            <div className="text-sm text-zinc-400">{config.description}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(integration || { enabled: false } as Integration)}
                          <Badge 
                            variant={integration?.enabled ? 'default' : 'secondary'}
                            className={integration?.enabled ? 'bg-green-600' : ''}
                          >
                            {integration?.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-zinc-400">
                        {integration?.lastTestedAt 
                          ? new Date(integration.lastTestedAt).toLocaleDateString()
                          : 'Never'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleConfigure(provider)}
                            className="text-white border-zinc-600 hover:bg-zinc-800"
                          >
                            Configure
                          </Button>
                          {integration && (
                            <>
                              <Switch
                                checked={integration.enabled}
                                onCheckedChange={() => handleToggle(integration)}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleTest(integration)}
                                disabled={!integration.enabled || testing === integration.id}
                                className="text-white border-zinc-600 hover:bg-zinc-800"
                              >
                                {testing === integration.id ? (
                                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                                ) : (
                                  <TestTube className="w-4 h-4" />
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Locked Integrations (for upgrade prompts) */}
        {(!hasQuickBooks || !hasBraintree) && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Lock className="w-5 h-5 mr-2" />
                Premium Integrations
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Upgrade your plan to unlock these advanced integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {!hasQuickBooks && providerConfigs.quickbooks && (
                  <div className="flex items-center justify-between p-4 border border-zinc-700 rounded-lg bg-zinc-800/50">
                    <div className="flex items-center space-x-3">
                      {providerConfigs.quickbooks.icon}
                      <div>
                        <div className="font-medium text-white">{providerConfigs.quickbooks.name}</div>
                        <div className="text-sm text-zinc-400">{providerConfigs.quickbooks.description}</div>
                        <Badge variant="secondary" className="mt-1">Elite Plan Required</Badge>
                      </div>
                    </div>
                    <Button variant="outline" className="text-white border-zinc-600 hover:bg-zinc-800">
                      Upgrade Plan
                    </Button>
                  </div>
                )}
                {!hasBraintree && providerConfigs.braintree && (
                  <div className="flex items-center justify-between p-4 border border-zinc-700 rounded-lg bg-zinc-800/50">
                    <div className="flex items-center space-x-3">
                      {providerConfigs.braintree.icon}
                      <div>
                        <div className="font-medium text-white">{providerConfigs.braintree.name}</div>
                        <div className="text-sm text-zinc-400">{providerConfigs.braintree.description}</div>
                        <Badge variant="secondary" className="mt-1">Growth Plan Required</Badge>
                      </div>
                    </div>
                    <Button variant="outline" className="text-white border-zinc-600 hover:bg-zinc-800">
                      Upgrade Plan
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Configure Integration Dialog */}
        <Dialog open={!!configureDialog} onOpenChange={() => setConfigureDialog(null)}>
          <DialogContent className="bg-zinc-900 border-zinc-700 text-white">
            <DialogHeader>
              <DialogTitle>
                Configure {configureDialog && providerConfigs[configureDialog]?.name}
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                {configureDialog && providerConfigs[configureDialog]?.description}
              </DialogDescription>
            </DialogHeader>
            
            {configureDialog && (
              <div className="space-y-4">
                {providerConfigs[configureDialog].fields.map((field) => (
                  <div key={field.key}>
                    <Label htmlFor={field.key} className="text-zinc-300">
                      {field.label}
                      {field.required && <span className="text-red-400 ml-1">*</span>}
                    </Label>
                    <Input
                      id={field.key}
                      type={field.type}
                      placeholder={field.placeholder}
                      value={credentials[field.key] || ''}
                      onChange={(e) => setCredentials(prev => ({
                        ...prev,
                        [field.key]: e.target.value
                      }))}
                      className="bg-zinc-800 border-zinc-700 text-white mt-1"
                    />
                  </div>
                ))}
                
                <div className="flex justify-end space-x-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setConfigureDialog(null)}
                    className="text-white border-zinc-600 hover:bg-zinc-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {saving ? 'Saving...' : 'Save Integration'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}