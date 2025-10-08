import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Activity,
  Watch,
  Heart,
  Footprints,
  Moon,
  TrendingUp,
  Wifi,
  WifiOff,
  RefreshCw,
  Settings,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  Smartphone
} from 'lucide-react';
import {
  SiFitbit,
  SiGarmin,
  SiStrava,
  SiApple,
  SiGoogle
} from 'react-icons/si';
import { formatDistanceToNow } from 'date-fns';

const PROVIDER_CONFIG = {
  fitbit: {
    name: 'Fitbit',
    icon: SiFitbit,
    color: '#00B0B9',
    description: 'Track activity, sleep, and heart rate'
  },
  garmin: {
    name: 'Garmin Connect',
    icon: SiGarmin,
    color: '#007dba',
    description: 'Advanced fitness metrics and GPS tracking'
  },
  strava: {
    name: 'Strava',
    icon: SiStrava,
    color: '#fc4c02',
    description: 'Social fitness tracking and segments'
  },
  apple_health: {
    name: 'Apple Health',
    icon: SiApple,
    color: '#000000',
    description: 'Comprehensive health and fitness data'
  },
  google_fit: {
    name: 'Google Fit',
    icon: SiGoogle,
    color: '#4285f4',
    description: 'Activity tracking and health insights'
  },
  whoop: {
    name: 'WHOOP',
    icon: Activity,
    color: '#000000',
    description: 'Recovery, strain, and sleep optimization'
  },
  polar: {
    name: 'Polar',
    icon: Heart,
    color: '#ff0037',
    description: 'Heart rate and training analysis'
  }
};

interface WearableIntegration {
  id: string;
  provider: keyof typeof PROVIDER_CONFIG;
  isActive: boolean;
  lastSyncAt: string;
  syncFrequency: number;
  scope: string;
  metadata: any;
}

interface WearablesProps {
  playerId?: string;
  playerName?: string;
}

export default function Wearables({ playerId, playerName }: WearablesProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [syncSettings, setSyncSettings] = useState<{ [key: string]: number }>({});

  // Fetch connected integrations
  const { data: integrations = [], isLoading } = useQuery<WearableIntegration[]>({
    queryKey: ['/api/admin/player-development/wearables', { playerId }],
    enabled: !!playerId,
  });

  // Connect mutation
  const connectMutation = useMutation({
    mutationFn: (provider: string) => 
      apiRequest('/api/admin/player-development/wearables/connect', {
        method: 'POST',
        body: JSON.stringify({ provider, playerId })
      }),
    onSuccess: (data) => {
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    },
    onError: () => {
      toast({
        title: 'Connection failed',
        description: 'Failed to initiate connection. Please try again.',
        variant: 'destructive'
      });
    }
  });

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: (integrationId: string) => 
      apiRequest('/api/admin/player-development/wearables/disconnect', {
        method: 'POST',
        body: JSON.stringify({ integrationId })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/player-development/wearables'] });
      toast({
        title: 'Device disconnected',
        description: 'The wearable device has been disconnected successfully.'
      });
    },
    onError: () => {
      toast({
        title: 'Disconnection failed',
        description: 'Failed to disconnect device. Please try again.',
        variant: 'destructive'
      });
    }
  });

  // Manual sync mutation
  const syncMutation = useMutation({
    mutationFn: (integrationId: string) => 
      apiRequest('/api/admin/player-development/wearables/sync', {
        method: 'POST',
        body: JSON.stringify({ integrationId })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/player-development/wearables'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/player-development/metrics'] });
      toast({
        title: 'Sync successful',
        description: 'Wearable data has been synchronized.'
      });
    },
    onError: () => {
      toast({
        title: 'Sync failed',
        description: 'Failed to sync data. Please try again.',
        variant: 'destructive'
      });
    }
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: ({ integrationId, syncFrequency }: { integrationId: string; syncFrequency: number }) => 
      apiRequest(`/api/admin/player-development/wearables/${integrationId}`, {
        method: 'PATCH',
        body: JSON.stringify({ syncFrequency })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/player-development/wearables'] });
      toast({
        title: 'Settings updated',
        description: 'Sync frequency has been updated.'
      });
    },
    onError: () => {
      toast({
        title: 'Update failed',
        description: 'Failed to update settings. Please try again.',
        variant: 'destructive'
      });
    }
  });

  const handleConnect = (provider: string) => {
    connectMutation.mutate(provider);
  };

  const handleDisconnect = (integrationId: string) => {
    if (confirm('Are you sure you want to disconnect this device?')) {
      disconnectMutation.mutate(integrationId);
    }
  };

  const handleSync = (integrationId: string) => {
    syncMutation.mutate(integrationId);
  };

  const handleUpdateFrequency = (integrationId: string, frequency: number) => {
    updateSettingsMutation.mutate({ integrationId, syncFrequency: frequency });
  };

  // Check if provider is connected
  const isProviderConnected = (provider: string) => {
    return integrations.some(i => i.provider === provider && i.isActive);
  };

  // Get integration for provider
  const getIntegration = (provider: string) => {
    return integrations.find(i => i.provider === provider);
  };

  if (!playerId) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4" />
              <p>Please select a player to manage wearable integrations.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Wearable Integrations</h2>
          <p className="text-muted-foreground">
            Connect fitness trackers and smartwatches to monitor {playerName || 'player'}'s health metrics
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/player-development/wearables'] })}
          data-testid="button-refresh-integrations"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Provider Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(PROVIDER_CONFIG).map(([key, config]) => {
          const integration = getIntegration(key);
          const isConnected = !!integration?.isActive;
          const Icon = config.icon;

          return (
            <Card key={key} className={isConnected ? 'border-green-500' : ''}>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${config.color}20` }}
                    >
                      <Icon 
                        className="h-6 w-6" 
                        style={{ color: config.color }}
                      />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{config.name}</CardTitle>
                      {isConnected && (
                        <Badge variant="success" className="mt-1">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Connected
                        </Badge>
                      )}
                    </div>
                  </div>
                  {isConnected ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDisconnect(integration!.id)}
                      disabled={disconnectMutation.isPending}
                      data-testid={`button-disconnect-${key}`}
                    >
                      <WifiOff className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleConnect(key)}
                      disabled={connectMutation.isPending}
                      data-testid={`button-connect-${key}`}
                    >
                      <Wifi className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <CardDescription className="mt-2">
                  {config.description}
                </CardDescription>
              </CardHeader>
              
              {isConnected && integration && (
                <CardContent>
                  <div className="space-y-3">
                    {/* Last Sync */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Last sync:</span>
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDistanceToNow(new Date(integration.lastSyncAt), { addSuffix: true })}
                      </span>
                    </div>

                    {/* Sync Frequency */}
                    <div className="space-y-1">
                      <Label htmlFor={`freq-${key}`} className="text-sm">
                        Sync frequency
                      </Label>
                      <Select
                        value={syncSettings[key]?.toString() || integration.syncFrequency.toString()}
                        onValueChange={(value) => {
                          setSyncSettings({ ...syncSettings, [key]: parseInt(value) });
                          handleUpdateFrequency(integration.id, parseInt(value));
                        }}
                      >
                        <SelectTrigger id={`freq-${key}`} className="h-8" data-testid={`select-frequency-${key}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">Every 15 minutes</SelectItem>
                          <SelectItem value="30">Every 30 minutes</SelectItem>
                          <SelectItem value="60">Every hour</SelectItem>
                          <SelectItem value="120">Every 2 hours</SelectItem>
                          <SelectItem value="240">Every 4 hours</SelectItem>
                          <SelectItem value="1440">Once daily</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleSync(integration.id)}
                        disabled={syncMutation.isPending}
                        data-testid={`button-sync-${key}`}
                      >
                        <RefreshCw className={`h-3 w-3 mr-1 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                        Sync Now
                      </Button>
                    </div>

                    {/* Permissions */}
                    {integration.scope && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-1">Permissions:</p>
                        <div className="flex flex-wrap gap-1">
                          {integration.scope.split(' ').map((perm) => (
                            <Badge key={perm} variant="secondary" className="text-xs">
                              {perm.replace(/_/g, ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Connection Status Summary */}
      {integrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Connection Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <Smartphone className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {integrations.filter(i => i.isActive).length} active
                  </span>
                </div>
                <div className="flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {integrations.length} total integrations
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Text */}
      {integrations.length === 0 && !isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Watch className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                No wearable devices connected yet. Connect a device to start tracking health metrics.
              </p>
              <p className="text-sm text-muted-foreground">
                Click the connection button on any provider card above to get started.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}