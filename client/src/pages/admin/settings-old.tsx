import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { useToast } from '../../hooks/use-toast';
import { Settings, Shield, Bell, Users } from 'lucide-react';

interface SystemSettings {
  autoApproveRegistrations: boolean;
  businessName: string;
  contactEmail: string;
  timezone: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  sessionCapacityWarning: number;
  paymentReminderHours: number;
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<SystemSettings>({
    autoApproveRegistrations: true,
    businessName: '',
    contactEmail: '',
    timezone: '',
    emailNotifications: true,
    smsNotifications: false,
    sessionCapacityWarning: 3,
    paymentReminderHours: 4
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
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

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error('Failed to update settings');

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
              <Label htmlFor="timezone" className="text-zinc-300">Timezone</Label>
              <Input
                id="timezone"
                value={settings.timezone}
                onChange={(e) => setSettings(prev => ({ ...prev, timezone: e.target.value }))}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
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
            <div className="flex items-center justify-between">
              <Label htmlFor="require2fa" className="text-zinc-300">Require 2FA for Admins</Label>
              <Switch id="require2fa" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="sessionTimeout" className="text-zinc-300">Auto-logout after inactivity</Label>
              <Switch id="sessionTimeout" defaultChecked />
            </div>
            <div>
              <Label htmlFor="allowedDomains" className="text-zinc-300">Allowed Admin Domains</Label>
              <Input
                id="allowedDomains"
                placeholder="example.com, company.org"
                className="bg-zinc-800 border-zinc-700 text-white"
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
              <Label htmlFor="emailNotifs" className="text-zinc-300">Email Notifications</Label>
              <Switch id="emailNotifs" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="smsNotifs" className="text-zinc-300">SMS Notifications</Label>
              <Switch id="smsNotifs" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="paymentAlerts" className="text-zinc-300">Payment Alerts</Label>
              <Switch id="paymentAlerts" defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Users className="w-5 h-5 mr-2" />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="autoApprove" className="text-zinc-300">Auto-approve new registrations</Label>
              <Switch id="autoApprove" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="playerPortal" className="text-zinc-300">Allow player portal access</Label>
              <Switch id="playerPortal" defaultChecked />
            </div>
            <div>
              <Label htmlFor="maxPlayers" className="text-zinc-300">Max players per parent</Label>
              <Input
                id="maxPlayers"
                type="number"
                defaultValue="5"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end mt-6">
        <Button className="bg-blue-600 hover:bg-blue-700">
          Save Settings
        </Button>
      </div>
    </AdminLayout>
  );
}