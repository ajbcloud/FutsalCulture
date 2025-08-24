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

  // Fetch plan comparison data
  const { data: comparisonData, isLoading: loadingComparison } = useQuery<PlanComparison>({
    queryKey: ['/api/super-admin/plans/comparison'],
    staleTime: 5 * 60 * 1000
  });

  // Fetch features for selected plan
  const { data: planData, isLoading: loadingPlan, refetch: refetchPlan } = useQuery<{
    plan: Plan;
    features: Record<string, Feature[]>;
    lastModified: string;
  }>({
    queryKey: ['/api/super-admin/plans', selectedPlan, 'features'],
    queryFn: () => apiRequest(`/api/super-admin/plans/${selectedPlan}/features`, 'GET'),
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
  const handleFeatureChange = useCallback((featureKey: string, value: any) => {
    // Clear any existing timeout for this feature
    const timeoutKey = `${selectedPlan}-${featureKey}`;
    if (timeouts[timeoutKey]) {
      clearTimeout(timeouts[timeoutKey]);
    }

    // Set pending change
    setPendingChanges(prev => ({
      ...prev,
      [featureKey]: value
    }));

    // Debounce the save
    timeouts[timeoutKey] = setTimeout(() => {
      updateFeatureMutation.mutate({
        planCode: selectedPlan,
        featureKey,
        value
      });
      
      // Clear pending change after save
      setPendingChanges(prev => {
        const newPending = { ...prev };
        delete newPending[featureKey];
        return newPending;
      });
    }, 1000); // 1 second debounce
  }, [selectedPlan, updateFeatureMutation, timeouts]);

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
  const featuresByCategory = planData?.features || {};

  // Render value input based on feature type
  const renderFeatureControl = (feature: Feature) => {
    const currentValue = pendingChanges[feature.key] !== undefined 
      ? pendingChanges[feature.key] 
      : feature.value;
    
    const isSaving = updateFeatureMutation.isPending && 
      updateFeatureMutation.variables?.featureKey === feature.key;
    
    const lastSaveTime = lastSaved[`${selectedPlan}-${feature.key}`];

    switch (feature.type) {
      case 'boolean':
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={currentValue === true}
              onCheckedChange={(checked) => handleFeatureChange(feature.key, { enabled: checked })}
              disabled={isSaving}
            />
            {isSaving && <Loader2 className="h-3 w-3 animate-spin" />}
            {lastSaveTime && !isSaving && (
              <Check className="h-3 w-3 text-green-500" />
            )}
          </div>
        );

      case 'enum':
        const options = feature.optionsJson?.values || [];
        return (
          <div className="flex items-center gap-2">
            <Select
              value={currentValue || ''}
              onValueChange={(value) => handleFeatureChange(feature.key, { variant: value })}
              disabled={isSaving}
            >
              <SelectTrigger className="w-[180px]">
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
            {isSaving && <Loader2 className="h-3 w-3 animate-spin" />}
            {lastSaveTime && !isSaving && (
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
              onChange={(e) => handleFeatureChange(feature.key, { limitValue: parseInt(e.target.value) })}
              min={0}
              max={maxValue}
              className="w-[120px]"
              disabled={isSaving}
            />
            {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
            {isSaving && <Loader2 className="h-3 w-3 animate-spin" />}
            {lastSaveTime && !isSaving && (
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
          <Button variant="outline" size="sm">
            <History className="h-4 w-4 mr-2" />
            View Audit Log
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetchPlan()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Plan Selector Tabs */}
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

      {/* Feature Comparison Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Comparison Matrix</CardTitle>
          <CardDescription>
            Compare features across all plans at a glance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <table className="w-full">
              <thead className="sticky top-0 bg-background border-b">
                <tr>
                  <th className="text-left p-2">Feature</th>
                  {plans.map(plan => (
                    <th key={plan.code} className="text-center p-2 min-w-[120px]">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-semibold">{plan.name}</span>
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
                  <tr key={featureKey} className="border-b hover:bg-muted/50">
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{feature.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {feature.type}
                        </Badge>
                      </div>
                    </td>
                    {plans.map(plan => {
                      const value = feature.plans[plan.code];
                      return (
                        <td key={plan.code} className="text-center p-2">
                          {feature.type === 'boolean' ? (
                            value?.enabled ? (
                              <Check className="h-5 w-5 text-green-500 mx-auto" />
                            ) : (
                              <X className="h-5 w-5 text-muted-foreground mx-auto" />
                            )
                          ) : feature.type === 'enum' ? (
                            <Badge variant={value?.variant ? 'default' : 'secondary'}>
                              {value?.variant || 'None'}
                            </Badge>
                          ) : feature.type === 'limit' ? (
                            <span className="font-medium">
                              {value?.limitValue === 999999 ? '∞' : value?.limitValue || 0}
                            </span>
                          ) : null}
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
    </div>
  );
}