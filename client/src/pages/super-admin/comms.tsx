import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Mail, MessageSquare, TrendingUp, BarChart3, Eye, MousePointer, AlertTriangle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import FilterBar from '@/components/shared/FilterBar';

interface EmailStats {
  delivered: number;
  failed: number;
  opens: number;
  clicks: number;
}

interface SmsStats {
  delivered: number;
  failed: number;
}

interface Template {
  template_key: string;
  delivered: number;
  failed: number;
  opens: number;
  clicks: number;
}

interface CommsOverview {
  email: EmailStats;
  sms: SmsStats;
  templates: Template[];
}

interface SeriesData {
  email: { d: string; delivered: number; failed: number; }[];
  sms: { d: string; delivered: number; failed: number; }[];
}

interface EventsResponse {
  rows: any[];
  page: number;
  pageSize: number;
  totalRows: number;
}

export default function CommsDeliverability() {
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    to: new Date().toISOString(),
  });
  const [selectedChannel, setSelectedChannel] = useState<'email' | 'sms'>('email');
  const [eventsPage, setEventsPage] = useState(1);

  // Overview query
  const { data: overview, isLoading: overviewLoading } = useQuery<CommsOverview>({
    queryKey: ['super-admin', 'comms', 'overview', dateRange],
    queryFn: () => apiRequest(`/api/super-admin/comms/overview?from=${encodeURIComponent(dateRange.from)}&to=${encodeURIComponent(dateRange.to)}`),
  });

  // Series query for charts
  const { data: seriesData } = useQuery<SeriesData>({
    queryKey: ['super-admin', 'comms', 'series', dateRange],
    queryFn: () => apiRequest(`/api/super-admin/comms/series?from=${encodeURIComponent(dateRange.from)}&to=${encodeURIComponent(dateRange.to)}`),
  });

  // Events query
  const { data: eventsData, isLoading: eventsLoading } = useQuery<EventsResponse>({
    queryKey: ['super-admin', 'comms', 'events', selectedChannel, dateRange, eventsPage],
    queryFn: () => apiRequest(`/api/super-admin/comms/events?channel=${selectedChannel}&from=${encodeURIComponent(dateRange.from)}&to=${encodeURIComponent(dateRange.to)}&page=${eventsPage}&pageSize=25`),
  });

  const emailStats = overview?.email || { delivered: 0, failed: 0, opens: 0, clicks: 0 };
  const smsStats = overview?.sms || { delivered: 0, failed: 0 };
  const templates = overview?.templates || [];

  // Calculate delivery rates
  const emailDeliveryRate = emailStats.delivered + emailStats.failed > 0 
    ? (emailStats.delivered / (emailStats.delivered + emailStats.failed)) * 100 
    : 0;
  const smsDeliveryRate = smsStats.delivered + smsStats.failed > 0 
    ? (smsStats.delivered / (smsStats.delivered + smsStats.failed)) * 100 
    : 0;

  // Calculate CTR (Click Through Rate)
  const emailCTR = emailStats.delivered > 0 
    ? (emailStats.clicks / emailStats.delivered) * 100 
    : 0;

  // Calculate open rate
  const emailOpenRate = emailStats.delivered > 0 
    ? (emailStats.opens / emailStats.delivered) * 100 
    : 0;

  // Prepare chart data
  const chartData = selectedChannel === 'email' 
    ? (seriesData?.email || []).map(item => ({
        date: new Date(item.d).toLocaleDateString(),
        delivered: item.delivered,
        failed: item.failed,
        rate: item.delivered + item.failed > 0 ? (item.delivered / (item.delivered + item.failed)) * 100 : 0,
      }))
    : (seriesData?.sms || []).map(item => ({
        date: new Date(item.d).toLocaleDateString(),
        delivered: item.delivered,
        failed: item.failed,
        rate: item.delivered + item.failed > 0 ? (item.delivered / (item.delivered + item.failed)) * 100 : 0,
      }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Communications Deliverability
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Monitor email and SMS delivery performance across all tenants
          </p>
        </div>
      </div>

      <FilterBar
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />

      <Tabs value={selectedChannel} onValueChange={(value) => setSelectedChannel(value as 'email' | 'sms')}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="email" data-testid="tab-email">
            <Mail className="h-4 w-4 mr-2" />
            Email
          </TabsTrigger>
          <TabsTrigger value="sms" data-testid="tab-sms">
            <MessageSquare className="h-4 w-4 mr-2" />
            SMS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="space-y-6">
          {/* Email KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card data-testid="email-delivered">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Delivered</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {emailStats.delivered.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {emailDeliveryRate.toFixed(1)}% delivery rate
                </p>
              </CardContent>
            </Card>

            <Card data-testid="email-failed">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Failed</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {emailStats.failed.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Bounces, drops, spam reports
                </p>
              </CardContent>
            </Card>

            <Card data-testid="email-opens">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Opens</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {emailStats.opens.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {emailOpenRate.toFixed(1)}% open rate
                </p>
              </CardContent>
            </Card>

            <Card data-testid="email-clicks">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clicks</CardTitle>
                <MousePointer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {emailStats.clicks.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {emailCTR.toFixed(2)}% CTR
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sms" className="space-y-6">
          {/* SMS KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card data-testid="sms-delivered">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Delivered</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {smsStats.delivered.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {smsDeliveryRate.toFixed(1)}% delivery rate
                </p>
              </CardContent>
            </Card>

            <Card data-testid="sms-failed">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Failed</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {smsStats.failed.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Undelivered, failed
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Time Series Chart */}
      <Card data-testid="delivery-chart">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            {selectedChannel.toUpperCase()} Delivery Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="delivered" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Delivered"
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="failed" 
                stroke="#ef4444" 
                strokeWidth={2}
                name="Failed"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="rate" 
                stroke="#6366f1" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Success Rate (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Template Performance (Email only) */}
      {selectedChannel === 'email' && (
        <Card data-testid="template-performance">
          <CardHeader>
            <CardTitle>Email Template Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {templates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No template data available for selected timeframe
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead data-testid="header-template">Template Key</TableHead>
                    <TableHead data-testid="header-delivered">Delivered</TableHead>
                    <TableHead data-testid="header-failed">Failed</TableHead>
                    <TableHead data-testid="header-open-rate">Open Rate</TableHead>
                    <TableHead data-testid="header-click-rate">Click Rate</TableHead>
                    <TableHead data-testid="header-performance">Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.slice(0, 10).map((template) => {
                    const openRate = template.delivered > 0 ? (template.opens / template.delivered) * 100 : 0;
                    const clickRate = template.delivered > 0 ? (template.clicks / template.delivered) * 100 : 0;
                    const deliveryRate = template.delivered + template.failed > 0 
                      ? (template.delivered / (template.delivered + template.failed)) * 100 
                      : 0;
                    
                    return (
                      <TableRow key={template.template_key} data-testid={`template-${template.template_key}`}>
                        <TableCell className="font-medium">{template.template_key}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            {template.delivered.toLocaleString()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {template.failed > 0 ? (
                            <Badge variant="destructive">
                              {template.failed.toLocaleString()}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{openRate.toFixed(1)}%</span>
                          <div className="text-xs text-gray-500">{template.opens.toLocaleString()} opens</div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{clickRate.toFixed(1)}%</span>
                          <div className="text-xs text-gray-500">{template.clicks.toLocaleString()} clicks</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-green-500 transition-all duration-300"
                                style={{ width: `${Math.min(deliveryRate, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600">{deliveryRate.toFixed(1)}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Event Explorer */}
      <Card data-testid="event-explorer">
        <CardHeader>
          <CardTitle>
            {selectedChannel.toUpperCase()} Event Explorer
          </CardTitle>
        </CardHeader>
        <CardContent>
          {eventsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : !eventsData || eventsData.rows.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No {selectedChannel} events found for selected timeframe
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Reason/Code</TableHead>
                    <TableHead>Tenant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eventsData.rows.map((event, index) => (
                    <TableRow key={`${event.id || index}`} data-testid={`event-row-${index}`}>
                      <TableCell className="text-sm">
                        {new Date(event.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{event.provider}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {selectedChannel === 'email' ? event.to_addr : event.to_number}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            event.event === 'delivered' ? 'default' :
                            ['bounce', 'dropped', 'spamreport', 'undelivered', 'failed'].includes(event.event) ? 'destructive' :
                            'secondary'
                          }
                        >
                          {event.event}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {selectedChannel === 'email' ? event.reason : event.error_code || '—'}
                      </TableCell>
                      <TableCell>
                        {event.tenant_id || 'System'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Pagination */}
              {eventsData.totalRows > eventsData.pageSize && (
                <div className="flex items-center justify-between px-2 py-4">
                  <div className="text-sm text-gray-500">
                    Showing {((eventsData.page - 1) * eventsData.pageSize) + 1} to {Math.min(eventsData.page * eventsData.pageSize, eventsData.totalRows)} of {eventsData.totalRows} events
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEventsPage(p => Math.max(1, p - 1))}
                      disabled={eventsData.page <= 1}
                      data-testid="prev-page"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEventsPage(p => p + 1)}
                      disabled={eventsData.page * eventsData.pageSize >= eventsData.totalRows}
                      data-testid="next-page"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}