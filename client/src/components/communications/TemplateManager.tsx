
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Mail, MessageSquare, Plus, Edit2, Trash2, Eye, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NotificationTemplate {
  id: string;
  name: string;
  type: 'email' | 'sms';
  method: string;
  subject?: string;
  template: string;
  active: boolean;
  createdAt: string;
}

interface TemplateManagerProps {
  onTemplateSelect?: (template: NotificationTemplate) => void;
}

export function TemplateManager({ onTemplateSelect }: TemplateManagerProps) {
  const [isAddTemplateOpen, setIsAddTemplateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<NotificationTemplate | null>(null);
  const [templateTypeFilter, setTemplateTypeFilter] = useState<'all' | 'email' | 'sms'>('all');
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    type: 'email' as 'email' | 'sms',
    method: 'manual',
    subject: '',
    template: '',
    active: true
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch templates
  const { data: templates, isLoading } = useQuery<NotificationTemplate[]>({
    queryKey: ['/api/admin/notification-templates'],
    queryFn: async () => {
      const response = await fetch('/api/admin/notification-templates', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch templates');
      return response.json();
    }
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (template: typeof newTemplate) => {
      const response = await fetch('/api/admin/notification-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(template)
      });
      if (!response.ok) throw new Error('Failed to create template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/notification-templates'] });
      toast({ title: "Success", description: "Template created successfully" });
      setIsAddTemplateOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create template", variant: "destructive" });
    }
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async (template: NotificationTemplate) => {
      const response = await fetch(`/api/admin/notification-templates/${template.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(template)
      });
      if (!response.ok) throw new Error('Failed to update template');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/notification-templates'] });
      toast({ title: "Success", description: "Template updated successfully" });
      setEditingTemplate(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update template", variant: "destructive" });
    }
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/notification-templates/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to delete template');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/notification-templates'] });
      toast({ title: "Success", description: "Template deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete template", variant: "destructive" });
    }
  });

  const resetForm = () => {
    setNewTemplate({
      name: '',
      type: 'email',
      method: 'manual',
      subject: '',
      template: '',
      active: true
    });
  };

  const filteredTemplates = templates?.filter(template => 
    templateTypeFilter === 'all' || template.type === templateTypeFilter
  ) || [];

  const methodNames: Record<string, string> = {
    'booking_confirmation': 'Booking Confirmation',
    'reminder_24h': '24-Hour Reminder',
    'status_update': 'Status Update',
    'invitation': 'Invitation',
    'welcome': 'Welcome Message',
    'manual': 'Manual Send'
  };

  const renderTemplatePreview = (template: NotificationTemplate) => {
    const sampleData = {
      customerName: 'John Doe',
      playerName: 'Alex Smith',
      sessionDate: 'Monday, January 15, 2024',
      sessionTime: '2:00 PM',
      location: 'Main Training Center',
      sessionName: 'Elite Training',
      confirmationCode: 'ABC123',
      tenantName: 'Elite Sports Academy',
      businessPhone: '(555) 123-4567'
    };

    let preview = template.template;
    Object.entries(sampleData).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    return preview;
  };

  const getAvailableVariables = () => [
    { name: 'customerName', example: 'John Doe' },
    { name: 'firstName', example: 'John' },
    { name: 'playerName', example: 'Alex Smith' },
    { name: 'sessionDate', example: 'Monday, January 15, 2024' },
    { name: 'sessionTime', example: '2:00 PM' },
    { name: 'location', example: 'Main Training Center' },
    { name: 'sessionName', example: 'Elite Training' },
    { name: 'confirmationCode', example: 'ABC123' },
    { name: 'tenantName', example: 'Elite Sports Academy' },
    { name: 'businessPhone', example: '(555) 123-4567' },
    { name: 'inviteUrl', example: 'https://app.playhq.app/invite/abc123' },
    { name: 'expiresAt', example: 'January 20, 2024' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Template Management</h2>
          <p className="text-muted-foreground">Create and manage email and SMS templates</p>
        </div>
        <Dialog open={isAddTemplateOpen} onOpenChange={setIsAddTemplateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Template Details</TabsTrigger>
                <TabsTrigger value="content">Content & Preview</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Template Name</label>
                    <Input
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter template name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Type</label>
                    <Select value={newTemplate.type} onValueChange={(value: 'email' | 'sms') => 
                      setNewTemplate(prev => ({ ...prev, type: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Method</label>
                  <Select value={newTemplate.method} onValueChange={(value) => 
                    setNewTemplate(prev => ({ ...prev, method: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual Send</SelectItem>
                      <SelectItem value="booking_confirmation">Booking Confirmation</SelectItem>
                      <SelectItem value="reminder_24h">24-Hour Reminder</SelectItem>
                      <SelectItem value="invitation">Invitation</SelectItem>
                      <SelectItem value="welcome">Welcome Message</SelectItem>
                      <SelectItem value="status_update">Status Update</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newTemplate.type === 'email' && (
                  <div>
                    <label className="text-sm font-medium">Subject Line</label>
                    <Input
                      value={newTemplate.subject}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Enter email subject"
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={newTemplate.active}
                    onCheckedChange={(checked) => setNewTemplate(prev => ({ ...prev, active: checked }))}
                  />
                  <label className="text-sm font-medium">Active Template</label>
                </div>
              </TabsContent>

              <TabsContent value="content" className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Template Content</label>
                  <Textarea
                    value={newTemplate.template}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, template: e.target.value }))}
                    className="min-h-[200px]"
                    placeholder="Enter your template content with variables like {{customerName}}, {{sessionDate}}, etc."
                  />
                  {newTemplate.type === 'sms' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Character count: {newTemplate.template.length}/160 (optimal for SMS)
                    </p>
                  )}
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Available Variables:</h4>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    {getAvailableVariables().map(variable => (
                      <div key={variable.name} className="flex flex-col">
                        <code className="text-blue-600">{{`{{${variable.name}}}`}}</code>
                        <span className="text-muted-foreground text-xs">{variable.example}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {newTemplate.template && (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Preview:</h4>
                    <div className="bg-background p-3 rounded border text-sm whitespace-pre-wrap">
                      {renderTemplatePreview(newTemplate as any)}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddTemplateOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => createTemplateMutation.mutate(newTemplate)}
                disabled={createTemplateMutation.isPending || !newTemplate.name || !newTemplate.template}
              >
                {createTemplateMutation.isPending ? 'Creating...' : 'Create Template'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={templateTypeFilter} onValueChange={(value: 'all' | 'email' | 'sms') => setTemplateTypeFilter(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="email">Email Only</SelectItem>
            <SelectItem value="sms">SMS Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Templates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
          <CardDescription>Manage your notification templates</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p>No templates found. Create your first template to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {template.type === 'email' ? 
                          <Mail className="w-4 h-4 text-blue-500" /> : 
                          <MessageSquare className="w-4 h-4 text-green-500" />
                        }
                        {template.type}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {methodNames[template.method] || template.method}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={template.active ? "default" : "secondary"}>
                        {template.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(template.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewTemplate(template)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingTemplate(template)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        {onTemplateSelect && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onTemplateSelect(template)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Template</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{template.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteTemplateMutation.mutate(template.id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      {previewTemplate && (
        <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{previewTemplate.name} - Preview</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {previewTemplate.subject && (
                <div>
                  <h4 className="font-medium">Subject:</h4>
                  <div className="bg-muted p-3 rounded">{previewTemplate.subject}</div>
                </div>
              )}
              <div>
                <h4 className="font-medium">Content:</h4>
                <div className="bg-muted p-3 rounded text-sm whitespace-pre-wrap">
                  {renderTemplatePreview(previewTemplate)}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setPreviewTemplate(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
