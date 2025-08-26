import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Copy,
  RefreshCw,
  Send,
  Users,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Shield,
  LinkIcon,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Edit,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";

interface TenantInviteCode {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  usageCount: number;
  maxUsage?: number;
  createdAt: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: "pending" | "accepted" | "expired";
  createdAt: string;
  expiresAt: string;
  usedAt?: string;
  invitedBy: {
    firstName: string;
    lastName: string;
  };
}

export default function InvitationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("codes");
  const [selectedRole, setSelectedRole] = useState("parent");
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  // Multiple invite codes state
  const [createCodeDialogOpen, setCreateCodeDialogOpen] = useState(false);
  const [newCodeName, setNewCodeName] = useState('');
  const [newCodeDescription, setNewCodeDescription] = useState('');
  const [newCodeMaxUsage, setNewCodeMaxUsage] = useState<number | ''>('');

  // Fetch invite codes
  const { data: inviteCodes = [], isLoading: codesLoading, error: codesError, refetch: refetchCodes } = useQuery<TenantInviteCode[]>({
    queryKey: ['/api/admin/tenant/current/invite-codes'],
    enabled: activeTab === "codes",
  });

  // Fetch invitations
  const { data: invitations = [], isLoading: invitationsLoading, error: invitationsError, refetch: refetchInvitations } = useQuery<Invitation[]>({
    queryKey: ['/api/admin/invitations'],
    enabled: activeTab === "invitations",
  });

  // Create new invite code mutation
  const createCodeMutation = useMutation({
    mutationFn: async (newCode: { name: string; description?: string; maxUsage?: number }) => {
      const response = await fetch('/api/admin/tenant/current/invite-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newCode),
      });
      if (!response.ok) throw new Error('Failed to create invite code');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Invite code created successfully!" });
      setCreateCodeDialogOpen(false);
      setNewCodeName('');
      setNewCodeDescription('');
      setNewCodeMaxUsage('');
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tenant/current/invite-codes'] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create invite code", variant: "destructive" });
    }
  });

  // Toggle code active status mutation
  const toggleCodeMutation = useMutation({
    mutationFn: async (codeId: string) => {
      const response = await fetch(`/api/admin/tenant/current/invite-codes/${codeId}/toggle`, {
        method: 'PATCH',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to toggle invite code');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Invite code status updated!" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tenant/current/invite-codes'] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update invite code", variant: "destructive" });
    }
  });

  // Delete code mutation
  const deleteCodeMutation = useMutation({
    mutationFn: async (codeId: string) => {
      const response = await fetch(`/api/admin/tenant/current/invite-codes/${codeId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete invite code');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Invite code deleted successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tenant/current/invite-codes'] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete invite code", variant: "destructive" });
    }
  });

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Code copied to clipboard",
      description: `Invite code ${code} has been copied to your clipboard.`,
    });
  };

  const handleCreateCode = () => {
    if (!newCodeName.trim()) {
      toast({ title: "Error", description: "Please enter a name for the invite code", variant: "destructive" });
      return;
    }
    
    createCodeMutation.mutate({
      name: newCodeName.trim(),
      description: newCodeDescription.trim() || undefined,
      maxUsage: newCodeMaxUsage === '' ? undefined : Number(newCodeMaxUsage)
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invitations & Codes</h1>
          <p className="text-muted-foreground">
            Invite parents and players to join your organization
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={() => setActiveTab("invitations")} data-testid="button-invite-user">
            <Users className="w-4 h-4 mr-2" />
            Invite User
          </Button>
          <Dialog open={createCodeDialogOpen} onOpenChange={setCreateCodeDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-invite-code">
                <Plus className="w-4 h-4 mr-2" />
                Create Invite Code
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Invite Code</DialogTitle>
                <DialogDescription>
                  Create a permanent invite code that parents and players can use to join your organization.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="code-name">Code Name *</Label>
                  <Input
                    id="code-name"
                    placeholder="e.g., Parent Registration, Player Signup"
                    value={newCodeName}
                    onChange={(e) => setNewCodeName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="code-description">Description (Optional)</Label>
                  <Textarea
                    id="code-description"
                    placeholder="Brief description of what this code is for"
                    value={newCodeDescription}
                    onChange={(e) => setNewCodeDescription(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="code-max-usage">Usage Limit (Optional)</Label>
                  <Input
                    id="code-max-usage"
                    type="number"
                    placeholder="Leave empty for unlimited usage"
                    value={newCodeMaxUsage}
                    onChange={(e) => setNewCodeMaxUsage(e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateCodeDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCode} disabled={createCodeMutation.isPending}>
                  {createCodeMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Create Code
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="invitations" data-testid="tab-sent-invitations">
            Sent Invitations
          </TabsTrigger>
          <TabsTrigger value="codes" data-testid="tab-invite-codes">
            Invite Codes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invitations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                Send Invitation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    data-testid="input-invite-email"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    className="w-full p-2 border rounded-md"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    data-testid="select-invite-role"
                  >
                    <option value="parent">Parent</option>
                    <option value="player">Player</option>
                    <option value="coach">Coach</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={() => {}}
                    disabled={isInviting || !inviteEmail}
                    className="w-full"
                    data-testid="button-send-invitation"
                  >
                    {isInviting ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Send Invitation
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sent Invitations</CardTitle>
            </CardHeader>
            <CardContent>
              {invitationsLoading ? (
                <div className="flex justify-center py-4">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
              ) : invitationsError ? (
                <div className="text-center py-8">
                  <p className="text-red-600 mb-2">Failed to load invitations</p>
                  <Button onClick={() => refetchInvitations()} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : invitations.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">No invitations sent yet</p>
                  <p className="text-sm text-gray-500">
                    Send your first invitation using the form above
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {invitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{invitation.email}</span>
                            <Badge
                              variant={
                                invitation.status === "accepted"
                                  ? "default"
                                  : invitation.status === "expired"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {invitation.status}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {invitation.role}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{invitation.email}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Sent: {formatDate(invitation.createdAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Expires: {formatDate(invitation.expiresAt)}
                            </span>
                            {invitation.usedAt && (
                              <span className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Accepted: {formatDate(invitation.usedAt)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="codes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5" />
                Static Invite Codes
              </CardTitle>
              <p className="text-sm text-gray-600">
                Create permanent codes that parents and players can use to join your organization
              </p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {codesLoading ? (
                <div className="flex justify-center py-4">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
              ) : codesError ? (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 mx-auto mb-4 text-red-500 opacity-50" />
                  <p className="text-red-600 mb-2">Unable to load invite codes</p>
                  <Button onClick={() => refetchCodes()} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : inviteCodes.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-2">No invite codes created yet</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Create your first invite code using the button above
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {inviteCodes.map((code) => (
                    <div
                      key={code.id}
                      className={`border rounded-lg p-4 ${!code.isActive ? 'opacity-50 bg-gray-50' : 'bg-white'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">{code.name}</h3>
                            <Badge variant={code.isActive ? "default" : "secondary"}>
                              {code.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          
                          {code.description && (
                            <p className="text-sm text-gray-600 mb-2">{code.description}</p>
                          )}
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>Used: {code.usageCount} times</span>
                            {code.maxUsage && (
                              <span>Limit: {code.maxUsage}</span>
                            )}
                            <span>Created: {formatDate(code.createdAt)}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2">
                            <code className="text-lg font-mono bg-gray-100 px-3 py-1 rounded border">
                              {code.code}
                            </code>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopyCode(code.code)}
                              data-testid={`button-copy-code-${code.id}`}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleCodeMutation.mutate(code.id)}
                            disabled={toggleCodeMutation.isPending}
                            data-testid={`button-toggle-code-${code.id}`}
                          >
                            {code.isActive ? (
                              <ToggleRight className="w-4 h-4" />
                            ) : (
                              <ToggleLeft className="w-4 h-4" />
                            )}
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteCodeMutation.mutate(code.id)}
                            disabled={deleteCodeMutation.isPending}
                            data-testid={`button-delete-code-${code.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}