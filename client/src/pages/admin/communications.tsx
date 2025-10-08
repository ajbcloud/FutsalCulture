import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { Mail, MessageSquare, Users, Calendar, Clock, Send, Plus, Edit2, Trash2, Play, Pause, Filter, ChevronRight, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import type { SelectCommunicationCampaign } from '@shared/schema';
import AdminLayout from '@/components/admin-layout';
import { TemplateManager } from '@/components/communications/TemplateManager';

export default function AdminCommunications() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('campaigns');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<SelectCommunicationCampaign | null>(null);
  
  // Form state for creating/editing campaigns
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    type: 'email' as 'email' | 'sms',
    subject: '',
    content: '',
    recipientType: 'all_parents',
    schedule: 'immediate',
    scheduledFor: '',
    recurringPattern: '',
    recurringDays: [] as string[],
    recurringTime: '',
    recurringEndDate: '',
    recipientFilters: {
      ageGroups: [] as string[],
      locations: [] as string[],
      genders: [] as string[]
    }
  });

  // Fetch campaigns
  const { data: campaigns = [], isLoading } = useQuery<SelectCommunicationCampaign[]>({
    queryKey: ['/api/admin/campaigns'],
    queryFn: async () => {
      const response = await fetch('/api/admin/campaigns', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch campaigns');
      return response.json();
    }
  });

  // Create campaign mutation
  const createCampaign = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create campaign');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/campaigns'] });
      setCreateDialogOpen(false);
      resetForm();
      toast({
        title: 'Campaign created',
        description: 'Your communication campaign has been created successfully.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create campaign. Please try again.',
        variant: 'destructive'
      });
    }
  });

  // Update campaign mutation
  const updateCampaign = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/admin/campaigns/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update campaign');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/campaigns'] });
      setEditingCampaign(null);
      resetForm();
      toast({
        title: 'Campaign updated',
        description: 'Your campaign has been updated successfully.'
      });
    }
  });

  // Delete campaign mutation
  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/campaigns/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to delete campaign');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/campaigns'] });
      toast({
        title: 'Campaign deleted',
        description: 'The campaign has been deleted.'
      });
    }
  });

  // Send campaign mutation
  const sendCampaign = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/campaigns/${id}/send`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to send campaign');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/campaigns'] });
      toast({
        title: 'Campaign sent',
        description: 'Your campaign is being sent to recipients.'
      });
    }
  });

  const resetForm = () => {
    setCampaignForm({
      name: '',
      type: 'email',
      subject: '',
      content: '',
      recipientType: 'all_parents',
      schedule: 'immediate',
      scheduledFor: '',
      recurringPattern: '',
      recurringDays: [],
      recurringTime: '',
      recurringEndDate: '',
      recipientFilters: {
        ageGroups: [],
        locations: [],
        genders: []
      }
    });
  };

  const handleCreateOrUpdate = () => {
    if (editingCampaign) {
      updateCampaign.mutate({ id: editingCampaign.id, data: campaignForm });
    } else {
      createCampaign.mutate(campaignForm);
    }
  };

  const openEditDialog = (campaign: SelectCommunicationCampaign) => {
    setEditingCampaign(campaign);
    setCampaignForm({
      name: campaign.name,
      type: campaign.type as 'email' | 'sms',
      subject: campaign.subject || '',
      content: campaign.content,
      recipientType: campaign.recipientType,
      schedule: campaign.schedule,
      scheduledFor: campaign.scheduledFor ? format(new Date(campaign.scheduledFor), "yyyy-MM-dd'T'HH:mm") : '',
      recurringPattern: campaign.recurringPattern || '',
      recurringDays: campaign.recurringDays || [],
      recurringTime: campaign.recurringTime || '',
      recurringEndDate: campaign.recurringEndDate ? format(new Date(campaign.recurringEndDate), "yyyy-MM-dd") : '',
      recipientFilters: {
        ageGroups: campaign.recipientFilters?.ageGroups || [],
        locations: campaign.recipientFilters?.locations || [],
        genders: campaign.recipientFilters?.genders || []
      }
    });
    setCreateDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      scheduled: 'bg-blue-100 text-blue-800',
      sending: 'bg-yellow-100 text-yellow-800',
      sent: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return <Badge className={statusColors[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>;
  };

  return (
    <AdminLayout>
      <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Communications</h1>
        <p className="text-muted-foreground mt-2">Manage mass email and SMS campaigns for parents and players</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => { resetForm(); setEditingCampaign(null); setCreateDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              New Campaign
            </Button>
          </div>

          <div className="grid gap-4">
            {isLoading ? (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center text-muted-foreground">Loading campaigns...</div>
                </CardContent>
              </Card>
            ) : campaigns.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <Mail className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No campaigns yet</h3>
                    <p className="text-muted-foreground mb-4">Create your first communication campaign to reach parents and players</p>
                    <Button onClick={() => { resetForm(); setEditingCampaign(null); setCreateDialogOpen(true); }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Campaign
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              campaigns.map((campaign) => (
                <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {campaign.type === 'email' ? (
                            <Mail className="w-5 h-5 text-blue-600" />
                          ) : (
                            <MessageSquare className="w-5 h-5 text-green-600" />
                          )}
                          <h3 className="text-lg font-semibold">{campaign.name}</h3>
                          {getStatusBadge(campaign.status)}
                        </div>
                        
                        {campaign.subject && (
                          <p className="text-sm text-muted-foreground mb-2">Subject: {campaign.subject}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {campaign.recipientType.replace('_', ' ')}
                          </span>
                          
                          {campaign.schedule === 'recurring' && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {campaign.recurringPattern}
                            </span>
                          )}
                          
                          {campaign.scheduledFor && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {format(new Date(campaign.scheduledFor), 'MMM d, yyyy h:mm a')}
                            </span>
                          )}
                          
                          {campaign.sentCount && campaign.sentCount > 0 && (
                            <span>
                              Sent: {campaign.sentCount}
                              {campaign.failedCount && campaign.failedCount > 0 && ` (${campaign.failedCount} failed)`}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {campaign.status === 'draft' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(campaign)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => sendCampaign.mutate(campaign.id)}
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        
                        {campaign.status === 'scheduled' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateCampaign.mutate({ id: campaign.id, data: { status: 'cancelled' } })}
                          >
                            <Pause className="w-4 h-4" />
                          </Button>
                        )}
                        
                        {(campaign.status === 'draft' || campaign.status === 'cancelled') && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteCampaign.mutate(campaign.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <TemplateManager />
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Communication History</CardTitle>
              <CardDescription>View all sent communications and their delivery status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Communication history coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Campaign Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}</DialogTitle>
            <DialogDescription>
              Set up a communication campaign to reach parents and players
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              
              <div>
                <Label htmlFor="name">Campaign Name *</Label>
                <Input
                  id="name"
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Weekly Training Update"
                  required
                />
              </div>

              <div>
                <Label htmlFor="type">Message Type *</Label>
                <Select
                  value={campaignForm.type}
                  onValueChange={(value) => setCampaignForm(prev => ({ ...prev, type: value as 'email' | 'sms' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {campaignForm.type === 'email' && (
                <div>
                  <Label htmlFor="subject">Email Subject *</Label>
                  <Input
                    id="subject"
                    value={campaignForm.subject}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="e.g., This Week's Training Schedule"
                    required
                  />
                </div>
              )}

              <div>
                <Label htmlFor="content">Message Content *</Label>
                <Textarea
                  id="content"
                  value={campaignForm.content}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder={campaignForm.type === 'sms' ? 'Enter your SMS message (160 characters max for best delivery)' : 'Enter your email message content...'}
                  rows={campaignForm.type === 'sms' ? 3 : 8}
                  required
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                />
                {campaignForm.type === 'sms' && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {campaignForm.content.length}/160 characters
                  </p>
                )}
              </div>
            </div>

            {/* Recipients */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Recipients</h3>
              
              <div>
                <Label htmlFor="recipientType">Recipient Group *</Label>
                <Select
                  value={campaignForm.recipientType}
                  onValueChange={(value) => setCampaignForm(prev => ({ ...prev, recipientType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_parents">All Parents</SelectItem>
                    <SelectItem value="all_players">All Players (13+)</SelectItem>
                    <SelectItem value="specific_age_groups">Specific Age Groups</SelectItem>
                    <SelectItem value="specific_locations">Specific Locations</SelectItem>
                    <SelectItem value="custom">Custom Selection</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(campaignForm.recipientType === 'specific_age_groups' || campaignForm.recipientType === 'custom') && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Advanced filtering options will be available in the next update
                  </p>
                </div>
              )}
            </div>

            {/* Schedule */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Schedule</h3>
              
              <div>
                <Label htmlFor="schedule">Send Timing *</Label>
                <Select
                  value={campaignForm.schedule}
                  onValueChange={(value) => setCampaignForm(prev => ({ ...prev, schedule: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Send Immediately</SelectItem>
                    <SelectItem value="scheduled">Schedule for Later</SelectItem>
                    <SelectItem value="recurring">Recurring</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {campaignForm.schedule === 'scheduled' && (
                <div>
                  <Label htmlFor="scheduledFor">Scheduled Date & Time</Label>
                  <Input
                    id="scheduledFor"
                    type="datetime-local"
                    value={campaignForm.scheduledFor}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, scheduledFor: e.target.value }))}
                    required
                  />
                </div>
              )}

              {campaignForm.schedule === 'recurring' && (
                <>
                  <div>
                    <Label htmlFor="recurringPattern">Recurring Pattern</Label>
                    <Select
                      value={campaignForm.recurringPattern}
                      onValueChange={(value) => setCampaignForm(prev => ({ ...prev, recurringPattern: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select pattern" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="recurringTime">Send Time</Label>
                    <Input
                      id="recurringTime"
                      type="time"
                      value={campaignForm.recurringTime}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, recurringTime: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="recurringEndDate">End Date (Optional)</Label>
                    <Input
                      id="recurringEndDate"
                      type="date"
                      value={campaignForm.recurringEndDate}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, recurringEndDate: e.target.value }))}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateOrUpdate}>
              {editingCampaign ? 'Update Campaign' : 'Create Campaign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </AdminLayout>
  );
}