import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Edit, Users, X, Check } from "lucide-react";
import { format } from "date-fns";
import type { ContactGroup, ContactGroupMember } from "@shared/schema";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
  birthYear?: number;
  ageGroup?: string;
  gender?: string;
  club?: string;
}

interface GroupWithMembers extends ContactGroup {
  memberCount?: number;
}

export default function ContactGroupsManager() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ContactGroup | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<ContactGroup | null>(null);
  const [managingMembersGroup, setManagingMembersGroup] = useState<ContactGroup | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [memberSearchOpen, setMemberSearchOpen] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const { data: groupsData, isLoading: groupsLoading } = useQuery<{ groups: GroupWithMembers[] }>({
    queryKey: ['/api/contact-groups'],
  });

  const groups: GroupWithMembers[] = groupsData?.groups || [];

  const { data: usersData } = useQuery<{ users: User[] }>({
    queryKey: ['/api/users'],
  });

  const users: User[] = usersData?.users || [];

  const { data: playersData } = useQuery<User[]>({
    queryKey: ['/api/players'],
  });

  const players: User[] = playersData || [];

  const { data: membersData, isLoading: membersLoading } = useQuery<{ members: ContactGroupMember[] }>({
    queryKey: ['/api/contact-groups', managingMembersGroup?.id, 'members'],
    enabled: !!managingMembersGroup,
  });

  const groupMembers: ContactGroupMember[] = membersData?.members || [];

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/contact-groups", data),
    onSuccess: async (response: any) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/contact-groups"] });
      
      if (selectedMembers.length > 0 && response?.group?.id) {
        for (const userId of selectedMembers) {
          try {
            await apiRequest("POST", `/api/contact-groups/${response.group.id}/members`, { userId });
          } catch (error) {
            console.error('Error adding member:', error);
          }
        }
        await queryClient.invalidateQueries({ queryKey: ["/api/contact-groups"] });
      }
      
      toast({ title: "Contact group created successfully" });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create contact group",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest("PATCH", `/api/contact-groups/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contact-groups"] });
      toast({ title: "Contact group updated successfully" });
      setEditingGroup(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update contact group",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/contact-groups/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contact-groups"] });
      toast({ title: "Contact group deleted successfully" });
      setDeletingGroup(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete contact group",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
      apiRequest("POST", `/api/contact-groups/${groupId}/members`, { userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contact-groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contact-groups", managingMembersGroup?.id, "members"] });
      toast({ title: "Member added successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add member",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
      apiRequest("DELETE", `/api/contact-groups/${groupId}/members/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contact-groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contact-groups", managingMembersGroup?.id, "members"] });
      toast({ title: "Member removed successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to remove member",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
    });
    setSelectedMembers([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGroup) {
      updateMutation.mutate({
        id: editingGroup.id,
        data: formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (group: ContactGroup) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || "",
    });
  };

  const handleManageMembers = (group: ContactGroup) => {
    setManagingMembersGroup(group);
  };

  const getEligibleUsers = () => {
    const parentUsers = users.filter(u => u.role === 'parent');
    
    const eligiblePlayers = players.filter((p: any) => {
      const age = new Date().getFullYear() - (p.birthYear || 0);
      return age >= 13;
    }).map((p: any) => ({
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      email: p.email || '',
      role: 'player',
      ageGroup: p.ageGroup || '',
      gender: p.gender || '',
      club: p.club || ''
    }));
    
    return [...parentUsers, ...eligiblePlayers];
  };

  const eligibleUsers = getEligibleUsers();

  const availableUsers = eligibleUsers.filter(u => {
    if (managingMembersGroup) {
      const isMember = groupMembers.some(m => m.userId === u.id);
      return !isMember;
    }
    return !selectedMembers.includes(u.id);
  });

  const filteredAvailableUsers = availableUsers.filter(u => {
    const searchLower = memberSearchQuery.toLowerCase();
    const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
    const ageGroup = (u.ageGroup || '').toLowerCase();
    const club = (u.club || '').toLowerCase();
    
    return fullName.includes(searchLower) || 
           u.email.toLowerCase().includes(searchLower) ||
           ageGroup.includes(searchLower) ||
           club.includes(searchLower);
  });

  const getUserById = (userId: string) => {
    return eligibleUsers.find(u => u.id === userId);
  };

  const getMemberCount = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    return group?.memberCount || 0;
  };

  if (groupsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-foreground">Contact Groups</h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm();
                setIsCreateOpen(true);
              }}
              data-testid="button-create-group"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Group
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">All Contact Groups</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No contact groups found. Create your first group to get started.
                  </TableCell>
                </TableRow>
              ) : (
                groups.map((group) => (
                  <TableRow key={group.id} data-testid={`row-group-${group.id}`}>
                    <TableCell className="font-medium" data-testid={`text-name-${group.id}`}>
                      {group.name}
                    </TableCell>
                    <TableCell className="max-w-md truncate" data-testid={`text-description-${group.id}`}>
                      {group.description || '-'}
                    </TableCell>
                    <TableCell data-testid={`text-member-count-${group.id}`}>
                      <Badge variant="secondary">
                        {getMemberCount(group.id)} members
                      </Badge>
                    </TableCell>
                    <TableCell data-testid={`text-created-${group.id}`}>
                      {group.createdAt ? format(new Date(group.createdAt), "MMM d, yyyy") : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleManageMembers(group)}
                          data-testid={`button-manage-members-${group.id}`}
                        >
                          <Users className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(group)}
                          data-testid={`button-edit-${group.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingGroup(group)}
                          data-testid={`button-delete-${group.id}`}
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

      <Dialog open={isCreateOpen || !!editingGroup} onOpenChange={(open) => {
        if (!open) {
          setIsCreateOpen(false);
          setEditingGroup(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingGroup ? "Edit Contact Group" : "Create Contact Group"}</DialogTitle>
            <DialogDescription>
              {editingGroup ? "Update the contact group details below." : "Create a new contact group for targeted messaging."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Group Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., U10 Parents, Premium Members"
                required
                data-testid="input-group-name"
              />
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add a description for this group..."
                rows={3}
                data-testid="textarea-group-description"
              />
            </div>

            {!editingGroup && (
              <div>
                <Label>Initial Members (Optional)</Label>
                <Popover open={memberSearchOpen} onOpenChange={setMemberSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      data-testid="button-select-members"
                    >
                      <Users className="mr-2 h-4 w-4" />
                      {selectedMembers.length > 0
                        ? `${selectedMembers.length} member${selectedMembers.length > 1 ? 's' : ''} selected`
                        : "Select members..."}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Search by name, email, age group, or club..."
                        value={memberSearchQuery}
                        onValueChange={setMemberSearchQuery}
                        data-testid="input-search-members"
                      />
                      <CommandEmpty>No users found.</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-auto">
                        {filteredAvailableUsers.map((user) => (
                          <CommandItem
                            key={user.id}
                            onSelect={() => {
                              setSelectedMembers([...selectedMembers, user.id]);
                              setMemberSearchQuery("");
                            }}
                            data-testid={`option-user-${user.id}`}
                          >
                            <div className="flex-1">
                              <div className="font-medium">{user.firstName} {user.lastName}</div>
                              <div className="text-sm text-muted-foreground">
                                {user.email}
                                {user.ageGroup && <span className="ml-2">• {user.ageGroup}</span>}
                                {user.club && <span className="ml-2">• {user.club}</span>}
                              </div>
                            </div>
                            <Badge variant="outline" className="ml-2">
                              {user.role === 'player' ? 'Player' : 'Adult'}
                            </Badge>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>

                {selectedMembers.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedMembers.map((userId) => {
                      const user = getUserById(userId);
                      if (!user) return null;
                      return (
                        <Badge key={userId} variant="secondary" className="flex items-center gap-1">
                          {user.firstName} {user.lastName}
                          <button
                            type="button"
                            onClick={() => setSelectedMembers(selectedMembers.filter(id => id !== userId))}
                            className="ml-1 hover:text-destructive"
                            data-testid={`button-remove-selected-${userId}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditingGroup(null);
                  resetForm();
                }}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save-group"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : editingGroup
                  ? "Update Group"
                  : "Create Group"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!managingMembersGroup} onOpenChange={(open) => !open && setManagingMembersGroup(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Members - {managingMembersGroup?.name}</DialogTitle>
            <DialogDescription>
              Add or remove members from this contact group.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Current Members ({groupMembers.length})
              </h3>
              <Popover>
                <PopoverTrigger asChild>
                  <Button size="sm" data-testid="button-add-member">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Member
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="end">
                  <Command>
                    <CommandInput
                      placeholder="Search by name, email, age group, or club..."
                      value={memberSearchQuery}
                      onValueChange={setMemberSearchQuery}
                      data-testid="input-search-add-member"
                    />
                    <CommandEmpty>No users found.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-auto">
                      {filteredAvailableUsers.map((user) => (
                        <CommandItem
                          key={user.id}
                          onSelect={() => {
                            if (managingMembersGroup) {
                              addMemberMutation.mutate({
                                groupId: managingMembersGroup.id,
                                userId: user.id,
                              });
                            }
                            setMemberSearchQuery("");
                          }}
                          data-testid={`option-add-user-${user.id}`}
                        >
                          <div className="flex-1">
                            <div className="font-medium">{user.firstName} {user.lastName}</div>
                            <div className="text-sm text-muted-foreground">
                              {user.email}
                              {user.ageGroup && <span className="ml-2">• {user.ageGroup}</span>}
                              {user.club && <span className="ml-2">• {user.club}</span>}
                            </div>
                          </div>
                          <Badge variant="outline" className="ml-2">
                            {user.role === 'player' ? 'Player' : 'Parent'}
                          </Badge>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {membersLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : groupMembers.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No members in this group yet. Add members to get started.
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupMembers.map((member) => {
                      const user = getUserById(member.userId);
                      if (!user) return null;
                      return (
                        <TableRow key={member.id} data-testid={`row-member-${member.id}`}>
                          <TableCell className="font-medium" data-testid={`text-member-name-${member.id}`}>
                            {user.firstName} {user.lastName}
                          </TableCell>
                          <TableCell data-testid={`text-member-email-${member.id}`}>
                            {user.email}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" data-testid={`badge-member-type-${member.id}`}>
                              {user.role === 'player' ? 'Player' : 'Adult'}
                            </Badge>
                          </TableCell>
                          <TableCell data-testid={`text-member-added-${member.id}`}>
                            {member.addedAt ? format(new Date(member.addedAt), "MMM d, yyyy") : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (managingMembersGroup) {
                                  removeMemberMutation.mutate({
                                    groupId: managingMembersGroup.id,
                                    userId: member.userId,
                                  });
                                }
                              }}
                              data-testid={`button-remove-member-${member.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setManagingMembersGroup(null);
                setMemberSearchQuery("");
              }}
              data-testid="button-close-members"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingGroup} onOpenChange={(open) => !open && setDeletingGroup(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingGroup?.name}"? This action cannot be undone. All members will be removed from this group.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingGroup && deleteMutation.mutate(deletingGroup.id)}
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
