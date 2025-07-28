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
import { Settings, Shield, Bell, Users, Zap, CheckCircle, XCircle, AlertCircle, ExternalLink, Calendar, Clock, CreditCard, Building2, Upload, X, Image } from 'lucide-react';
import { useBusinessName } from "@/contexts/BusinessContext";
import { Link } from 'wouter';

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
  weekdayStart: string;
  weekdayEnd: string;
  fiscalYearType: string;
  fiscalYearStartMonth: number;
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
    current_period_start: number;
    current_period_end: number;
    plan: {
      id: string;
      nickname: string;
      amount: number;
      currency: string;
      interval: string;
      product: {
        id: string;
        name: string;
        description: string;
      };
    };
    customer: {
      id: string;
      email: string;
    };
  };
  invoices: Array<{
    id: string;
    status: string;
    amount_paid: number;
    created: number;
    period_start: number;
    period_end: number;
  }>;
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

export default function AdminSettings() {
  const businessName = useBusinessName();
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
    weekdayStart: 'monday',
    weekdayEnd: 'sunday',
    fiscalYearType: 'calendar',
    fiscalYearStartMonth: 1
  });
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingSubscription, setLoadingSubscription] = useState(false);

  const { toast } = useToast();

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
    fetchSubscriptionInfo();
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

  const fetchSubscriptionInfo = async () => {
    setLoadingSubscription(true);
    try {
      const response = await fetch('/api/admin/subscription-info');
      if (response.ok) {
        const data = await response.json();
        setSubscriptionInfo(data);
      } else {
        console.error('Failed to fetch subscription info');
      }
    } catch (error) {
      console.error('Error fetching subscription info:', error);
    } finally {
      setLoadingSubscription(false);
    }
  };

  const openBillingPortal = () => {
    // Use the direct Stripe customer portal URL
    const portalUrl = 'https://billing.stripe.com/p/login/test_14AeVe4GC2cAeVI4Ns2Fa00';
    window.open(portalUrl, '_blank');
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
        throw new Error('Failed to update settings');
      }

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
          <div className="text-zinc-400">Loading settings...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Admin Settings</h1>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-zinc-800 border-zinc-700">
          <TabsTrigger value="general" className="data-[state=active]:bg-zinc-900 data-[state=active]:text-white">
            General & Registration
          </TabsTrigger>
          <TabsTrigger value="sessions" className="data-[state=active]:bg-zinc-900 data-[state=active]:text-white">
            Sessions & Schedule
          </TabsTrigger>
          <TabsTrigger value="billing" className="data-[state=active]:bg-zinc-900 data-[state=active]:text-white">
            Service Billing
          </TabsTrigger>
          <TabsTrigger value="integrations" className="data-[state=active]:bg-zinc-900 data-[state=active]:text-white">
            Integrations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                General Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="businessName" className="text-zinc-300">Business Name</Label>
                <Input
                  id="businessName"
                  value={settings.businessName}
                  onChange={(e) => setSettings(prev => ({ ...prev, businessName: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  placeholder="Your business or organization name"
                />
              </div>
              <div>
                <Label className="text-zinc-300">Business Logo</Label>
                <p className="text-sm text-zinc-400 mb-2">
                  Upload a logo to replace the business name text. Maximum size: 2MB. Recommended dimensions: 200x60px.
                </p>
                <div className="space-y-4">
                  {settings.businessLogo ? (
                    <div className="relative inline-block">
                      <img 
                        src={settings.businessLogo} 
                        alt="Business Logo" 
                        className="max-h-16 max-w-48 object-contain bg-zinc-800 rounded p-2"
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
                      className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Logo
                    </Button>
                    {settings.businessLogo ? (
                      <span className="text-sm text-green-500 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Logo uploaded
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="contactEmail" className="text-zinc-300">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => setSettings(prev => ({ ...prev, contactEmail: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  placeholder="Primary contact email address"
                />
              </div>
              <div>
                <Label htmlFor="supportEmail" className="text-zinc-300">Support Email</Label>
                <Input
                  id="supportEmail"
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => setSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  placeholder="Email address for help request notifications"
                />
              </div>
              <div>
                <Label htmlFor="supportPhone" className="text-zinc-300">Support Phone</Label>
                <Input
                  id="supportPhone"
                  type="tel"
                  value={settings.supportPhone}
                  onChange={(e) => setSettings(prev => ({ ...prev, supportPhone: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  placeholder="Phone number for support inquiries"
                />
              </div>
              <div>
                <Label htmlFor="supportHours" className="text-zinc-300">Support Hours</Label>
                <Input
                  id="supportHours"
                  value={settings.supportHours}
                  onChange={(e) => setSettings(prev => ({ ...prev, supportHours: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  placeholder="e.g., Monday - Friday, 9:00 AM - 5:00 PM"
                />
              </div>
              <div>
                <Label htmlFor="supportLocation" className="text-zinc-300">Support Location</Label>
                <Input
                  id="supportLocation"
                  value={settings.supportLocation}
                  onChange={(e) => setSettings(prev => ({ ...prev, supportLocation: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  placeholder="Business location or region"
                />
              </div>
              <div>
                <Label htmlFor="timezone" className="text-zinc-300">Timezone</Label>
                <Select
                  value={settings.timezone}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, timezone: value }))}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700 max-h-60">
                    {getTimezones().map((tz) => (
                      <SelectItem key={tz} value={tz} className="text-white hover:bg-zinc-700">
                        {tz.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Registration Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-zinc-300">Auto-approve new registrations</Label>
                  <p className="text-sm text-zinc-400">
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

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-zinc-300">Email Notifications</Label>
                  <p className="text-sm text-zinc-400">
                    Receive email notifications for important events
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
                  <Label className="text-zinc-300">SMS Notifications</Label>
                  <p className="text-sm text-zinc-400">
                    Receive SMS notifications for urgent events
                  </p>
                </div>
                <Switch
                  checked={settings.smsNotifications}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, smsNotifications: checked }))
                  }
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
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Session Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="capacityWarning" className="text-zinc-300">Session Capacity Warning</Label>
                <Input
                  id="capacityWarning"
                  type="number"
                  min="1"
                  max="10"
                  value={settings.sessionCapacityWarning}
                  onChange={(e) => setSettings(prev => ({ ...prev, sessionCapacityWarning: parseInt(e.target.value) || 3 }))}
                  className="bg-zinc-800 border-zinc-700 text-white mt-1"
                />
              </div>
              <div>
                <Label htmlFor="paymentReminder" className="text-zinc-300">Payment Reminder Minutes</Label>
                <Input
                  id="paymentReminder"
                  type="number"
                  min="5"
                  max="1440"
                  value={settings.paymentReminderMinutes}
                  onChange={(e) => setSettings(prev => ({ ...prev, paymentReminderMinutes: parseInt(e.target.value) || 60 }))}
                  className="bg-zinc-800 border-zinc-700 text-white mt-1"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Business Schedule & Fiscal Year
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="weekdayStart" className="text-zinc-300">Business Week Start</Label>
                <Select
                  value={settings.weekdayStart}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, weekdayStart: value }))}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="monday" className="text-white hover:bg-zinc-700">Monday</SelectItem>
                    <SelectItem value="tuesday" className="text-white hover:bg-zinc-700">Tuesday</SelectItem>
                    <SelectItem value="wednesday" className="text-white hover:bg-zinc-700">Wednesday</SelectItem>
                    <SelectItem value="thursday" className="text-white hover:bg-zinc-700">Thursday</SelectItem>
                    <SelectItem value="friday" className="text-white hover:bg-zinc-700">Friday</SelectItem>
                    <SelectItem value="saturday" className="text-white hover:bg-zinc-700">Saturday</SelectItem>
                    <SelectItem value="sunday" className="text-white hover:bg-zinc-700">Sunday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="fiscalYearType" className="text-zinc-300">Fiscal Year Type</Label>
                <Select
                  value={settings.fiscalYearType}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, fiscalYearType: value }))}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="calendar" className="text-white hover:bg-zinc-700">Calendar Year (Jan-Dec)</SelectItem>
                    <SelectItem value="fiscal" className="text-white hover:bg-zinc-700">Custom Fiscal Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {settings.fiscalYearType === 'fiscal' && (
                <div>
                  <Label htmlFor="fiscalYearStartMonth" className="text-zinc-300">Fiscal Year Start Month</Label>
                  <Select
                    value={settings.fiscalYearStartMonth.toString()}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, fiscalYearStartMonth: parseInt(value) }))}
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="1" className="text-white hover:bg-zinc-700">January</SelectItem>
                      <SelectItem value="2" className="text-white hover:bg-zinc-700">February</SelectItem>
                      <SelectItem value="3" className="text-white hover:bg-zinc-700">March</SelectItem>
                      <SelectItem value="4" className="text-white hover:bg-zinc-700">April</SelectItem>
                      <SelectItem value="5" className="text-white hover:bg-zinc-700">May</SelectItem>
                      <SelectItem value="6" className="text-white hover:bg-zinc-700">June</SelectItem>
                      <SelectItem value="7" className="text-white hover:bg-zinc-700">July</SelectItem>
                      <SelectItem value="8" className="text-white hover:bg-zinc-700">August</SelectItem>
                      <SelectItem value="9" className="text-white hover:bg-zinc-700">September</SelectItem>
                      <SelectItem value="10" className="text-white hover:bg-zinc-700">October</SelectItem>
                      <SelectItem value="11" className="text-white hover:bg-zinc-700">November</SelectItem>
                      <SelectItem value="12" className="text-white hover:bg-zinc-700">December</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Save Button at bottom of Sessions & Schedule tab */}
          <div className="flex justify-start">
            <Button onClick={handleSave} disabled={saving} className="px-6">
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          {/* Stripe Payment Processing Card */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Service Payment
              </CardTitle>
              <p className="text-zinc-400 text-sm">
                Pay for your {businessName} platform subscription and services
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {loadingSubscription ? (
                <div className="flex justify-center items-center py-8">
                  <div className="text-zinc-400">Loading subscription info...</div>
                </div>
              ) : subscriptionInfo ? (
                <>
                  {/* Current Plan Display */}
                  <div className="bg-zinc-800 p-4 rounded-lg border border-zinc-700">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <h3 className="text-white font-medium">Current Plan</h3>
                        <p className="text-zinc-400 text-sm">{subscriptionInfo.subscription.plan.product.name}</p>
                      </div>
                      <Badge className={subscriptionInfo.subscription.status === 'active' ? "bg-green-900 text-green-300" : "bg-yellow-900 text-yellow-300"}>
                        {subscriptionInfo.subscription.status === 'active' ? 'Active' : subscriptionInfo.subscription.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-zinc-400">Monthly Fee:</span>
                        <span className="text-white ml-2 font-medium">
                          ${(subscriptionInfo.subscription.plan.amount / 100).toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-400">Next Billing:</span>
                        <span className="text-white ml-2">
                          {new Date(subscriptionInfo.subscription.current_period_end * 1000).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-400">Customer:</span>
                        <span className="text-white ml-2">{subscriptionInfo.subscription.customer.email}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400">Interval:</span>
                        <span className="text-white ml-2 capitalize">{subscriptionInfo.subscription.plan.interval}ly</span>
                      </div>
                    </div>
                  </div>

                  {/* Billing History */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-white font-medium">Recent Invoices</h4>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-blue-400 hover:text-blue-300 hover:bg-zinc-800"
                        onClick={openBillingPortal}
                      >
                        View All
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {subscriptionInfo.invoices.map((invoice) => (
                        <div key={invoice.id} className="bg-zinc-800 p-3 rounded border border-zinc-700 flex justify-between items-center">
                          <div>
                            <p className="text-white text-sm">
                              {new Date(invoice.created * 1000).toLocaleDateString()}
                            </p>
                            <p className="text-zinc-400 text-xs">Monthly Subscription</p>
                          </div>
                          <div className="text-right">
                            <p className="text-white text-sm font-medium">
                              ${(invoice.amount_paid / 100).toFixed(2)}
                            </p>
                            <Badge className="bg-green-900 text-green-300 text-xs capitalize">
                              {invoice.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex justify-center pt-4">
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 px-8"
                      onClick={openBillingPortal}
                    >
                      Manage Subscription & Billing
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-zinc-400 mb-4">No subscription information available</p>
                  <Link href="/admin/payment">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Set Up Billing
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Zap className="w-5 h-5 mr-2" />
                Third-party Integrations
              </CardTitle>
              <p className="text-zinc-400 text-sm">
                Manage external service integrations for email, SMS, payments, and accounting
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-zinc-300">Integration Management</Label>
                  <p className="text-sm text-zinc-400">
                    Configure Stripe, SendGrid, Mailchimp, QuickBooks, and other service integrations
                  </p>
                  <div className="flex gap-2 mt-2">
                    {integrations.slice(0, 3).map((integration) => (
                      <div
                        key={integration.id}
                        className={`px-2 py-1 rounded text-xs ${
                          integration.enabled 
                            ? 'bg-green-900 text-green-300' 
                            : 'bg-zinc-700 text-zinc-400'
                        }`}
                      >
                        {integration.provider}
                      </div>
                    ))}
                    {integrations.length > 3 && (
                      <div className="px-2 py-1 rounded text-xs bg-zinc-700 text-zinc-400">
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
  );
}