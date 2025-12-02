import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useUserTerminology } from "@/hooks/use-user-terminology";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
  audienceMode?: 'youth_only' | 'mixed' | 'adult_only';
  householdPolicy?: {
    householdRequired: boolean;
    requiresHouseholdForMinors: boolean;
    adultCanSkipHousehold: boolean;
    description: string;
  };
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
  birthYear?: number;
};

type CreditHistoryItem = {
  id: string;
  userId: string | null;
  householdId: string | null;
  amountCents: number;
  isUsed: boolean;
};

export default function HouseholdSection() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { term } = useUserTerminology();
  const [householdName, setHouseholdName] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [confirmRemove, setConfirmRemove] = useState<{ memberId: string; memberName: string } | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [pendingPlayerToAdd, setPendingPlayerToAdd] = useState<Player | null>(null);

  const { data: households = [], isLoading: householdsLoading } = useQuery<HouseholdWithMembers[]>({
    queryKey: ["/api/households"],
    enabled: isAuthenticated && !!user?.tenantId,
  });

  const userHousehold = households.find(h => 
    h.members.some(m => m.userId === user?.id)
  );

  const currentUserMember = userHousehold?.members.find(m => m.userId === user?.id);

  const { data: userPlayers = [], isLoading: playersLoading } = useQuery<Player[]>({
    queryKey: ["/api/players"],
    enabled: isAuthenticated && !!user?.id,
  });

  const availablePlayers = userPlayers.filter(player => 
    !userHousehold?.members.some(m => m.playerId === player.id)
  );

  const { data: creditsHistoryData } = useQuery<{ credits: CreditHistoryItem[] }>({
    queryKey: ["/api/credits/history"],
    enabled: isAuthenticated,
  });

  const { data: agePolicyData } = useQuery<AgePolicy>({
    queryKey: ["/api/tenant/age-policy"],
    queryFn: () => fetch("/api/tenant/age-policy", { credentials: 'include' }).then(res => res.json()),
    enabled: isAuthenticated,
  });

  const isConsentRequired = agePolicyData?.requireConsent === true || 
                            agePolicyData?.requireConsent === 'true' || 
                            agePolicyData?.requireConsent === 1 || 
                            agePolicyData?.requireConsent === '1';

  const personalCredits = (creditsHistoryData?.credits || [])
    .filter(c => !c.isUsed && c.userId && !c.householdId)
    .reduce((sum, c) => sum + c.amountCents, 0);

  const householdCredits = (creditsHistoryData?.credits || [])
    .filter(c => !c.isUsed && c.householdId)
    .reduce((sum, c) => sum + c.amountCents, 0);

  const totalCredits = personalCredits + householdCredits;

  const createHouseholdMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest("POST", "/api/households", { name });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create household");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/households"] });
      setHouseholdName("");
      toast({ title: "Success", description: "Household created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create household", variant: "destructive" });
    },
  });

  const addPlayerMutation = useMutation({
    mutationFn: async (playerId: string) => {
      const response = await apiRequest("POST", `/api/households/${userHousehold?.id}/players`, { playerId });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add player to household");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/households"] });
      setSelectedPlayerId("");
      toast({ title: "Success", description: "Player added to household" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to add player", variant: "destructive" });
    },
  });

  const inviteParentMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("POST", `/api/households/${userHousehold?.id}/invite`, { email });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/households"] });
      setInviteEmail("");
      toast({ title: "Success", description: "Invitation sent successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to send invitation", variant: "destructive" });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const response = await apiRequest("DELETE", `/api/households/${userHousehold?.id}/members/${memberId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/households"] });
      setConfirmRemove(null);
      toast({ title: "Success", description: "Member removed from household" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to remove member", variant: "destructive" });
    },
  });

  const leaveHouseholdMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/households/${userHousehold?.id}/leave`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/households"] });
      setConfirmLeave(false);
      toast({ title: "Success", description: "You have left the household" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to leave household", variant: "destructive" });
    },
  });

  const handleAddPlayer = (playerId: string) => {
    const player = userPlayers.find(p => p.id === playerId);
    if (!player) return;

    if (isConsentRequired && user?.id) {
      setPendingPlayerToAdd(player);
      setShowConsentModal(true);
    } else {
      addPlayerMutation.mutate(playerId);
    }
  };

  const handleConsentComplete = () => {
    if (pendingPlayerToAdd) {
      addPlayerMutation.mutate(pendingPlayerToAdd.id);
      setPendingPlayerToAdd(null);
    }
    setShowConsentModal(false);
  };

  if (authLoading || householdsLoading || playersLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!userHousehold) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Create Your Household
            </CardTitle>
            <CardDescription>
              {agePolicyData?.householdPolicy?.householdRequired 
                ? "A household is required to register players. Create your household to get started."
                : "Create a household to manage your players and share credits with family members."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Household Name (e.g., The Smiths)"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                className="flex-1"
                data-testid="input-household-name"
              />
              <Button 
                onClick={() => createHouseholdMutation.mutate(householdName)}
                disabled={!householdName.trim() || createHouseholdMutation.isPending}
                data-testid="button-create-household"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Household
              </Button>
            </div>
          </CardContent>
        </Card>

        {agePolicyData?.householdPolicy && (
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                {agePolicyData.householdPolicy.description}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Home className="h-6 w-6" />
            {userHousehold.name}
          </h2>
          <p className="text-muted-foreground">
            {userHousehold.memberCount} {userHousehold.memberCount === 1 ? 'member' : 'members'}
          </p>
        </div>
        {totalCredits > 0 && (
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <DollarSign className="h-4 w-4 mr-1" />
            ${(totalCredits / 100).toFixed(2)} Credits
          </Badge>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Household Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userHousehold.members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      {member.user 
                        ? `${member.user.firstName || ''} ${member.user.lastName || ''}`.trim() || 'Unknown'
                        : member.player 
                          ? `${member.player.firstName} ${member.player.lastName}`
                          : 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.role === 'primary' ? 'default' : 'secondary'}>
                        {member.role === 'primary' ? 'Primary' : member.user ? 'Parent' : 'Player'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {member.userId !== user?.id && member.role !== 'primary' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmRemove({
                            memberId: member.id,
                            memberName: member.user 
                              ? `${member.user.firstName || ''} ${member.user.lastName || ''}`.trim()
                              : member.player 
                                ? `${member.player.firstName} ${member.player.lastName}`
                                : 'this member'
                          })}
                          data-testid={`button-remove-member-${member.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {availablePlayers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Add Player to Household
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                    <SelectTrigger className="flex-1" data-testid="select-player-to-add">
                      <SelectValue placeholder="Select a player" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePlayers.map((player) => (
                        <SelectItem key={player.id} value={player.id}>
                          {player.firstName} {player.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => handleAddPlayer(selectedPlayerId)}
                    disabled={!selectedPlayerId || addPlayerMutation.isPending}
                    data-testid="button-add-player-to-household"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Invite Another Parent
              </CardTitle>
              <CardDescription>
                Share household access with a spouse or co-parent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input
                  type="email"
                  placeholder="Email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1"
                  data-testid="input-invite-email"
                />
                <Button
                  onClick={() => inviteParentMutation.mutate(inviteEmail)}
                  disabled={!inviteEmail.trim() || inviteParentMutation.isPending}
                  data-testid="button-send-invite"
                >
                  Send Invite
                </Button>
              </div>
            </CardContent>
          </Card>

          {currentUserMember?.role !== 'primary' && (
            <Card className="border-destructive/50">
              <CardContent className="pt-6">
                <Button
                  variant="destructive"
                  onClick={() => setConfirmLeave(true)}
                  className="w-full"
                  data-testid="button-leave-household"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Leave Household
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={!!confirmRemove} onOpenChange={() => setConfirmRemove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {confirmRemove?.memberName} from your household?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRemove(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmRemove && removeMemberMutation.mutate(confirmRemove.memberId)}
              disabled={removeMemberMutation.isPending}
              data-testid="button-confirm-remove"
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmLeave} onOpenChange={setConfirmLeave}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Household</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave this household? You will lose access to shared credits and household features.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmLeave(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => leaveHouseholdMutation.mutate()}
              disabled={leaveHouseholdMutation.isPending}
              data-testid="button-confirm-leave"
            >
              Leave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showConsentModal && pendingPlayerToAdd && user?.id && (
        <ConsentDocumentModal
          isOpen={showConsentModal}
          onClose={() => {
            setShowConsentModal(false);
            setPendingPlayerToAdd(null);
          }}
          playerData={{
            id: pendingPlayerToAdd.id,
            firstName: pendingPlayerToAdd.firstName,
            lastName: pendingPlayerToAdd.lastName,
            birthDate: pendingPlayerToAdd.birthYear 
              ? `${pendingPlayerToAdd.birthYear}-01-01` 
              : new Date().toISOString().split('T')[0],
          }}
          parentData={{
            id: user.id,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
          }}
          isParentSigning={true}
          onComplete={handleConsentComplete}
        />
      )}
    </div>
  );
}
