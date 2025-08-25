import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Shield, Save, Clock, Database, AlertTriangle, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Policies {
  autoApproveTenants: boolean;
  requireTenantApproval: boolean;
  mfa: {
    requireSuperAdmins: boolean;
    requireTenantAdmins: boolean;
  };
  subdomains: {
    enabled: boolean;
    baseDomain: string;
    dnsOk?: boolean;
    sslOk?: boolean;
  };
  impersonation: {
    allow: boolean;
    maxMinutes: number;
    requireReason: boolean;
  };
  session: {
    idleTimeoutMinutes: number;
  };
  retentionDays: {
    logs: number;
    analytics: number;
    pii: number;
  };
  maintenance: {
    enabled: boolean;
    message: string;
  };
  security: {
    ipRestrictions: {
      enabled: boolean;
      allowedIPs: string[];
    };
    apiRateLimit: {
      enabled: boolean;
      requestsPerMinute: number;
    };
    sessionMonitoring: {
      enabled: boolean;
      maxConcurrentSessions: number;
    };
  };
}

export function PlatformPolicies() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [localPolicies, setLocalPolicies] = useState<Policies | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: policies, isLoading } = useQuery({
    queryKey: ['/api/super-admin/settings/policies'],
    queryFn: async () => {
      const response = await fetch('/api/super-admin/settings/policies', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch policies');
      }
      return response.json() as Policies;
    },
    retry: false,
  });

  const updatePolicies = useMutation({
    mutationFn: async (newPolicies: Policies) => {
      const response = await fetch('/api/super-admin/settings/policies', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPolicies),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to update policies');
      }
      
      return response.json();
    },
    onSuccess: (updatedPolicies) => {
      queryClient.setQueryData(['/api/super-admin/settings/policies'], updatedPolicies);
      setLocalPolicies(updatedPolicies);
      setHasChanges(false);
      toast({
        title: "Policies Updated",
        description: "Platform policies have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update policies. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (policies) {
      setLocalPolicies(policies);
    }
  }, [policies]);

  const handleChange = (path: string, value: any) => {
    if (!localPolicies) return;

    const keys = path.split('.');
    const newPolicies = { ...localPolicies };
    let current: any = newPolicies;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current[keys[i]] = { ...current[keys[i]] };
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setLocalPolicies(newPolicies);
    setHasChanges(true);
  };

  const handleSave = () => {
    if (localPolicies) {
      updatePolicies.mutate(localPolicies);
    }
  };

  if (isLoading || !localPolicies) {
    return <div>Loading policies...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Platform Policies</h3>
          <p className="text-sm text-muted-foreground">Configure platform-wide security and operational policies</p>
        </div>
        {hasChanges && (
          <Button onClick={handleSave} disabled={updatePolicies.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updatePolicies.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Policies
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Multi-Factor Authentication for Super Admins</Label>
                <p className="text-sm text-muted-foreground">Require MFA for super admin accounts</p>
              </div>
              <Switch
                checked={localPolicies.mfa.requireSuperAdmins}
                onCheckedChange={(value) => handleChange('mfa.requireSuperAdmins', value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Multi-Factor Authentication for Tenant Admins</Label>
                <p className="text-sm text-muted-foreground">Require MFA for tenant admin accounts</p>
              </div>
              <Switch
                checked={localPolicies.mfa.requireTenantAdmins}
                onCheckedChange={(value) => handleChange('mfa.requireTenantAdmins', value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Session Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Session Idle Timeout (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                min="5"
                max="1440"
                value={localPolicies.session.idleTimeoutMinutes}
                onChange={(e) => handleChange('session.idleTimeoutMinutes', parseInt(e.target.value) || 5)}
              />
              <p className="text-sm text-muted-foreground">Users will be logged out after this period of inactivity</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Retention
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="logsRetention">Logs (days)</Label>
                <Input
                  id="logsRetention"
                  type="number"
                  min="1"
                  max="3650"
                  value={localPolicies.retentionDays.logs}
                  onChange={(e) => handleChange('retentionDays.logs', parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="analyticsRetention">Analytics (days)</Label>
                <Input
                  id="analyticsRetention"
                  type="number"
                  min="1"
                  max="3650"
                  value={localPolicies.retentionDays.analytics}
                  onChange={(e) => handleChange('retentionDays.analytics', parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="piiRetention">PII Data (days)</Label>
                <Input
                  id="piiRetention"
                  type="number"
                  min="1"
                  max="3650"
                  value={localPolicies.retentionDays.pii}
                  onChange={(e) => handleChange('retentionDays.pii', parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Maintenance Mode
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">Restrict access to the platform</p>
              </div>
              <Switch
                checked={localPolicies.maintenance.enabled}
                onCheckedChange={(value) => handleChange('maintenance.enabled', value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
              <Textarea
                id="maintenanceMessage"
                value={localPolicies.maintenance.message}
                onChange={(e) => handleChange('maintenance.message', e.target.value)}
                placeholder="Enter the message users will see during maintenance"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Tenant Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-Approve New Tenants</Label>
                <p className="text-sm text-muted-foreground">Automatically approve tenant registrations</p>
              </div>
              <Switch
                checked={localPolicies.autoApproveTenants}
                onCheckedChange={(value) => handleChange('autoApproveTenants', value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Require Tenant Approval</Label>
                <p className="text-sm text-muted-foreground">Manual approval required for new tenants</p>
              </div>
              <Switch
                checked={localPolicies.requireTenantApproval}
                onCheckedChange={(value) => handleChange('requireTenantApproval', value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}