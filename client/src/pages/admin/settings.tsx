import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { Badge } from '../../components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useToast } from '../../hooks/use-toast';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Settings, Shield, Bell, Users, Zap, CheckCircle, XCircle, AlertCircle, ExternalLink, Calendar, Clock, CreditCard, Building2, Upload, X, Image, MapPin, Plus, Edit2, Crown, DollarSign, Receipt, Mail, MessageSquare, Cloud, TestTube, Lock, Settings2, Info } from 'lucide-react';
import { CardDescription } from '@/components/ui/card';
import { useBusinessName } from "@/contexts/BusinessContext";
import { Link } from 'wouter';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { usePlanFeatures, useHasFeature, FeatureGuard, UpgradePrompt, usePlanLimits } from '../../hooks/use-feature-flags';
import { FEATURE_KEYS } from '@shared/schema';
import { useTenantPlan, useSubscriptionInfo } from '../../hooks/useTenantPlan';
import { ManageSubscriptionButton } from '../../components/billing/ManageSubscriptionButton';
import { FeatureGrid } from '../../components/billing/FeatureGrid';
import { PlanComparisonCards } from '../../components/billing/PlanComparisonCards';
import { plans, getPlan } from '@/lib/planUtils';
import { useUpgradeStatus } from '../../hooks/use-upgrade-status';
import { SubscriptionUpgradeBanner, SubscriptionSuccessBanner } from '../../components/subscription-upgrade-banner';
import { PlanUpgradeButtons } from '../../components/plan-upgrade-buttons';
import AgePolicySettings from '../../components/admin/AgePolicySettings';
import ConsentTemplateSettings from '../../components/admin/ConsentTemplateSettings';

interface LocationData {
  name: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

interface SystemSettings {
  autoApproveRegistrations: boolean;
  businessName: string;
  businessLogo?: string;
  contactEmail: string;
  supportEmail: string;
  supportPhone: string;
  supportHours: string;
  supportLocation: string;
  timezone: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  sessionCapacityWarning: number;
  paymentReminderMinutes: number;
  paymentSubmissionTimeMinutes: number;
  refundCutoffMinutes: number;
  weekdayStart: string;
  weekdayEnd: string;
  fiscalYearType: string;
  fiscalYearStartMonth: number;
  availableLocations: (string | LocationData)[];
  // Waitlist settings
  defaultWaitlistEnabled: boolean;
  defaultWaitlistLimit: number;
  defaultWaitlistOfferTimeMinutes: number;
  defaultAutoPromote: boolean;
  waitlistNotificationEmail: boolean;
  waitlistNotificationSMS: boolean;
  waitlistJoinMessage: string;
  waitlistPromotionMessage: string;

}

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

interface SubscriptionInfo {
  subscription: {
    id: string;
    status: string;
    current_period_start: number | null;
    current_period_end: number | null;
    planName?: string;
    amount?: number;
    currentPeriodEnd?: string;
    hostedInvoiceUrl?: string;
    plan?: {
      id: string;
      nickname: string;
      amount: number;
      currency: string;
      interval: string;
      product?: {
        id: string;
        name: string;
        description: string;
      };
    } | null;
    customer?: {
      id: string;
      email: string;
    };
  };
  invoices?: Array<{
    id: string;
    status: string;
    amount_paid: number;
    created: number;
    period_start: number;
    period_end: number;
    hosted_invoice_url?: string;
    invoice_pdf?: string;
  }>;
  customer_id?: string;
}



const getTimezones = () => {
  const priorityTimezones = [
    'America/New_York',
    'America/Chicago', 
    'America/Denver',
    'America/Los_Angeles',
    'America/Phoenix',
    'Pacific/Honolulu',
    'America/Anchorage',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Rome',
    'Europe/Madrid',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Kolkata',
    'Asia/Dubai',
    'Australia/Sydney',
    'Australia/Melbourne',
    'Pacific/Auckland',
    'America/Sao_Paulo',
    'America/Mexico_City',
    'America/Toronto',
    'America/Vancouver',
    'Europe/Amsterdam',
    'Europe/Stockholm',
    'Europe/Moscow',
    'Asia/Seoul',
    'Asia/Singapore',
    'Asia/Bangkok',
    'Africa/Cairo',
    'Africa/Johannesburg',
    'UTC'
  ];
  
  const remainingTimezones = Intl.supportedValuesOf('timeZone')
    .filter(tz => !priorityTimezones.includes(tz))
    .sort();
  
  return [...priorityTimezones, ...remainingTimezones];
};

// Plan & Features Component
function PlanAndFeaturesContent() {
  const { data: tenantPlan, isLoading: tenantPlanLoading } = useTenantPlan();
  const { data: subscriptionInfo, isLoading: subscriptionLoading } = useSubscriptionInfo();
  const { data: planFeatures } = usePlanFeatures();

  if (tenantPlanLoading || subscriptionLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-muted-foreground">Loading plan information...</div>
      </div>
    );
  }

  const currentPlan = tenantPlan?.planId || planFeatures?.planLevel || 'free';
  const plan = getPlan(currentPlan) || getPlan('free')!;
  const planDisplayName = plan.name;
  const planPrice = plan.price;
  const billingStatus = tenantPlan?.billingStatus || 'none';
  const hasActiveSubscription = billingStatus === 'active';

  return (
    <div className="space-y-6">
      {/* Current Plan Overview */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center">
            <Crown className="w-5 h-5 mr-2 text-amber-500" />
            Current Plan
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Your plan determines which features and limits are available for your organization.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-foreground capitalize mb-2">
                {planDisplayName} Plan
              </div>
              <div className="text-sm text-muted-foreground">
                {planPrice === 0 ? 'Free forever' : `$${planPrice}/month`}
              </div>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-lg font-semibold text-foreground mb-2">Player Limit</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {plan.playerLimit === 'unlimited' 
                  ? 'Unlimited' 
                  : `${planFeatures?.playerCount || 0}/${plan.playerLimit}`}
              </div>
              <div className="text-sm text-muted-foreground">
                {plan.playerLimit === 'unlimited' 
                  ? `Currently registered: ${planFeatures?.playerCount || 0}`
                  : 'Current vs maximum players'}
              </div>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-lg font-semibold text-foreground mb-2">Billing Status</div>
              <div className="space-y-2">
                {hasActiveSubscription ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">
                      Active
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {currentPlan === 'free' ? 'Free Plan' : 'Inactive'}
                    </span>
                  </div>
                )}
                
                <ManageSubscriptionButton
                  planId={currentPlan as any}
                  billingStatus={billingStatus as any}
                  className="mt-2"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan Comparison Cards */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Plan Options
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Compare features and upgrade to unlock more capabilities for your organization.
          </p>
        </CardHeader>
        <CardContent>
          <PlanComparisonCards currentPlan={currentPlan as any} />
        </CardContent>
      </Card>

      {/* Feature Grid */}
      <FeatureGrid currentPlan={currentPlan} />
    </div>
  );
}

export default function AdminSettings() {
  const businessName = useBusinessName();
  const { upgradeStatus, clearUpgradeStatus } = useUpgradeStatus();
  const [settings, setSettings] = useState<SystemSettings>({
    autoApproveRegistrations: true,
    businessName: '',
    contactEmail: '',
    supportEmail: '',
    supportPhone: '',
    supportHours: '',
    supportLocation: '',
    timezone: 'America/New_York',
    emailNotifications: true,
    smsNotifications: false,
    sessionCapacityWarning: 3,
    paymentReminderMinutes: 60,
    paymentSubmissionTimeMinutes: 30,
    weekdayStart: 'monday',
    weekdayEnd: 'sunday',
    fiscalYearType: 'calendar',
    fiscalYearStartMonth: 1,
    availableLocations: [
      { name: 'Turf City', addressLine1: 'Turf City', city: 'Singapore', country: 'SG' },
      { name: 'Sports Hub', addressLine1: 'Sports Hub', city: 'Singapore', country: 'SG' },
      { name: 'Jurong East', addressLine1: 'Jurong East', city: 'Singapore', country: 'SG' }
    ],
    // Waitlist settings
    defaultWaitlistEnabled: true,
    defaultWaitlistLimit: 10,
    defaultWaitlistOfferTimeMinutes: 45,
    defaultAutoPromote: true,
    waitlistNotificationEmail: true,
    waitlistNotificationSMS: false,
    waitlistJoinMessage: "You've been added to the waitlist for {session}. You're #{position} in line.",
    waitlistPromotionMessage: "Great news! A spot opened up in {session}. You have until {expires} to complete your booking."
  });
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [configureDialog, setConfigureDialog] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [savingIntegration, setSavingIntegration] = useState(false);
  const [testingIntegration, setTestingIntegration] = useState<string | null>(null);
  const [activeProcessor, setActiveProcessor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch current tenant capabilities to check requireConsent status
  const { data: tenantCapabilities } = useQuery({
    queryKey: ["/api/tenant/capabilities"],
    queryFn: () => fetch("/api/tenant/capabilities", { credentials: 'include' }).then(res => res.json()),
    retry: false,
  });

  const isConsentFormsEnabled = tenantCapabilities?.policy?.requireConsent === true;
  const [saving, setSaving] = useState(false);
  const [newLocation, setNewLocation] = useState('');
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationData | null>(null);
  const [logoJustUploaded, setLogoJustUploaded] = useState(false);
  const [locationForm, setLocationForm] = useState<LocationData>({
    name: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Feature flag hooks
  const { data: planFeatures } = usePlanFeatures();
  const { hasFeature: hasSmsFeature } = useHasFeature(FEATURE_KEYS.NOTIFICATIONS_SMS);
  const { hasFeature: hasPaymentsFeature } = useHasFeature(FEATURE_KEYS.PAYMENTS_ENABLED);
  const { hasFeature: hasAdvancedAnalytics } = useHasFeature(FEATURE_KEYS.ANALYTICS_ADVANCED);
  const { hasFeature: hasAutoPromotion } = useHasFeature(FEATURE_KEYS.WAITLIST_AUTO_PROMOTE);
  const planLimits = usePlanLimits();

  // Check if Twilio integration is enabled
  const isTwilioEnabled = integrations.some(
    integration => integration.provider.toLowerCase() === 'twilio' && integration.enabled
  );

  // Combined SMS availability check (requires both plan feature and Twilio integration)
  const canUseSms = hasSmsFeature && isTwilioEnabled;

  useEffect(() => {
    // Check for payment success parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success') {
      toast({
        title: "Payment Successful",
        description: "Your subscription payment has been processed successfully!",
      });
      // Clean up the URL without refreshing the page
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    fetchSettings();
    fetchIntegrations();
    fetchActiveProcessor();
  }, [toast]);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      
      if (data.paymentReminderHours && !data.paymentReminderMinutes) {
        data.paymentReminderMinutes = data.paymentReminderHours * 60;
        delete data.paymentReminderHours;
      }
      
      // Ensure availableLocations has a default value if not present
      if (!data.availableLocations) {
        data.availableLocations = [
          { name: 'Turf City', addressLine1: 'Turf City', city: 'Singapore', country: 'SG' },
          { name: 'Sports Hub', addressLine1: 'Sports Hub', city: 'Singapore', country: 'SG' },
          { name: 'Jurong East', addressLine1: 'Jurong East', city: 'Singapore', country: 'SG' }
        ];
      }
      
      // Convert legacy string locations to objects
      data.availableLocations = data.availableLocations.map((loc: any) => {
        if (typeof loc === 'string') {
          return { name: loc, addressLine1: loc, country: 'US' };
        }
        return loc;
      });
      
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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

  const fetchIntegrations = async () => {
    try {
      const response = await fetch('/api/admin/integrations');
      if (!response.ok) throw new Error('Failed to fetch integrations');
      const data = await response.json();
      setIntegrations(data);
    } catch (error) {
      console.error('Error fetching integrations:', error);
    }
  };

  const fetchActiveProcessor = async () => {
    try {
      const response = await fetch('/api/billing/active-processor');
      if (response.ok) {
        const data = await response.json();
        setActiveProcessor(data);
      }
    } catch (error) {
      console.error('Error fetching active processor:', error);
    }
  };

  const handleConfigureIntegration = async (provider: string) => {
    try {
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

  const handleTestIntegration = async (provider: string) => {
    setTestingIntegration(provider);
    
    try {
      const response = await fetch(`/api/admin/integrations/test/${provider}`, {
        method: 'POST',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Test Successful",
          description: `${provider} integration is working correctly.`,
        });
      } else {
        toast({
          title: "Test Failed",
          description: result.error || `Failed to test ${provider} integration.`,
          variant: "destructive",
        });
      }
      
    } catch (error) {
      console.error('Error testing integration:', error);
      toast({
        title: "Test Error",
        description: `Failed to test ${provider} integration.`,
        variant: "destructive",
      });
    } finally {
      setTestingIntegration(null);
    }
  };

  const handleSaveIntegration = async () => {
    if (!configureDialog) return;
    
    setSavingIntegration(true);
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
        throw new Error(error.message || error.error || 'Failed to save integration');
      }

      const isPaymentProcessor = configureDialog === 'stripe' || configureDialog === 'braintree';
      const message = isPaymentProcessor 
        ? `${configureDialog} integration saved successfully. Other payment processors have been automatically disabled.`
        : "Integration saved successfully";

      toast({
        title: "Success",
        description: message,
      });
      
      setConfigureDialog(null);
      setCredentials({});
      fetchIntegrations();
      fetchActiveProcessor();
    } catch (error) {
      console.error('Error saving integration:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save integration",
        variant: "destructive",
      });
    } finally {
      setSavingIntegration(false);
    }
  };

  const handleToggleIntegration = async (integration: Integration) => {
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
      fetchActiveProcessor();
    } catch (error) {
      console.error('Error toggling integration:', error);
      toast({
        title: "Error",
        description: "Failed to update integration",
        variant: "destructive",
      });
    }
  };





  const openLocationDialog = (location?: LocationData) => {
    if (location) {
      setEditingLocation(location);
      setLocationForm({ ...location });
    } else {
      setEditingLocation(null);
      setLocationForm({
        name: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'US',
      });
    }
    setLocationDialogOpen(true);
  };

  const handleSaveLocation = () => {
    if (!locationForm.name.trim()) {
      toast({
        title: "Error",
        description: "Location name is required",
        variant: "destructive",
      });
      return;
    }

    const newLocations = [...settings.availableLocations] as LocationData[];
    
    if (editingLocation) {
      // Update existing location
      const index = newLocations.findIndex(loc => 
        (typeof loc === 'object' ? loc.name : loc) === editingLocation.name
      );
      if (index !== -1) {
        newLocations[index] = { ...locationForm };
      }
    } else {
      // Add new location
      const existingNames = newLocations.map(loc => 
        typeof loc === 'object' ? loc.name : loc
      );
      if (existingNames.includes(locationForm.name.trim())) {
        toast({
          title: "Error",
          description: "A location with this name already exists",
          variant: "destructive",
        });
        return;
      }
      newLocations.push({ ...locationForm });
    }

    setSettings(prev => ({ ...prev, availableLocations: newLocations }));
    setLocationDialogOpen(false);
    setEditingLocation(null);
  };

  const removeLocation = (locationToRemove: string | LocationData) => {
    const locationName = typeof locationToRemove === 'object' ? locationToRemove.name : locationToRemove;
    const newLocations = settings.availableLocations.filter(loc => {
      const locName = typeof loc === 'object' ? loc.name : loc;
      return locName !== locationName;
    });
    setSettings(prev => ({ ...prev, availableLocations: newLocations }));
  };

  const getLocationDisplayName = (location: string | LocationData): string => {
    if (typeof location === 'string') return location;
    return location.name;
  };

  const getLocationAddress = (location: string | LocationData): string => {
    if (typeof location === 'string') return '';
    const parts = [location.addressLine1, location.city, location.state].filter(Boolean);
    return parts.join(', ');
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Logo file size must be less than 2MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: "Please upload a PNG, JPEG, or SVG image",
        variant: "destructive",
      });
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setSettings(prev => ({ ...prev, businessLogo: base64String }));
      setLogoJustUploaded(true);
      // Clear the upload message after 3 seconds
      setTimeout(() => {
        setLogoJustUploaded(false);
      }, 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update settings');
      }

      // Invalidate settings cache to refresh other components
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });

      if (window.location && settings.timezone) {
        window.location.reload();
      }

      toast({
        title: "Success",
        description: "Settings updated successfully",
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-muted-foreground">Loading settings...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <>
      {/* Upgrade Status Banners */}
      <SubscriptionUpgradeBanner
        isAnimating={upgradeStatus.isAnimating}
        plan={upgradeStatus.plan}
        onClose={clearUpgradeStatus}
      />
      
      {upgradeStatus.success && !upgradeStatus.isAnimating && (
        <SubscriptionSuccessBanner
          plan={upgradeStatus.plan}
          onClose={clearUpgradeStatus}
        />
      )}
      
      <AdminLayout>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Admin Settings</h1>
        </div>

      <Tabs defaultValue="general" className="space-y-6">
        {/* Mobile Tab Navigation - Vertical Stack */}
        <div className="md:hidden">
          <TabsList className="flex flex-col w-full bg-muted border-border h-auto p-1">
            <TabsTrigger 
              value="general" 
              className="w-full justify-start data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-sm py-3"
            >
              General & Registration
            </TabsTrigger>
            <TabsTrigger 
              value="sessions" 
              className="w-full justify-start data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-sm py-3"
            >
              Sessions & Schedule
            </TabsTrigger>
            <TabsTrigger 
              value="communications" 
              className="w-full justify-start data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-sm py-3"
            >
              Communications
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="w-full justify-start data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-sm py-3"
            >
              Security
            </TabsTrigger>
            <TabsTrigger 
              value="plan" 
              className="w-full justify-start data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-sm py-3"
            >
              Plan & Features
            </TabsTrigger>

            <TabsTrigger 
              value="integrations" 
              className="w-full justify-start data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-sm py-3"
            >
              Integrations
            </TabsTrigger>
            <TabsTrigger 
              value="age-policy" 
              className="w-full justify-start data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-sm py-3"
            >
              Age Policy
            </TabsTrigger>
            <TabsTrigger 
              value="consent-forms" 
              className={`w-full justify-start data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-sm py-3 ${
                !isConsentFormsEnabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={!isConsentFormsEnabled}
            >
              <div className="flex items-center">
                Consent Forms
                {!isConsentFormsEnabled && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 ml-2 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>To access consent forms, enable "Require Consent Forms" under Age Policy settings.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Desktop Tab Navigation - Horizontal Grid */}
        <div className="hidden md:block">
          <TabsList className="grid w-full grid-cols-8 bg-muted border-border">
            <TabsTrigger value="general" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
              General & Registration
            </TabsTrigger>
            <TabsTrigger value="sessions" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
              Sessions & Schedule
            </TabsTrigger>
            <TabsTrigger value="communications" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
              Communications
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
              Security
            </TabsTrigger>
            <TabsTrigger value="plan" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
              Plan & Features
            </TabsTrigger>
            <TabsTrigger value="integrations" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
              Integrations
            </TabsTrigger>
            <TabsTrigger value="age-policy" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
              Age Policy
            </TabsTrigger>
            <TabsTrigger 
              value="consent-forms" 
              className={`data-[state=active]:bg-accent data-[state=active]:text-accent-foreground ${
                !isConsentFormsEnabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={!isConsentFormsEnabled}
            >
              <div className="flex items-center">
                Consent Forms
                {!isConsentFormsEnabled && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 ml-2 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>To access consent forms, enable "Require Consent Forms" under Age Policy settings.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="general" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                General Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="businessName" className="text-foreground">Business Name</Label>
                <Input
                  id="businessName"
                  value={settings.businessName}
                  onChange={(e) => setSettings(prev => ({ ...prev, businessName: e.target.value }))}
                  className="bg-input border-border text-foreground"
                  placeholder="Your business or organization name"
                />
              </div>
              <div>
                <Label className="text-foreground">Business Logo</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Upload a logo to replace the business name text. Maximum size: 2MB. Recommended dimensions: 200x60px.
                </p>
                <div className="space-y-4">
                  {settings.businessLogo ? (
                    <div className="relative inline-block">
                      <img 
                        src={settings.businessLogo} 
                        alt="Business Logo" 
                        className="max-h-16 max-w-48 object-contain bg-muted rounded p-2"
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-6 w-6 p-0"
                        onClick={() => setSettings(prev => ({ ...prev, businessLogo: '' }))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : null}
                  <div className="flex items-center gap-4">
                    <Input
                      id="logoUpload"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('logoUpload')?.click()}
                      className="bg-secondary border-border hover:bg-secondary/80"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Logo
                    </Button>
                    {logoJustUploaded && settings.businessLogo ? (
                      <span className="text-sm text-green-500 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Logo uploaded
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="contactEmail" className="text-foreground">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => setSettings(prev => ({ ...prev, contactEmail: e.target.value }))}
                  className="bg-input border-border text-foreground"
                  placeholder="Primary contact email address"
                />
              </div>
              <div>
                <Label htmlFor="supportEmail" className="text-foreground">Support Email</Label>
                <Input
                  id="supportEmail"
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => setSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                  className="bg-input border-border text-foreground"
                  placeholder="Email address for help request notifications"
                />
              </div>
              <div>
                <Label htmlFor="supportPhone" className="text-foreground">Support Phone</Label>
                <Input
                  id="supportPhone"
                  type="tel"
                  value={settings.supportPhone}
                  onChange={(e) => setSettings(prev => ({ ...prev, supportPhone: e.target.value }))}
                  className="bg-input border-border text-foreground"
                  placeholder="Phone number for support inquiries"
                />
              </div>
              <div>
                <Label htmlFor="supportHours" className="text-foreground">Support Hours</Label>
                <Input
                  id="supportHours"
                  value={settings.supportHours}
                  onChange={(e) => setSettings(prev => ({ ...prev, supportHours: e.target.value }))}
                  className="bg-input border-border text-foreground"
                  placeholder="e.g., Monday - Friday, 9:00 AM - 5:00 PM"
                />
              </div>
              <div>
                <Label htmlFor="supportLocation" className="text-foreground">Support Location</Label>
                <Input
                  id="supportLocation"
                  value={settings.supportLocation}
                  onChange={(e) => setSettings(prev => ({ ...prev, supportLocation: e.target.value }))}
                  className="bg-input border-border text-foreground"
                  placeholder="Business location or region"
                />
              </div>
              <div>
                <Label htmlFor="timezone" className="text-foreground">Timezone</Label>
                <Select
                  value={settings.timezone}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, timezone: value }))}
                >
                  <SelectTrigger className="bg-input border-border text-foreground">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border max-h-60">
                    {getTimezones().map((tz) => (
                      <SelectItem key={tz} value={tz} className="text-foreground hover:bg-accent">
                        {tz.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Business Schedule & Fiscal Year
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="weekdayStart" className="text-foreground">Business Week Start</Label>
                <Select
                  value={settings.weekdayStart}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, weekdayStart: value }))}
                >
                  <SelectTrigger className="bg-input border-border text-foreground mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="monday" className="text-foreground hover:bg-accent">Monday</SelectItem>
                    <SelectItem value="tuesday" className="text-foreground hover:bg-accent">Tuesday</SelectItem>
                    <SelectItem value="wednesday" className="text-foreground hover:bg-accent">Wednesday</SelectItem>
                    <SelectItem value="thursday" className="text-foreground hover:bg-accent">Thursday</SelectItem>
                    <SelectItem value="friday" className="text-foreground hover:bg-accent">Friday</SelectItem>
                    <SelectItem value="saturday" className="text-foreground hover:bg-accent">Saturday</SelectItem>
                    <SelectItem value="sunday" className="text-foreground hover:bg-accent">Sunday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="fiscalYearType" className="text-foreground">Fiscal Year Type</Label>
                <Select
                  value={settings.fiscalYearType}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, fiscalYearType: value }))}
                >
                  <SelectTrigger className="bg-input border-border text-foreground mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="calendar" className="text-foreground hover:bg-accent">Calendar Year (Jan-Dec)</SelectItem>
                    <SelectItem value="fiscal" className="text-foreground hover:bg-accent">Custom Fiscal Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {settings.fiscalYearType === 'fiscal' && (
                <div>
                  <Label htmlFor="fiscalYearStartMonth" className="text-foreground">Fiscal Year Start Month</Label>
                  <Select
                    value={settings.fiscalYearStartMonth.toString()}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, fiscalYearStartMonth: parseInt(value) }))}
                  >
                    <SelectTrigger className="bg-input border-border text-foreground mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="1" className="text-foreground hover:bg-accent">January</SelectItem>
                      <SelectItem value="2" className="text-foreground hover:bg-accent">February</SelectItem>
                      <SelectItem value="3" className="text-foreground hover:bg-accent">March</SelectItem>
                      <SelectItem value="4" className="text-foreground hover:bg-accent">April</SelectItem>
                      <SelectItem value="5" className="text-foreground hover:bg-accent">May</SelectItem>
                      <SelectItem value="6" className="text-foreground hover:bg-accent">June</SelectItem>
                      <SelectItem value="7" className="text-foreground hover:bg-accent">July</SelectItem>
                      <SelectItem value="8" className="text-foreground hover:bg-accent">August</SelectItem>
                      <SelectItem value="9" className="text-foreground hover:bg-accent">September</SelectItem>
                      <SelectItem value="10" className="text-foreground hover:bg-accent">October</SelectItem>
                      <SelectItem value="11" className="text-foreground hover:bg-accent">November</SelectItem>
                      <SelectItem value="12" className="text-foreground hover:bg-accent">December</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Registration Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-foreground">Auto-approve new registrations</Label>
                  <p className="text-sm text-muted-foreground">
                    When enabled, new parent and player sign-ups are automatically approved
                  </p>
                </div>
                <Switch
                  checked={settings.autoApproveRegistrations}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, autoApproveRegistrations: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification settings moved to Communications tab */}
          
          {/* Save Button at bottom of General & Registration tab */}
          <div className="flex justify-start">
            <Button onClick={handleSave} disabled={saving} className="px-6">
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Session Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-foreground">Session Management</h4>
                <div>
                  <Label htmlFor="capacityWarning" className="text-foreground">Session Capacity Warning</Label>
                  <Input
                    id="capacityWarning"
                    type="number"
                    min="1"
                    max="10"
                    value={settings.sessionCapacityWarning}
                    onChange={(e) => setSettings(prev => ({ ...prev, sessionCapacityWarning: parseInt(e.target.value) || 3 }))}
                    className="bg-input border-border text-foreground mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Spots remaining before showing capacity warning</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium text-foreground">Payment & Booking Timeframes</h4>
                
                <div>
                  <Label htmlFor="paymentSubmissionTime" className="text-foreground">Payment Submission Time (minutes)</Label>
                  <Input
                    id="paymentSubmissionTime"
                    type="number"
                    min="5"
                    max="1440"
                    value={settings.paymentSubmissionTimeMinutes || 30}
                    onChange={(e) => setSettings(prev => ({ ...prev, paymentSubmissionTimeMinutes: parseInt(e.target.value) || 30 }))}
                    className="bg-input border-border text-foreground mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">How long parents/players have to complete payment after selecting a session to book</p>
                </div>
                
                <div>
                  <Label htmlFor="paymentReminder" className="text-foreground">Payment Reminder Minutes</Label>
                  <Input
                    id="paymentReminder"
                    type="number"
                    min="5"
                    max="1440"
                    value={settings.paymentReminderMinutes}
                    onChange={(e) => setSettings(prev => ({ ...prev, paymentReminderMinutes: parseInt(e.target.value) || 60 }))}
                    className="bg-input border-border text-foreground mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Send payment reminders this many minutes before deadline</p>
                </div>
                
                <div>
                  <Label htmlFor="refundCutoff" className="text-foreground">Refund Cutoff Minutes</Label>
                  <Input
                    id="refundCutoff"
                    type="number"
                    min="0"
                    max="10080"
                    value={settings.refundCutoffMinutes || 60}
                    onChange={(e) => setSettings(prev => ({ ...prev, refundCutoffMinutes: parseInt(e.target.value) || 60 }))}
                    className="bg-input border-border text-foreground mt-1"
                    data-testid="input-refund-cutoff"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Minutes before session start when refunds are no longer allowed</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium text-foreground">Default Waitlist Settings</h4>
                <p className="text-sm text-muted-foreground">These settings will be applied to new sessions by default. Individual sessions can override these values.</p>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-foreground">Enable Waitlists by Default</Label>
                    <p className="text-sm text-muted-foreground">
                      New sessions will have waitlists enabled automatically
                    </p>
                  </div>
                  <Switch
                    checked={settings.defaultWaitlistEnabled}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, defaultWaitlistEnabled: checked }))
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="defaultWaitlistLimit" className="text-foreground">Default Waitlist Limit</Label>
                    <Input
                      id="defaultWaitlistLimit"
                      type="number"
                      min="0"
                      max="100"
                      value={settings.defaultWaitlistLimit}
                      onChange={(e) => setSettings(prev => ({ ...prev, defaultWaitlistLimit: parseInt(e.target.value) || 10 }))}
                      className="bg-input border-border text-foreground mt-1"
                      placeholder="10"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Maximum waitlist size (0 = unlimited)</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="defaultWaitlistOfferTime" className="text-foreground">Waitlist Offer Time (minutes)</Label>
                    <Input
                      id="defaultWaitlistOfferTime"
                      type="number"
                      min="15"
                      max="1440"
                      value={settings.defaultWaitlistOfferTimeMinutes || 45}
                      onChange={(e) => setSettings(prev => ({ ...prev, defaultWaitlistOfferTimeMinutes: parseInt(e.target.value) || 45 }))}
                      className="bg-input border-border text-foreground mt-1"
                      placeholder="45"
                    />
                    <p className="text-xs text-muted-foreground mt-1">How long to accept a waitlist offer</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className={`${!hasAutoPromotion ? 'text-muted-foreground' : 'text-foreground'}`}>
                        Auto-promote by Default
                        {!hasAutoPromotion && (
                          <Crown className="w-4 h-4 inline ml-1 text-amber-500" />
                        )}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {hasAutoPromotion 
                          ? 'Automatically offer spots to next person on waitlist'
                          : 'Automatic waitlist promotion is available on Growth and Elite plans'
                        }
                      </p>
                      {!hasAutoPromotion && (
                        <UpgradePrompt 
                          feature={FEATURE_KEYS.WAITLIST_AUTO_PROMOTE} 
                          className="mt-2"
                          targetPlan="growth"
                        />
                      )}
                    </div>
                    <Switch
                      checked={settings.defaultAutoPromote && hasAutoPromotion}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, defaultAutoPromote: checked }))
                      }
                      disabled={!hasAutoPromotion}
                    />
                  </div>
                </div>

                {/* Communication Settings - Last section */}
                <div className="border-t border-border pt-6 space-y-4">
                  <h4 className="text-sm font-medium text-foreground">Communication Settings</h4>
                  <p className="text-sm text-muted-foreground">Configure how parents are notified about waitlist updates</p>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-foreground">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Send email notifications for waitlist updates
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          Default: Emails sent from company domain. White-label options available on higher plans.
                        </p>
                      </div>
                      <Switch
                        checked={settings.waitlistNotificationEmail}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, waitlistNotificationEmail: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className={`${!isTwilioEnabled ? 'text-muted-foreground' : 'text-foreground'}`}>
                          SMS Notifications
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {isTwilioEnabled 
                            ? 'Send SMS notifications for urgent waitlist updates'
                            : 'Requires Twilio integration to be configured'
                          }
                        </p>
                        {!isTwilioEnabled && (
                          <p className="text-xs text-amber-600 dark:text-amber-400">
                            Configure Twilio in the Integrations tab to enable SMS notifications
                          </p>
                        )}
                      </div>
                      <Switch
                        checked={settings.waitlistNotificationSMS && isTwilioEnabled}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, waitlistNotificationSMS: checked }))
                        }
                        disabled={!isTwilioEnabled}
                      />
                    </div>

                    {/* Message Templates */}
                    <div className="space-y-4 pt-4">
                      <h5 className="text-sm font-medium text-foreground">Message Templates</h5>
                      <p className="text-xs text-muted-foreground">
                        Customize the messages sent to parents. Variables will be automatically replaced with actual session details.
                      </p>
                      
                      <div>
                        <Label htmlFor="waitlistJoinMessage" className="text-foreground">Join Waitlist Message</Label>
                        <Textarea
                          id="waitlistJoinMessage"
                          value={settings.waitlistJoinMessage}
                          onChange={(e) => setSettings(prev => ({ ...prev, waitlistJoinMessage: e.target.value }))}
                          className="bg-input border-border text-foreground mt-1"
                          rows={2}
                          placeholder="You've been added to the waitlist for {session}. You're #{position} in line."
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Available variables: {"{session}"}, {"{position}"}, {"{location}"}, {"{date}"}, {"{time}"}
                        </p>
                        
                        {/* Dynamic Preview */}
                        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <div className="text-xs text-blue-800 dark:text-blue-200 font-medium mb-1">Preview:</div>
                          <div className="text-sm text-blue-700 dark:text-blue-300">
                            {(settings.waitlistJoinMessage || "You've been added to the waitlist for {session}. You're #{position} in line.")
                              .replace('{session}', 'U12 Boys Training Session')
                              .replace('{position}', '3')
                              .replace('{location}', 'Main Field')
                              .replace('{date}', new Date().toLocaleDateString())
                              .replace('{time}', '6:00 PM')
                            }
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="waitlistPromotionMessage" className="text-foreground">Promotion Message</Label>
                        <Textarea
                          id="waitlistPromotionMessage"
                          value={settings.waitlistPromotionMessage}
                          onChange={(e) => setSettings(prev => ({ ...prev, waitlistPromotionMessage: e.target.value }))}
                          className="bg-input border-border text-foreground mt-1"
                          rows={3}
                          placeholder="Great news! A spot opened up in {session}. You have until {expires} to complete your booking."
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Available variables: {"{session}"}, {"{expires}"}, {"{location}"}, {"{date}"}, {"{time}"}, {"{offerTime}"}
                        </p>
                        
                        {/* Dynamic Preview */}
                        <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                          <div className="text-xs text-green-800 dark:text-green-200 font-medium mb-1">Preview:</div>
                          <div className="text-sm text-green-700 dark:text-green-300">
                            {(() => {
                              const now = new Date();
                              const expiresDate = new Date(now.getTime() + (settings.defaultWaitlistOfferTimeMinutes || 45) * 60 * 1000);
                              return (settings.waitlistPromotionMessage || "Great news! A spot opened up in {session}. You have until {expires} to complete your booking.")
                                .replace('{session}', 'U12 Boys Training Session')
                                .replace('{expires}', expiresDate.toLocaleString())
                                .replace('{location}', 'Main Field')
                                .replace('{date}', new Date().toLocaleDateString())
                                .replace('{time}', '6:00 PM')
                                .replace('{offerTime}', `${settings.defaultWaitlistOfferTimeMinutes || 45} minutes`);
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>



          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Available Locations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Manage the locations that appear in session creation and filtering dropdowns. Each location can include detailed address information and coordinates for mapping.
              </p>
              <div className="space-y-3">
                {settings.availableLocations?.map((location, index) => {
                  const displayName = getLocationDisplayName(location);
                  const address = getLocationAddress(location);
                  return (
                    <div key={index} className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                      <div className="flex-1">
                        <div className="font-medium text-foreground">{displayName}</div>
                        {address && (
                          <div className="text-sm text-muted-foreground">{address}</div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openLocationDialog(typeof location === 'object' ? location : { name: location, country: 'US' })}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeLocation(location)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => openLocationDialog()}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Location
                  </Button>
                </div>
              </div>
              
              {/* Location Dialog */}
              <Dialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingLocation ? 'Edit Location' : 'Add New Location'}
                    </DialogTitle>
                    <DialogDescription>
                      Provide detailed location information including address details for mapping integration.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="locationName" className="text-muted-foreground">Location Name *</Label>
                      <Input
                        id="locationName"
                        value={locationForm.name}
                        onChange={(e) => setLocationForm(prev => ({ ...prev, name: e.target.value }))}
                        className="bg-input border-border text-foreground"
                        placeholder="e.g., Sugar Sand Park – Field 2"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="addressLine1" className="text-muted-foreground">Address Line 1</Label>
                        <Input
                          id="addressLine1"
                          value={locationForm.addressLine1 || ''}
                          onChange={(e) => setLocationForm(prev => ({ ...prev, addressLine1: e.target.value }))}
                          className="bg-input border-border text-foreground"
                          placeholder="Street address"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="addressLine2" className="text-muted-foreground">Address Line 2</Label>
                        <Input
                          id="addressLine2"
                          value={locationForm.addressLine2 || ''}
                          onChange={(e) => setLocationForm(prev => ({ ...prev, addressLine2: e.target.value }))}
                          className="bg-input border-border text-foreground"
                          placeholder="Apartment, suite, etc. (optional)"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="city" className="text-muted-foreground">City</Label>
                        <Input
                          id="city"
                          value={locationForm.city || ''}
                          onChange={(e) => setLocationForm(prev => ({ ...prev, city: e.target.value }))}
                          className="bg-input border-border text-foreground"
                          placeholder="City"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="state" className="text-muted-foreground">State</Label>
                        <Input
                          id="state"
                          value={locationForm.state || ''}
                          onChange={(e) => setLocationForm(prev => ({ ...prev, state: e.target.value }))}
                          className="bg-input border-border text-foreground"
                          placeholder="State"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="postalCode" className="text-muted-foreground">Postal Code</Label>
                        <Input
                          id="postalCode"
                          value={locationForm.postalCode || ''}
                          onChange={(e) => setLocationForm(prev => ({ ...prev, postalCode: e.target.value }))}
                          className="bg-input border-border text-foreground"
                          placeholder="ZIP/Postal code"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="country" className="text-muted-foreground">Country</Label>
                        <Input
                          id="country"
                          value={locationForm.country || 'US'}
                          onChange={(e) => setLocationForm(prev => ({ ...prev, country: e.target.value }))}
                          className="bg-input border-border text-foreground"
                          placeholder="Country"
                        />
                      </div>
                    </div>
                    
                  </div>
                  
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setLocationDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSaveLocation}>
                      {editingLocation ? 'Update Location' : 'Add Location'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>



          {/* Save Button at bottom of Sessions tab */}
          <div className="flex justify-start">
            <Button onClick={handleSave} disabled={saving} className="px-6">
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </TabsContent>

        {/* Communications Tab */}
        <TabsContent value="communications" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Email Notifications
              </CardTitle>
              <CardDescription>Configure email communication preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-foreground">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email notifications for important events
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Default: Emails sent from company domain. White-label options available on higher plans.
                  </p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, emailNotifications: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                SMS Notifications
              </CardTitle>
              <CardDescription>Configure SMS communication preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className={`${!canUseSms ? 'text-muted-foreground' : 'text-foreground'}`}>
                    SMS Notifications
                    {!hasSmsFeature && (
                      <Crown className="w-4 h-4 inline ml-1 text-amber-500" />
                    )}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {!hasSmsFeature 
                      ? 'SMS notifications are available on Growth and Elite plans'
                      : isTwilioEnabled 
                        ? 'Receive SMS notifications for urgent events'
                        : 'Requires Twilio integration to be configured'
                    }
                  </p>
                  {!hasSmsFeature ? (
                    <UpgradePrompt 
                      feature={FEATURE_KEYS.NOTIFICATIONS_SMS} 
                      className="mt-2"
                      targetPlan="growth"
                    />
                  ) : !isTwilioEnabled && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Configure Twilio in the Integrations tab to enable SMS notifications
                    </p>
                  )}
                </div>
                <Switch
                  checked={settings.smsNotifications && canUseSms}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, smsNotifications: checked }))
                  }
                  disabled={!canUseSms}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button for Communications */}
          <div className="flex justify-start">
            <Button onClick={handleSave} disabled={saving} className="px-6">
              {saving ? 'Saving...' : 'Save Communications Settings'}
            </Button>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Access & Security
              </CardTitle>
              <CardDescription>Manage access controls and security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-foreground">Admin Access</h4>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Admin Portal Access
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        Admin access is managed automatically based on your user role. Contact your super admin to modify access permissions.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium text-foreground">Session Security</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-foreground">Automatic Logout</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically log out inactive admin sessions after 8 hours
                      </p>
                    </div>
                    <Switch
                      checked={true}
                      disabled={true}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium text-foreground">Data Protection</h4>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Lock className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-green-800 dark:text-green-200">
                        Data Encryption
                      </h4>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        All sensitive data is encrypted at rest and in transit. Payment information is handled by secure third-party processors and never stored directly.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Audit Log
              </CardTitle>
              <CardDescription>Recent administrative actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Recent Activity</h3>
                  <p>Administrative actions will appear here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plan" className="space-y-6">
          <PlanAndFeaturesContent />
        </TabsContent>



        <TabsContent value="integrations" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <Zap className="w-5 h-5 mr-2" />
                Third-party Integrations
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                Configure external service integrations for email, SMS, payments, and accounting
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Payment Processors */}
              <div>
                <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Payment Processing
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Stripe */}
                  <FeatureGuard feature={FEATURE_KEYS.PAYMENTS_ENABLED}>
                    <div className="border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          <CreditCard className="w-5 h-5 mr-2 text-purple-500" />
                          <div>
                            <h4 className="font-medium text-foreground">Stripe</h4>
                            <p className="text-sm text-muted-foreground">Payment processing and subscriptions</p>
                            <p className="text-xs text-muted-foreground mt-1">Available on: Growth, Elite</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {integrations.find(i => i.provider === 'stripe')?.enabled && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Active
                            </Badge>
                          )}
                          {activeProcessor?.provider === 'stripe' && (
                            <Badge variant="default" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              Primary
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleConfigureIntegration('stripe')}
                          className="flex-1"
                        >
                          <Settings2 className="w-4 h-4 mr-2" />
                          Configure
                        </Button>
                        {integrations.find(i => i.provider === 'stripe')?.enabled && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleTestIntegration('stripe')}
                            disabled={testingIntegration === 'stripe'}
                            className="px-3"
                          >
                            {testingIntegration === 'stripe' ? (
                              <div className="w-4 h-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                            ) : (
                              <TestTube className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </FeatureGuard>

                  {/* Braintree */}
                  <FeatureGuard feature={FEATURE_KEYS.INTEGRATIONS_BRAINTREE}>
                    <div className="border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          <CreditCard className="w-5 h-5 mr-2 text-blue-500" />
                          <div>
                            <h4 className="font-medium text-foreground">Braintree</h4>
                            <p className="text-sm text-muted-foreground">Alternative payment processing</p>
                            <p className="text-xs text-muted-foreground mt-1">Available on: Growth, Elite</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {integrations.find(i => i.provider === 'braintree')?.enabled && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Active
                            </Badge>
                          )}
                          {activeProcessor?.provider === 'braintree' && (
                            <Badge variant="default" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              Primary
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleConfigureIntegration('braintree')}
                          className="flex-1"
                        >
                          <Settings2 className="w-4 h-4 mr-2" />
                          Configure
                        </Button>
                        {integrations.find(i => i.provider === 'braintree')?.enabled && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleTestIntegration('braintree')}
                            disabled={testingIntegration === 'braintree'}
                            className="px-3"
                          >
                            {testingIntegration === 'braintree' ? (
                              <div className="w-4 h-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                            ) : (
                              <TestTube className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </FeatureGuard>
                </div>
              </div>

              {/* Communication */}
              <div>
                <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Communications
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {/* SendGrid */}
                  <FeatureGuard feature={FEATURE_KEYS.NOTIFICATIONS_EMAIL}>
                    <div className="border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        <Mail className="w-5 h-5 mr-2 text-blue-500" />
                        <div>
                          <h4 className="font-medium text-foreground">SendGrid</h4>
                          <p className="text-sm text-muted-foreground">Email delivery platform</p>
                          <p className="text-xs text-muted-foreground mt-1">Available on: Core, Growth, Elite</p>
                        </div>
                      </div>
                      {integrations.find(i => i.provider === 'sendgrid')?.enabled && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Active
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleConfigureIntegration('sendgrid')}
                        className="flex-1"
                      >
                        <Settings2 className="w-4 h-4 mr-2" />
                        Configure
                      </Button>
                      {integrations.find(i => i.provider === 'sendgrid')?.enabled && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleTestIntegration('sendgrid')}
                          disabled={testingIntegration === 'sendgrid'}
                          className="px-3"
                        >
                          {testingIntegration === 'sendgrid' ? (
                            <div className="w-4 h-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                          ) : (
                            <TestTube className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                  </FeatureGuard>

                  {/* Twilio */}
                  <FeatureGuard feature={FEATURE_KEYS.NOTIFICATIONS_SMS}>
                    <div className="border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          <MessageSquare className="w-5 h-5 mr-2 text-red-500" />
                          <div>
                            <h4 className="font-medium text-foreground">Twilio</h4>
                            <p className="text-sm text-muted-foreground">SMS messaging service</p>
                            <p className="text-xs text-muted-foreground mt-1">Available on: Growth, Elite</p>
                          </div>
                        </div>
                        {integrations.find(i => i.provider === 'twilio')?.enabled && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Active
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleConfigureIntegration('twilio')}
                          className="flex-1"
                        >
                          <Settings2 className="w-4 h-4 mr-2" />
                          Configure
                        </Button>
                        {integrations.find(i => i.provider === 'twilio')?.enabled && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleTestIntegration('twilio')}
                            disabled={testingIntegration === 'twilio'}
                            className="px-3"
                          >
                            {testingIntegration === 'twilio' ? (
                              <div className="w-4 h-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                            ) : (
                              <TestTube className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </FeatureGuard>

                  {/* Mailchimp */}
                  <FeatureGuard feature={FEATURE_KEYS.INTEGRATIONS_MAILCHIMP}>
                    <div className="border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          <Mail className="w-5 h-5 mr-2 text-yellow-500" />
                          <div>
                            <h4 className="font-medium text-foreground">Mailchimp</h4>
                            <p className="text-sm text-muted-foreground">Email marketing platform</p>
                            <p className="text-xs text-muted-foreground mt-1">Available on: Elite</p>
                          </div>
                        </div>
                        {integrations.find(i => i.provider === 'mailchimp')?.enabled && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Active
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleConfigureIntegration('mailchimp')}
                          className="flex-1"
                        >
                          <Settings2 className="w-4 h-4 mr-2" />
                          Configure
                        </Button>
                        {integrations.find(i => i.provider === 'mailchimp')?.enabled && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleTestIntegration('mailchimp')}
                            disabled={testingIntegration === 'mailchimp'}
                            className="px-3"
                          >
                            {testingIntegration === 'mailchimp' ? (
                              <div className="w-4 h-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                            ) : (
                              <TestTube className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </FeatureGuard>
                </div>
              </div>

              {/* Calendar & Productivity */}
              <div>
                <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Calendar & Productivity
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Google Workspace */}
                  <FeatureGuard feature={FEATURE_KEYS.INTEGRATIONS_CALENDAR}>
                    <div className="border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          <Calendar className="w-5 h-5 mr-2 text-red-500" />
                          <div>
                            <h4 className="font-medium text-foreground">Google Workspace</h4>
                            <p className="text-sm text-muted-foreground">Gmail, Calendar, and Drive</p>
                            <p className="text-xs text-muted-foreground mt-1">Available on: Elite</p>
                          </div>
                        </div>
                        {integrations.find(i => i.provider === 'google')?.enabled && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Active
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleConfigureIntegration('google')}
                          className="flex-1"
                        >
                          <Settings2 className="w-4 h-4 mr-2" />
                          Configure
                        </Button>
                        {integrations.find(i => i.provider === 'google')?.enabled && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleTestIntegration('google')}
                            disabled={testingIntegration === 'google'}
                            className="px-3"
                          >
                            {testingIntegration === 'google' ? (
                              <div className="w-4 h-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                            ) : (
                              <TestTube className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </FeatureGuard>

                  {/* Microsoft 365 */}
                  <FeatureGuard feature={FEATURE_KEYS.INTEGRATIONS_CALENDAR}>
                    <div className="border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          <Cloud className="w-5 h-5 mr-2 text-blue-500" />
                          <div>
                            <h4 className="font-medium text-foreground">Microsoft 365</h4>
                            <p className="text-sm text-muted-foreground">Outlook, Teams, SharePoint</p>
                            <p className="text-xs text-muted-foreground mt-1">Available on: Elite</p>
                          </div>
                        </div>
                        {integrations.find(i => i.provider === 'microsoft')?.enabled && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Active
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleConfigureIntegration('microsoft')}
                          className="flex-1"
                        >
                          <Settings2 className="w-4 h-4 mr-2" />
                          Configure
                        </Button>
                        {integrations.find(i => i.provider === 'microsoft')?.enabled && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleTestIntegration('microsoft')}
                            disabled={testingIntegration === 'microsoft'}
                            className="px-3"
                          >
                            {testingIntegration === 'microsoft' ? (
                              <div className="w-4 h-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                            ) : (
                              <TestTube className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </FeatureGuard>

                  {/* Zapier */}
                  <FeatureGuard feature={FEATURE_KEYS.INTEGRATIONS_ZAPIER}>
                    <div className="border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          <Zap className="w-5 h-5 mr-2 text-orange-500" />
                          <div>
                            <h4 className="font-medium text-foreground">Zapier</h4>
                            <p className="text-sm text-muted-foreground">Workflow automation platform</p>
                            <p className="text-xs text-muted-foreground mt-1">Available on: Elite</p>
                          </div>
                        </div>
                        {integrations.find(i => i.provider === 'zapier')?.enabled && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Active
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleConfigureIntegration('zapier')}
                          className="flex-1"
                        >
                          <Settings2 className="w-4 h-4 mr-2" />
                          Configure
                        </Button>
                        {integrations.find(i => i.provider === 'zapier')?.enabled && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleTestIntegration('zapier')}
                            disabled={testingIntegration === 'zapier'}
                            className="px-3"
                          >
                            {testingIntegration === 'zapier' ? (
                              <div className="w-4 h-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                            ) : (
                              <TestTube className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </FeatureGuard>
                </div>
              </div>

              {/* Accounting */}
              <FeatureGuard feature={FEATURE_KEYS.INTEGRATIONS_QUICKBOOKS}>
                <div>
                  <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4 flex items-center">
                    <DollarSign className="w-5 h-5 mr-2" />
                    Accounting & Finance
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* QuickBooks */}
                    <div className="border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          <DollarSign className="w-5 h-5 mr-2 text-green-500" />
                          <div>
                            <h4 className="font-medium text-foreground">QuickBooks Online</h4>
                            <p className="text-sm text-muted-foreground">Accounting and financial management</p>
                            <p className="text-xs text-muted-foreground mt-1">Available on: Elite</p>
                          </div>
                        </div>
                        {integrations.find(i => i.provider === 'quickbooks')?.enabled && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Active
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleConfigureIntegration('quickbooks')}
                          className="flex-1"
                        >
                          <Settings2 className="w-4 h-4 mr-2" />
                          Configure
                        </Button>
                        {integrations.find(i => i.provider === 'quickbooks')?.enabled && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleTestIntegration('quickbooks')}
                            disabled={testingIntegration === 'quickbooks'}
                            className="px-3"
                          >
                            {testingIntegration === 'quickbooks' ? (
                              <div className="w-4 h-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                            ) : (
                              <TestTube className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </FeatureGuard>
            </CardContent>
          </Card>

          {/* Integration Configuration Dialog */}
          <Dialog open={!!configureDialog} onOpenChange={(open) => !open && setConfigureDialog(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  Configure {configureDialog && providerConfigs[configureDialog]?.name}
                </DialogTitle>
                <DialogDescription>
                  {configureDialog && providerConfigs[configureDialog]?.description}
                </DialogDescription>
              </DialogHeader>

              {configureDialog && (
                <div className="space-y-4">
                  {providerConfigs[configureDialog]?.fields.map((field) => (
                    <div key={field.key}>
                      <Label htmlFor={field.key} className="text-foreground">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <Input
                        id={field.key}
                        type={field.type}
                        value={credentials[field.key] || ''}
                        onChange={(e) => setCredentials(prev => ({ ...prev, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        className="mt-1"
                        required={field.required}
                      />
                    </div>
                  ))}

                  {configureDialog === 'stripe' && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-start">
                        <AlertCircle className="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
                        <div className="text-sm text-blue-700 dark:text-blue-300">
                          <p className="font-medium mb-1">Payment Processor Notice</p>
                          <p>Enabling Stripe will automatically disable other payment processors. Only one payment processor can be active at a time.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {configureDialog === 'braintree' && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-start">
                        <AlertCircle className="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
                        <div className="text-sm text-blue-700 dark:text-blue-300">
                          <p className="font-medium mb-1">Payment Processor Notice</p>
                          <p>Enabling Braintree will automatically disable other payment processors. Only one payment processor can be active at a time.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setConfigureDialog(null)}
                  disabled={savingIntegration}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveIntegration}
                  disabled={savingIntegration}
                >
                  {savingIntegration ? 'Saving...' : 'Save Integration'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
        
        {/* Age Policy Tab */}
        <TabsContent value="age-policy" className="space-y-6">
          <AgePolicySettings />
        </TabsContent>

        {/* Consent Forms Tab */}
        <TabsContent value="consent-forms" className="space-y-6">
          {isConsentFormsEnabled ? (
            <ConsentTemplateSettings />
          ) : (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Consent Forms
                </CardTitle>
                <CardDescription>
                  Consent forms are currently disabled
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Consent Forms Disabled</h3>
                  <p className="text-muted-foreground mb-4">
                    To configure consent forms, you must first enable "Require Consent Forms" in the Age Policy settings.
                  </p>
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Switch to age-policy tab
                        const agePolicyTab = document.querySelector('[value="age-policy"]') as HTMLButtonElement;
                        if (agePolicyTab) {
                          agePolicyTab.click();
                        }
                      }}
                      data-testid="button-go-to-age-policy"
                    >
                      Go to Age Policy Settings
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        </Tabs>
      </AdminLayout>
    </>
  );
}