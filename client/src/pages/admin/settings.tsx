import React from 'react';
import AdminLayout from '../../components/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Settings, Shield, Bell, Users } from 'lucide-react';

export default function AdminSettings() {
  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-white mb-6">Admin Settings</h1>

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
                defaultValue="Futsal Culture"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div>
              <Label htmlFor="contactEmail" className="text-zinc-300">Contact Email</Label>
              <Input
                id="contactEmail"
                defaultValue="admin@futsalculture.com"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div>
              <Label htmlFor="timezone" className="text-zinc-300">Timezone</Label>
              <Input
                id="timezone"
                defaultValue="Singapore/Asia"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Security Settings
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