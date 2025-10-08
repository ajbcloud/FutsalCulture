import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Edit, Eye, Info } from "lucide-react";
import type { NotificationTemplate } from "@shared/schema";

const TEMPLATE_METHODS = [
  { value: "booking_confirmation", label: "Booking Confirmation" },
  { value: "reminder_24h", label: "24h Reminder" },
  { value: "session_cancelled", label: "Session Cancelled" },
  { value: "credit_applied", label: "Credit Applied" },
  { value: "payment_received", label: "Payment Received" },
  { value: "waitlist_joined", label: "Waitlist Joined" },
  { value: "waitlist_spot_available", label: "Waitlist Spot Available" },
  { value: "waitlist_payment_reminder", label: "Waitlist Payment Reminder" },
  { value: "waitlist_payment_expired", label: "Waitlist Payment Expired" },
  { value: "email_verification", label: "Email Verification" },
  { value: "welcome", label: "Welcome Email" },
  { value: "password_reset", label: "Password Reset" },
  { value: "help_request_received", label: "Help Request Received" },
  { value: "help_request_resolved", label: "Help Request Resolved" },
  { value: "player_portal_access", label: "Player Portal Access" },
  { value: "manual", label: "Manual Message" },
];

const AVAILABLE_VARIABLES = [
  { var: "{{parentName}}", desc: "Parent/Adult's full name" },
  { var: "{{playerName}}", desc: "Player's full name" },
  { var: "{{sessionDate}}", desc: "Session date" },
  { var: "{{sessionTime}}", desc: "Session time" },
  { var: "{{sessionLocation}}", desc: "Session location" },
  { var: "{{sessionAgeGroup}}", desc: "Session age group" },
  { var: "{{creditAmount}}", desc: "Credit amount" },
  { var: "{{organizationName}}", desc: "Organization/tenant name" },
  { var: "{{organizationPhone}}", desc: "Organization phone number" },
  { var: "{{waitlistPosition}}", desc: "Position on waitlist" },
  { var: "{{paymentWindowHours}}", desc: "Payment window in hours" },
  { var: "{{paymentDeadline}}", desc: "Payment deadline date/time" },
  { var: "{{verificationLink}}", desc: "Email verification link" },
  { var: "{{resetLink}}", desc: "Password reset link" },
  { var: "{{ticketNumber}}", desc: "Help request ticket number" },
  { var: "{{subject}}", desc: "Help request subject" },
  { var: "{{category}}", desc: "Help request category" },
  { var: "{{priority}}", desc: "Help request priority" },
  { var: "{{resolutionNotes}}", desc: "Help request resolution notes" },
];

export default function TemplateManager() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<NotificationTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<NotificationTemplate | null>(null);
  const [filterType, setFilterType] = useState<"all" | "email" | "sms">("all");
  const [formData, setFormData] = useState({
    name: "",
    type: "email" as "email" | "sms",
    method: "manual",
    subject: "",
    template: "",
    active: true,
  });

  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['/api/templates'],
    queryFn: async () => {
      const response = await fetch('/api/templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      return response.json();
    }
  });

  const templates = templatesData?.templates || [];

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/templates", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({ title: "Template created successfully" });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create template",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest("PATCH", `/api/templates/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({ title: "Template updated successfully" });
      setEditingTemplate(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update template",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({ title: "Template deleted successfully" });
      setDeletingTemplate(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete template",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const setupDefaultsMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/templates/setup-defaults"),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      if (data.created > 0) {
        toast({ 
          title: "Default templates created",
          description: `Successfully created ${data.created} default templates`
        });
      } else {
        toast({ 
          title: "Default templates already exist",
          description: "Your tenant already has default templates set up"
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create default templates",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      type: "email",
      method: "manual",
      subject: "",
      template: "",
      active: true,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTemplate) {
      updateMutation.mutate({
        id: editingTemplate.id,
        data: formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (template: NotificationTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      type: template.type,
      method: template.method,
      subject: template.subject || "",
      template: template.template,
      active: template.active ?? true,
    });
  };

  const insertVariable = (variable: string) => {
    setFormData((prev) => ({
      ...prev,
      template: prev.template + variable,
    }));
  };

  const renderPreview = () => {
    if (!previewTemplate) return null;

    let preview = previewTemplate.template;
    AVAILABLE_VARIABLES.forEach(({ var: varName }) => {
      const sampleValue = varName
        .replace("{{", "")
        .replace("}}", "")
        .replace(/([A-Z])/g, " $1")
        .trim();
      preview = preview.replace(new RegExp(varName, "g"), `[${sampleValue}]`);
    });

    return preview;
  };

  const filteredTemplates = templates.filter((t) => {
    if (filterType === "all") return true;
    return t.type === filterType;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Tabs value={filterType} onValueChange={(v) => setFilterType(v as any)} className="w-full">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="all" data-testid="filter-all">All Templates</TabsTrigger>
              <TabsTrigger value="email" data-testid="filter-email">Email</TabsTrigger>
              <TabsTrigger value="sms" data-testid="filter-sms">SMS</TabsTrigger>
            </TabsList>
            <div className="flex gap-2">
              {templates.length === 0 && (
                <Button
                  onClick={() => setupDefaultsMutation.mutate()}
                  disabled={setupDefaultsMutation.isPending}
                  variant="outline"
                  data-testid="button-setup-defaults"
                >
                  {setupDefaultsMutation.isPending ? "Creating..." : "Setup Default Templates"}
                </Button>
              )}
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      resetForm();
                      setIsCreateOpen(true);
                    }}
                    data-testid="button-create-template"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Template
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </div>
        </Tabs>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">
            {filterType === "all" ? "All Templates" : filterType === "email" ? "Email Templates" : "SMS Templates"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTemplates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No templates found. Create your first template to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTemplates.map((template) => (
                  <TableRow key={template.id} data-testid={`row-template-${template.id}`}>
                    <TableCell className="font-medium" data-testid={`text-name-${template.id}`}>
                      {template.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant={template.type === "email" ? "default" : "secondary"} data-testid={`badge-type-${template.id}`}>
                        {template.type}
                      </Badge>
                    </TableCell>
                    <TableCell data-testid={`text-method-${template.id}`}>
                      {TEMPLATE_METHODS.find((m) => m.value === template.method)?.label || template.method}
                    </TableCell>
                    <TableCell>
                      <Badge variant={template.active ? "default" : "outline"} data-testid={`badge-status-${template.id}`}>
                        {template.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setPreviewTemplate(template)}
                          data-testid={`button-preview-${template.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(template)}
                          data-testid={`button-edit-${template.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingTemplate(template)}
                          data-testid={`button-delete-${template.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen || !!editingTemplate} onOpenChange={(open) => {
        if (!open) {
          setIsCreateOpen(false);
          setEditingTemplate(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Edit Template" : "Create Template"}</DialogTitle>
            <DialogDescription>
              {editingTemplate ? "Update the template details below." : "Create a new notification template for emails or SMS messages."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Booking Confirmation"
                  required
                  data-testid="input-template-name"
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "email" | "sms") => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger data-testid="select-template-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="method">Method</Label>
                <Select
                  value={formData.method}
                  onValueChange={(value) => setFormData({ ...formData, method: value })}
                >
                  <SelectTrigger data-testid="select-template-method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_METHODS.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formData.type === "email" && (
                <div>
                  <Label htmlFor="subject">Subject Line</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g., Your booking is confirmed"
                    data-testid="input-template-subject"
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="template">Template Content</Label>
              <Textarea
                id="template"
                value={formData.template}
                onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                placeholder="Enter your message template here. Use variables like {{parentName}} for dynamic content."
                rows={8}
                required
                data-testid="textarea-template-content"
              />
            </div>

            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Available Variables
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_VARIABLES.map(({ var: varName, desc }) => (
                    <Button
                      key={varName}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => insertVariable(varName)}
                      className="justify-start text-left"
                      data-testid={`button-variable-${varName.replace(/[{}]/g, "")}`}
                    >
                      <code className="text-xs">{varName}</code>
                      <span className="ml-2 text-muted-foreground text-xs">- {desc}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                data-testid="switch-template-active"
              />
              <Label htmlFor="active">Active</Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditingTemplate(null);
                  resetForm();
                }}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save-template"
              >
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingTemplate ? "Update Template" : "Create Template"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>
              This is how the template will appear with sample data.
            </DialogDescription>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              {previewTemplate.type === "email" && previewTemplate.subject && (
                <div>
                  <Label>Subject</Label>
                  <div className="p-3 bg-muted rounded-md mt-1" data-testid="text-preview-subject">
                    {previewTemplate.subject}
                  </div>
                </div>
              )}
              <div>
                <Label>Message</Label>
                <div className="p-4 bg-muted rounded-md mt-1 whitespace-pre-wrap" data-testid="text-preview-message">
                  {renderPreview()}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setPreviewTemplate(null)} data-testid="button-close-preview">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingTemplate} onOpenChange={(open) => !open && setDeletingTemplate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingTemplate?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingTemplate && deleteMutation.mutate(deletingTemplate.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
