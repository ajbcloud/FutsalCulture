import React, { useState } from 'react';
import AdminLayout from '../../components/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../components/ui/form';
import { Textarea } from '../../components/ui/textarea';
import { useToast } from '../../hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  UserPlus, 
  Mail, 
  Users, 
  RefreshCw, 
  Copy, 
  Send, 
  Clock, 
  CheckCircle, 
  XCircle,
  RotateCcw,
  Shield,
  Link as LinkIcon,
  Calendar,
  Filter
} from 'lucide-react';

// Validation schemas
const inviteUserSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['parent', 'player'], { required_error: 'Please select a role' }),
  birthdate: z.string().optional(),
});

type InviteUserForm = z.infer<typeof inviteUserSchema>;

interface Invitation {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'parent' | 'player';
  status: 'pending' | 'accepted' | 'expired';
  createdAt: string;
  expiresAt: string;
  usedAt?: string;
}

interface TenantCode {
  inviteCode: string;
  updatedAt: string;
  updatedBy: string;
}

export default function InvitationsPage() {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [codeRotateDialogOpen, setCodeRotateDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('invitations');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form for inviting users
  const form = useForm<InviteUserForm>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      role: 'parent',
      birthdate: '',
    },
  });

  // Fetch invitations
  const { data: invitations = [], isLoading: invitationsLoading } = useQuery<Invitation[]>({
    queryKey: ['/api/admin/invitations'],
    queryFn: async () => {
      const response = await fetch('/api/admin/invitations');
      if (!response.ok) throw new Error('Failed to fetch invitations');
      return response.json();
    },
  });

  // Fetch tenant invite code
  const { data: tenantCode, isLoading: codeLoading } = useQuery<TenantCode>({
    queryKey: ['/api/admin/tenant/invite-code'],
    queryFn: async () => {
      const response = await fetch('/api/admin/tenant/invite-code');
      if (!response.ok) throw new Error('Failed to fetch invite code');
      return response.json();
    },
  });

  // Create invitation mutation
  const createInvitationMutation = useMutation({
    mutationFn: async (data: InviteUserForm & { tenantId: string }) => {
      const response = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create invitation');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/invitations'] });
      setInviteDialogOpen(false);
      form.reset();
      toast({
        title: 'Invitation sent!',
        description: 'The invitation email has been sent successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to send invitation',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Rotate invite code mutation  
  const rotateCodeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/tenants/current/rotate-invite-code', {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to rotate invite code');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tenant/invite-code'] });
      setCodeRotateDialogOpen(false);
      toast({
        title: 'Invite code rotated',
        description: 'New invite code generated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to rotate code',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleInviteSubmit = (data: InviteUserForm) => {
    // Get current tenant ID (you'll need to implement this based on your auth system)
    const tenantId = 'current'; // Replace with actual tenant ID
    createInvitationMutation.mutate({ ...data, tenantId });
  };

  const handleCopyCode = () => {
    if (tenantCode?.inviteCode) {
      navigator.clipboard.writeText(tenantCode.inviteCode);
      toast({
        title: 'Copied!',
        description: 'Invite code copied to clipboard.',
      });
    }
  };

  const handleRotateCode = () => {
    rotateCodeMutation.mutate();
  };

  // Filter invitations
  const filteredInvitations = invitations.filter(invitation => {
    if (statusFilter !== 'all' && invitation.status !== statusFilter) return false;
    if (roleFilter !== 'all' && invitation.role !== roleFilter) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: 'secondary' as const, icon: <Clock className="w-3 h-3" />, label: 'Pending' },
      accepted: { variant: 'success' as const, icon: <CheckCircle className="w-3 h-3" />, label: 'Accepted' },
      expired: { variant: 'destructive' as const, icon: <XCircle className="w-3 h-3" />, label: 'Expired' },
    };
    
    const config = variants[status as keyof typeof variants] || variants.pending;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6" data-testid="invitations-page">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Invitations & Codes</h1>
            <p className="text-gray-600 mt-1">
              Invite parents and players to join your organization
            </p>
          </div>
          
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2" data-testid="button-invite-user">
                <UserPlus className="w-4 h-4" />
                Invite User
              </Button>
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Invite New User</DialogTitle>
                <DialogDescription>
                  Send an invitation to join your organization as a parent or player.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleInviteSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-first-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-last-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} data-testid="input-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-role">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="parent">Parent</SelectItem>
                            <SelectItem value="player">Player (13+ only)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {form.watch('role') === 'player' && (
                    <FormField
                      control={form.control}
                      name="birthdate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Birthdate (for players 13+)</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-birthdate" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={createInvitationMutation.isPending}
                      className="flex items-center gap-2"
                      data-testid="button-send-invitation"
                    >
                      {createInvitationMutation.isPending ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Invitation
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="invitations">Sent Invitations</TabsTrigger>
            <TabsTrigger value="codes">Invite Codes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="invitations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Sent Invitations
                </CardTitle>
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="parent">Parents</SelectItem>
                      <SelectItem value="player">Players</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              
              <CardContent>
                {invitationsLoading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  </div>
                ) : filteredInvitations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Mail className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No invitations found</p>
                    <p className="text-sm">Start inviting parents and players to join your organization</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredInvitations.map((invitation) => (
                      <div 
                        key={invitation.id} 
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                        data-testid={`invitation-${invitation.id}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">
                                {invitation.firstName} {invitation.lastName}
                              </span>
                              <Badge variant="outline" className="capitalize">
                                {invitation.role}
                              </Badge>
                              {getStatusBadge(invitation.status)}
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
                  Organization Invite Code
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Share this code with parents and players so they can join your organization
                </p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {codeLoading ? (
                  <div className="flex justify-center py-4">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  </div>
                ) : tenantCode ? (
                  <>
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium">Current Invite Code</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-lg font-mono bg-white px-3 py-1 rounded border">
                              {tenantCode.inviteCode}
                            </code>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCopyCode}
                              className="flex items-center gap-1"
                              data-testid="button-copy-code"
                            >
                              <Copy className="w-3 h-3" />
                              Copy
                            </Button>
                          </div>
                        </div>
                        
                        <Dialog open={codeRotateDialogOpen} onOpenChange={setCodeRotateDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              className="flex items-center gap-2"
                              data-testid="button-rotate-code"
                            >
                              <RotateCcw className="w-4 h-4" />
                              Rotate Code
                            </Button>
                          </DialogTrigger>
                          
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Shield className="w-5 h-5" />
                                Rotate Invite Code
                              </DialogTitle>
                              <DialogDescription>
                                This will generate a new invite code and invalidate the current one. 
                                Anyone using the old code will no longer be able to join your organization.
                              </DialogDescription>
                            </DialogHeader>
                            
                            <DialogFooter>
                              <Button
                                variant="outline" 
                                onClick={() => setCodeRotateDialogOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleRotateCode}
                                disabled={rotateCodeMutation.isPending}
                                className="flex items-center gap-2"
                                data-testid="button-confirm-rotate"
                              >
                                {rotateCodeMutation.isPending ? (
                                  <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Rotating...
                                  </>
                                ) : (
                                  <>
                                    <RotateCcw className="w-4 h-4" />
                                    Rotate Code
                                  </>
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                      
                      {tenantCode.updatedAt && (
                        <p className="text-xs text-gray-500 mt-2">
                          Last updated: {formatDate(tenantCode.updatedAt)}
                          {tenantCode.updatedBy && ` by ${tenantCode.updatedBy}`}
                        </p>
                      )}
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-900 mb-2">How to use invite codes:</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Share this code with parents and players</li>
                        <li>• They can use it during signup to join your organization</li>
                        <li>• Existing users can add it to their profile to join multiple organizations</li>
                        <li>• The code never expires but can be rotated for security</li>
                      </ul>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No invite code available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}