import { useState } from 'react';
import AdminLayout from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { format } from 'date-fns';
import {
  UserPlus,
  Edit,
  Trash2,
  Users,
  UserCheck,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

interface CoachUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  profileImageUrl?: string;
}

interface CoachAssignment {
  id: string;
  userId: string;
  tenantId: string;
  status: 'active' | 'suspended';
  createdAt: string;
  canViewPii: boolean;
  canManageSessions: boolean;
  canViewAnalytics: boolean;
  canViewAttendance: boolean;
  canTakeAttendance: boolean;
  canViewFinancials: boolean;
  canIssueRefunds: boolean;
  canIssueCredits: boolean;
  canManageDiscounts: boolean;
  canAccessAdminPortal: boolean;
  user: CoachUser;
}

interface CoachesResponse {
  coaches: CoachAssignment[];
}

const defaultPermissions = {
  canViewPii: false,
  canManageSessions: false,
  canViewAnalytics: false,
  canViewAttendance: true,
  canTakeAttendance: true,
  canViewFinancials: false,
  canIssueRefunds: false,
  canIssueCredits: false,
  canManageDiscounts: false,
  canAccessAdminPortal: false,
};

export default function AdminCoaches() {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<CoachAssignment | null>(null);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    permissions: { ...defaultPermissions },
  });
  const [editForm, setEditForm] = useState({
    status: 'active' as 'active' | 'suspended',
    canViewPii: false,
    canManageSessions: false,
    canViewAnalytics: false,
    canViewAttendance: true,
    canTakeAttendance: true,
    canViewFinancials: false,
    canIssueRefunds: false,
    canIssueCredits: false,
    canManageDiscounts: false,
    canAccessAdminPortal: false,
  });
  const { toast } = useToast();

  const { data, isLoading, refetch } = useQuery<CoachesResponse>({
    queryKey: ['/api/admin/coaches'],
  });

  const coaches = data?.coaches || [];

  const inviteMutation = useMutation({
    mutationFn: async (formData: typeof inviteForm) => {
      const response = await apiRequest('POST', '/api/admin/coaches/invite', {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        permissions: formData.permissions,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Coach invited successfully' });
      setShowInviteDialog(false);
      resetInviteForm();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/coaches'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to invite coach', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof editForm }) => {
      const response = await apiRequest('PUT', `/api/admin/coaches/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Coach permissions updated' });
      setShowEditDialog(false);
      setSelectedCoach(null);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/coaches'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update coach', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/admin/coaches/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Coach removed successfully' });
      setShowDeleteDialog(false);
      setSelectedCoach(null);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/coaches'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to remove coach', description: error.message, variant: 'destructive' });
    },
  });

  const resetInviteForm = () => {
    setInviteForm({
      email: '',
      firstName: '',
      lastName: '',
      permissions: { ...defaultPermissions },
    });
  };

  const handleEditClick = (coach: CoachAssignment) => {
    setSelectedCoach(coach);
    setEditForm({
      status: coach.status,
      canViewPii: coach.canViewPii,
      canManageSessions: coach.canManageSessions,
      canViewAnalytics: coach.canViewAnalytics,
      canViewAttendance: coach.canViewAttendance,
      canTakeAttendance: coach.canTakeAttendance,
      canViewFinancials: coach.canViewFinancials,
      canIssueRefunds: coach.canIssueRefunds,
      canIssueCredits: coach.canIssueCredits,
      canManageDiscounts: coach.canManageDiscounts,
      canAccessAdminPortal: coach.canAccessAdminPortal,
    });
    setShowEditDialog(true);
  };

  const handleDeleteClick = (coach: CoachAssignment) => {
    setSelectedCoach(coach);
    setShowDeleteDialog(true);
  };

  const getPermissionBadges = (coach: CoachAssignment) => {
    const badges = [];
    if (coach.canManageSessions) badges.push('Sessions');
    if (coach.canViewPii) badges.push('PII');
    if (coach.canViewAnalytics) badges.push('Analytics');
    if (coach.canViewAttendance || coach.canTakeAttendance) badges.push('Attendance');
    if (coach.canAccessAdminPortal) badges.push('Admin');
    return badges;
  };

  const activeCoaches = coaches.filter((c) => c.status === 'active').length;
  const suspendedCoaches = coaches.filter((c) => c.status === 'suspended').length;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Coaches</h1>
          <Button
            onClick={() => setShowInviteDialog(true)}
            data-testid="button-invite-coach"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Coach
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Coaches</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground" data-testid="text-total-coaches">
                {coaches.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground" data-testid="text-active-coaches">
                {activeCoaches}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Suspended</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground" data-testid="text-suspended-coaches">
                {suspendedCoaches}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-card rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-muted-foreground">Name</TableHead>
                <TableHead className="text-muted-foreground">Email</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Date Invited</TableHead>
                <TableHead className="text-muted-foreground">Permissions</TableHead>
                <TableHead className="text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coaches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No coaches found. Click "Invite Coach" to add your first coach.
                  </TableCell>
                </TableRow>
              ) : (
                coaches.map((coach) => (
                  <TableRow key={coach.id} className="border-border" data-testid={`row-coach-${coach.id}`}>
                    <TableCell className="text-foreground font-medium">
                      {coach.user.firstName} {coach.user.lastName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{coach.user.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={coach.status === 'active' ? 'default' : 'secondary'}
                        className={
                          coach.status === 'active'
                            ? 'bg-green-900 text-green-300'
                            : 'bg-yellow-900 text-yellow-300'
                        }
                        data-testid={`badge-status-${coach.id}`}
                      >
                        {coach.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {coach.createdAt ? format(new Date(coach.createdAt), 'MMM d, yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {getPermissionBadges(coach).map((badge) => (
                          <Badge
                            key={badge}
                            variant="outline"
                            className="text-xs"
                            data-testid={`badge-permission-${badge.toLowerCase()}-${coach.id}`}
                          >
                            {badge}
                          </Badge>
                        ))}
                        {getPermissionBadges(coach).length === 0 && (
                          <span className="text-muted-foreground text-sm">None</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(coach)}
                          data-testid={`button-edit-${coach.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(coach)}
                          className="text-red-500 hover:text-red-600"
                          data-testid={`button-remove-${coach.id}`}
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
        </div>
      </div>

      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Coach</DialogTitle>
            <DialogDescription>
              Send an invitation to a new coach. They will receive access based on the permissions you set.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email *</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="coach@example.com"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                data-testid="input-invite-email"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invite-firstname">First Name</Label>
                <Input
                  id="invite-firstname"
                  placeholder="First name"
                  value={inviteForm.firstName}
                  onChange={(e) => setInviteForm({ ...inviteForm, firstName: e.target.value })}
                  data-testid="input-invite-firstname"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-lastname">Last Name</Label>
                <Input
                  id="invite-lastname"
                  placeholder="Last name"
                  value={inviteForm.lastName}
                  onChange={(e) => setInviteForm({ ...inviteForm, lastName: e.target.value })}
                  data-testid="input-invite-lastname"
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-medium">Default Permissions</Label>
              <div className="space-y-2">
                <PermissionToggle
                  label="View Attendance"
                  description="See who attended sessions, but cannot mark players present or absent"
                  checked={inviteForm.permissions.canViewAttendance}
                  onChange={(checked) =>
                    setInviteForm({
                      ...inviteForm,
                      permissions: { ...inviteForm.permissions, canViewAttendance: checked },
                    })
                  }
                  testId="switch-invite-view-attendance"
                />
                <PermissionToggle
                  label="Take Attendance"
                  description="Mark players as present or absent during sessions"
                  checked={inviteForm.permissions.canTakeAttendance}
                  onChange={(checked) =>
                    setInviteForm({
                      ...inviteForm,
                      permissions: { ...inviteForm.permissions, canTakeAttendance: checked },
                    })
                  }
                  testId="switch-invite-take-attendance"
                />
                <PermissionToggle
                  label="View Player Info (PII)"
                  description="Access player details like phone numbers, emails, and emergency contacts"
                  checked={inviteForm.permissions.canViewPii}
                  onChange={(checked) =>
                    setInviteForm({
                      ...inviteForm,
                      permissions: { ...inviteForm.permissions, canViewPii: checked },
                    })
                  }
                  testId="switch-invite-view-pii"
                />
                <PermissionToggle
                  label="Manage Sessions"
                  description="Create, edit, and cancel training sessions"
                  checked={inviteForm.permissions.canManageSessions}
                  onChange={(checked) =>
                    setInviteForm({
                      ...inviteForm,
                      permissions: { ...inviteForm.permissions, canManageSessions: checked },
                    })
                  }
                  testId="switch-invite-manage-sessions"
                />
                <PermissionToggle
                  label="View Analytics"
                  description="Access reports on attendance trends and session performance"
                  checked={inviteForm.permissions.canViewAnalytics}
                  onChange={(checked) =>
                    setInviteForm({
                      ...inviteForm,
                      permissions: { ...inviteForm.permissions, canViewAnalytics: checked },
                    })
                  }
                  testId="switch-invite-view-analytics"
                />
                
                <div className="border-t border-border pt-3 mt-3">
                  <div className="flex items-center gap-2 mb-2 text-amber-600 dark:text-amber-500">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-xs font-medium">Financial Permissions (Sensitive)</span>
                  </div>
                  <PermissionToggle
                    label="View Financials"
                    description="View payment history, revenue reports, and financial data"
                    checked={inviteForm.permissions.canViewFinancials}
                    onChange={(checked) =>
                      setInviteForm({
                        ...inviteForm,
                        permissions: { ...inviteForm.permissions, canViewFinancials: checked },
                      })
                    }
                    testId="switch-invite-view-financials"
                  />
                  <PermissionToggle
                    label="Issue Refunds"
                    description="Process refunds for cancelled bookings or payments"
                    checked={inviteForm.permissions.canIssueRefunds}
                    onChange={(checked) =>
                      setInviteForm({
                        ...inviteForm,
                        permissions: { ...inviteForm.permissions, canIssueRefunds: checked },
                      })
                    }
                    testId="switch-invite-issue-refunds"
                  />
                  <PermissionToggle
                    label="Issue Credits"
                    description="Add account credits to parents or players"
                    checked={inviteForm.permissions.canIssueCredits}
                    onChange={(checked) =>
                      setInviteForm({
                        ...inviteForm,
                        permissions: { ...inviteForm.permissions, canIssueCredits: checked },
                      })
                    }
                    testId="switch-invite-issue-credits"
                  />
                  <PermissionToggle
                    label="Manage Discounts"
                    description="Create and edit discount codes for sessions"
                    checked={inviteForm.permissions.canManageDiscounts}
                    onChange={(checked) =>
                      setInviteForm({
                        ...inviteForm,
                        permissions: { ...inviteForm.permissions, canManageDiscounts: checked },
                      })
                    }
                    testId="switch-invite-manage-discounts"
                  />
                </div>

                <div className="border-t border-border pt-3 mt-3">
                  <PermissionToggle
                    label="Access Admin Portal"
                    description="Allow this coach to access the admin portal"
                    checked={inviteForm.permissions.canAccessAdminPortal}
                    onChange={(checked) =>
                      setInviteForm({
                        ...inviteForm,
                        permissions: { ...inviteForm.permissions, canAccessAdminPortal: checked },
                      })
                    }
                    testId="switch-invite-access-admin"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowInviteDialog(false);
                resetInviteForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => inviteMutation.mutate(inviteForm)}
              disabled={!inviteForm.email || inviteMutation.isPending}
              data-testid="button-submit-invite"
            >
              {inviteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Coach Permissions</DialogTitle>
            <DialogDescription>
              {selectedCoach
                ? `Update permissions for ${selectedCoach.user.firstName} ${selectedCoach.user.lastName}`
                : 'Update coach permissions'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <p className="text-xs text-muted-foreground">
                  {editForm.status === 'active' ? 'Coach is active and can access the system' : 'Coach is suspended'}
                </p>
              </div>
              <Switch
                checked={editForm.status === 'active'}
                onCheckedChange={(checked) =>
                  setEditForm({ ...editForm, status: checked ? 'active' : 'suspended' })
                }
                data-testid="switch-edit-status"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Permissions</Label>

              <PermissionToggle
                label="View Attendance"
                description="See who attended sessions, but cannot mark players present or absent"
                checked={editForm.canViewAttendance}
                onChange={(checked) => setEditForm({ ...editForm, canViewAttendance: checked })}
                testId="switch-edit-view-attendance"
              />
              <PermissionToggle
                label="Take Attendance"
                description="Mark players as present or absent during sessions"
                checked={editForm.canTakeAttendance}
                onChange={(checked) => setEditForm({ ...editForm, canTakeAttendance: checked })}
                testId="switch-edit-take-attendance"
              />
              <PermissionToggle
                label="View Player Info (PII)"
                description="Access player details like phone numbers, emails, and emergency contacts"
                checked={editForm.canViewPii}
                onChange={(checked) => setEditForm({ ...editForm, canViewPii: checked })}
                testId="switch-edit-view-pii"
              />
              <PermissionToggle
                label="Manage Sessions"
                description="Create, edit, and cancel training sessions"
                checked={editForm.canManageSessions}
                onChange={(checked) => setEditForm({ ...editForm, canManageSessions: checked })}
                testId="switch-edit-manage-sessions"
              />
              <PermissionToggle
                label="View Analytics"
                description="Access reports on attendance trends and session performance"
                checked={editForm.canViewAnalytics}
                onChange={(checked) => setEditForm({ ...editForm, canViewAnalytics: checked })}
                testId="switch-edit-view-analytics"
              />

              <div className="border-t border-border pt-3 mt-3">
                <div className="flex items-center gap-2 mb-2 text-amber-600 dark:text-amber-500">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-xs font-medium">Financial Permissions (Sensitive)</span>
                </div>
                <PermissionToggle
                  label="View Financials"
                  description="View payment history, revenue reports, and financial data"
                  checked={editForm.canViewFinancials}
                  onChange={(checked) => setEditForm({ ...editForm, canViewFinancials: checked })}
                  testId="switch-edit-view-financials"
                />
                <PermissionToggle
                  label="Issue Refunds"
                  description="Process refunds for cancelled bookings or payments"
                  checked={editForm.canIssueRefunds}
                  onChange={(checked) => setEditForm({ ...editForm, canIssueRefunds: checked })}
                  testId="switch-edit-issue-refunds"
                />
                <PermissionToggle
                  label="Issue Credits"
                  description="Add account credits to parents or players"
                  checked={editForm.canIssueCredits}
                  onChange={(checked) => setEditForm({ ...editForm, canIssueCredits: checked })}
                  testId="switch-edit-issue-credits"
                />
                <PermissionToggle
                  label="Manage Discounts"
                  description="Create and edit discount codes for sessions"
                  checked={editForm.canManageDiscounts}
                  onChange={(checked) => setEditForm({ ...editForm, canManageDiscounts: checked })}
                  testId="switch-edit-manage-discounts"
                />
              </div>

              <div className="border-t border-border pt-3 mt-3">
                <PermissionToggle
                  label="Access Admin Portal"
                  checked={editForm.canAccessAdminPortal}
                  onChange={(checked) => setEditForm({ ...editForm, canAccessAdminPortal: checked })}
                  testId="switch-edit-access-admin"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedCoach && updateMutation.mutate({ id: selectedCoach.id, data: editForm })}
              disabled={updateMutation.isPending}
              data-testid="button-save-permissions"
            >
              {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Coach</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{' '}
              <strong>
                {selectedCoach?.user.firstName} {selectedCoach?.user.lastName}
              </strong>{' '}
              as a coach? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedCoach && deleteMutation.mutate(selectedCoach.id)}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-remove"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}

function PermissionToggle({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  warning,
  testId,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  warning?: string;
  testId: string;
}) {
  return (
    <div
      className={`flex items-center justify-between py-2 ${disabled ? 'opacity-60' : ''}`}
    >
      <div className="flex-1">
        <Label className="text-sm cursor-pointer">{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
        {warning && disabled && (
          <p className="text-xs text-yellow-600 flex items-center gap-1 mt-0.5">
            <AlertTriangle className="w-3 h-3" />
            {warning}
          </p>
        )}
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        data-testid={testId}
      />
    </div>
  );
}
