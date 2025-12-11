import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Save, Package, Clock, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TenantDefaults {
  defaultPlanCode: 'free' | 'core' | 'growth' | 'elite';
  bookingWindowHours: number;
  sessionCapacity: number;
  seedSampleContent: boolean;
}

export function TenantDefaults() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [localDefaults, setLocalDefaults] = useState<TenantDefaults | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: tenantDefaults, isLoading } = useQuery({
    queryKey: ['/api/super-admin/settings/tenant-defaults'],
    queryFn: async () => {
      const response = await fetch('/api/super-admin/settings/tenant-defaults', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch tenant defaults');
      }
      return response.json() as TenantDefaults;
    },
    retry: false,
  });

  const updateDefaults = useMutation({
    mutationFn: async (newDefaults: TenantDefaults) => {
      const response = await fetch('/api/super-admin/settings/tenant-defaults', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newDefaults),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to update tenant defaults');
      }
      
      return response.json();
    },
    onSuccess: (updatedDefaults) => {
      queryClient.setQueryData(['/api/super-admin/settings/tenant-defaults'], updatedDefaults);
      setLocalDefaults(updatedDefaults);
      setHasChanges(false);
      toast({
        title: "Tenant Defaults Updated",
        description: "Default settings for new tenants have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update tenant defaults. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (tenantDefaults) {
      setLocalDefaults(tenantDefaults);
    }
  }, [tenantDefaults]);

  const handleChange = (key: keyof TenantDefaults, value: any) => {
    if (!localDefaults) return;

    const newDefaults = { ...localDefaults, [key]: value };
    setLocalDefaults(newDefaults);
    setHasChanges(true);
  };

  const handleSave = () => {
    if (localDefaults) {
      updateDefaults.mutate(localDefaults);
    }
  };

  if (isLoading || !localDefaults) {
    return <div>Loading tenant defaults...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Tenant Defaults</h3>
          <p className="text-sm text-muted-foreground">Configure default settings applied to new tenant organizations</p>
        </div>
        {hasChanges && (
          <Button onClick={handleSave} disabled={updateDefaults.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updateDefaults.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Plan Configuration
            </CardTitle>
            <CardDescription>
              Default subscription plan assigned to new tenants
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="defaultPlan">Default Plan</Label>
              <Select 
                value={localDefaults.defaultPlanCode} 
                onValueChange={(value) => handleChange('defaultPlanCode', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free Plan - $0/month (10 players)</SelectItem>
                  <SelectItem value="core">Core Plan - $79/month (Unlimited players)</SelectItem>
                  <SelectItem value="growth">Growth Plan - $149/month (Unlimited players)</SelectItem>
                  <SelectItem value="elite">Elite Plan - $299/month (Unlimited players)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                New tenants will be assigned this plan by default. They can upgrade or change plans later.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Session Settings
            </CardTitle>
            <CardDescription>
              Default settings for session management and bookings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bookingWindow">Booking Window (hours)</Label>
                <Input
                  id="bookingWindow"
                  type="number"
                  min="0"
                  max="168"
                  value={localDefaults.bookingWindowHours}
                  onChange={(e) => handleChange('bookingWindowHours', parseInt(e.target.value) || 0)}
                />
                <p className="text-sm text-muted-foreground">
                  Hours before session start that booking opens (8 AM rule)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessionCapacity">Default Session Capacity</Label>
                <Input
                  id="sessionCapacity"
                  type="number"
                  min="1"
                  max="1000"
                  value={localDefaults.sessionCapacity}
                  onChange={(e) => handleChange('sessionCapacity', parseInt(e.target.value) || 1)}
                />
                <p className="text-sm text-muted-foreground">
                  Maximum number of players per session by default
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Content & Data
            </CardTitle>
            <CardDescription>
              Default content and sample data configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Seed Sample Content</Label>
                <p className="text-sm text-muted-foreground">
                  Provide new tenants with sample players, sessions, and bookings to help them get started
                </p>
              </div>
              <Switch
                checked={localDefaults.seedSampleContent}
                onCheckedChange={(value) => handleChange('seedSampleContent', value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preview: New Tenant Configuration</CardTitle>
            <CardDescription>
              This is how new tenants will be configured with current defaults
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Plan:</span>
                <span className="text-sm">{localDefaults.defaultPlanCode.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Booking Window:</span>
                <span className="text-sm">{localDefaults.bookingWindowHours} hours before session</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Session Capacity:</span>
                <span className="text-sm">{localDefaults.sessionCapacity} players maximum</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Sample Content:</span>
                <span className="text-sm">{localDefaults.seedSampleContent ? 'Included' : 'Not included'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}