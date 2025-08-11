import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useToast } from '../../hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Settings, Shield, Bell, Users, Zap, CheckCircle, XCircle, AlertCircle, ExternalLink, Calendar, Clock, CreditCard, Building2, Upload, X, Image, MapPin, Plus, Edit2, Crown, DollarSign, Receipt } from 'lucide-react';
import { useBusinessName } from "@/contexts/BusinessContext";
import { Link } from 'wouter';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { usePlanFeatures, useHasFeature, FeatureGuard, UpgradePrompt, usePlanLimits } from '../../hooks/use-feature-flags';
import { useTenantPlan, useSubscriptionInfo } from '../../hooks/useTenantPlan';
import { ManageSubscriptionButton } from '../../components/billing/ManageSubscriptionButton';
import { FeatureGrid } from '../../components/billing/FeatureGrid';
import { PlanComparisonCards } from '../../components/billing/PlanComparisonCards';
import { plans, getPlan } from '@/lib/planUtils';
import { useUpgradeStatus } from '../../hooks/use-upgrade-status';
import { SubscriptionUpgradeBanner, SubscriptionSuccessBanner } from '../../components/subscription-upgrade-banner';
import { PlanUpgradeButtons } from '../../components/plan-upgrade-buttons';
// Remove unused import

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
  const [loading, setLoading] = useState(true);
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
  const { hasFeature: hasSmsFeature } = useHasFeature('smsNotifications');
  const { hasFeature: hasPaymentsFeature } = useHasFeature('payments');
  const { hasFeature: hasAdvancedAnalytics } = useHasFeature('analytics');
  const { hasFeature: hasAutoPromotion } = useHasFeature('waitlist');
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
          </TabsList>
        </div>

        {/* Desktop Tab Navigation - Horizontal Grid */}
        <div className="hidden md:block">
          <TabsList className="grid w-full grid-cols-4 bg-muted border-border">
            <TabsTrigger value="general" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
              General & Registration
            </TabsTrigger>
            <TabsTrigger value="sessions" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
              Sessions & Schedule
            </TabsTrigger>
            <TabsTrigger value="plan" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
              Plan & Features
            </TabsTrigger>
            <TabsTrigger value="integrations" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
              Integrations
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

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Notification Settings
              </CardTitle>
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
                          feature={'waitlist'} 
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
                Manage external service integrations for email, SMS, payments, and accounting
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-foreground">Integration Management</Label>
                  <p className="text-sm text-muted-foreground">
                    Configure Stripe, SendGrid, Mailchimp, QuickBooks, and other service integrations
                  </p>
                  <div className="flex gap-2 mt-2">
                    {integrations.slice(0, 3).map((integration) => (
                      <div
                        key={integration.id}
                        className={`px-2 py-1 rounded text-xs ${
                          integration.enabled 
                            ? 'bg-green-900 text-green-300' 
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {integration.provider}
                      </div>
                    ))}
                    {integrations.length > 3 && (
                      <div className="px-2 py-1 rounded text-xs bg-muted text-muted-foreground">
                        +{integrations.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
                <Link href="/admin/integrations">
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    Manage All
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
      </AdminLayout>
    </>
  );
}