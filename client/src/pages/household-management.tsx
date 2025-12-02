import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useUserTerminology } from "@/hooks/use-user-terminology";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Home, Users, UserPlus, UserMinus, LogOut, DollarSign, Plus, Trash2, User, FileCheck } from "lucide-react";
import { Link } from "wouter";
import type { HouseholdSelect, HouseholdMemberSelect } from "@shared/schema";
import ConsentDocumentModal from "@/components/consent/ConsentDocumentModal";

type AgePolicy = {
  requireConsent: boolean | string | number;
};

type HouseholdMember = HouseholdMemberSelect & {
  user?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  };
  player?: {
    id: string;
    firstName: string;
    lastName: string;
  };
};

type HouseholdWithMembers = HouseholdSelect & {
  memberCount: number;
  members: Array<HouseholdMember>;
};

type Player = {
  id: string;
  firstName: string;
  lastName: string;
};

type CreditHistoryItem = {
  id: string;
  userId: string | null;
  householdId: string | null;
  amountCents: number;
  isUsed: boolean;
};

export default function HouseholdManagement() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { term } = useUserTerminology();
  const [householdName, setHouseholdName] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [confirmRemove, setConfirmRemove] = useState<{ memberId: string; memberName: string } | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [pendingPlayerToAdd, setPendingPlayerToAdd] = useState<{ id: string; firstName: string; lastName: string } | null>(null);

  // Fetch all households and find user's household
  const { data: households = [], isLoading: householdsLoading } = useQuery<HouseholdWithMembers[]>({
    queryKey: ["/api/households"],
    enabled: isAuthenticated && !!user?.tenantId,
  });

  // Find the household the user is in
  const userHousehold = households.find(h => 
    h.members.some(m => m.userId === user?.id)
  );

  // Get the current user's member record
  const currentUserMember = userHousehold?.members.find(m => m.userId === user?.id);

  // Fetch user's players
  const { data: userPlayers = [], isLoading: playersLoading } = useQuery<Player[]>({
    queryKey: ["/api/players"],
    enabled: isAuthenticated && !!user?.id,
  });

  // Filter players not already in household
  const availablePlayers = userPlayers.filter(player => 
    !userHousehold?.members.some(m => m.playerId === player.id)
  );

  // Fetch credit history to calculate breakdown
  const { data: creditsHistoryData } = useQuery<{ credits: CreditHistoryItem[] }>({
    queryKey: ["/api/credits/history"],
    enabled: isAuthenticated,
  });

  // Fetch age policy to check if consent forms are required (uses tenant endpoint, not admin)
  const { data: agePolicyData } = useQuery<AgePolicy>({
    queryKey: ["/api/tenant/age-policy"],
    queryFn: () => fetch("/api/tenant/age-policy", { credentials: 'include' }).then(res => res.json()),
    enabled: isAuthenticated,
  });

  // Check if consent forms are required (handle all possible truthy values)
  const isConsentRequired = agePolicyData?.requireConsent === true || 
                            agePolicyData?.requireConsent === 'true' || 
                            agePolicyData?.requireConsent === 1 || 
                            agePolicyData?.requireConsent === '1';

  // Calculate personal and household credit breakdown
  const personalCredits = (creditsHistoryData?.credits || [])
    .filter(c => !c.isUsed && c.userId && !c.householdId)
    .reduce((sum, c) => sum + c.amountCents, 0);

  const householdCredits = (creditsHistoryData?.credits || [])
    .filter(c => !c.isUsed && c.householdId)
    .reduce((sum, c) => sum + c.amountCents, 0);

  const totalCredits = personalCredits + householdCredits;

  // Create household mutation
  const createHouseholdMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/households", { name });
      return await res.json();
    },
    onSuccess: (newHousehold: HouseholdSelect) => {
      queryClient.invalidateQueries({ queryKey: ["/api/households"] });
      setHouseholdName("");
      toast({
        title: "Success",
        description: "Household created successfully",
      });
      
      // Automatically add the current user as admin
      addMemberMutation.mutate({ 
        householdId: newHousehold.id, 
        userId: user?.id,
        role: "admin" 
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create household",
        variant: "destructive",
      });
    },
  });

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: async ({ householdId, userId, playerId, role }: { 
      householdId: string; 
      userId?: string; 
      playerId?: string;
      role?: string;
    }) => {
      const res = await apiRequest("POST", `/api/households/${householdId}/members`, {
        userId,
        playerId,
        role: role || "member",
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/households"] });
      setSelectedPlayerId("");
      setInviteEmail("");
      toast({
        title: "Success",
        description: "Member added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add member",
        variant: "destructive",
      });
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async ({ householdId, memberId }: { householdId: string; memberId: string }) => {
      const res = await apiRequest("DELETE", `/api/households/${householdId}/members/${memberId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/households"] });
      setConfirmRemove(null);
      toast({
        title: "Success",
        description: "Member removed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove member",
        variant: "destructive",
      });
    },
  });

  // Leave household mutation (removes current user)
  const leaveHouseholdMutation = useMutation({
    mutationFn: async () => {
      if (!userHousehold || !currentUserMember) return;
      const res = await apiRequest("DELETE", `/api/households/${userHousehold.id}/members/${currentUserMember.id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/households"] });
      setConfirmLeave(false);
      toast({
        title: "Success",
        description: "You have left the household",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to leave household",
        variant: "destructive",
      });
    },
  });

  // Invite parent mutation
  const inviteParentMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest("POST", "/api/parent2/invite", {
        method: "email",
        email,
      });
      return await res.json();
    },
    onSuccess: () => {
      setInviteEmail("");
      toast({
        title: "Invitation Sent",
        description: "An invitation has been sent to the email address provided.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
    },
  });

  const handleCreateHousehold = () => {
    if (!householdName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a household name",
        variant: "destructive",
      });
      return;
    }
    createHouseholdMutation.mutate(householdName);
  };

  const handleAddPlayer = () => {
    if (!selectedPlayerId || !userHousehold) {
      toast({
        title: "Error",
        description: "Please select a player",
        variant: "destructive",
      });
      return;
    }
    
    // Find the selected player details for consent form
    const selectedPlayer = userPlayers.find(p => p.id === selectedPlayerId);
    if (!selectedPlayer) return;
    
    // If consent forms are required, show consent modal first
    if (isConsentRequired) {
      setPendingPlayerToAdd(selectedPlayer);
      setShowConsentModal(true);
      return;
    }
    
    // Otherwise, add player directly
    addMemberMutation.mutate({ 
      householdId: userHousehold.id, 
      playerId: selectedPlayerId 
    });
  };

  const handleConsentComplete = (signedDocuments: any[]) => {
    // Consent forms signed, now add the player to household
    if (!pendingPlayerToAdd || !userHousehold) {
      toast({
        title: "Error",
        description: "No player selected to add",
        variant: "destructive",
      });
      return;
    }
    
    addMemberMutation.mutate({ 
      householdId: userHousehold.id, 
      playerId: pendingPlayerToAdd.id 
    });
    
    // Close modal and clear pending player
    setShowConsentModal(false);
    setPendingPlayerToAdd(null);
    setSelectedPlayerId("");
  };

  const handleConsentClose = () => {
    setShowConsentModal(false);
    setPendingPlayerToAdd(null);
  };

  const handleInviteParent = () => {
    if (!inviteEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    
    inviteParentMutation.mutate(inviteEmail);
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    setConfirmRemove({ memberId, memberName });
  };

  const confirmRemoveMember = () => {
    if (!confirmRemove || !userHousehold) return;
    removeMemberMutation.mutate({ 
      householdId: userHousehold.id, 
      memberId: confirmRemove.memberId 
    });
  };

  const handleLeaveHousehold = () => {
    setConfirmLeave(true);
  };

  const confirmLeaveHousehold = () => {
    leaveHouseholdMutation.mutate();
  };

  if (authLoading || householdsLoading || playersLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" data-testid="loading-spinner" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="flex items-center justify-center py-16">
          <Card className="bg-card border-border p-8 text-center">
            <p className="text-muted-foreground" data-testid="text-login-required">Please log in to manage your household.</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3" data-testid="text-page-title">
            <Home className="w-8 h-8" />
            Household Management
          </h1>
          <p className="text-muted-foreground mt-2" data-testid="text-page-description">
            Manage your household members and shared credits
          </p>
        </div>

        {/* Credit Balance Display with Breakdown */}
        {totalCredits > 0 && (
          <Card className="bg-card border-border mb-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Available Credits
                </CardTitle>
                <Link href="/credits/history">
                  <Button variant="outline" size="sm" data-testid="button-view-history">
                    View History
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-3xl font-bold text-green-600" data-testid="text-total-credits">
                  ${(totalCredits / 100).toFixed(2)}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border">
                  {/* Personal Credits */}
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="text-sm text-muted-foreground">{term} Credits</div>
                      <div className="text-xl font-semibold" data-testid="text-personal-credits">
                        ${(personalCredits / 100).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Household Credits - only show if user is in household */}
                  {userHousehold && (
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-purple-600" />
                      <div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          Household Credits
                          <Badge variant="secondary" className="text-xs" data-testid="badge-shared">
                            Shared
                          </Badge>
                        </div>
                        <div className="text-xl font-semibold" data-testid="text-household-credits">
                          ${(householdCredits / 100).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {userHousehold ? (
          /* View Current Household */
          <div className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                  <div>
                    <CardTitle className="text-2xl" data-testid="text-household-name">{userHousehold.name}</CardTitle>
                    <CardDescription className="mt-1" data-testid="text-member-count">
                      {userHousehold.memberCount} {userHousehold.memberCount === 1 ? 'member' : 'members'}
                    </CardDescription>
                  </div>
                  <Button
                    onClick={handleLeaveHousehold}
                    variant="outline"
                    className="border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                    data-testid="button-leave-household"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Leave Household
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Members
                  </h3>
                  
                  {userHousehold.members.length === 0 ? (
                    <p className="text-muted-foreground" data-testid="text-no-members">No members in this household yet.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userHousehold.members.map((member) => {
                          const isCurrentUser = member.userId === user?.id;
                          const memberName = member.user 
                            ? `${member.user.firstName} ${member.user.lastName}`
                            : member.player 
                            ? `${member.player.firstName} ${member.player.lastName}`
                            : 'Unknown';
                          const memberType = member.user ? 'Adult' : 'Player';
                          
                          return (
                            <TableRow key={member.id} data-testid={`row-member-${member.id}`}>
                              <TableCell className="font-medium" data-testid={`text-member-name-${member.id}`}>
                                {memberName}
                                {isCurrentUser && <Badge variant="outline" className="ml-2">You</Badge>}
                              </TableCell>
                              <TableCell data-testid={`text-member-type-${member.id}`}>{memberType}</TableCell>
                              <TableCell data-testid={`text-member-role-${member.id}`}>
                                <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                                  {member.role}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {!isCurrentUser && (
                                  <Button
                                    onClick={() => handleRemoveMember(member.id, memberName)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                    data-testid={`button-remove-member-${member.id}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Add Members Section */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Add Members
                </CardTitle>
                <CardDescription>Add players from your account to the household</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {availablePlayers.length > 0 ? (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <Label htmlFor="player-select">Select Player</Label>
                      <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                        <SelectTrigger id="player-select" data-testid="select-player">
                          <SelectValue placeholder="Choose a player" />
                        </SelectTrigger>
                        <SelectContent>
                          {availablePlayers.map((player) => (
                            <SelectItem key={player.id} value={player.id} data-testid={`option-player-${player.id}`}>
                              {player.firstName} {player.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={handleAddPlayer}
                        disabled={!selectedPlayerId || addMemberMutation.isPending}
                        data-testid="button-add-player"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {addMemberMutation.isPending ? "Adding..." : "Add Player"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground" data-testid="text-no-available-players">
                    All your players are already in the household.
                  </p>
                )}

                <div className="pt-4 border-t border-border">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4" />
                      <h4 className="font-medium">Invite Another Adult</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Invite a spouse, partner, or co-parent to help manage household activities.
                      {isConsentRequired && (
                        <span className="flex items-center gap-1 mt-1 text-amber-600 dark:text-amber-400">
                          <FileCheck className="w-3 h-3" />
                          They will need to sign consent forms when they join.
                        </span>
                      )}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <Label htmlFor="invite-email">Email Address</Label>
                        <Input
                          id="invite-email"
                          type="email"
                          placeholder="partner@example.com"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          data-testid="input-invite-email"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          onClick={handleInviteParent}
                          disabled={!inviteEmail.trim() || inviteParentMutation.isPending}
                          variant="outline"
                          data-testid="button-invite-parent"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          {inviteParentMutation.isPending ? "Sending..." : "Send Invite"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Create New Household */
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Home className="w-6 h-6" />
                Create a Household
              </CardTitle>
              <CardDescription>
                Create a household to share credits with family members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="household-name">Household Name</Label>
                  <Input
                    id="household-name"
                    placeholder="e.g., Smith Family"
                    value={householdName}
                    onChange={(e) => setHouseholdName(e.target.value)}
                    data-testid="input-household-name"
                  />
                </div>
                <Button
                  onClick={handleCreateHousehold}
                  disabled={!householdName.trim() || createHouseholdMutation.isPending}
                  className="w-full sm:w-auto"
                  data-testid="button-create-household"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {createHouseholdMutation.isPending ? "Creating..." : "Create Household"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Remove Member Confirmation Dialog */}
        <Dialog open={!!confirmRemove} onOpenChange={(open) => !open && setConfirmRemove(null)}>
          <DialogContent data-testid="dialog-confirm-remove">
            <DialogHeader>
              <DialogTitle>Remove Member</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove {confirmRemove?.memberName} from the household?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setConfirmRemove(null)}
                data-testid="button-cancel-remove"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmRemoveMember}
                disabled={removeMemberMutation.isPending}
                data-testid="button-confirm-remove"
              >
                {removeMemberMutation.isPending ? "Removing..." : "Remove"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Leave Household Confirmation Dialog */}
        <Dialog open={confirmLeave} onOpenChange={setConfirmLeave}>
          <DialogContent data-testid="dialog-confirm-leave">
            <DialogHeader>
              <DialogTitle>Leave Household</DialogTitle>
              <DialogDescription>
                Are you sure you want to leave this household? You will no longer have access to shared household credits.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setConfirmLeave(false)}
                data-testid="button-cancel-leave"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmLeaveHousehold}
                disabled={leaveHouseholdMutation.isPending}
                data-testid="button-confirm-leave"
              >
                {leaveHouseholdMutation.isPending ? "Leaving..." : "Leave Household"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Consent Form Modal for adding players to household */}
        {showConsentModal && pendingPlayerToAdd && (
          <ConsentDocumentModal
            isOpen={showConsentModal}
            onClose={handleConsentClose}
            onComplete={handleConsentComplete}
            isParentSigning={true}
            playerData={{
              id: pendingPlayerToAdd.id,
              firstName: pendingPlayerToAdd.firstName,
              lastName: pendingPlayerToAdd.lastName,
              birthDate: '',
            }}
            parentData={user ? {
              id: user.id,
              firstName: user.firstName || '',
              lastName: user.lastName || '',
            } : undefined}
          />
        )}
      </div>
    </div>
  );
}
