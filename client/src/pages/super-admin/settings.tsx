import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield,
  UserCheck,
  Key,
  Globe,
  UserX,
  Clock,
  Database,
  AlertTriangle,
  Package,
  Calendar,
  Users as UsersIcon,
  Sparkles,
  HelpCircle,
  Check,
  Loader2,
  CreditCard,
  Mail,
  MessageSquare,
  Smartphone,
  TestTube,
  Server,
  Users,
  Settings as SettingsIcon,
  User,
  Gauge,
  Lock,
  MailCheck,
  Settings2,
  TrendingUp,
  Timer,
  Bell,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  Wallet,
  Building
} from 'lucide-react';
import { debounce } from 'lodash';

// Type definitions
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
}

interface TenantDefaults {
  defaultPlanCode: 'free' | 'core' | 'growth' | 'elite';
  bookingWindowHours: number;
  sessionCapacity: number;
  seedSampleContent: boolean;
}

export default function SuperAdminSettings() {
  const [activeTab, setActiveTab] = useState('policies');
  const [localPolicies, setLocalPolicies] = useState<Policies | null>(null);
  const [localTenantDefaults, setLocalTenantDefaults] = useState<TenantDefaults | null>(null);
  const [saveStatus, setSaveStatus] = useState<{ type: 'idle' | 'saving' | 'saved' | 'error'; message?: string }>({ type: 'idle' });
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; action: string; callback: () => void } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Integration configuration states
  const [emailConfig, setEmailConfig] = useState<any>({
    apiKey: '',
    senderEmail: '',
    senderName: '',
    replyTo: '',
    templates: {
      welcome: true,
      booking: true,
      reminders: true
    }
  });
  const [smsConfig, setSmsConfig] = useState<any>({
    accountSid: '',
    authToken: '',
    phoneNumber: '',
    messagingServiceSid: '',
    notifications: {
      reminders: true,
      bookings: true,
      cancellations: false,
      waitlist: true
    }
  });
  const [paymentConfig, setPaymentConfig] = useState<any>({
    mode: 'test',
    secretKey: '',
    publishableKey: '',
    webhookSecret: '',
    methods: {
      card: true,
      applePay: false,
      bankTransfer: false
    },
    settings: {
      autoCapture: true,
      sendReceipts: true
    }
  });
  const [authConfig, setAuthConfig] = useState<any>({});
  
  // UI visibility states
  const [showSendGridKey, setShowSendGridKey] = useState(false);
  const [showTwilioSid, setShowTwilioSid] = useState(false);
  const [showTwilioToken, setShowTwilioToken] = useState(false);
  const [showStripeSecret, setShowStripeSecret] = useState(false);
  const [showStripeWebhook, setShowStripeWebhook] = useState(false);
  
  // Loading states
  const [testingIntegration, setTestingIntegration] = useState<string | null>(null);
  const [savingIntegration, setSavingIntegration] = useState<string | null>(null);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [sendingTestSMS, setSendingTestSMS] = useState(false);
  
  // Add Super Admin dialog states
  const [addSuperAdminOpen, setAddSuperAdminOpen] = useState(false);
  const [newSuperAdminData, setNewSuperAdminData] = useState({
    username: '',
    email: '',
    fullName: '',
    requireMfa: true
  });
  const [addingSuperAdmin, setAddingSuperAdmin] = useState(false);

  // Fetch policies
  const { data: policies, isLoading: policiesLoading } = useQuery<Policies>({
    queryKey: ['/api/super-admin/settings/policies'],
    queryFn: async () => {
      const response = await fetch('/api/super-admin/settings/policies', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch policies');
      return response.json();
    }
  });

  // Fetch tenant defaults
  const { data: tenantDefaults, isLoading: defaultsLoading } = useQuery<TenantDefaults>({
    queryKey: ['/api/super-admin/settings/tenant-defaults'],
    queryFn: async () => {
      const response = await fetch('/api/super-admin/settings/tenant-defaults', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch tenant defaults');
      return response.json();
    }
  });

  // Update policies mutation
  const updatePoliciesMutation = useMutation({
    mutationFn: async (data: Policies) => {
      const response = await fetch('/api/super-admin/settings/policies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update policies');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/settings/policies'] });
      setSaveStatus({ type: 'saved', message: 'Policies saved' });
      setTimeout(() => setSaveStatus({ type: 'idle' }), 3000);
    },
    onError: (error: any) => {
      setSaveStatus({ type: 'error', message: error.message });
      toast({ title: 'Failed to save policies', description: error.message, variant: 'destructive' });
    }
  });

  // Update tenant defaults mutation
  const updateTenantDefaultsMutation = useMutation({
    mutationFn: async (data: TenantDefaults) => {
      const response = await fetch('/api/super-admin/settings/tenant-defaults', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update tenant defaults');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/settings/tenant-defaults'] });
      setSaveStatus({ type: 'saved', message: 'Defaults saved' });
      setTimeout(() => setSaveStatus({ type: 'idle' }), 3000);
    },
    onError: (error: any) => {
      setSaveStatus({ type: 'error', message: error.message });
      toast({ title: 'Failed to save defaults', description: error.message, variant: 'destructive' });
    }
  });

  // Initialize local state
  useEffect(() => {
    if (policies) setLocalPolicies(policies);
  }, [policies]);

  useEffect(() => {
    if (tenantDefaults) setLocalTenantDefaults(tenantDefaults);
  }, [tenantDefaults]);

  // Debounced autosave for policies
  const debouncedSavePolicies = useCallback(
    debounce((data: Policies) => {
      setSaveStatus({ type: 'saving' });
      updatePoliciesMutation.mutate(data);
    }, 1000),
    []
  );

  // Debounced autosave for tenant defaults
  const debouncedSaveTenantDefaults = useCallback(
    debounce((data: TenantDefaults) => {
      setSaveStatus({ type: 'saving' });
      updateTenantDefaultsMutation.mutate(data);
    }, 1000),
    []
  );

  // Handle policy changes
  const handlePolicyChange = (updates: Partial<Policies>) => {
    if (!localPolicies) return;
    
    const newPolicies = { ...localPolicies, ...updates };
    
    // Check for risky changes
    const riskyChanges = [];
    if (updates.maintenance?.enabled && !localPolicies.maintenance.enabled) {
      riskyChanges.push('Enable maintenance mode');
    }
    if (updates.mfa?.requireSuperAdmins && !localPolicies.mfa.requireSuperAdmins) {
      riskyChanges.push('Require MFA for Super Admins');
    }
    if (updates.impersonation && !updates.impersonation.allow && localPolicies.impersonation.allow) {
      riskyChanges.push('Disable impersonation');
    }

    if (riskyChanges.length > 0) {
      setConfirmDialog({
        open: true,
        action: riskyChanges.join(', '),
        callback: () => {
          setLocalPolicies(newPolicies);
          debouncedSavePolicies(newPolicies);
        }
      });
    } else {
      setLocalPolicies(newPolicies);
      debouncedSavePolicies(newPolicies);
    }
  };

  // Handle tenant defaults changes
  const handleTenantDefaultsChange = (updates: Partial<TenantDefaults>) => {
    if (!localTenantDefaults) return;
    
    const newDefaults = { ...localTenantDefaults, ...updates };
    setLocalTenantDefaults(newDefaults);
    debouncedSaveTenantDefaults(newDefaults);
  };
  
  // Integration handler functions
  const handleTestIntegration = async (type: string) => {
    setTestingIntegration(type);
    try {
      const response = await fetch(`/api/super-admin/integrations/${type}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(
          type === 'email' ? emailConfig :
          type === 'sms' ? smsConfig :
          type === 'payment' ? paymentConfig :
          authConfig
        )
      });
      
      const result = await response.json();
      if (response.ok) {
        toast({ title: `${type} integration test successful`, description: result.message });
      } else {
        throw new Error(result.error || 'Test failed');
      }
    } catch (error: any) {
      toast({ 
        title: `${type} integration test failed`, 
        description: error.message,
        variant: 'destructive' 
      });
    } finally {
      setTestingIntegration(null);
    }
  };
  
  const handleSaveIntegration = async (type: string) => {
    setSavingIntegration(type);
    try {
      const config = 
        type === 'email' ? emailConfig :
        type === 'sms' ? smsConfig :
        type === 'payment' ? paymentConfig :
        authConfig;
        
      const response = await fetch(`/api/super-admin/integrations/${type}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        toast({ title: `${type} integration saved successfully` });
        queryClient.invalidateQueries({ queryKey: ['/api/super-admin/integrations'] });
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Save failed');
      }
    } catch (error: any) {
      toast({ 
        title: `Failed to save ${type} integration`, 
        description: error.message,
        variant: 'destructive' 
      });
    } finally {
      setSavingIntegration(null);
    }
  };
  
  const handleSendTestEmail = async () => {
    setSendingTestEmail(true);
    try {
      const response = await fetch('/api/super-admin/integrations/email/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...emailConfig,
          to: 'test@example.com'
        })
      });
      
      if (response.ok) {
        toast({ title: 'Test email sent successfully' });
      } else {
        throw new Error('Failed to send test email');
      }
    } catch (error: any) {
      toast({ 
        title: 'Failed to send test email', 
        description: error.message,
        variant: 'destructive' 
      });
    } finally {
      setSendingTestEmail(false);
    }
  };
  
  const handleSendTestSMS = async () => {
    setSendingTestSMS(true);
    try {
      const response = await fetch('/api/super-admin/integrations/sms/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...smsConfig,
          to: '+1234567890'
        })
      });
      
      if (response.ok) {
        toast({ title: 'Test SMS sent successfully' });
      } else {
        throw new Error('Failed to send test SMS');
      }
    } catch (error: any) {
      toast({ 
        title: 'Failed to send test SMS', 
        description: error.message,
        variant: 'destructive' 
      });
    } finally {
      setSendingTestSMS(false);
    }
  };
  
  // Handle adding new Super Admin
  const handleAddSuperAdmin = async () => {
    if (!newSuperAdminData.username || !newSuperAdminData.email) {
      toast({ 
        title: 'Validation Error', 
        description: 'Username and email are required',
        variant: 'destructive' 
      });
      return;
    }
    
    setAddingSuperAdmin(true);
    try {
      const response = await fetch('/api/super-admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newSuperAdminData)
      });
      
      if (response.ok) {
        toast({ 
          title: 'Super Admin Added', 
          description: `${newSuperAdminData.fullName || newSuperAdminData.username} has been added as a Super Admin` 
        });
        setAddSuperAdminOpen(false);
        setNewSuperAdminData({
          username: '',
          email: '',
          fullName: '',
          requireMfa: true
        });
        // Refresh the user list if needed
        queryClient.invalidateQueries({ queryKey: ['/api/super-admin/users'] });
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add Super Admin');
      }
    } catch (error: any) {
      toast({ 
        title: 'Failed to add Super Admin', 
        description: error.message,
        variant: 'destructive' 
      });
    } finally {
      setAddingSuperAdmin(false);
    }
  };

  if (policiesLoading || defaultsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Platform Settings</h2>
          <p className="text-muted-foreground">Configure platform-wide policies and tenant defaults</p>
        </div>
        
        <div className="flex items-center gap-2">
          {saveStatus.type === 'saving' && (
            <Badge variant="secondary">
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
              Saving...
            </Badge>
          )}
          {saveStatus.type === 'saved' && (
            <Badge variant="default" className="bg-green-500">
              <Check className="h-3 w-3 mr-1" />
              {saveStatus.message}
            </Badge>
          )}
          {saveStatus.type === 'error' && (
            <Badge variant="destructive">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {saveStatus.message}
            </Badge>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="policies">
            <Shield className="h-4 w-4 mr-2" />
            Policies
          </TabsTrigger>
          <TabsTrigger value="tenant-defaults">
            <Package className="h-4 w-4 mr-2" />
            Tenant Defaults
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Server className="h-4 w-4 mr-2" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="user-management">
            <Users className="h-4 w-4 mr-2" />
            User Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="policies" className="space-y-4 mt-6">
          {localPolicies && (
            <>
              {/* Tenant Approval */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-5 w-5 text-muted-foreground" />
                      <CardTitle>Tenant Approval</CardTitle>
                    </div>
                    <a href="#" className="text-sm text-primary hover:underline">Learn more</a>
                  </div>
                  <CardDescription>Control how new tenants are onboarded to the platform</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-approve new tenants</Label>
                      <p className="text-sm text-muted-foreground">Automatically approve new tenant registrations</p>
                    </div>
                    <Switch
                      checked={localPolicies.autoApproveTenants}
                      onCheckedChange={(checked) => {
                        handlePolicyChange({ 
                          autoApproveTenants: checked,
                          requireTenantApproval: checked ? false : localPolicies.requireTenantApproval
                        });
                      }}
                      disabled={localPolicies.requireTenantApproval}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Require tenant approval</Label>
                      <p className="text-sm text-muted-foreground">Manually review and approve each tenant</p>
                    </div>
                    <Switch
                      checked={localPolicies.requireTenantApproval}
                      onCheckedChange={(checked) => {
                        handlePolicyChange({ 
                          requireTenantApproval: checked,
                          autoApproveTenants: checked ? false : localPolicies.autoApproveTenants
                        });
                      }}
                      disabled={localPolicies.autoApproveTenants}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* MFA Policy */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key className="h-5 w-5 text-muted-foreground" />
                      <CardTitle>Multi-Factor Authentication</CardTitle>
                    </div>
                    <a href="#" className="text-sm text-primary hover:underline">Learn more</a>
                  </div>
                  <CardDescription>Enforce MFA requirements for different user roles</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Require MFA for Super Admins</Label>
                      <p className="text-sm text-muted-foreground">Enforce MFA for all Super Admin accounts</p>
                    </div>
                    <Switch
                      checked={localPolicies.mfa.requireSuperAdmins}
                      onCheckedChange={(checked) => {
                        handlePolicyChange({ 
                          mfa: { ...localPolicies.mfa, requireSuperAdmins: checked }
                        });
                      }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Require MFA for Tenant Admins</Label>
                      <p className="text-sm text-muted-foreground">Enforce MFA for all Tenant Admin accounts</p>
                    </div>
                    <Switch
                      checked={localPolicies.mfa.requireTenantAdmins}
                      onCheckedChange={(checked) => {
                        handlePolicyChange({ 
                          mfa: { ...localPolicies.mfa, requireTenantAdmins: checked }
                        });
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Subdomains */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-muted-foreground" />
                      <CardTitle>Tenant Subdomains</CardTitle>
                    </div>
                    <a href="#" className="text-sm text-primary hover:underline">Learn more</a>
                  </div>
                  <CardDescription>Configure custom subdomains for tenants</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable subdomains</Label>
                      <p className="text-sm text-muted-foreground">Allow tenants to use custom subdomains</p>
                    </div>
                    <Switch
                      checked={localPolicies.subdomains.enabled}
                      onCheckedChange={(checked) => {
                        handlePolicyChange({ 
                          subdomains: { ...localPolicies.subdomains, enabled: checked }
                        });
                      }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Base domain</Label>
                    <Input
                      value={localPolicies.subdomains.baseDomain}
                      onChange={(e) => {
                        handlePolicyChange({ 
                          subdomains: { ...localPolicies.subdomains, baseDomain: e.target.value }
                        });
                      }}
                      placeholder="tenants.playhq.app"
                      disabled={!localPolicies.subdomains.enabled}
                    />
                    <div className="flex gap-2">
                      {localPolicies.subdomains.dnsOk && (
                        <Badge variant="secondary" className="text-green-600">
                          <Check className="h-3 w-3 mr-1" />
                          DNS Verified
                        </Badge>
                      )}
                      {localPolicies.subdomains.sslOk && (
                        <Badge variant="secondary" className="text-green-600">
                          <Check className="h-3 w-3 mr-1" />
                          SSL Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Impersonation */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserX className="h-5 w-5 text-muted-foreground" />
                      <CardTitle>Impersonation Policy</CardTitle>
                    </div>
                    <a href="#" className="text-sm text-primary hover:underline">Learn more</a>
                  </div>
                  <CardDescription>Control admin impersonation capabilities</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Allow impersonation</Label>
                      <p className="text-sm text-muted-foreground">Enable Super Admins to impersonate users</p>
                    </div>
                    <Switch
                      checked={localPolicies.impersonation.allow}
                      onCheckedChange={(checked) => {
                        handlePolicyChange({ 
                          impersonation: { ...localPolicies.impersonation, allow: checked }
                        });
                      }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Max duration (minutes)</Label>
                    <Input
                      type="number"
                      value={localPolicies.impersonation.maxMinutes}
                      onChange={(e) => {
                        handlePolicyChange({ 
                          impersonation: { ...localPolicies.impersonation, maxMinutes: parseInt(e.target.value) || 30 }
                        });
                      }}
                      min={1}
                      max={480}
                      disabled={!localPolicies.impersonation.allow}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Require reason</Label>
                      <p className="text-sm text-muted-foreground">Require a reason for impersonation</p>
                    </div>
                    <Switch
                      checked={localPolicies.impersonation.requireReason}
                      onCheckedChange={(checked) => {
                        handlePolicyChange({ 
                          impersonation: { ...localPolicies.impersonation, requireReason: checked }
                        });
                      }}
                      disabled={!localPolicies.impersonation.allow}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Session Security */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <CardTitle>Session Security</CardTitle>
                    </div>
                    <a href="#" className="text-sm text-primary hover:underline">Learn more</a>
                  </div>
                  <CardDescription>Configure session timeout settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Idle timeout (minutes)</Label>
                    <Input
                      type="number"
                      value={localPolicies.session.idleTimeoutMinutes}
                      onChange={(e) => {
                        handlePolicyChange({ 
                          session: { idleTimeoutMinutes: parseInt(e.target.value) || 60 }
                        });
                      }}
                      min={5}
                      max={1440}
                    />
                    <p className="text-sm text-muted-foreground">
                      Sessions will expire after {localPolicies.session.idleTimeoutMinutes} minutes of inactivity
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Data Retention */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-muted-foreground" />
                      <CardTitle>Data Retention</CardTitle>
                    </div>
                    <a href="#" className="text-sm text-primary hover:underline">Learn more</a>
                  </div>
                  <CardDescription>Set data retention periods for different data types</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Logs (days)</Label>
                    <Input
                      type="number"
                      value={localPolicies.retentionDays.logs}
                      onChange={(e) => {
                        handlePolicyChange({ 
                          retentionDays: { ...localPolicies.retentionDays, logs: parseInt(e.target.value) || 90 }
                        });
                      }}
                      min={1}
                      max={3650}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Analytics (days)</Label>
                    <Input
                      type="number"
                      value={localPolicies.retentionDays.analytics}
                      onChange={(e) => {
                        handlePolicyChange({ 
                          retentionDays: { ...localPolicies.retentionDays, analytics: parseInt(e.target.value) || 365 }
                        });
                      }}
                      min={1}
                      max={3650}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>PII (days)</Label>
                    <Input
                      type="number"
                      value={localPolicies.retentionDays.pii}
                      onChange={(e) => {
                        handlePolicyChange({ 
                          retentionDays: { ...localPolicies.retentionDays, pii: parseInt(e.target.value) || 730 }
                        });
                      }}
                      min={1}
                      max={3650}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Maintenance Mode */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                      <CardTitle>Maintenance Mode</CardTitle>
                    </div>
                    <a href="#" className="text-sm text-primary hover:underline">Learn more</a>
                  </div>
                  <CardDescription>Temporarily disable platform access for maintenance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable maintenance mode</Label>
                      <p className="text-sm text-muted-foreground">Block non-admin access to the platform</p>
                    </div>
                    <Switch
                      checked={localPolicies.maintenance.enabled}
                      onCheckedChange={(checked) => {
                        handlePolicyChange({ 
                          maintenance: { ...localPolicies.maintenance, enabled: checked }
                        });
                      }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Maintenance message</Label>
                    <Textarea
                      value={localPolicies.maintenance.message}
                      onChange={(e) => {
                        handlePolicyChange({ 
                          maintenance: { ...localPolicies.maintenance, message: e.target.value }
                        });
                      }}
                      placeholder="The platform is undergoing scheduled maintenance. We'll be back shortly."
                      disabled={!localPolicies.maintenance.enabled}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* API Rate Limiting */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gauge className="h-5 w-5 text-muted-foreground" />
                      <CardTitle>API Rate Limiting</CardTitle>
                    </div>
                    <a href="#" className="text-sm text-primary hover:underline">Learn more</a>
                  </div>
                  <CardDescription>Configure API request limits to prevent abuse</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Requests per minute</Label>
                    <Input
                      type="number"
                      defaultValue="60"
                      min={10}
                      max={1000}
                    />
                    <p className="text-xs text-muted-foreground">Per user/tenant</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Burst limit</Label>
                    <Input
                      type="number"
                      defaultValue="100"
                      min={20}
                      max={2000}
                    />
                    <p className="text-xs text-muted-foreground">Max concurrent requests</p>
                  </div>
                </CardContent>
              </Card>

              {/* Password Policy */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="h-5 w-5 text-muted-foreground" />
                      <CardTitle>Password Policy</CardTitle>
                    </div>
                    <a href="#" className="text-sm text-primary hover:underline">Learn more</a>
                  </div>
                  <CardDescription>Set password requirements for all platform users</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Minimum length</Label>
                      <Input
                        type="number"
                        defaultValue="8"
                        min={6}
                        max={32}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Expiry (days)</Label>
                      <Input
                        type="number"
                        defaultValue="90"
                        min={0}
                        max={365}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Requirements</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2">
                        <Switch defaultChecked />
                        <Label className="font-normal">Uppercase letters</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch defaultChecked />
                        <Label className="font-normal">Lowercase letters</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch defaultChecked />
                        <Label className="font-normal">Numbers</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch />
                        <Label className="font-normal">Special characters</Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Email Verification */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MailCheck className="h-5 w-5 text-muted-foreground" />
                      <CardTitle>Email Verification</CardTitle>
                    </div>
                    <a href="#" className="text-sm text-primary hover:underline">Learn more</a>
                  </div>
                  <CardDescription>Control email verification requirements</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Require email verification</Label>
                      <p className="text-sm text-muted-foreground">Users must verify email before access</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Block disposable emails</Label>
                      <p className="text-sm text-muted-foreground">Prevent temporary email addresses</p>
                    </div>
                    <Switch />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Verification link expiry (hours)</Label>
                    <Input
                      type="number"
                      defaultValue="24"
                      min={1}
                      max={168}
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="tenant-defaults" className="space-y-4 mt-6">
          {localTenantDefaults && (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                      <CardTitle>Default Plan</CardTitle>
                    </div>
                    <a href="#" className="text-sm text-primary hover:underline">Learn more</a>
                  </div>
                  <CardDescription>Plan assigned to new tenants by default</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select
                    value={localTenantDefaults.defaultPlanCode}
                    onValueChange={(value: 'free' | 'core' | 'growth' | 'elite') => {
                      handleTenantDefaultsChange({ defaultPlanCode: value });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="core">Core</SelectItem>
                      <SelectItem value="growth">Growth</SelectItem>
                      <SelectItem value="elite">Elite</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <CardTitle>Booking Window</CardTitle>
                    </div>
                    <a href="#" className="text-sm text-primary hover:underline">Learn more</a>
                  </div>
                  <CardDescription>Default booking window for new tenants (hours before session)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Input
                      type="number"
                      value={localTenantDefaults.bookingWindowHours}
                      onChange={(e) => {
                        handleTenantDefaultsChange({ bookingWindowHours: parseInt(e.target.value) || 8 });
                      }}
                      min={0}
                      max={168}
                    />
                    <p className="text-sm text-muted-foreground">
                      Sessions open for booking {localTenantDefaults.bookingWindowHours} hours before start time
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UsersIcon className="h-5 w-5 text-muted-foreground" />
                      <CardTitle>Session Capacity</CardTitle>
                    </div>
                    <a href="#" className="text-sm text-primary hover:underline">Learn more</a>
                  </div>
                  <CardDescription>Default maximum capacity for new sessions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Input
                      type="number"
                      value={localTenantDefaults.sessionCapacity}
                      onChange={(e) => {
                        handleTenantDefaultsChange({ sessionCapacity: parseInt(e.target.value) || 20 });
                      }}
                      min={1}
                      max={1000}
                    />
                    <p className="text-sm text-muted-foreground">
                      Maximum {localTenantDefaults.sessionCapacity} players per session by default
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-muted-foreground" />
                      <CardTitle>Sample Content</CardTitle>
                    </div>
                    <a href="#" className="text-sm text-primary hover:underline">Learn more</a>
                  </div>
                  <CardDescription>Help new tenants get started with sample data</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Seed sample content on trial</Label>
                      <p className="text-sm text-muted-foreground">Create sample sessions, players, and data for new trial tenants</p>
                    </div>
                    <Switch
                      checked={localTenantDefaults.seedSampleContent}
                      onCheckedChange={(checked) => {
                        handleTenantDefaultsChange({ seedSampleContent: checked });
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Default Features */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Settings2 className="h-5 w-5 text-muted-foreground" />
                      <CardTitle>Default Features</CardTitle>
                    </div>
                    <a href="#" className="text-sm text-primary hover:underline">Learn more</a>
                  </div>
                  <CardDescription>Enable features for new tenants by default</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Communication</Label>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Switch defaultChecked />
                          <Label className="font-normal text-sm">Email notifications</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch />
                          <Label className="font-normal text-sm">SMS notifications</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch defaultChecked />
                          <Label className="font-normal text-sm">In-app messaging</Label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Payments</Label>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Switch defaultChecked />
                          <Label className="font-normal text-sm">Stripe integration</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch />
                          <Label className="font-normal text-sm">PayPal integration</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch defaultChecked />
                          <Label className="font-normal text-sm">Discount codes</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Default Limits */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-muted-foreground" />
                      <CardTitle>Default Limits</CardTitle>
                    </div>
                    <a href="#" className="text-sm text-primary hover:underline">Learn more</a>
                  </div>
                  <CardDescription>Set default limits for new tenants</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Max players</Label>
                    <Input
                      type="number"
                      defaultValue="150"
                      min={10}
                      max={10000}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Max admins</Label>
                    <Input
                      type="number"
                      defaultValue="5"
                      min={1}
                      max={50}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Max locations</Label>
                    <Input
                      type="number"
                      defaultValue="3"
                      min={1}
                      max={100}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Storage (GB)</Label>
                    <Input
                      type="number"
                      defaultValue="10"
                      min={1}
                      max={1000}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>API calls/month</Label>
                    <Input
                      type="number"
                      defaultValue="10000"
                      min={1000}
                      max={1000000}
                      step={1000}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Emails/month</Label>
                    <Input
                      type="number"
                      defaultValue="5000"
                      min={100}
                      max={100000}
                      step={100}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Trial Settings */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Timer className="h-5 w-5 text-muted-foreground" />
                      <CardTitle>Trial Settings</CardTitle>
                    </div>
                    <a href="#" className="text-sm text-primary hover:underline">Learn more</a>
                  </div>
                  <CardDescription>Configure trial period for new tenants</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Trial duration (days)</Label>
                      <Input
                        type="number"
                        defaultValue="14"
                        min={0}
                        max={90}
                      />
                      <p className="text-xs text-muted-foreground">0 = No trial period</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Trial plan</Label>
                      <Select defaultValue="growth">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="core">Core</SelectItem>
                          <SelectItem value="growth">Growth</SelectItem>
                          <SelectItem value="elite">Elite</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-convert to free</Label>
                      <p className="text-sm text-muted-foreground">Automatically downgrade after trial ends</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Require payment method</Label>
                      <p className="text-sm text-muted-foreground">Credit card required for trial</p>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>

              {/* Notification Defaults */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="h-5 w-5 text-muted-foreground" />
                      <CardTitle>Notification Defaults</CardTitle>
                    </div>
                    <a href="#" className="text-sm text-primary hover:underline">Learn more</a>
                  </div>
                  <CardDescription>Default notification preferences for new tenants</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Session reminders</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex items-center gap-2">
                        <Switch defaultChecked />
                        <Label className="font-normal text-sm">24 hours before</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch defaultChecked />
                        <Label className="font-normal text-sm">2 hours before</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch />
                        <Label className="font-normal text-sm">30 min before</Label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Admin notifications</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2">
                        <Switch defaultChecked />
                        <Label className="font-normal text-sm">New registrations</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch defaultChecked />
                        <Label className="font-normal text-sm">Payment received</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch defaultChecked />
                        <Label className="font-normal text-sm">Session full</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch />
                        <Label className="font-normal text-sm">Daily summary</Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4 mt-6">
          {/* Email Service Integration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Email Service (SendGrid)</CardTitle>
                </div>
                <Badge variant={emailConfig?.apiKey ? "default" : "secondary"}>
                  {emailConfig?.apiKey ? "Configured" : "Not Configured"}
                </Badge>
              </div>
              <CardDescription>Configure email delivery service for notifications and communications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sendgrid-api-key">API Key</Label>
                    <div className="flex gap-2">
                      <Input
                        id="sendgrid-api-key"
                        type={showSendGridKey ? "text" : "password"}
                        placeholder="SG.xxxxxxxxxxxxxxxxxxxxx"
                        value={emailConfig?.apiKey || ''}
                        onChange={(e) => setEmailConfig({ ...emailConfig, apiKey: e.target.value })}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowSendGridKey(!showSendGridKey)}
                      >
                        {showSendGridKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sendgrid-sender">Default Sender Email</Label>
                    <Input
                      id="sendgrid-sender"
                      type="email"
                      placeholder="notifications@yourdomain.com"
                      value={emailConfig?.senderEmail || ''}
                      onChange={(e) => setEmailConfig({ ...emailConfig, senderEmail: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sendgrid-sender-name">Sender Name</Label>
                    <Input
                      id="sendgrid-sender-name"
                      placeholder="Futsal Culture"
                      value={emailConfig?.senderName || ''}
                      onChange={(e) => setEmailConfig({ ...emailConfig, senderName: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sendgrid-reply-to">Reply-To Email</Label>
                    <Input
                      id="sendgrid-reply-to"
                      type="email"
                      placeholder="support@yourdomain.com"
                      value={emailConfig?.replyTo || ''}
                      onChange={(e) => setEmailConfig({ ...emailConfig, replyTo: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Email Templates</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">Welcome Email</p>
                        <Switch 
                          checked={emailConfig?.templates?.welcome || false}
                          onCheckedChange={(checked) => setEmailConfig({ 
                            ...emailConfig, 
                            templates: { ...emailConfig?.templates, welcome: checked }
                          })}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">New user onboarding</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">Booking Confirmation</p>
                        <Switch 
                          checked={emailConfig?.templates?.booking || false}
                          onCheckedChange={(checked) => setEmailConfig({ 
                            ...emailConfig, 
                            templates: { ...emailConfig?.templates, booking: checked }
                          })}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Session confirmations</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">Reminders</p>
                        <Switch 
                          checked={emailConfig?.templates?.reminders || false}
                          onCheckedChange={(checked) => setEmailConfig({ 
                            ...emailConfig, 
                            templates: { ...emailConfig?.templates, reminders: checked }
                          })}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Session reminders</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-2">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => handleTestIntegration('email')}
                      disabled={!emailConfig?.apiKey || testingIntegration === 'email'}
                    >
                      {testingIntegration === 'email' ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Testing...</>
                      ) : (
                        <><TestTube className="h-4 w-4 mr-2" />Test Connection</>
                      )}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handleSendTestEmail()}
                      disabled={!emailConfig?.apiKey || sendingTestEmail}
                    >
                      {sendingTestEmail ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending...</>
                      ) : (
                        <><Mail className="h-4 w-4 mr-2" />Send Test Email</>
                      )}
                    </Button>
                  </div>
                  <Button 
                    onClick={() => handleSaveIntegration('email')}
                    disabled={savingIntegration === 'email'}
                  >
                    {savingIntegration === 'email' ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                    ) : (
                      <>Save Configuration</>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SMS Service Integration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>SMS Service (Twilio)</CardTitle>
                </div>
                <Badge variant={smsConfig?.accountSid ? "default" : "secondary"}>
                  {smsConfig?.accountSid ? "Configured" : "Not Configured"}
                </Badge>
              </div>
              <CardDescription>Configure SMS delivery for instant notifications and alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="twilio-account-sid">Account SID</Label>
                    <div className="flex gap-2">
                      <Input
                        id="twilio-account-sid"
                        type={showTwilioSid ? "text" : "password"}
                        placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        value={smsConfig?.accountSid || ''}
                        onChange={(e) => setSmsConfig({ ...smsConfig, accountSid: e.target.value })}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowTwilioSid(!showTwilioSid)}
                      >
                        {showTwilioSid ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="twilio-auth-token">Auth Token</Label>
                    <div className="flex gap-2">
                      <Input
                        id="twilio-auth-token"
                        type={showTwilioToken ? "text" : "password"}
                        placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        value={smsConfig?.authToken || ''}
                        onChange={(e) => setSmsConfig({ ...smsConfig, authToken: e.target.value })}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowTwilioToken(!showTwilioToken)}
                      >
                        {showTwilioToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="twilio-phone">From Phone Number</Label>
                    <Input
                      id="twilio-phone"
                      type="tel"
                      placeholder="+1234567890"
                      value={smsConfig?.phoneNumber || ''}
                      onChange={(e) => setSmsConfig({ ...smsConfig, phoneNumber: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="twilio-messaging-service">Messaging Service SID (Optional)</Label>
                    <Input
                      id="twilio-messaging-service"
                      placeholder="MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      value={smsConfig?.messagingServiceSid || ''}
                      onChange={(e) => setSmsConfig({ ...smsConfig, messagingServiceSid: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>SMS Notifications</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">Session Reminders</p>
                        <p className="text-xs text-muted-foreground">24hr and 2hr before session</p>
                      </div>
                      <Switch 
                        checked={smsConfig?.notifications?.reminders || false}
                        onCheckedChange={(checked) => setSmsConfig({ 
                          ...smsConfig, 
                          notifications: { ...smsConfig?.notifications, reminders: checked }
                        })}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">Booking Confirmations</p>
                        <p className="text-xs text-muted-foreground">Instant confirmation SMS</p>
                      </div>
                      <Switch 
                        checked={smsConfig?.notifications?.bookings || false}
                        onCheckedChange={(checked) => setSmsConfig({ 
                          ...smsConfig, 
                          notifications: { ...smsConfig?.notifications, bookings: checked }
                        })}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">Cancellations</p>
                        <p className="text-xs text-muted-foreground">Session cancellation alerts</p>
                      </div>
                      <Switch 
                        checked={smsConfig?.notifications?.cancellations || false}
                        onCheckedChange={(checked) => setSmsConfig({ 
                          ...smsConfig, 
                          notifications: { ...smsConfig?.notifications, cancellations: checked }
                        })}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">Waitlist Updates</p>
                        <p className="text-xs text-muted-foreground">Spot availability alerts</p>
                      </div>
                      <Switch 
                        checked={smsConfig?.notifications?.waitlist || false}
                        onCheckedChange={(checked) => setSmsConfig({ 
                          ...smsConfig, 
                          notifications: { ...smsConfig?.notifications, waitlist: checked }
                        })}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-2">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => handleTestIntegration('sms')}
                      disabled={!smsConfig?.accountSid || testingIntegration === 'sms'}
                    >
                      {testingIntegration === 'sms' ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Testing...</>
                      ) : (
                        <><TestTube className="h-4 w-4 mr-2" />Test Connection</>
                      )}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handleSendTestSMS()}
                      disabled={!smsConfig?.accountSid || sendingTestSMS}
                    >
                      {sendingTestSMS ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending...</>
                      ) : (
                        <><Smartphone className="h-4 w-4 mr-2" />Send Test SMS</>
                      )}
                    </Button>
                  </div>
                  <Button 
                    onClick={() => handleSaveIntegration('sms')}
                    disabled={savingIntegration === 'sms'}
                  >
                    {savingIntegration === 'sms' ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                    ) : (
                      <>Save Configuration</>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Integration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Payment Processing (Stripe)</CardTitle>
                </div>
                <Badge variant={paymentConfig?.secretKey ? "default" : "secondary"}>
                  {paymentConfig?.mode === 'live' ? 'Live' : paymentConfig?.secretKey ? 'Test Mode' : 'Not Configured'}
                </Badge>
              </div>
              <CardDescription>Payment gateway configuration and processing settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <p className="text-sm font-medium">Environment Mode</p>
                  </div>
                  <Select
                    value={paymentConfig?.mode || 'test'}
                    onValueChange={(value: 'test' | 'live') => setPaymentConfig({ ...paymentConfig, mode: value })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="test">Test Mode</SelectItem>
                      <SelectItem value="live">Live Mode</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stripe-secret">Secret Key</Label>
                    <div className="flex gap-2">
                      <Input
                        id="stripe-secret"
                        type={showStripeSecret ? "text" : "password"}
                        placeholder={paymentConfig?.mode === 'live' ? "sk_live_..." : "sk_test_..."}
                        value={paymentConfig?.secretKey || ''}
                        onChange={(e) => setPaymentConfig({ ...paymentConfig, secretKey: e.target.value })}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowStripeSecret(!showStripeSecret)}
                      >
                        {showStripeSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="stripe-publishable">Publishable Key</Label>
                    <Input
                      id="stripe-publishable"
                      placeholder={paymentConfig?.mode === 'live' ? "pk_live_..." : "pk_test_..."}
                      value={paymentConfig?.publishableKey || ''}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, publishableKey: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stripe-webhook">Webhook Endpoint Secret</Label>
                    <div className="flex gap-2">
                      <Input
                        id="stripe-webhook"
                        type={showStripeWebhook ? "text" : "password"}
                        placeholder="whsec_..."
                        value={paymentConfig?.webhookSecret || ''}
                        onChange={(e) => setPaymentConfig({ ...paymentConfig, webhookSecret: e.target.value })}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowStripeWebhook(!showStripeWebhook)}
                      >
                        {showStripeWebhook ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Webhook URL</Label>
                    <div className="flex gap-2">
                      <Input
                        value="https://your-domain.com/api/webhooks/stripe"
                        disabled
                        className="bg-muted"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          navigator.clipboard.writeText('https://your-domain.com/api/webhooks/stripe');
                          toast({ title: 'Webhook URL copied to clipboard' });
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Payment Methods</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        <p className="text-sm font-medium">Card Payments</p>
                      </div>
                      <Switch 
                        checked={paymentConfig?.methods?.card || false}
                        onCheckedChange={(checked) => setPaymentConfig({ 
                          ...paymentConfig, 
                          methods: { ...paymentConfig?.methods, card: checked }
                        })}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        <p className="text-sm font-medium">Apple Pay</p>
                      </div>
                      <Switch 
                        checked={paymentConfig?.methods?.applePay || false}
                        onCheckedChange={(checked) => setPaymentConfig({ 
                          ...paymentConfig, 
                          methods: { ...paymentConfig?.methods, applePay: checked }
                        })}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        <p className="text-sm font-medium">Bank Transfer</p>
                      </div>
                      <Switch 
                        checked={paymentConfig?.methods?.bankTransfer || false}
                        onCheckedChange={(checked) => setPaymentConfig({ 
                          ...paymentConfig, 
                          methods: { ...paymentConfig?.methods, bankTransfer: checked }
                        })}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Additional Settings</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">Auto Capture Payments</p>
                        <p className="text-xs text-muted-foreground">Capture immediately after authorization</p>
                      </div>
                      <Switch 
                        checked={paymentConfig?.settings?.autoCapture || false}
                        onCheckedChange={(checked) => setPaymentConfig({ 
                          ...paymentConfig, 
                          settings: { ...paymentConfig?.settings, autoCapture: checked }
                        })}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">Send Receipt Emails</p>
                        <p className="text-xs text-muted-foreground">Automatic receipts via Stripe</p>
                      </div>
                      <Switch 
                        checked={paymentConfig?.settings?.sendReceipts || false}
                        onCheckedChange={(checked) => setPaymentConfig({ 
                          ...paymentConfig, 
                          settings: { ...paymentConfig?.settings, sendReceipts: checked }
                        })}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-2">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => handleTestIntegration('payment')}
                      disabled={!paymentConfig?.secretKey || testingIntegration === 'payment'}
                    >
                      {testingIntegration === 'payment' ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Testing...</>
                      ) : (
                        <><TestTube className="h-4 w-4 mr-2" />Test Connection</>
                      )}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => window.open('https://dashboard.stripe.com', '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />Stripe Dashboard
                    </Button>
                  </div>
                  <Button 
                    onClick={() => handleSaveIntegration('payment')}
                    disabled={savingIntegration === 'payment'}
                  >
                    {savingIntegration === 'payment' ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                    ) : (
                      <>Save Configuration</>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Authentication Integration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Authentication (Replit OAuth)</CardTitle>
                </div>
                <Badge variant="default">Active</Badge>
              </div>
              <CardDescription>OAuth and authentication service configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>OAuth Provider</Label>
                  <p className="text-sm text-muted-foreground">Replit OpenID Connect</p>
                </div>
                <div className="space-y-2">
                  <Label>Session Duration</Label>
                  <p className="text-sm text-muted-foreground">7 days</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="user-management" className="space-y-4 mt-6">
          {/* Super Admin Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Super Admin Users</CardTitle>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setAddSuperAdminOpen(true)}
                  data-testid="button-add-super-admin"
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Add Super Admin
                </Button>
              </div>
              <CardDescription>Manage users with platform-wide administrative access</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white">AF</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">Ajoseph Finch</p>
                      <p className="text-sm text-muted-foreground">ajosephfinch@example.com</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">Primary</Badge>
                    <Badge variant="secondary">MFA Enabled</Badge>
                  </div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>• Primary Super Admin account (cannot be modified)</p>
                <p>• Full platform access and management permissions</p>
                <p>• Multi-factor authentication required</p>
              </div>
            </CardContent>
          </Card>

          {/* Role Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Role Permissions</CardTitle>
              </div>
              <CardDescription>Configure role-based access control and permissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-yellow-600" />
                    <p className="font-medium">Super Admin</p>
                  </div>
                  <p className="text-sm text-muted-foreground">Full platform access</p>
                  <p className="text-xs text-muted-foreground mt-1">• All tenant management</p>
                  <p className="text-xs text-muted-foreground">• Platform settings</p>
                  <p className="text-xs text-muted-foreground">• User management</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <SettingsIcon className="h-4 w-4 text-blue-600" />
                    <p className="font-medium">Tenant Admin</p>
                  </div>
                  <p className="text-sm text-muted-foreground">Tenant-level management</p>
                  <p className="text-xs text-muted-foreground mt-1">• Session management</p>
                  <p className="text-xs text-muted-foreground">• Player administration</p>
                  <p className="text-xs text-muted-foreground">• Local settings</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-green-600" />
                    <p className="font-medium">Parent User</p>
                  </div>
                  <p className="text-sm text-muted-foreground">Session booking access</p>
                  <p className="text-xs text-muted-foreground mt-1">• Book sessions</p>
                  <p className="text-xs text-muted-foreground">• Manage players</p>
                  <p className="text-xs text-muted-foreground">• View history</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Access Control */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TestTube className="h-4 w-4 text-muted-foreground" />
                <CardTitle>Access Control</CardTitle>
              </div>
              <CardDescription>Platform-wide access control settings and restrictions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>IP Restrictions</Label>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Limit admin access by IP</p>
                    <Switch 
                      checked={localPolicies?.security?.ipRestrictions?.enabled || false}
                      onCheckedChange={(checked) => handlePolicyChange({
                        security: {
                          ...localPolicies?.security,
                          ipRestrictions: {
                            ...localPolicies?.security?.ipRestrictions,
                            enabled: checked
                          }
                        }
                      })}
                      data-testid="switch-ip-restrictions"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>API Rate Limiting</Label>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Enforce API request limits</p>
                    <Switch 
                      checked={localPolicies?.security?.apiRateLimit?.enabled || false}
                      onCheckedChange={(checked) => handlePolicyChange({
                        security: {
                          ...localPolicies?.security,
                          apiRateLimit: {
                            ...localPolicies?.security?.apiRateLimit,
                            enabled: checked
                          }
                        }
                      })}
                      data-testid="switch-api-rate-limiting"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Session Monitoring</Label>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Monitor concurrent sessions</p>
                  <Switch 
                    checked={localPolicies?.security?.sessionMonitoring?.enabled || false}
                    onCheckedChange={(checked) => handlePolicyChange({
                      security: {
                        ...localPolicies?.security,
                        sessionMonitoring: {
                          ...localPolicies?.security?.sessionMonitoring,
                          enabled: checked
                        }
                      }
                    })}
                    data-testid="switch-session-monitoring"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Activity */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <CardTitle>User Activity</CardTitle>
              </div>
              <CardDescription>Monitor and manage user activity across the platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 border rounded">
                  <p className="text-2xl font-bold text-green-600">127</p>
                  <p className="text-sm text-muted-foreground">Active Sessions</p>
                </div>
                <div className="text-center p-3 border rounded">
                  <p className="text-2xl font-bold text-blue-600">2,543</p>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                </div>
                <div className="text-center p-3 border rounded">
                  <p className="text-2xl font-bold text-purple-600">45</p>
                  <p className="text-sm text-muted-foreground">Admin Users</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Recent Activity</Label>
                <div className="space-y-1 text-sm">
                  <p className="text-muted-foreground">• New tenant registration: Elite Footwork Academy</p>
                  <p className="text-muted-foreground">• Admin login: Sarah Johnson (Futsal Culture)</p>
                  <p className="text-muted-foreground">• Bulk session creation: 25 sessions added</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Policy Change</AlertDialogTitle>
              <AlertDialogDescription>
                You are about to: <strong>{confirmDialog.action}</strong>
                <br /><br />
                This action will have immediate effect on the platform. Are you sure you want to continue?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmDialog(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                confirmDialog.callback();
                setConfirmDialog(null);
              }}>
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      
      {/* Add Super Admin Dialog */}
      <Dialog open={addSuperAdminOpen} onOpenChange={setAddSuperAdminOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Super Admin User</DialogTitle>
            <DialogDescription>
              Create a new Super Admin account with full platform access and management permissions.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                placeholder="Enter username"
                value={newSuperAdminData.username}
                onChange={(e) => setNewSuperAdminData({ ...newSuperAdminData, username: e.target.value })}
                data-testid="input-username"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={newSuperAdminData.email}
                onChange={(e) => setNewSuperAdminData({ ...newSuperAdminData, email: e.target.value })}
                data-testid="input-email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="Enter full name"
                value={newSuperAdminData.fullName}
                onChange={(e) => setNewSuperAdminData({ ...newSuperAdminData, fullName: e.target.value })}
                data-testid="input-full-name"
              />
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">Require Multi-Factor Authentication</p>
                <p className="text-xs text-muted-foreground">Enforce MFA for enhanced security</p>
              </div>
              <Switch 
                checked={newSuperAdminData.requireMfa}
                onCheckedChange={(checked) => setNewSuperAdminData({ ...newSuperAdminData, requireMfa: checked })}
                data-testid="switch-require-mfa"
              />
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">Security Notice</p>
                  <p className="text-yellow-700 dark:text-yellow-300">Super Admins have full platform access. Only add trusted users.</p>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setAddSuperAdminOpen(false)}
              disabled={addingSuperAdmin}
              data-testid="button-cancel-add-admin"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddSuperAdmin}
              disabled={addingSuperAdmin || !newSuperAdminData.username || !newSuperAdminData.email}
              data-testid="button-confirm-add-admin"
            >
              {addingSuperAdmin ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Add Super Admin
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}