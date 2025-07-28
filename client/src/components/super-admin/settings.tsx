import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings, 
  Mail, 
  MessageSquare, 
  Users, 
  Globe, 
  Shield,
  TestTube,
  Check,
  X,
  Key,
  Webhook
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Integration {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'oauth' | 'webhook';
  enabled: boolean;
  config: Record<string, any>;
  status: 'connected' | 'disconnected' | 'testing';
}

interface PlatformSettings {
  autoApproveTenants: boolean;
  enableMfaByDefault: boolean;
  defaultBookingWindowHours: number;
  maxTenantsPerAdmin: number;
  enableTenantSubdomains: boolean;
  requireTenantApproval: boolean;
  defaultSessionCapacity: number;
  platformMaintenanceMode: boolean;
}

interface SuperAdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'super-admin' | 'platform-admin';
  status: 'active' | 'inactive';
  lastLogin: string;
  createdAt: string;
}

export default function SuperAdminSettings() {
  const [settings, setSettings] = useState<PlatformSettings>({
    autoApproveTenants: false,
    enableMfaByDefault: true,
    defaultBookingWindowHours: 24,
    maxTenantsPerAdmin: 5,
    enableTenantSubdomains: true,
    requireTenantApproval: true,
    defaultSessionCapacity: 15,
    platformMaintenanceMode: false
  });
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [users, setUsers] = useState<SuperAdminUser[]>([]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: platformSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['/api/super-admin/settings'],
    queryFn: async () => {
      const response = await fetch('/api/super-admin/settings');
      return response.json();
    }
  });

  const { data: platformIntegrations, isLoading: integrationsLoading } = useQuery({
    queryKey: ['/api/super-admin/integrations'],
    queryFn: async () => {
      const response = await fetch('/api/super-admin/integrations');
      return response.json();
    }
  });

  const { data: platformUsers, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/super-admin/users'],
    queryFn: async () => {
      const response = await fetch('/api/super-admin/users');
      return response.json();
    }
  });

  const saveSettingsMutation = useMutation({
    mutationFn: (newSettings: PlatformSettings) => apiRequest('/api/super-admin/settings', newSettings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/settings'] });
      toast({ title: "Success", description: "Platform settings saved successfully!" });
    }
  });

  const updateIntegrationMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest(`/api/super-admin/integrations/${id}`, data, 'PATCH'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/integrations'] });
      toast({ title: "Success", description: "Integration updated successfully!" });
    }
  });

  const testIntegrationMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/super-admin/integrations/${id}/test`, {}, 'POST'),
    onSuccess: () => {
      toast({ title: "Success", description: "Integration test completed successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Integration test failed. Please check your configuration." });
    }
  });

  useEffect(() => {
    if (platformSettings) {
      setSettings(platformSettings);
    }
  }, [platformSettings]);

  useEffect(() => {
    if (platformIntegrations) {
      setIntegrations(platformIntegrations);
    }
  }, [platformIntegrations]);

  useEffect(() => {
    if (platformUsers) {
      setUsers(platformUsers);
    }
  }, [platformUsers]);

  const handleSettingsSave = () => {
    setSaving(true);
    saveSettingsMutation.mutate(settings);
    setSaving(false);
  };

  const handleIntegrationToggle = (id: string, enabled: boolean) => {
    updateIntegrationMutation.mutate({ id, enabled });
  };

  const handleIntegrationTest = (id: string) => {
    testIntegrationMutation.mutate(id);
  };

  const handleIntegrationUpdate = (id: string, config: Record<string, any>) => {
    updateIntegrationMutation.mutate({ id, config });
  };

  if (settingsLoading || integrationsLoading || usersLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Platform Settings</h1>
        </div>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold">Platform Settings</h1>
          <p className="text-muted-foreground">Configure global platform settings and integrations</p>
        </div>
      </div>

      <Tabs defaultValue="platform" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="platform">Platform Settings</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
        </TabsList>

        {/* Platform Settings Tab */}
        <TabsContent value="platform" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Global Platform Settings</span>
              </CardTitle>
              <CardDescription>Configure default settings that apply across all tenants</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="autoApproveTenants">Auto-approve new tenants</Label>
                      <p className="text-sm text-muted-foreground">Automatically approve new tenant registrations</p>
                    </div>
                    <Switch
                      id="autoApproveTenants"
                      checked={settings.autoApproveTenants}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoApproveTenants: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="enableMfaByDefault">Enable MFA by default</Label>
                      <p className="text-sm text-muted-foreground">Require multi-factor authentication for new users</p>
                    </div>
                    <Switch
                      id="enableMfaByDefault"
                      checked={settings.enableMfaByDefault}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableMfaByDefault: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="enableTenantSubdomains">Enable tenant subdomains</Label>
                      <p className="text-sm text-muted-foreground">Allow tenants to use custom subdomains</p>
                    </div>
                    <Switch
                      id="enableTenantSubdomains"
                      checked={settings.enableTenantSubdomains}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableTenantSubdomains: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="requireTenantApproval">Require tenant approval</Label>
                      <p className="text-sm text-muted-foreground">Require super admin approval for tenant changes</p>
                    </div>
                    <Switch
                      id="requireTenantApproval"
                      checked={settings.requireTenantApproval}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, requireTenantApproval: checked }))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="defaultBookingWindowHours">Default booking window (hours)</Label>
                    <Input
                      id="defaultBookingWindowHours"
                      type="number"
                      min="1"
                      max="168"
                      value={settings.defaultBookingWindowHours}
                      onChange={(e) => setSettings(prev => ({ ...prev, defaultBookingWindowHours: parseInt(e.target.value) }))}
                    />
                    <p className="text-sm text-muted-foreground">How far in advance users can book sessions</p>
                  </div>

                  <div>
                    <Label htmlFor="maxTenantsPerAdmin">Max tenants per admin</Label>
                    <Input
                      id="maxTenantsPerAdmin"
                      type="number"
                      min="1"
                      max="50"
                      value={settings.maxTenantsPerAdmin}
                      onChange={(e) => setSettings(prev => ({ ...prev, maxTenantsPerAdmin: parseInt(e.target.value) }))}
                    />
                    <p className="text-sm text-muted-foreground">Maximum number of tenants one admin can manage</p>
                  </div>

                  <div>
                    <Label htmlFor="defaultSessionCapacity">Default session capacity</Label>
                    <Input
                      id="defaultSessionCapacity"
                      type="number"
                      min="1"
                      max="100"
                      value={settings.defaultSessionCapacity}
                      onChange={(e) => setSettings(prev => ({ ...prev, defaultSessionCapacity: parseInt(e.target.value) }))}
                    />
                    <p className="text-sm text-muted-foreground">Default capacity for new sessions</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="platformMaintenanceMode">Maintenance mode</Label>
                      <p className="text-sm text-muted-foreground">Enable platform-wide maintenance mode</p>
                    </div>
                    <Switch
                      id="platformMaintenanceMode"
                      checked={settings.platformMaintenanceMode}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, platformMaintenanceMode: checked }))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t">
                <Button onClick={handleSettingsSave} disabled={saving}>
                  {saving ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          {/* Email Integrations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="w-5 h-5" />
                <span>Email Services</span>
              </CardTitle>
              <CardDescription>Configure email providers for tenant communications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {integrations.filter(i => i.type === 'email').map((integration) => (
                <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div>
                      <h4 className="font-medium">{integration.name}</h4>
                      <div className="flex items-center space-x-2">
                        <Badge variant={integration.status === 'connected' ? 'default' : 'secondary'}>
                          {integration.status}
                        </Badge>
                        {integration.enabled && (
                          <Badge variant="outline">Enabled</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleIntegrationTest(integration.id)}
                      disabled={testIntegrationMutation.isPending}
                    >
                      <TestTube className="w-4 h-4 mr-1" />
                      Test
                    </Button>
                    <Switch
                      checked={integration.enabled}
                      onCheckedChange={(checked) => handleIntegrationToggle(integration.id, checked)}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* SMS Integrations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5" />
                <span>SMS Services</span>
              </CardTitle>
              <CardDescription>Configure SMS providers for notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {integrations.filter(i => i.type === 'sms').map((integration) => (
                <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div>
                      <h4 className="font-medium">{integration.name}</h4>
                      <div className="flex items-center space-x-2">
                        <Badge variant={integration.status === 'connected' ? 'default' : 'secondary'}>
                          {integration.status}
                        </Badge>
                        {integration.enabled && (
                          <Badge variant="outline">Enabled</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleIntegrationTest(integration.id)}
                      disabled={testIntegrationMutation.isPending}
                    >
                      <TestTube className="w-4 h-4 mr-1" />
                      Test
                    </Button>
                    <Switch
                      checked={integration.enabled}
                      onCheckedChange={(checked) => handleIntegrationToggle(integration.id, checked)}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* OAuth Providers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="w-5 h-5" />
                <span>OAuth Providers</span>
              </CardTitle>
              <CardDescription>Configure social authentication providers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {integrations.filter(i => i.type === 'oauth').map((integration) => (
                <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div>
                      <h4 className="font-medium">{integration.name}</h4>
                      <div className="flex items-center space-x-2">
                        <Badge variant={integration.status === 'connected' ? 'default' : 'secondary'}>
                          {integration.status}
                        </Badge>
                        {integration.enabled && (
                          <Badge variant="outline">Enabled</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleIntegrationTest(integration.id)}
                      disabled={testIntegrationMutation.isPending}
                    >
                      <TestTube className="w-4 h-4 mr-1" />
                      Test
                    </Button>
                    <Switch
                      checked={integration.enabled}
                      onCheckedChange={(checked) => handleIntegrationToggle(integration.id, checked)}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Webhook Endpoints */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Webhook className="w-5 h-5" />
                <span>Webhook Endpoints</span>
              </CardTitle>
              <CardDescription>Configure webhook endpoints for external integrations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {integrations.filter(i => i.type === 'webhook').map((integration) => (
                <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div>
                      <h4 className="font-medium">{integration.name}</h4>
                      <p className="text-sm text-muted-foreground">{integration.config?.url}</p>
                      <div className="flex items-center space-x-2">
                        <Badge variant={integration.status === 'connected' ? 'default' : 'secondary'}>
                          {integration.status}
                        </Badge>
                        {integration.enabled && (
                          <Badge variant="outline">Enabled</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleIntegrationTest(integration.id)}
                      disabled={testIntegrationMutation.isPending}
                    >
                      <TestTube className="w-4 h-4 mr-1" />
                      Test
                    </Button>
                    <Switch
                      checked={integration.enabled}
                      onCheckedChange={(checked) => handleIntegrationToggle(integration.id, checked)}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Management Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Super Admin Users</span>
              </CardTitle>
              <CardDescription>Manage platform administrators and their permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div>
                        <h4 className="font-medium">{user.firstName} {user.lastName}</h4>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant={user.role === 'super-admin' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                          <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                            {user.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Key className="w-4 h-4 mr-1" />
                        Reset Password
                      </Button>
                      <Select defaultValue={user.role}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="super-admin">Super Admin</SelectItem>
                          <SelectItem value="platform-admin">Platform Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}