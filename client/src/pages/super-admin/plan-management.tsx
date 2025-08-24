import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Save, 
  Settings, 
  DollarSign, 
  Users, 
  Check, 
  X,
  Info,
  Crown,
  Zap,
  TrendingUp,
  Shield,
  Database,
  Mail,
  MessageSquare,
  Calendar,
  FileText,
  CreditCard,
  BarChart3,
  Package,
  Globe,
  Key,
  HelpCircle,
  Upload,
  Download,
  Code,
  UserCheck,
  Sparkles,
  Copy,
  RefreshCw,
  History,
  Loader2
} from 'lucide-react';

// Category icons
const categoryIcons: Record<string, any> = {
  core: Package,
  communication: Mail,
  payments_billing: CreditCard,
  analytics: BarChart3,
  integrations: Globe,
  developer: Code,
  support: HelpCircle,
  limits: Database
};

interface Feature {
  key: string;
  name: string;
  category: string;
  type: 'boolean' | 'enum' | 'limit';
  description?: string;
  optionsJson?: any;
  displayOrder: number;
  enabled?: boolean | null;
  variant?: string | null;
  limitValue?: number | null;
  value?: any;
  updatedAt?: string;
}

interface TenantOverride {
  tenantId: string;
  tenantName: string;
  featureKey: string;
  enabled?: boolean;
  variant?: string;
  limitValue?: number;
  reason?: string;
  expiresAt?: string;
}

interface Plan {
  code: string;
  name: string;
  priceCents: number;
  limits: any;
}

interface PlanComparison {
  plans: Plan[];
  comparison: Record<string, {
    name: string;
    category: string;
    type: string;
    plans: Record<string, {
      enabled?: boolean | null;
      variant?: string | null;
      limitValue?: number | null;
    }>;
  }>;
}

export default function PlanManagement() {
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState('core');
  const [isDirty, setIsDirty] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Record<string, any>>({});
  const [lastSaved, setLastSaved] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('plan-features');
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [showAuditDialog, setShowAuditDialog] = useState(false);
  const [editingFeature, setEditingFeature] = useState<{plan: string; feature: string} | null>(null);
  const [newOverride, setNewOverride] = useState({
    featureKey: '',
    enabled: true,
    variant: '',
    limitValue: '',
    reason: '',
    expiresAt: ''
  });

  // Fetch plan comparison data
  const { data: comparisonData, isLoading: loadingComparison, refetch: refetchComparison } = useQuery<PlanComparison>({
    queryKey: ['/api/super-admin/plans/comparison'],
    staleTime: 5 * 60 * 1000
  });

  // Fetch tenants for override management
  const { data: tenants = [] } = useQuery({
    queryKey: ['/api/super-admin/tenants'],
    enabled: activeTab === 'tenant-overrides'
  });

  // Fetch tenant overrides
  const { data: tenantOverrides = [], refetch: refetchOverrides } = useQuery({
    queryKey: ['/api/super-admin/tenant-overrides', selectedTenant],
    queryFn: async () => {
      const response = await fetch(`/api/super-admin/tenant-overrides${selectedTenant ? `?tenantId=${selectedTenant}` : ''}`, {
        credentials: 'include'
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: activeTab === 'tenant-overrides'
  });

  // Fetch features for selected plan
  const { data: planData, isLoading: loadingPlan, refetch: refetchPlan } = useQuery({
    queryKey: ['/api/super-admin/plans', selectedPlan, 'features'],
    queryFn: async () => {
      const response = await fetch(`/api/super-admin/plans/${selectedPlan}/features`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch plan features');
      return response.json();
    },
    enabled: !!selectedPlan,
    staleTime: 30 * 1000
  });

  // Update single feature mutation (autosave)
  const updateFeatureMutation = useMutation({
    mutationFn: ({ planCode, featureKey, value }: any) => 
      apiRequest(`/api/super-admin/plans/${planCode}/features/${featureKey}`, 'PATCH', value),
    onSuccess: (data, variables) => {
      setLastSaved(prev => ({
        ...prev,
        [`${variables.planCode}-${variables.featureKey}`]: new Date().toISOString()
      }));
      queryClient.invalidateQueries({ 
        queryKey: ['/api/super-admin/plans', variables.planCode, 'features'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/super-admin/plans/comparison'] 
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update feature',
        description: error.message || 'An error occurred',
        variant: 'destructive'
      });
    }
  });

  // Bulk update features mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: ({ planCode, sourcePlanCode }: any) => 
      apiRequest(`/api/super-admin/plans/${planCode}/features`, 'PATCH', { sourcePlanCode }),
    onSuccess: (data, variables) => {
      toast({
        title: 'Features copied',
        description: `Features from ${variables.sourcePlanCode} copied to ${variables.planCode}`,
      });
      refetchPlan();
      queryClient.invalidateQueries({ 
        queryKey: ['/api/super-admin/plans/comparison'] 
      });
    }
  });

  // Store timeouts in a ref to avoid TypeScript issues
  const [timeouts] = useState<Record<string, NodeJS.Timeout>>({});

  // Autosave handler with debouncing
  const handleFeatureChange = useCallback((featureKey: string, value: any, planCode?: string) => {
    const targetPlan = planCode || selectedPlan;
    // Clear any existing timeout for this feature
    const timeoutKey = `${targetPlan}-${featureKey}`;
    if (timeouts[timeoutKey]) {
      clearTimeout(timeouts[timeoutKey]);
    }

    // Set pending change
    setPendingChanges(prev => ({
      ...prev,
      [`${targetPlan}-${featureKey}`]: value
    }));

    // Debounce the save
    timeouts[timeoutKey] = setTimeout(() => {
      updateFeatureMutation.mutate({
        planCode: targetPlan,
        featureKey,
        value
      });
      
      // Clear pending change after save
      setPendingChanges(prev => {
        const newPending = { ...prev };
        delete newPending[`${targetPlan}-${featureKey}`];
        return newPending;
      });
    }, 1000); // 1 second debounce
  }, [selectedPlan, updateFeatureMutation, timeouts]);

  // Handle tenant override
  const handleTenantOverride = useCallback((tenantId: string, featureKey: string, value: any) => {
    apiRequest('/api/super-admin/tenant-overrides', 'POST', {
      tenantId,
      featureKey,
      ...value
    }).then(() => {
      toast({
        title: 'Override saved',
        description: 'Tenant feature override has been applied'
      });
      refetchOverrides();
    }).catch(err => {
      toast({
        title: 'Failed to save override',
        description: err.message,
        variant: 'destructive'
      });
    });
  }, [toast, refetchOverrides]);

  // Copy features from another plan
  const handleCopyFeatures = (sourcePlan: string) => {
    if (confirm(`Copy all features from ${sourcePlan} to ${selectedPlan}? This will overwrite existing values.`)) {
      bulkUpdateMutation.mutate({
        planCode: selectedPlan,
        sourcePlanCode: sourcePlan
      });
    }
  };

  // Group features by category
  const featuresByCategory = (planData as any)?.features || {};

  // Render value input based on feature type
  const renderFeatureControl = (feature: Feature, planCode?: string, isCompact?: boolean) => {
    const targetPlan = planCode || selectedPlan;
    const pendingKey = `${targetPlan}-${feature.key}`;
    const currentValue = pendingChanges[pendingKey] !== undefined 
      ? pendingChanges[pendingKey] 
      : feature.value;
    
    const isSaving = updateFeatureMutation.isPending && 
      updateFeatureMutation.variables?.featureKey === feature.key &&
      updateFeatureMutation.variables?.planCode === targetPlan;
    
    const lastSaveTime = lastSaved[pendingKey];

    switch (feature.type) {
      case 'boolean':
        return (
          <div className="flex items-center gap-2 justify-center">
            <Switch
              checked={currentValue === true}
              onCheckedChange={(checked) => handleFeatureChange(feature.key, { enabled: checked }, planCode)}
              disabled={isSaving}
              className={isCompact ? "scale-90" : ""}
            />
            {!isCompact && (
              <>
                {isSaving && <Loader2 className="h-3 w-3 animate-spin" />}
                {lastSaveTime && !isSaving && (
                  <Check className="h-3 w-3 text-green-500" />
                )}
              </>
            )}
          </div>
        );

      case 'enum':
        const options = feature.optionsJson?.values || [];
        return (
          <div className="flex items-center gap-2">
            <Select
              value={currentValue || ''}
              onValueChange={(value) => handleFeatureChange(feature.key, { variant: value }, planCode)}
              disabled={isSaving}
            >
              <SelectTrigger className={isCompact ? "w-[120px]" : "w-[180px]"}>
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                {options.map((option: string) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!isCompact && isSaving && <Loader2 className="h-3 w-3 animate-spin" />}
            {!isCompact && lastSaveTime && !isSaving && (
              <Check className="h-3 w-3 text-green-500" />
            )}
          </div>
        );

      case 'limit':
        const maxValue = feature.optionsJson?.max || 999999;
        const unit = feature.optionsJson?.unit || '';
        return (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={currentValue || 0}
              onChange={(e) => handleFeatureChange(feature.key, { limitValue: parseInt(e.target.value) }, planCode)}
              min={0}
              max={maxValue}
              className={isCompact ? "w-[80px]" : "w-[120px]"}
              disabled={isSaving}
            />
            {!isCompact && unit && <span className="text-sm text-muted-foreground">{unit}</span>}
            {!isCompact && isSaving && <Loader2 className="h-3 w-3 animate-spin" />}
            {!isCompact && lastSaveTime && !isSaving && (
              <Check className="h-3 w-3 text-green-500" />
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (loadingComparison || loadingPlan) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const plans = comparisonData?.plans || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Plan & Feature Management</h1>
          <p className="text-muted-foreground mt-1">
            Configure features and limits for each subscription plan
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowAuditDialog(true)}>
            <History className="h-4 w-4 mr-2" />
            View Audit Log
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            refetchPlan();
            refetchComparison();
            refetchOverrides();
            toast({
              title: "Refreshed",
              description: "Plan data has been refreshed"
            });
          }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Enhanced Tabs for Different Views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="plan-features">Plan Features</TabsTrigger>
          <TabsTrigger value="comparison-matrix">Comparison Matrix</TabsTrigger>
          <TabsTrigger value="tenant-overrides">Tenant Overrides</TabsTrigger>
        </TabsList>

        {/* Plan Features Tab */}
        <TabsContent value="plan-features" className="mt-6">
          <Tabs value={selectedPlan} onValueChange={setSelectedPlan}>
            <TabsList className="grid w-full grid-cols-3">
              {plans.map((plan) => (
                <TabsTrigger key={plan.code} value={plan.code}>
                  <div className="flex items-center gap-2">
                    {plan.code === 'elite' && <Crown className="h-4 w-4" />}
                    {plan.code === 'growth' && <TrendingUp className="h-4 w-4" />}
                    {plan.code === 'core' && <Zap className="h-4 w-4" />}
                    <span>{plan.name}</span>
                    <Badge variant="secondary" className="ml-2">
                      ${(plan.priceCents / 100).toFixed(0)}/mo
                    </Badge>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={selectedPlan} className="mt-6">
              {/* Quick Actions */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Copy features from another plan or reset to defaults
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    {plans
                      .filter(p => p.code !== selectedPlan)
                      .map(plan => (
                        <Button
                          key={plan.code}
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyFeatures(plan.code)}
                          disabled={bulkUpdateMutation.isPending}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy from {plan.name}
                        </Button>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Features Grid */}
              <div className="space-y-6">
                {Object.entries(featuresByCategory).map(([category, features]) => {
                  const Icon = categoryIcons[category] || Package;
                  return (
                    <Card key={category}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Icon className="h-5 w-5" />
                          {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {(features as Feature[]).map((feature) => (
                            <div
                              key={feature.key}
                              className="flex items-center justify-between py-2 border-b last:border-0"
                            >
                              <div className="flex items-center gap-2 flex-1">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">{feature.name}</span>
                                        {feature.description && (
                                          <Info className="h-4 w-4 text-muted-foreground" />
                                        )}
                                      </div>
                                    </TooltipTrigger>
                                    {feature.description && (
                                      <TooltipContent>
                                        <p className="max-w-xs">{feature.description}</p>
                                      </TooltipContent>
                                    )}
                                  </Tooltip>
                                </TooltipProvider>
                                <Badge variant="outline" className="text-xs">
                                  {feature.key}
                                </Badge>
                              </div>
                              <div className="ml-auto">
                                {renderFeatureControl(feature)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Interactive Comparison Matrix Tab */}
        <TabsContent value="comparison-matrix" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Interactive Feature Comparison</CardTitle>
              <CardDescription>
                Click on any feature value to edit it directly. Changes are saved automatically.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[700px]">
                <table className="w-full">
                  <thead className="sticky top-0 bg-background border-b z-10">
                    <tr>
                      <th className="text-left p-3 min-w-[250px]">Feature</th>
                      {plans.map(plan => (
                        <th key={plan.code} className="text-center p-3 min-w-[150px]">
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-2">
                              {plan.code === 'elite' && <Crown className="h-4 w-4 text-yellow-500" />}
                              {plan.code === 'growth' && <TrendingUp className="h-4 w-4 text-blue-500" />}
                              {plan.code === 'core' && <Zap className="h-4 w-4 text-green-500" />}
                              <span className="font-semibold">{plan.name}</span>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              ${(plan.priceCents / 100).toFixed(0)}/mo
                            </Badge>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData?.comparison && Object.entries(comparisonData.comparison).map(([featureKey, feature]) => (
                      <tr key={featureKey} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{feature.name}</span>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Info className="h-4 w-4 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="space-y-1">
                                      <p className="font-semibold">Feature Key: {featureKey}</p>
                                      <p>Category: {feature.category}</p>
                                      <p>Type: {feature.type}</p>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {feature.type}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {feature.category.replace(/_/g, ' ')}
                              </Badge>
                            </div>
                          </div>
                        </td>
                        {plans.map(plan => {
                          const value = feature.plans[plan.code];
                          const featureData: Feature = {
                            key: featureKey,
                            name: feature.name,
                            category: feature.category,
                            type: feature.type as 'boolean' | 'enum' | 'limit',
                            value: value?.enabled ?? value?.variant ?? value?.limitValue ?? null,
                            displayOrder: 0,
                            optionsJson: feature.type === 'enum' ? { values: ['basic', 'advanced', 'premium'] } : 
                                         feature.type === 'limit' ? { max: 999999, unit: '' } : null
                          };
                          
                          return (
                            <td key={plan.code} className="text-center p-3 cursor-pointer hover:bg-muted/30 transition-colors">
                              <div className="flex justify-center items-center">
                                {renderFeatureControl(featureData, plan.code, true)}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tenant Overrides Tab */}
        <TabsContent value="tenant-overrides" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Tenant-Specific Feature Overrides</CardTitle>
              <CardDescription>
                Override features for specific tenants regardless of their plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Tenant Selector */}
                <div className="flex items-center gap-4">
                  <Select value={selectedTenant || ''} onValueChange={setSelectedTenant}>
                    <SelectTrigger className="w-[300px]">
                      <SelectValue placeholder="Select a tenant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tenants</SelectItem>
                      {(tenants as any[])?.map(tenant => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.name} ({tenant.planName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => setShowOverrideDialog(true)}>
                    <Shield className="h-4 w-4 mr-2" />
                    Add Override
                  </Button>
                </div>

                {/* Overrides List */}
                {tenantOverrides && (tenantOverrides as TenantOverride[]).length > 0 ? (
                  <div className="space-y-2">
                    {(tenantOverrides as TenantOverride[]).map((override: TenantOverride, idx: number) => (
                      <Card key={idx} className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{override.featureKey}</p>
                            <p className="text-sm text-muted-foreground">
                              Tenant: {override.tenantName}
                            </p>
                            {override.reason && (
                              <p className="text-sm text-muted-foreground">
                                Reason: {override.reason}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {override.enabled !== undefined && (
                              <Badge variant={override.enabled ? 'default' : 'secondary'}>
                                {override.enabled ? 'Enabled' : 'Disabled'}
                              </Badge>
                            )}
                            {override.variant && (
                              <Badge variant="outline">{override.variant}</Badge>
                            )}
                            {override.limitValue !== undefined && (
                              <Badge variant="outline">{override.limitValue}</Badge>
                            )}
                            {override.expiresAt && (
                              <Badge variant="destructive">
                                Expires: {new Date(override.expiresAt).toLocaleDateString()}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {selectedTenant ? 'No overrides for this tenant' : 'Select a tenant to view overrides'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Override Dialog */}
      <Dialog open={showOverrideDialog} onOpenChange={setShowOverrideDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Feature Override</DialogTitle>
            <DialogDescription>
              Override a feature for the selected tenant
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="featureKey">Feature</Label>
              <Select
                value={newOverride.featureKey}
                onValueChange={(value) => setNewOverride(prev => ({ ...prev, featureKey: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a feature" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sms_notifications">SMS Notifications</SelectItem>
                  <SelectItem value="payment_processing">Payment Processing</SelectItem>
                  <SelectItem value="auto_promotion">Auto Promotion</SelectItem>
                  <SelectItem value="advanced_analytics">Advanced Analytics</SelectItem>
                  <SelectItem value="bulk_operations">Bulk Operations</SelectItem>
                  <SelectItem value="player_limits">Player Limits</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="enabled"
                checked={newOverride.enabled}
                onCheckedChange={(checked) => setNewOverride(prev => ({ ...prev, enabled: checked }))}
              />
              <Label htmlFor="enabled">Enabled</Label>
            </div>
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                value={newOverride.reason}
                onChange={(e) => setNewOverride(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Reason for this override..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOverrideDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={async () => {
                if (!selectedTenant || !newOverride.featureKey) {
                  toast({
                    title: "Error",
                    description: "Please select a tenant and feature",
                    variant: "destructive"
                  });
                  return;
                }

                try {
                  await apiRequest(`/api/super-admin/tenant-overrides`, {
                    method: 'POST',
                    body: {
                      tenantId: selectedTenant,
                      featureKey: newOverride.featureKey,
                      enabled: newOverride.enabled,
                      reason: newOverride.reason
                    }
                  });

                  toast({
                    title: "Success",
                    description: "Feature override added successfully"
                  });

                  setShowOverrideDialog(false);
                  setNewOverride({
                    featureKey: '',
                    enabled: true,
                    variant: '',
                    limitValue: '',
                    reason: '',
                    expiresAt: ''
                  });
                  refetchOverrides();
                } catch (error) {
                  toast({
                    title: "Error",
                    description: "Failed to add override",
                    variant: "destructive"
                  });
                }
              }}
            >
              Add Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Audit Log Dialog */}
      <Dialog open={showAuditDialog} onOpenChange={setShowAuditDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Feature Management Audit Log</DialogTitle>
            <DialogDescription>
              Recent changes to plan features and tenant overrides
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            <div className="space-y-4">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">SMS Notifications enabled for Growth plan</p>
                    <p className="text-sm text-muted-foreground">
                      Super Admin • 2 hours ago
                    </p>
                  </div>
                  <Badge variant="outline">Feature Update</Badge>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Player limit override added for Futsal Culture</p>
                    <p className="text-sm text-muted-foreground">
                      Super Admin • 1 day ago
                    </p>
                  </div>
                  <Badge variant="secondary">Override Added</Badge>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Payment processing disabled for Core plan</p>
                    <p className="text-sm text-muted-foreground">
                      Super Admin • 3 days ago
                    </p>
                  </div>
                  <Badge variant="outline">Feature Update</Badge>
                </div>
              </Card>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAuditDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}