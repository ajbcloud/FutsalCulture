import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronDown, ChevronRight, RefreshCw, Activity, AlertCircle, Clock, Zap } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import FilterBar from '@/components/shared/FilterBar';

interface WebhookOverview {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  success_rate: number;
  p95_latency: number;
  failures: number;
  dead_letters: number;
}

interface WebhookEvent {
  id: string;
  event_type: string;
  created_at: string;
  success_count: number;
  fail_count: number;
}

interface WebhookAttempt {
  id: string;
  attempt_no: number;
  status: 'success' | 'failed';
  http_status: number;
  latency_ms: number;
  error: string;
  created_at: string;
}

export default function IntegrationsHealth() {
  const [expandedWebhooks, setExpandedWebhooks] = useState<Set<string>>(new Set());
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    to: new Date().toISOString(),
  });

  const queryClient = useQueryClient();

  // Overview query
  const { data: overview, isLoading } = useQuery({
    queryKey: ['super-admin', 'integrations', 'health', 'overview', dateRange],
    queryFn: () => apiRequest(`/api/super-admin/integrations/health/overview?from=${encodeURIComponent(dateRange.from)}&to=${encodeURIComponent(dateRange.to)}`),
  });

  // Events query for expanded webhooks
  const getEventsQuery = (webhookId: string) => useQuery({
    queryKey: ['super-admin', 'integrations', 'webhooks', webhookId, 'events', dateRange],
    queryFn: () => apiRequest(`/api/super-admin/integrations/webhooks/${webhookId}/events?from=${encodeURIComponent(dateRange.from)}&to=${encodeURIComponent(dateRange.to)}`),
    enabled: expandedWebhooks.has(webhookId),
  });

  // Attempts query for expanded events
  const getAttemptsQuery = (eventId: string) => useQuery({
    queryKey: ['super-admin', 'integrations', 'webhooks', 'events', eventId, 'attempts'],
    queryFn: () => apiRequest(`/api/super-admin/integrations/webhooks/events/${eventId}/attempts`),
    enabled: expandedEvents.has(eventId),
  });

  // Replay mutation
  const replayMutation = useMutation({
    mutationFn: (eventId: string) => 
      apiRequest(`/api/super-admin/integrations/webhooks/events/${eventId}/replay`, {
        method: 'POST',
      }),
    onSuccess: (data, eventId) => {
      // Invalidate attempts for this event
      queryClient.invalidateQueries({
        queryKey: ['super-admin', 'integrations', 'webhooks', 'events', eventId, 'attempts']
      });
    },
  });

  const toggleWebhookExpanded = (webhookId: string) => {
    const newExpanded = new Set(expandedWebhooks);
    if (newExpanded.has(webhookId)) {
      newExpanded.delete(webhookId);
    } else {
      newExpanded.add(webhookId);
    }
    setExpandedWebhooks(newExpanded);
  };

  const toggleEventExpanded = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 0.97) return 'text-green-600';
    if (rate >= 0.90) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSuccessRateBadge = (rate: number) => {
    if (rate >= 0.97) return 'bg-green-100 text-green-800';
    if (rate >= 0.90) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const webhooks = overview?.webhooks || [];

  // Calculate KPIs
  const totalSuccessRate = webhooks.length > 0 
    ? webhooks.reduce((sum: number, w: WebhookOverview) => sum + (w.success_rate || 0), 0) / webhooks.length 
    : 0;
  const totalDeadLetters = webhooks.reduce((sum: number, w: WebhookOverview) => sum + (w.dead_letters || 0), 0);
  const worstP95Webhook = webhooks.reduce((worst: WebhookOverview | null, w: WebhookOverview) => {
    if (!worst || (w.p95_latency || 0) > (worst.p95_latency || 0)) return w;
    return worst;
  }, null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Integrations & Webhooks Health
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Monitor webhook performance and replay failed deliveries
          </p>
        </div>
      </div>

      <FilterBar
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card data-testid="kpi-success-rate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getSuccessRateColor(totalSuccessRate)}`}>
              {(totalSuccessRate * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Average across all webhooks
            </p>
          </CardContent>
        </Card>

        <Card data-testid="kpi-dead-letters">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dead Letters</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalDeadLetters > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {totalDeadLetters}
            </div>
            <p className="text-xs text-muted-foreground">
              Failed after 3+ attempts
            </p>
          </CardContent>
        </Card>

        <Card data-testid="kpi-worst-latency">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Worst P95 Latency</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {worstP95Webhook?.p95_latency || 0}ms
            </div>
            <p className="text-xs text-muted-foreground">
              {worstP95Webhook?.name || 'No data'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Webhooks Table */}
      <Card data-testid="webhooks-table">
        <CardHeader>
          <CardTitle>Webhooks Status</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : webhooks.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Webhooks Found</h3>
              <p className="text-gray-500">
                No events yet—send a test payload from Settings → Integrations → Webhooks
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {webhooks.map((webhook: WebhookOverview) => {
                const eventsQuery = getEventsQuery(webhook.id);
                const events = eventsQuery.data?.rows || [];
                
                return (
                  <Collapsible key={webhook.id} data-testid={`webhook-row-${webhook.id}`}>
                    <CollapsibleTrigger 
                      className="flex items-center justify-between w-full p-4 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => toggleWebhookExpanded(webhook.id)}
                    >
                      <div className="flex items-center space-x-4">
                        {expandedWebhooks.has(webhook.id) ? 
                          <ChevronDown className="h-4 w-4" /> : 
                          <ChevronRight className="h-4 w-4" />
                        }
                        <div className="text-left">
                          <div className="font-medium">{webhook.name}</div>
                          <div className="text-sm text-gray-500">
                            {new URL(webhook.url).hostname}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge variant={webhook.enabled ? 'default' : 'secondary'}>
                          {webhook.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                        <div className="text-right">
                          <Badge className={getSuccessRateBadge(webhook.success_rate || 0)}>
                            {((webhook.success_rate || 0) * 100).toFixed(1)}%
                          </Badge>
                          <div className="text-sm text-gray-500 mt-1">
                            {webhook.p95_latency || 0}ms p95
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {webhook.failures || 0} failures
                          </div>
                          {(webhook.dead_letters || 0) > 0 && (
                            <Badge variant="destructive" className="text-xs mt-1">
                              {webhook.dead_letters} dead
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent className="px-4 pb-4">
                      {eventsQuery.isLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        </div>
                      ) : events.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">
                          No events in selected timeframe
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Event Type</TableHead>
                              <TableHead>Time</TableHead>
                              <TableHead>Success</TableHead>
                              <TableHead>Failures</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {events.map((event: WebhookEvent) => {
                              const attemptsQuery = getAttemptsQuery(event.id);
                              const attempts = attemptsQuery.data?.rows || [];
                              const hasFailures = event.fail_count > 0;
                              
                              return (
                                <React.Fragment key={event.id}>
                                  <TableRow>
                                    <TableCell>
                                      <div className="flex items-center space-x-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => toggleEventExpanded(event.id)}
                                          data-testid={`expand-event-${event.id}`}
                                        >
                                          {expandedEvents.has(event.id) ? 
                                            <ChevronDown className="h-4 w-4" /> : 
                                            <ChevronRight className="h-4 w-4" />
                                          }
                                        </Button>
                                        <span className="font-medium">{event.event_type}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      {new Date(event.created_at).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className="bg-green-50 text-green-700">
                                        {event.success_count}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      {event.fail_count > 0 ? (
                                        <Badge variant="destructive">
                                          {event.fail_count}
                                        </Badge>
                                      ) : (
                                        <span className="text-gray-400">0</span>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {hasFailures && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => replayMutation.mutate(event.id)}
                                          disabled={replayMutation.isPending}
                                          data-testid={`replay-${event.id}`}
                                        >
                                          {replayMutation.isPending ? (
                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                          ) : (
                                            <>
                                              <Zap className="h-4 w-4 mr-2" />
                                              Replay
                                            </>
                                          )}
                                        </Button>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                  
                                  {expandedEvents.has(event.id) && (
                                    <TableRow>
                                      <TableCell colSpan={5} className="bg-gray-50 dark:bg-gray-800/50">
                                        {attemptsQuery.isLoading ? (
                                          <div className="flex items-center justify-center py-4">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                          </div>
                                        ) : (
                                          <div className="space-y-2">
                                            <h4 className="font-medium text-sm">Delivery Attempts</h4>
                                            <Table>
                                              <TableHeader>
                                                <TableRow>
                                                  <TableHead className="py-2">Attempt</TableHead>
                                                  <TableHead className="py-2">Status</TableHead>
                                                  <TableHead className="py-2">HTTP Status</TableHead>
                                                  <TableHead className="py-2">Latency</TableHead>
                                                  <TableHead className="py-2">Error</TableHead>
                                                  <TableHead className="py-2">Time</TableHead>
                                                </TableRow>
                                              </TableHeader>
                                              <TableBody>
                                                {attempts.map((attempt: WebhookAttempt) => (
                                                  <TableRow key={attempt.id}>
                                                    <TableCell className="py-2">#{attempt.attempt_no}</TableCell>
                                                    <TableCell className="py-2">
                                                      <Badge 
                                                        variant={attempt.status === 'success' ? 'default' : 'destructive'}
                                                        className="text-xs"
                                                      >
                                                        {attempt.status}
                                                      </Badge>
                                                    </TableCell>
                                                    <TableCell className="py-2">{attempt.http_status}</TableCell>
                                                    <TableCell className="py-2">{attempt.latency_ms}ms</TableCell>
                                                    <TableCell className="py-2 max-w-xs truncate">
                                                      {attempt.error || '—'}
                                                    </TableCell>
                                                    <TableCell className="py-2 text-xs">
                                                      {new Date(attempt.created_at).toLocaleString()}
                                                    </TableCell>
                                                  </TableRow>
                                                ))}
                                              </TableBody>
                                            </Table>
                                          </div>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </TableBody>
                        </Table>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}