import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Send, Users, Loader2 } from "lucide-react";
import { AGE_GROUPS } from "@shared/constants";
import type { NotificationTemplate } from "@shared/schema";

const AVAILABLE_VARIABLES = [
  { var: "{{parentName}}", desc: "Parent's full name" },
  { var: "{{playerName}}", desc: "Player's full name" },
  { var: "{{sessionDate}}", desc: "Session date" },
  { var: "{{sessionTime}}", desc: "Session time" },
  { var: "{{location}}", desc: "Session location" },
  { var: "{{amount}}", desc: "Payment amount" },
  { var: "{{creditAmount}}", desc: "Credit amount" },
  { var: "{{businessName}}", desc: "Business name" },
];

interface SendResult {
  sent: number;
  failed: number;
  results: Array<{ recipient: string; success: boolean; error?: string }>;
}

export default function SendNotification() {
  const { toast } = useToast();
  const [notificationType, setNotificationType] = useState<"email" | "sms">("email");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [recipientType, setRecipientType] = useState<"all_parents" | "all_players" | "age_groups" | "contact_groups" | "custom">("all_parents");
  const [selectedAgeGroups, setSelectedAgeGroups] = useState<string[]>([]);
  const [selectedContactGroup, setSelectedContactGroup] = useState<string>("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [customRecipients, setCustomRecipients] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [sendResult, setSendResult] = useState<SendResult | null>(null);

  const { data: templatesData } = useQuery({
    queryKey: ['/api/templates'],
    queryFn: async () => {
      const response = await fetch('/api/templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      return response.json();
    }
  });

  const templates = templatesData?.templates || [];

  const { data: contactGroupsData } = useQuery({
    queryKey: ['/api/contact-groups'],
    queryFn: async () => {
      const response = await fetch('/api/contact-groups');
      if (!response.ok) throw new Error('Failed to fetch contact groups');
      return response.json();
    }
  });

  const contactGroups = contactGroupsData?.groups || [];

  const { data: usersData } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    }
  });

  const allUsers = usersData?.users || [];
  const eligibleUsers = allUsers.filter((u: any) => 
    u.role === 'parent' || (u.role === 'player' && u.canAccessPortal)
  );

  const { data: stats } = useQuery({
    queryKey: ["/api/admin/stats"],
  });

  const sendMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/notifications/send-bulk", data);
      return response;
    },
    onSuccess: (data: SendResult) => {
      setSendResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Messages sent successfully",
        description: `Sent ${data.sent} message(s), ${data.failed} failed`,
      });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send messages",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedTemplate("");
    setCustomMessage("");
    setCustomRecipients("");
    setSelectedAgeGroups([]);
    setSelectedContactGroup("");
    setSelectedUserIds([]);
  };

  const activeTemplates = templates.filter((t) => t.active);
  const selectedTemplateData = activeTemplates.find((t) => t.id === selectedTemplate);

  const getRecipientCount = (): number => {
    switch (recipientType) {
      case "all_parents":
        return stats?.totalParents || 0;
      case "all_players":
        return stats?.totalPlayers || 0;
      case "age_groups":
        // Estimate based on age groups selected
        const totalPlayers = stats?.totalPlayers || 0;
        const ageGroupCount = AGE_GROUPS.length;
        return Math.round((totalPlayers / ageGroupCount) * selectedAgeGroups.length);
      case "contact_groups":
        const selectedGroup = contactGroups.find((g: any) => g.id === selectedContactGroup);
        return selectedGroup?.memberCount || 0;
      case "custom":
        return selectedUserIds.length;
      default:
        return 0;
    }
  };

  const handleSend = () => {
    if (!selectedTemplate && !customMessage) {
      toast({
        title: "Template or message required",
        description: "Please select a template or enter a custom message",
        variant: "destructive",
      });
      return;
    }

    setShowConfirmDialog(true);
  };

  const confirmSend = () => {
    const data: any = {
      type: notificationType,
      templateId: selectedTemplate || undefined,
      customMessage: customMessage || undefined,
      recipientType,
    };

    if (recipientType === "age_groups") {
      data.ageGroups = selectedAgeGroups;
    } else if (recipientType === "contact_groups") {
      data.contactGroupId = selectedContactGroup;
    } else if (recipientType === "custom") {
      data.userIds = selectedUserIds;
    }

    sendMutation.mutate(data);
    setShowConfirmDialog(false);
  };

  const renderPreview = () => {
    let preview = selectedTemplateData?.template || customMessage;
    if (!preview) return "No message to preview";

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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Configuration */}
        <div className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Message Type</CardTitle>
              <CardDescription>Choose between email or SMS notification</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={notificationType} onValueChange={(v: "email" | "sms") => setNotificationType(v)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="email" id="email" data-testid="radio-type-email" />
                  <Label htmlFor="email">Email</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sms" id="sms" data-testid="radio-type-sms" />
                  <Label htmlFor="sms">SMS</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Template</CardTitle>
              <CardDescription>Select a pre-configured template or write a custom message</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="template">Choose Template</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger data-testid="select-template">
                    <SelectValue placeholder="Select a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Custom Message</SelectItem>
                    {activeTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(selectedTemplate === "none" || !selectedTemplate) && (
                <div>
                  <Label htmlFor="customMessage">Custom Message</Label>
                  <Textarea
                    id="customMessage"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Enter your custom message..."
                    rows={6}
                    data-testid="textarea-custom-message"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Users className="w-5 h-5" />
                Recipients
              </CardTitle>
              <CardDescription>Who should receive this notification?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={recipientType} onValueChange={(v: any) => setRecipientType(v)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all_parents" id="all_parents" data-testid="radio-recipient-all-parents" />
                  <Label htmlFor="all_parents">All Parents</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all_players" id="all_players" data-testid="radio-recipient-all-players" />
                  <Label htmlFor="all_players">All Players (13+)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="age_groups" id="age_groups" data-testid="radio-recipient-age-groups" />
                  <Label htmlFor="age_groups">Specific Age Groups</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="contact_groups" id="contact_groups" data-testid="radio-recipient-contact-groups" />
                  <Label htmlFor="contact_groups">Contact Groups</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="custom" data-testid="radio-recipient-custom" />
                  <Label htmlFor="custom">Custom Recipients</Label>
                </div>
              </RadioGroup>

              {recipientType === "age_groups" && (
                <div className="space-y-2 ml-6">
                  <Label>Select Age Groups</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {AGE_GROUPS.map((ageGroup) => (
                      <div key={ageGroup} className="flex items-center space-x-2">
                        <Checkbox
                          id={ageGroup}
                          checked={selectedAgeGroups.includes(ageGroup)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedAgeGroups([...selectedAgeGroups, ageGroup]);
                            } else {
                              setSelectedAgeGroups(selectedAgeGroups.filter((g) => g !== ageGroup));
                            }
                          }}
                          data-testid={`checkbox-age-group-${ageGroup}`}
                        />
                        <Label htmlFor={ageGroup}>{ageGroup}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {recipientType === "contact_groups" && (
                <div className="ml-6">
                  <Label htmlFor="contactGroup">Select Contact Group</Label>
                  <Select value={selectedContactGroup} onValueChange={setSelectedContactGroup}>
                    <SelectTrigger data-testid="select-contact-group">
                      <SelectValue placeholder="Select a contact group..." />
                    </SelectTrigger>
                    <SelectContent>
                      {contactGroups.map((group: any) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {recipientType === "custom" && (
                <div className="ml-6 space-y-2">
                  <Label>Select Recipients</Label>
                  <div className="border rounded-md p-2 max-h-60 overflow-y-auto">
                    {eligibleUsers.map((user: any) => (
                      <div key={user.id} className="flex items-center space-x-2 p-2 hover:bg-accent rounded">
                        <Checkbox
                          id={`user-${user.id}`}
                          checked={selectedUserIds.includes(user.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedUserIds([...selectedUserIds, user.id]);
                            } else {
                              setSelectedUserIds(selectedUserIds.filter((id) => id !== user.id));
                            }
                          }}
                          data-testid={`checkbox-user-${user.id}`}
                        />
                        <Label htmlFor={`user-${user.id}`} className="flex-1 cursor-pointer">
                          {user.firstName} {user.lastName} ({user.email || user.phone})
                        </Label>
                      </div>
                    ))}
                  </div>
                  {selectedUserIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedUserIds.map((userId) => {
                        const user = eligibleUsers.find((u: any) => u.id === userId);
                        return user ? (
                          <div key={userId} className="bg-primary text-primary-foreground px-2 py-1 rounded-md text-sm flex items-center gap-1">
                            {user.firstName} {user.lastName}
                            <button
                              onClick={() => setSelectedUserIds(selectedUserIds.filter((id) => id !== userId))}
                              className="ml-1 hover:text-destructive"
                              data-testid={`remove-user-${userId}`}
                            >
                              ×
                            </button>
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm text-muted-foreground">
                  Estimated recipients: <span className="font-medium text-foreground" data-testid="text-recipient-count">{getRecipientCount()}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Preview */}
        <div className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Preview</CardTitle>
              <CardDescription>How the message will appear to recipients</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedTemplateData && notificationType === "email" && selectedTemplateData.subject && (
                <div className="mb-4">
                  <Label>Subject</Label>
                  <div className="p-3 bg-muted rounded-md mt-1" data-testid="text-preview-subject">
                    {selectedTemplateData.subject}
                  </div>
                </div>
              )}
              <div>
                <Label>Message</Label>
                <div className="p-4 bg-muted rounded-md mt-1 whitespace-pre-wrap min-h-[200px]" data-testid="text-preview-message">
                  {renderPreview()}
                </div>
              </div>
            </CardContent>
          </Card>

          {sendResult && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Send Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sent:</span>
                    <span className="font-medium text-green-600" data-testid="text-result-sent">{sendResult.sent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Failed:</span>
                    <span className="font-medium text-red-600" data-testid="text-result-failed">{sendResult.failed}</span>
                  </div>
                  {sendResult.failed > 0 && (
                    <div className="mt-4">
                      <Label>Failed Recipients:</Label>
                      <div className="mt-2 space-y-1">
                        {sendResult.results
                          .filter((r) => !r.success)
                          .map((r, i) => (
                            <div key={i} className="text-sm text-muted-foreground">
                              {r.recipient}: {r.error}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Button
            onClick={handleSend}
            disabled={sendMutation.isPending || (!selectedTemplate && !customMessage)}
            className="w-full"
            size="lg"
            data-testid="button-send-notification"
          >
            {sendMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send to {getRecipientCount()} Recipient{getRecipientCount() !== 1 ? "s" : ""}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Send</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to send this {notificationType} to {getRecipientCount()} recipient(s). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-send">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSend} data-testid="button-confirm-send">
              Send Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
