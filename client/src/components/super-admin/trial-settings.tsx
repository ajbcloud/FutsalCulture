import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  Save, 
  Settings2, 
  Clock, 
  Shield, 
  Database, 
  Users, 
  Bell,
  Archive,
  CreditCard,
  UserX,
  Calendar,
  Mail,
  MessageSquare,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Comprehensive types for trial settings
interface TrialSettings {
  enabled: boolean;
  durationDays: number;
  defaultTrialPlan: 'free' | 'core' | 'growth' | 'elite';
  autoConvertToFree: boolean;
  requirePaymentMethod: boolean;
  allowPlanChangeDuringTrial: boolean;
  maxExtensions: number;
  extensionDurationDays: number;
  gracePeriodDays: number;
  dataRetentionAfterTrialDays: number;
  autoCleanupExpiredTrials: boolean;
  preventMultipleTrials: boolean;
  riskAssessmentEnabled: boolean;
  paymentMethodGracePeriodHours: number;
  notificationSchedule: {
    trialStart: number[];
    trialReminders: number[];
    trialExpiry: number[];
    gracePeriod: number[];
  };
  planTransitionRules: {
    preserveDataOnDowngrade: boolean;
    archiveAdvancedFeatureData: boolean;
    playerLimitEnforcement: 'strict' | 'soft' | 'grace';
    featureAccessGracePeriod: number;
  };
  abusePreventionRules: {
    maxTrialsPerEmail: number;
    maxTrialsPerIP: number;
    maxTrialsPerPaymentMethod: number;
    cooldownBetweenTrialsDays: number;
    requirePhoneVerification: boolean;
    requireCreditCardVerification: boolean;
  };
}

export function TrialSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<TrialSettings | null>(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch trial settings
  const { data: trialSettings, isLoading, error } = useQuery({
    queryKey: ['/api/super-admin/settings/trial-settings'],
    queryFn: async () => {
      const response = await fetch('/api/super-admin/settings/trial-settings', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch trial settings');
      }
      return response.json() as TrialSettings;
    },
    retry: false,
  });

  // Update settings mutation
  const updateSettings = useMutation({
    mutationFn: async (newSettings: TrialSettings) => {
      const response = await fetch('/api/super-admin/settings/trial-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update trial settings');
      }
      
      return response.json();
    },
    onSuccess: (updatedSettings) => {
      queryClient.setQueryData(['/api/super-admin/settings/trial-settings'], updatedSettings);
      setSettings(updatedSettings);
      setHasChanges(false);
      toast({
        title: "Trial Settings Updated",
        description: "Comprehensive trial settings have been updated successfully with all business logic rules.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update trial settings. Please check your configuration.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (trialSettings) {
      setSettings(trialSettings);
    }
  }, [trialSettings]);

  const handleSettingChange = (path: string, value: any) => {
    if (!settings) return;

    const keys = path.split('.');
    const newSettings = { ...settings };
    let current: any = newSettings;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current[keys[i]] = { ...current[keys[i]] };
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setSettings(newSettings);
    setHasChanges(true);
  };

  const handleArrayChange = (path: string, index: number, value: number) => {
    if (!settings) return;
    
    const keys = path.split('.');
    const newSettings = { ...settings };
    let current: any = newSettings;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current[keys[i]] = { ...current[keys[i]] };
      current = current[keys[i]];
    }
    
    const array = [...(current[keys[keys.length - 1]] || [])];
    array[index] = value;
    current[keys[keys.length - 1]] = array;
    
    setSettings(newSettings);
    setHasChanges(true);
  };

  const addArrayItem = (path: string) => {
    if (!settings) return;
    
    const keys = path.split('.');
    const newSettings = { ...settings };
    let current: any = newSettings;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current[keys[i]] = { ...current[keys[i]] };
      current = current[keys[i]];
    }
    
    const array = [...(current[keys[keys.length - 1]] || [])];
    array.push(0);
    current[keys[keys.length - 1]] = array;
    
    setSettings(newSettings);
    setHasChanges(true);
  };

  const removeArrayItem = (path: string, index: number) => {
    if (!settings) return;
    
    const keys = path.split('.');
    const newSettings = { ...settings };
    let current: any = newSettings;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current[keys[i]] = { ...current[keys[i]] };
      current = current[keys[i]];
    }
    
    const array = [...(current[keys[keys.length - 1]] || [])];
    array.splice(index, 1);
    current[keys[keys.length - 1]] = array;
    
    setSettings(newSettings);
    setHasChanges(true);
  };

  const handleSave = () => {
    if (settings) {
      updateSettings.mutate(settings);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
            <span className="ml-2">Loading trial settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !settings) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load trial settings. Please refresh the page and try again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Comprehensive Trial Settings</h2>
          <p className="text-muted-foreground">
            Configure advanced trial management with full business logic, data retention, and abuse prevention
          </p>
        </div>
        {hasChanges && (
          <Button 
            onClick={handleSave} 
            disabled={updateSettings.isPending}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {updateSettings.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Basic
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data & Plans
          </TabsTrigger>
          <TabsTrigger value="abuse" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Abuse Prevention
          </TabsTrigger>
          <TabsTrigger value="grace" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Grace Periods
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        {/* Basic Settings Tab */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                Basic Trial Configuration
              </CardTitle>
              <CardDescription>
                Core trial settings that control the fundamental behavior of trial periods
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Trial System</Label>
                  <div className="text-sm text-muted-foreground">
                    Master switch for the entire trial system
                  </div>
                </div>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(value) => handleSettingChange('enabled', value)}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="durationDays">Trial Duration (Days)</Label>
                  <Input
                    id="durationDays"
                    type="number"
                    min="1"
                    max="365"
                    value={settings.durationDays}
                    onChange={(e) => handleSettingChange('durationDays', parseInt(e.target.value) || 1)}
                  />
                  <div className="text-xs text-muted-foreground">
                    Standard trial period length (1-365 days)
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultTrialPlan">Default Trial Plan</Label>
                  <Select 
                    value={settings.defaultTrialPlan} 
                    onValueChange={(value) => handleSettingChange('defaultTrialPlan', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="core">Core Plan</SelectItem>
                      <SelectItem value="growth">Growth Plan</SelectItem>
                      <SelectItem value="elite">Elite Plan</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-xs text-muted-foreground">
                    Plan level assigned during trial period
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-Convert to Free</Label>
                    <div className="text-xs text-muted-foreground">
                      Automatically downgrade expired trials
                    </div>
                  </div>
                  <Switch
                    checked={settings.autoConvertToFree}
                    onCheckedChange={(value) => handleSettingChange('autoConvertToFree', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Payment Method</Label>
                    <div className="text-xs text-muted-foreground">
                      Payment method needed to start trial
                    </div>
                  </div>
                  <Switch
                    checked={settings.requirePaymentMethod}
                    onCheckedChange={(value) => handleSettingChange('requirePaymentMethod', value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Plan Changes During Trial</Label>
                  <div className="text-xs text-muted-foreground">
                    Users can upgrade/downgrade plans during trial period
                  </div>
                </div>
                <Switch
                  checked={settings.allowPlanChangeDuringTrial}
                  onCheckedChange={(value) => handleSettingChange('allowPlanChangeDuringTrial', value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxExtensions">Maximum Extensions</Label>
                  <Input
                    id="maxExtensions"
                    type="number"
                    min="0"
                    max="10"
                    value={settings.maxExtensions}
                    onChange={(e) => handleSettingChange('maxExtensions', parseInt(e.target.value) || 0)}
                  />
                  <div className="text-xs text-muted-foreground">
                    How many times a trial can be extended
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="extensionDurationDays">Extension Duration (Days)</Label>
                  <Input
                    id="extensionDurationDays"
                    type="number"
                    min="1"
                    max="30"
                    value={settings.extensionDurationDays}
                    onChange={(e) => handleSettingChange('extensionDurationDays', parseInt(e.target.value) || 1)}
                  />
                  <div className="text-xs text-muted-foreground">
                    Length of each trial extension
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Schedule
              </CardTitle>
              <CardDescription>
                Configure automated email and SMS notifications for trial lifecycle events
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Trial Start Notifications */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Trial Start Notifications (Days After Start)
                </Label>
                <div className="flex flex-wrap gap-2">
                  {settings.notificationSchedule.trialStart.map((day, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="365"
                        value={day}
                        onChange={(e) => handleArrayChange('notificationSchedule.trialStart', index, parseInt(e.target.value) || 0)}
                        className="w-20"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeArrayItem('notificationSchedule.trialStart', index)}
                      >
                        <UserX className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem('notificationSchedule.trialStart')}
                  >
                    Add Day
                  </Button>
                </div>
              </div>

              {/* Trial Reminders */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Trial Reminder Notifications (Days Before Expiry)
                </Label>
                <div className="flex flex-wrap gap-2">
                  {settings.notificationSchedule.trialReminders.map((day, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="365"
                        value={day}
                        onChange={(e) => handleArrayChange('notificationSchedule.trialReminders', index, parseInt(e.target.value) || 0)}
                        className="w-20"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeArrayItem('notificationSchedule.trialReminders', index)}
                      >
                        <UserX className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem('notificationSchedule.trialReminders')}
                  >
                    Add Day
                  </Button>
                </div>
              </div>

              {/* Trial Expiry Notifications */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Trial Expiry Notifications (Days After Expiry)
                </Label>
                <div className="flex flex-wrap gap-2">
                  {settings.notificationSchedule.trialExpiry.map((day, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="30"
                        value={day}
                        onChange={(e) => handleArrayChange('notificationSchedule.trialExpiry', index, parseInt(e.target.value) || 0)}
                        className="w-20"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeArrayItem('notificationSchedule.trialExpiry', index)}
                      >
                        <UserX className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem('notificationSchedule.trialExpiry')}
                  >
                    Add Day
                  </Button>
                </div>
              </div>

              {/* Grace Period Notifications */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Grace Period Notifications (Days Into Grace Period)
                </Label>
                <div className="flex flex-wrap gap-2">
                  {settings.notificationSchedule.gracePeriod.map((day, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="30"
                        value={day}
                        onChange={(e) => handleArrayChange('notificationSchedule.gracePeriod', index, parseInt(e.target.value) || 0)}
                        className="w-20"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeArrayItem('notificationSchedule.gracePeriod', index)}
                      >
                        <UserX className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem('notificationSchedule.gracePeriod')}
                  >
                    Add Day
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data & Plans Tab */}
        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Retention & Plan Transitions
              </CardTitle>
              <CardDescription>
                Configure data retention policies and plan transition behavior for complex scenarios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataRetentionAfterTrialDays">Data Retention After Trial (Days)</Label>
                  <Input
                    id="dataRetentionAfterTrialDays"
                    type="number"
                    min="1"
                    max="365"
                    value={settings.dataRetentionAfterTrialDays}
                    onChange={(e) => handleSettingChange('dataRetentionAfterTrialDays', parseInt(e.target.value) || 1)}
                  />
                  <div className="text-xs text-muted-foreground">
                    How long to keep data after trial expiry
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-Cleanup Expired Trials</Label>
                    <div className="text-xs text-muted-foreground">
                      Automatically remove expired trial data
                    </div>
                  </div>
                  <Switch
                    checked={settings.autoCleanupExpiredTrials}
                    onCheckedChange={(value) => handleSettingChange('autoCleanupExpiredTrials', value)}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-lg font-semibold flex items-center gap-2">
                  <Archive className="h-4 w-4" />
                  Plan Transition Rules
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Preserve Data on Downgrade</Label>
                      <div className="text-xs text-muted-foreground">
                        Keep data when moving to lower plan
                      </div>
                    </div>
                    <Switch
                      checked={settings.planTransitionRules.preserveDataOnDowngrade}
                      onCheckedChange={(value) => handleSettingChange('planTransitionRules.preserveDataOnDowngrade', value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Archive Advanced Feature Data</Label>
                      <div className="text-xs text-muted-foreground">
                        Archive data from lost premium features
                      </div>
                    </div>
                    <Switch
                      checked={settings.planTransitionRules.archiveAdvancedFeatureData}
                      onCheckedChange={(value) => handleSettingChange('planTransitionRules.archiveAdvancedFeatureData', value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="playerLimitEnforcement">Player Limit Enforcement</Label>
                    <Select 
                      value={settings.planTransitionRules.playerLimitEnforcement} 
                      onValueChange={(value) => handleSettingChange('planTransitionRules.playerLimitEnforcement', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="strict">Strict - Immediately enforce</SelectItem>
                        <SelectItem value="soft">Soft - Allow over limit</SelectItem>
                        <SelectItem value="grace">Grace - Time-limited access</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="text-xs text-muted-foreground">
                      How to handle exceeding new plan limits
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="featureAccessGracePeriod">Feature Access Grace Period (Days)</Label>
                    <Input
                      id="featureAccessGracePeriod"
                      type="number"
                      min="0"
                      max="30"
                      value={settings.planTransitionRules.featureAccessGracePeriod}
                      onChange={(e) => handleSettingChange('planTransitionRules.featureAccessGracePeriod', parseInt(e.target.value) || 0)}
                    />
                    <div className="text-xs text-muted-foreground">
                      Days to maintain feature access after downgrade
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Abuse Prevention Tab */}
        <TabsContent value="abuse" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Abuse Prevention & Security
              </CardTitle>
              <CardDescription>
                Comprehensive rules to prevent trial abuse and ensure system security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Prevent Multiple Trials</Label>
                    <div className="text-xs text-muted-foreground">
                      Block multiple trial attempts per user
                    </div>
                  </div>
                  <Switch
                    checked={settings.preventMultipleTrials}
                    onCheckedChange={(value) => handleSettingChange('preventMultipleTrials', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Risk Assessment Enabled</Label>
                    <div className="text-xs text-muted-foreground">
                      Automatically assess signup risk
                    </div>
                  </div>
                  <Switch
                    checked={settings.riskAssessmentEnabled}
                    onCheckedChange={(value) => handleSettingChange('riskAssessmentEnabled', value)}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Trial Limits</h4>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxTrialsPerEmail">Max Trials per Email</Label>
                    <Input
                      id="maxTrialsPerEmail"
                      type="number"
                      min="1"
                      max="10"
                      value={settings.abusePreventionRules.maxTrialsPerEmail}
                      onChange={(e) => handleSettingChange('abusePreventionRules.maxTrialsPerEmail', parseInt(e.target.value) || 1)}
                    />
                    <div className="text-xs text-muted-foreground">
                      Limit per email address
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxTrialsPerIP">Max Trials per IP</Label>
                    <Input
                      id="maxTrialsPerIP"
                      type="number"
                      min="1"
                      max="50"
                      value={settings.abusePreventionRules.maxTrialsPerIP}
                      onChange={(e) => handleSettingChange('abusePreventionRules.maxTrialsPerIP', parseInt(e.target.value) || 1)}
                    />
                    <div className="text-xs text-muted-foreground">
                      Limit per IP address
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxTrialsPerPaymentMethod">Max Trials per Payment Method</Label>
                    <Input
                      id="maxTrialsPerPaymentMethod"
                      type="number"
                      min="1"
                      max="5"
                      value={settings.abusePreventionRules.maxTrialsPerPaymentMethod}
                      onChange={(e) => handleSettingChange('abusePreventionRules.maxTrialsPerPaymentMethod', parseInt(e.target.value) || 1)}
                    />
                    <div className="text-xs text-muted-foreground">
                      Limit per payment method
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cooldownBetweenTrialsDays">Cooldown Between Trials (Days)</Label>
                  <Input
                    id="cooldownBetweenTrialsDays"
                    type="number"
                    min="0"
                    max="365"
                    value={settings.abusePreventionRules.cooldownBetweenTrialsDays}
                    onChange={(e) => handleSettingChange('abusePreventionRules.cooldownBetweenTrialsDays', parseInt(e.target.value) || 0)}
                    className="w-full max-w-xs"
                  />
                  <div className="text-xs text-muted-foreground">
                    Required wait time between trial attempts
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Verification Requirements</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Require Phone Verification</Label>
                        <div className="text-xs text-muted-foreground">
                          Verify phone number before trial
                        </div>
                      </div>
                      <Switch
                        checked={settings.abusePreventionRules.requirePhoneVerification}
                        onCheckedChange={(value) => handleSettingChange('abusePreventionRules.requirePhoneVerification', value)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Require Credit Card Verification</Label>
                        <div className="text-xs text-muted-foreground">
                          Verify valid payment method
                        </div>
                      </div>
                      <Switch
                        checked={settings.abusePreventionRules.requireCreditCardVerification}
                        onCheckedChange={(value) => handleSettingChange('abusePreventionRules.requireCreditCardVerification', value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Grace Periods Tab */}
        <TabsContent value="grace" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Grace Periods & Payment Windows
              </CardTitle>
              <CardDescription>
                Configure grace periods for various scenarios to improve user experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gracePeriodDays">Standard Grace Period (Days)</Label>
                  <Input
                    id="gracePeriodDays"
                    type="number"
                    min="0"
                    max="30"
                    value={settings.gracePeriodDays}
                    onChange={(e) => handleSettingChange('gracePeriodDays', parseInt(e.target.value) || 0)}
                  />
                  <div className="text-xs text-muted-foreground">
                    General grace period after trial expiry
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentMethodGracePeriodHours">Payment Method Grace Period (Hours)</Label>
                  <Input
                    id="paymentMethodGracePeriodHours"
                    type="number"
                    min="1"
                    max="168"
                    value={settings.paymentMethodGracePeriodHours}
                    onChange={(e) => handleSettingChange('paymentMethodGracePeriodHours', parseInt(e.target.value) || 1)}
                  />
                  <div className="text-xs text-muted-foreground">
                    Time to provide payment method after trial start
                  </div>
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Grace periods provide users with additional time to make decisions or provide required information, 
                  improving conversion rates while maintaining security. Different grace periods handle various scenarios:
                  <ul className="mt-2 ml-4 list-disc space-y-1">
                    <li><strong>Standard Grace Period:</strong> Applied when trials expire naturally</li>
                    <li><strong>Payment Method Grace Period:</strong> For users to add payment details when required</li>
                    <li><strong>Feature Access Grace Period:</strong> Maintains feature access during plan transitions</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="mt-6 p-4 border border-orange-200 bg-orange-50 rounded-lg">
                <h4 className="font-semibold text-orange-800 mb-2">Grace Period Scenarios</h4>
                <div className="space-y-2 text-sm text-orange-700">
                  <div className="flex justify-between">
                    <span>Trial Expiry → Grace Period:</span>
                    <Badge variant="outline">{settings.gracePeriodDays} days</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Required → Payment Grace:</span>
                    <Badge variant="outline">{settings.paymentMethodGracePeriodHours} hours</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Plan Downgrade → Feature Grace:</span>
                    <Badge variant="outline">{settings.planTransitionRules.featureAccessGracePeriod} days</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Archive className="h-5 w-5" />
                Advanced Configuration
              </CardTitle>
              <CardDescription>
                Advanced settings for complex business scenarios and edge cases
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Advanced Settings Warning:</strong> These settings affect complex business logic scenarios. 
                  Changes may impact data retention, billing transitions, and user experience. 
                  Test thoroughly in a staging environment before applying to production.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Business Logic Summary</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                    <h5 className="font-semibold text-blue-800 mb-2">Trial Lifecycle</h5>
                    <div className="space-y-1 text-sm text-blue-700">
                      <div>• Duration: {settings.durationDays} days</div>
                      <div>• Extensions: {settings.maxExtensions} x {settings.extensionDurationDays} days</div>
                      <div>• Plan: {settings.defaultTrialPlan}</div>
                      <div>• Auto-convert: {settings.autoConvertToFree ? 'Yes' : 'No'}</div>
                    </div>
                  </div>

                  <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                    <h5 className="font-semibold text-green-800 mb-2">Data Protection</h5>
                    <div className="space-y-1 text-sm text-green-700">
                      <div>• Retention: {settings.dataRetentionAfterTrialDays} days</div>
                      <div>• Preserve on downgrade: {settings.planTransitionRules.preserveDataOnDowngrade ? 'Yes' : 'No'}</div>
                      <div>• Archive advanced data: {settings.planTransitionRules.archiveAdvancedFeatureData ? 'Yes' : 'No'}</div>
                      <div>• Auto-cleanup: {settings.autoCleanupExpiredTrials ? 'Yes' : 'No'}</div>
                    </div>
                  </div>

                  <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                    <h5 className="font-semibold text-red-800 mb-2">Security Measures</h5>
                    <div className="space-y-1 text-sm text-red-700">
                      <div>• Multiple trials: {settings.preventMultipleTrials ? 'Blocked' : 'Allowed'}</div>
                      <div>• Email limit: {settings.abusePreventionRules.maxTrialsPerEmail}</div>
                      <div>• IP limit: {settings.abusePreventionRules.maxTrialsPerIP}</div>
                      <div>• Cooldown: {settings.abusePreventionRules.cooldownBetweenTrialsDays} days</div>
                    </div>
                  </div>

                  <div className="p-4 border border-purple-200 bg-purple-50 rounded-lg">
                    <h5 className="font-semibold text-purple-800 mb-2">Grace Periods</h5>
                    <div className="space-y-1 text-sm text-purple-700">
                      <div>• Standard: {settings.gracePeriodDays} days</div>
                      <div>• Payment: {settings.paymentMethodGracePeriodHours} hours</div>
                      <div>• Feature access: {settings.planTransitionRules.featureAccessGracePeriod} days</div>
                      <div>• Payment required: {settings.requirePaymentMethod ? 'Yes' : 'No'}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Notification Summary</h4>
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Trial Start</Label>
                    <div className="flex flex-wrap gap-1">
                      {settings.notificationSchedule.trialStart.map((day, index) => (
                        <Badge key={index} variant="outline">+{day}d</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Reminders</Label>
                    <div className="flex flex-wrap gap-1">
                      {settings.notificationSchedule.trialReminders.map((day, index) => (
                        <Badge key={index} variant="outline">-{day}d</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Expiry</Label>
                    <div className="flex flex-wrap gap-1">
                      {settings.notificationSchedule.trialExpiry.map((day, index) => (
                        <Badge key={index} variant="outline">+{day}d</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Grace Period</Label>
                    <div className="flex flex-wrap gap-1">
                      {settings.notificationSchedule.gracePeriod.map((day, index) => (
                        <Badge key={index} variant="outline">+{day}d</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {hasChanges && (
        <div className="flex items-center justify-end gap-4 p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            You have unsaved changes
          </div>
          <Button onClick={handleSave} disabled={updateSettings.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updateSettings.isPending ? 'Saving...' : 'Save All Changes'}
          </Button>
        </div>
      )}
    </div>
  );
}