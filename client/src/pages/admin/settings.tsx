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
import { Settings, Shield, Bell, Users, Zap, CheckCircle, XCircle, AlertCircle, ExternalLink, Calendar, Clock, CreditCard, Building2 } from 'lucide-react';
import { Link } from 'wouter';

interface SystemSettings {
  autoApproveRegistrations: boolean;
  businessName: string;
  contactEmail: string;
  supportEmail: string;
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

interface ServiceBilling {
  id?: string;
  organizationName: string;
  contactEmail: string;
  billingEmail: string;
  phoneNumber: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  taxId: string;
  billingFrequency: string;
  paymentMethod: string;
  preferredInvoiceDay: number;
  notes: string;
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
  const [settings, setSettings] = useState<SystemSettings>({
    autoApproveRegistrations: true,
    businessName: '',
    contactEmail: '',
    supportEmail: '',
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
  const [serviceBilling, setServiceBilling] = useState<ServiceBilling>({
    organizationName: '',
    contactEmail: '',
    billingEmail: '',
    phoneNumber: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
    taxId: '',
    billingFrequency: 'monthly',
    paymentMethod: 'invoice',
    preferredInvoiceDay: 1,
    notes: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingBilling, setSavingBilling] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
    fetchIntegrations();
    fetchServiceBilling();
  }, []);

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

  const fetchServiceBilling = async () => {
    try {
      const response = await fetch('/api/admin/service-billing');
      if (!response.ok) throw new Error('Failed to fetch service billing');
      const data = await response.json();
      if (data && Object.keys(data).length > 0) {
        setServiceBilling(data);
      }
    } catch (error) {
      console.error('Error fetching service billing:', error);
    }
  };

  const handleSaveBilling = async () => {
    setSavingBilling(true);
    try {
      const response = await fetch('/api/admin/service-billing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serviceBilling),
      });

      if (!response.ok) {
        throw new Error('Failed to save service billing configuration');
      }

      toast({
        title: "Success",
        description: "Service billing configuration saved successfully",
      });
    } catch (error) {
      console.error('Error saving service billing:', error);
      toast({
        title: "Error",
        description: "Failed to save service billing configuration",
        variant: "destructive",
      });
    } finally {
      setSavingBilling(false);
    }
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
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
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
                  value={settings.supportEmail}
                  onChange={(e) => setSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  placeholder="Email address for help request notifications"
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
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Service Billing Configuration
              </CardTitle>
              <p className="text-zinc-400 text-sm">
                Configure payment information for platform service billing and invoicing
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="organizationName" className="text-zinc-300">Organization Name *</Label>
                  <Input
                    id="organizationName"
                    value={serviceBilling.organizationName}
                    onChange={(e) => setServiceBilling(prev => ({ ...prev, organizationName: e.target.value }))}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    placeholder="Your organization name"
                  />
                </div>
                <div>
                  <Label htmlFor="contactEmail" className="text-zinc-300">Contact Email *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={serviceBilling.contactEmail}
                    onChange={(e) => setServiceBilling(prev => ({ ...prev, contactEmail: e.target.value }))}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    placeholder="Primary contact email"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="billingEmail" className="text-zinc-300">Billing Email *</Label>
                  <Input
                    id="billingEmail"
                    type="email"
                    value={serviceBilling.billingEmail}
                    onChange={(e) => setServiceBilling(prev => ({ ...prev, billingEmail: e.target.value }))}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    placeholder="Email for invoices and billing"
                  />
                </div>
                <div>
                  <Label htmlFor="phoneNumber" className="text-zinc-300">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    value={serviceBilling.phoneNumber}
                    onChange={(e) => setServiceBilling(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="billingFrequency" className="text-zinc-300">Billing Frequency</Label>
                  <Select
                    value={serviceBilling.billingFrequency}
                    onValueChange={(value) => setServiceBilling(prev => ({ ...prev, billingFrequency: value }))}
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="monthly" className="text-white hover:bg-zinc-700">Monthly</SelectItem>
                      <SelectItem value="quarterly" className="text-white hover:bg-zinc-700">Quarterly</SelectItem>
                      <SelectItem value="annually" className="text-white hover:bg-zinc-700">Annually</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="paymentMethod" className="text-zinc-300">Payment Method</Label>
                  <Select
                    value={serviceBilling.paymentMethod}
                    onValueChange={(value) => setServiceBilling(prev => ({ ...prev, paymentMethod: value }))}
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="invoice" className="text-white hover:bg-zinc-700">Invoice (Net 30)</SelectItem>
                      <SelectItem value="credit_card" className="text-white hover:bg-zinc-700">Credit Card</SelectItem>
                      <SelectItem value="ach" className="text-white hover:bg-zinc-700">ACH/Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="notes" className="text-zinc-300">Special Instructions</Label>
                <textarea
                  id="notes"
                  value={serviceBilling.notes}
                  onChange={(e) => setServiceBilling(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full bg-zinc-800 border-zinc-700 text-white rounded-md p-3 mt-1"
                  placeholder="Any special billing instructions..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  onClick={handleSaveBilling}
                  disabled={savingBilling || !serviceBilling.organizationName || !serviceBilling.contactEmail || !serviceBilling.billingEmail}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {savingBilling ? 'Saving...' : 'Save Billing Configuration'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stripe Payment Processing Card */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Service Payment
              </CardTitle>
              <p className="text-zinc-400 text-sm">
                Pay for your Futsal Culture platform subscription and services
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Plan Display */}
              <div className="bg-zinc-800 p-4 rounded-lg border border-zinc-700">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h3 className="text-white font-medium">Current Plan</h3>
                    <p className="text-zinc-400 text-sm">Professional Platform</p>
                  </div>
                  <Badge className="bg-green-900 text-green-300">Active</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-zinc-400">Monthly Fee:</span>
                    <span className="text-white ml-2 font-medium">$49.99</span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Next Billing:</span>
                    <span className="text-white ml-2">Aug 28, 2025</span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Players:</span>
                    <span className="text-white ml-2">30 / 50</span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Sessions:</span>
                    <span className="text-white ml-2">Unlimited</span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-4">
                <h4 className="text-white font-medium">Payment Method</h4>
                <div className="bg-zinc-800 p-4 rounded-lg border border-zinc-700 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
                      VISA
                    </div>
                    <div>
                      <p className="text-white">•••• •••• •••• 4242</p>
                      <p className="text-zinc-400 text-sm">Expires 12/27</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                  >
                    Update
                  </Button>
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
                  >
                    View All
                  </Button>
                </div>
                <div className="space-y-2">
                  {[
                    { date: "Jul 28, 2025", amount: "$49.99", status: "Paid" },
                    { date: "Jun 28, 2025", amount: "$49.99", status: "Paid" },
                    { date: "May 28, 2025", amount: "$49.99", status: "Paid" }
                  ].map((invoice, index) => (
                    <div key={index} className="bg-zinc-800 p-3 rounded border border-zinc-700 flex justify-between items-center">
                      <div>
                        <p className="text-white text-sm">{invoice.date}</p>
                        <p className="text-zinc-400 text-xs">Monthly Subscription</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white text-sm font-medium">{invoice.amount}</p>
                        <Badge className="bg-green-900 text-green-300 text-xs">{invoice.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Link href="/admin/payment">
                  <Button className="bg-blue-600 hover:bg-blue-700 flex-1">
                    Make Payment
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                >
                  Download Invoice
                </Button>
              </div>
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