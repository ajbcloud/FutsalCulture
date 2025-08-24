import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Sparkles
} from 'lucide-react';

interface FeatureCategory {
  id: string;
  name: string;
  icon: any;
  features: Feature[];
}

interface Feature {
  id: string;
  name: string;
  description?: string;
  type: 'boolean' | 'number' | 'text' | 'select';
  options?: string[];
  unit?: string;
}

interface PlanFeatureValue {
  enabled: boolean;
  value?: string | number;
  description?: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  playerLimit: number | 'unlimited';
  description: string;
  popular?: boolean;
  features: Record<string, PlanFeatureValue>;
}

const featureCategories: FeatureCategory[] = [
  {
    id: 'core',
    name: 'Core Features',
    icon: Package,
    features: [
      { id: 'sessionManagement', name: 'Session Management', type: 'select', options: ['Manual only', 'Recurring', 'Recurring + Auto'] },
      { id: 'parentPlayerBooking', name: 'Parent/Player Booking', type: 'boolean' },
      { id: 'waitlist', name: 'Waitlist', type: 'select', options: ['Not available', 'Manual only', 'Auto-promote'] },
      { id: 'csvExport', name: 'CSV Export', type: 'boolean' },
      { id: 'csvImport', name: 'CSV Import', type: 'boolean' },
      { id: 'bulkOperations', name: 'Bulk Operations', type: 'boolean' },
      { id: 'accessCodes', name: 'Access Codes', type: 'boolean' },
      { id: 'discountCodes', name: 'Discount Codes', type: 'boolean' }
    ]
  },
  {
    id: 'communication',
    name: 'Communication',
    icon: Mail,
    features: [
      { id: 'emailNotifications', name: 'Email Notifications', type: 'boolean' },
      { id: 'smsNotifications', name: 'SMS Notifications', type: 'boolean' },
      { id: 'emailSmsGateway', name: 'Email/SMS Gateway', type: 'boolean' }
    ]
  },
  {
    id: 'payment',
    name: 'Payment & Billing',
    icon: CreditCard,
    features: [
      { id: 'acceptOnlinePayments', name: 'Accept Online Payments', type: 'boolean' },
      { id: 'paymentIntegrations', name: 'Payment Integrations', type: 'select', options: ['None', 'Stripe only', 'Stripe + QuickBooks', 'Multiple providers'] },
      { id: 'recurringBilling', name: 'Recurring Billing', type: 'boolean' }
    ]
  },
  {
    id: 'analytics',
    name: 'Analytics & Automation',
    icon: BarChart3,
    features: [
      { id: 'analytics', name: 'Analytics', type: 'select', options: ['Not available', 'Basic', 'Advanced', 'AI-powered'] },
      { id: 'playerDevelopment', name: 'Advanced Player Development', type: 'boolean' },
      { id: 'automatedReports', name: 'Automated Reports', type: 'boolean' }
    ]
  },
  {
    id: 'integrations',
    name: 'Integrations',
    icon: Globe,
    features: [
      { id: 'calendarIntegration', name: 'Calendar Integrations', type: 'boolean' },
      { id: 'additionalIntegrations', name: 'Additional Integrations', type: 'select', options: ['None', 'Mailchimp', 'Mailchimp, QuickBooks', 'Mailchimp, QuickBooks, Zapier'] },
      { id: 'apiAccess', name: 'API Access', type: 'select', options: ['None', 'Read-only', 'Full access'] }
    ]
  },
  {
    id: 'support',
    name: 'Support & Requests',
    icon: HelpCircle,
    features: [
      { id: 'supportLevel', name: 'Support Level', type: 'select', options: ['Basic', 'Standard', 'Standard + Priority', 'Priority + Phone'] },
      { id: 'featureRequests', name: 'Feature Request Queue', type: 'select', options: ['Not available', 'Standard queue', 'Priority queue'] }
    ]
  }
];

const defaultPlans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    playerLimit: 10,
    description: 'Up to 10 Players',
    features: {}
  },
  {
    id: 'core',
    name: 'Core',
    price: 99,
    playerLimit: 150,
    description: 'Up to 150 Players',
    features: {}
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 199,
    playerLimit: 500,
    description: 'Up to 500 Players',
    popular: true,
    features: {}
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 499,
    playerLimit: 'unlimited',
    description: 'Unlimited Players',
    features: {}
  }
];

export default function PlanManagement() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCategory, setSelectedCategory] = useState('core');
  const { toast } = useToast();

  // Fetch plan configurations
  const { data: plans = defaultPlans, isLoading } = useQuery<Plan[]>({
    queryKey: ['/api/super-admin/plans']
  });

  // Update plan mutation
  const updatePlanMutation = useMutation({
    mutationFn: async ({ planId, updates }: { planId: string; updates: Partial<Plan> }) => 
      apiRequest('PUT', `/api/super-admin/plans/${planId}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/plans'] });
      toast({ title: 'Plan updated successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to update plan', description: error.message, variant: 'destructive' });
    }
  });

  // Toggle feature for a plan
  const toggleFeature = (planId: string, featureId: string, enabled: boolean, value?: any) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    const updatedFeatures = {
      ...plan.features,
      [featureId]: {
        enabled,
        value: value || plan.features[featureId]?.value
      }
    };

    updatePlanMutation.mutate({
      planId,
      updates: { features: updatedFeatures }
    });
  };

  // Get feature value for a plan
  const getFeatureValue = (planId: string, featureId: string): PlanFeatureValue => {
    const plan = plans.find(p => p.id === planId);
    return plan?.features[featureId] || { enabled: false };
  };

  // Render feature control based on type
  const renderFeatureControl = (plan: Plan, feature: Feature) => {
    const value = getFeatureValue(plan.id, feature.id);

    switch (feature.type) {
      case 'boolean':
        return (
          <div className="flex items-center justify-center">
            {value.enabled ? (
              <Check className="w-5 h-5 text-green-600" />
            ) : (
              <X className="w-5 h-5 text-gray-400" />
            )}
          </div>
        );

      case 'select':
        if (!value.enabled) {
          return <X className="w-5 h-5 text-gray-400 mx-auto" />;
        }
        return (
          <Select
            value={value.value as string || feature.options?.[0]}
            onValueChange={(val) => toggleFeature(plan.id, feature.id, true, val)}
          >
            <SelectTrigger className="w-full h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {feature.options?.map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'number':
        if (!value.enabled) {
          return <X className="w-5 h-5 text-gray-400 mx-auto" />;
        }
        return (
          <Input
            type="number"
            value={value.value as number || 0}
            onChange={(e) => toggleFeature(plan.id, feature.id, true, parseInt(e.target.value))}
            className="h-8 text-xs text-center"
          />
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Plan Management</h1>
        </div>
        <div className="grid grid-cols-1 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Plan Management</h1>
          <p className="text-muted-foreground">Configure pricing plans, features, and limitations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="features">Feature Matrix</TabsTrigger>
          <TabsTrigger value="limits">Limits & Pricing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Plan Cards Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map(plan => (
              <Card key={plan.id} className={plan.popular ? 'border-primary' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="capitalize">{plan.name}</CardTitle>
                    {plan.popular && (
                      <Badge className="bg-primary text-primary-foreground">Popular</Badge>
                    )}
                  </div>
                  <CardDescription>
                    <div className="text-2xl font-bold">
                      ${plan.price}<span className="text-sm font-normal">/mo</span>
                    </div>
                    <div className="text-sm mt-1">{plan.description}</div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Player Limit</span>
                      <span className="font-medium">
                        {plan.playerLimit === 'unlimited' ? 'Unlimited' : plan.playerLimit}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Active Features</span>
                      <span className="font-medium">
                        {Object.values(plan.features).filter(f => f.enabled).length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{plans.length}</div>
                <p className="text-xs text-muted-foreground">Active pricing tiers</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {featureCategories.reduce((acc, cat) => acc + cat.features.length, 0)}
                </div>
                <p className="text-xs text-muted-foreground">Across all categories</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Price Range</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  $0 - ${Math.max(...plans.map(p => p.price))}
                </div>
                <p className="text-xs text-muted-foreground">Monthly pricing</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          {/* Feature Category Selector */}
          <div className="flex items-center gap-4">
            <Label>Category:</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {featureCategories.map(category => {
                  const Icon = category.icon;
                  return (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {category.name}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Feature Matrix */}
          <Card>
            <CardHeader>
              <CardTitle>Feature Comparison Matrix</CardTitle>
              <CardDescription>
                Click on features to toggle them for each plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Feature</th>
                      {plans.map(plan => (
                        <th key={plan.id} className="text-center py-3 px-4 min-w-[150px]">
                          <div className="font-medium capitalize">{plan.name}</div>
                          <div className="text-sm text-muted-foreground">${plan.price}/mo</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {featureCategories
                      .find(cat => cat.id === selectedCategory)
                      ?.features.map(feature => (
                        <tr key={feature.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{feature.name}</span>
                              {feature.description && (
                                <Info className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                          </td>
                          {plans.map(plan => (
                            <td key={plan.id} className="text-center py-3 px-4">
                              {feature.type === 'boolean' ? (
                                <button
                                  onClick={() => {
                                    const currentValue = getFeatureValue(plan.id, feature.id);
                                    toggleFeature(plan.id, feature.id, !currentValue.enabled);
                                  }}
                                  className="mx-auto flex items-center justify-center w-8 h-8 rounded hover:bg-muted"
                                >
                                  {renderFeatureControl(plan, feature)}
                                </button>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={getFeatureValue(plan.id, feature.id).enabled}
                                    onCheckedChange={(checked) => toggleFeature(plan.id, feature.id, checked)}
                                    className="mx-auto"
                                  />
                                  {getFeatureValue(plan.id, feature.id).enabled && (
                                    <div className="flex-1">
                                      {renderFeatureControl(plan, feature)}
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="limits" className="space-y-6">
          {/* Plan Limits and Pricing */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {plans.map(plan => (
              <Card key={plan.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="capitalize">{plan.name} Plan</span>
                    {plan.popular && <Badge>Popular</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`${plan.id}-price`}>Monthly Price</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">$</span>
                        <Input
                          id={`${plan.id}-price`}
                          type="number"
                          value={plan.price}
                          onChange={(e) => updatePlanMutation.mutate({
                            planId: plan.id,
                            updates: { price: parseInt(e.target.value) }
                          })}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor={`${plan.id}-players`}>Player Limit</Label>
                      <Input
                        id={`${plan.id}-players`}
                        type={plan.playerLimit === 'unlimited' ? 'text' : 'number'}
                        value={plan.playerLimit}
                        onChange={(e) => updatePlanMutation.mutate({
                          planId: plan.id,
                          updates: { 
                            playerLimit: e.target.value === 'unlimited' 
                              ? 'unlimited' 
                              : parseInt(e.target.value) 
                          }
                        })}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor={`${plan.id}-description`}>Description</Label>
                    <Textarea
                      id={`${plan.id}-description`}
                      value={plan.description}
                      onChange={(e) => updatePlanMutation.mutate({
                        planId: plan.id,
                        updates: { description: e.target.value }
                      })}
                      rows={2}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`${plan.id}-popular`}
                      checked={plan.popular || false}
                      onCheckedChange={(checked) => updatePlanMutation.mutate({
                        planId: plan.id,
                        updates: { popular: checked }
                      })}
                    />
                    <Label htmlFor={`${plan.id}-popular`}>Mark as Popular</Label>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={() => toast({ title: 'All changes saved', description: 'Plan configurations have been updated' })}
              className="min-w-[150px]"
            >
              <Save className="w-4 h-4 mr-2" />
              Save All Changes
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}