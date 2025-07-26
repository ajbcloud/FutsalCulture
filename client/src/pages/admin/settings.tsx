import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { Badge } from '../../components/ui/badge';
import { useToast } from '../../hooks/use-toast';
import { Settings, Shield, Bell, Users, Zap, CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react';
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

// Get all available timezones with US zones prioritized
const getTimezones = (): string[] => {
  // Priority US timezones (most commonly used)
  const priorityTimezones = [
    'America/New_York',    // Eastern
    'America/Chicago',     // Central
    'America/Denver',      // Mountain
    'America/Los_Angeles'  // Pacific
  ];
  
  let allTimezones: string[] = [];
  
  try {
    // Use Intl.supportedValuesOf if available (modern browsers)
    if ('supportedValuesOf' in Intl) {
      allTimezones = (Intl as any).supportedValuesOf('timeZone');
    }
  } catch (error) {
    console.warn('Intl.supportedValuesOf not available, using fallback timezone list');
  }
  
  // Fallback list if modern API not available
  if (allTimezones.length === 0) {
    allTimezones = [
      'America/New_York',
      'America/Chicago', 
      'America/Denver',
      'America/Los_Angeles',
      'America/Anchorage',
      'Pacific/Honolulu',
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
  }
  
  // Remove priority timezones from the main list and sort the rest
  const remainingTimezones = allTimezones
    .filter(tz => !priorityTimezones.includes(tz))
    .sort();
  
  // Return priority timezones first, then all others
  return [...priorityTimezones, ...remainingTimezones];
};

export default function AdminSettings() {
  const [settings, setSettings] = useState<SystemSettings>({
    autoApproveRegistrations: true,
    businessName: '',
    contactEmail: '',
    supportEmail: '',
    timezone: '',
    emailNotifications: true,
    smsNotifications: false,
    sessionCapacityWarning: 3,
    paymentReminderMinutes: 60
  });
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
    fetchIntegrations();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      
      // Convert legacy paymentReminderHours to paymentReminderMinutes if needed
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

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error('Failed to update settings');

      // Update timezone context if timezone changed
      if (window.location && settings.timezone) {
        // Refresh the page to ensure timezone changes take effect throughout the app
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              Integrations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-zinc-300">Third-party Services</Label>
                <p className="text-sm text-zinc-400">
                  Configure email, SMS, payments, accounting, and other external service integrations
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
              />
            </div>
            <div>
              <Label htmlFor="contactEmail" className="text-zinc-300">Contact Email</Label>
              <Input
                id="contactEmail"
                value={settings.contactEmail}
                onChange={(e) => setSettings(prev => ({ ...prev, contactEmail: e.target.value }))}
                className="bg-zinc-800 border-zinc-700 text-white"
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
              <p className="text-sm text-zinc-400 mt-1">
                Email address that receives notifications when users submit help requests
              </p>
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
                      {tz.replace(/_/g, ' ')} ({new Date().toLocaleTimeString('en-US', {
                        timeZone: tz,
                        timeZoneName: 'short'
                      }).split(' ').pop()})
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
                  When enabled, new parent and player sign-ups are automatically approved. 
                  When disabled, all registrations require manual admin approval.
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
              <p className="text-sm text-zinc-400 mt-1">
                Show warning when session capacity drops below this number
              </p>
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
              <p className="text-sm text-zinc-400 mt-1">
                Send payment reminders this many minutes before payment deadline
              </p>
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
                  Send email alerts for new bookings and system updates
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
                  Send SMS alerts for important updates
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
      </div>
    </AdminLayout>
  );
}