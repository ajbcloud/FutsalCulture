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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Home, Users, UserPlus, UserMinus, LogOut, DollarSign, Plus, Trash2, User, FileCheck, Edit, Calendar, Building2, KeyRound, ArrowRightLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import type { HouseholdSelect, HouseholdMemberSelect } from "@shared/schema";
import ConsentDocumentModal from "@/components/consent/ConsentDocumentModal";
import PlayerForm from "@/components/player-form";

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

type ConsentDocument = {
  id: string;
  templateType: string;
  documentTitle: string;
  signedAt: string;
  signedByParentId: string;
};

type MissingForm = {
  templateId: string;
  templateType: string;
  title: string;
};

type PlayerConsentData = {
  player: {
    id: string;
    firstName: string;
    lastName: string;
    isAdult: boolean;
    birthYear: number | null;
  };
  documents: ConsentDocument[];
  missingForms: MissingForm[];
  hasCompletedConsent: boolean;
};

export default function HouseholdSection() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { term } = useUserTerminology();
  const [, setLocation] = useLocation();
  const [householdName, setHouseholdName] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [confirmRemove, setConfirmRemove] = useState<{ memberId: string; memberName: string } | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [pendingPlayerToAdd, setPendingPlayerToAdd] = useState<Player | null>(null);
  const [isAddPlayerDialogOpen, setIsAddPlayerDialogOpen] = useState(false);
  const [newlyCreatedPlayer, setNewlyCreatedPlayer] = useState<Player | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showJoinClubModal, setShowJoinClubModal] = useState(false);
  const [confirmDeletePlayer, setConfirmDeletePlayer] = useState<{ playerId: string; playerName: string; memberId: string } | null>(null);
  const [editingParentMember, setEditingParentMember] = useState<HouseholdMember | null>(null);
  const [isEditParentDialogOpen, setIsEditParentDialogOpen] = useState(false);
  const [selectedTransferTargetId, setSelectedTransferTargetId] = useState<string>("");

  const isUnaffiliated = user?.isUnaffiliated === true;

  // Super admins without tenantId can still access households (backend resolves tenant)
  const canAccessHouseholds = isAuthenticated && (!!user?.tenantId || user?.isSuperAdmin);
  
  const { data: households = [], isLoading: householdsLoading } = useQuery<HouseholdWithMembers[]>({
    queryKey: ["/api/households"],
    enabled: canAccessHouseholds,
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

  const { data: consentDocuments = [], isLoading: consentLoading } = useQuery<PlayerConsentData[]>({
    queryKey: ["/api/household/consent-documents"],
    enabled: isAuthenticated && !!user?.id,
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/households"] });
      await queryClient.refetchQueries({ queryKey: ["/api/households"] });
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

  const deletePlayerMutation = useMutation({
    mutationFn: async (playerId: string) => {
      const response = await apiRequest("DELETE", `/api/players/${playerId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete player");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/households"] });
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      setConfirmDeletePlayer(null);
      toast({ title: "Success", description: "Player deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete player", variant: "destructive" });
    },
  });

  const transferRoleMutation = useMutation({
    mutationFn: async (targetMemberId: string) => {
      const response = await apiRequest("PATCH", `/api/households/${userHousehold?.id}/members/${targetMemberId}/role`, { role: 'primary' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to transfer role");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/households"] });
      setIsEditParentDialogOpen(false);
      setEditingParentMember(null);
      setSelectedTransferTargetId("");
      toast({ title: "Success", description: "Primary role transferred successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to transfer role", variant: "destructive" });
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
    if (newlyCreatedPlayer) {
      // Consent completed for newly created player - close the dialog
      setNewlyCreatedPlayer(null);
      setIsAddPlayerDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      queryClient.invalidateQueries({ queryKey: ["/api/households"] });
    }
    setShowConsentModal(false);
  };

  const handleNewPlayerCreated = (createdPlayer?: Player) => {
    if (createdPlayer && isConsentRequired && user?.id) {
      // Player created - now show consent modal
      setNewlyCreatedPlayer(createdPlayer);
      setShowConsentModal(true);
    } else {
      // No consent required - just close the dialog
      setIsAddPlayerDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      queryClient.invalidateQueries({ queryKey: ["/api/households"] });
    }
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

      {/* Household Players Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Players
            </CardTitle>
            {isUnaffiliated ? (
              <Button 
                onClick={() => setShowJoinClubModal(true)}
                data-testid="button-add-new-player"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Player
              </Button>
            ) : (
              <Dialog open={isAddPlayerDialogOpen} onOpenChange={setIsAddPlayerDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-new-player">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Player
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-foreground">Add New Player</DialogTitle>
                  </DialogHeader>
                  <PlayerForm onSuccess={handleNewPlayerCreated} />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {userPlayers.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No players registered yet</p>
              <Button 
                variant="outline" 
                onClick={() => {
                  if (isUnaffiliated) {
                    setShowJoinClubModal(true);
                  } else {
                    setIsAddPlayerDialogOpen(true);
                  }
                }} 
                data-testid="button-add-first-player"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Player
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {userPlayers.map((player) => (
                <Card key={player.id} className="bg-muted/50">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-foreground">{player.firstName} {player.lastName}</h4>
                        {player.birthYear && (
                          <p className="text-sm text-muted-foreground">
                            Born {player.birthYear}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingPlayer(player);
                          setIsEditDialogOpen(true);
                        }}
                        data-testid={`button-edit-player-${player.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    <Badge variant="secondary" className="mt-3">
                      In Household
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Player Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Player</DialogTitle>
          </DialogHeader>
          <PlayerForm 
            player={editingPlayer as any}
            onSuccess={() => {
              setIsEditDialogOpen(false);
              setEditingPlayer(null);
              queryClient.invalidateQueries({ queryKey: ["/api/players"] });
            }} 
          />
        </DialogContent>
      </Dialog>

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
                {userHousehold.members.map((member) => {
                  const isPrimaryUser = currentUserMember?.role === 'primary';
                  const isPlayer = !!member.playerId && !member.userId;
                  const isParent = !!member.userId;
                  const isSelf = member.userId === user?.id;
                  const isPrimaryMember = member.role === 'primary';
                  
                  const canEditPlayer = isPlayer;
                  const canEditParent = isPrimaryUser && isParent;
                  const canEditSelf = isSelf && isParent;
                  const canEdit = canEditPlayer || canEditParent || canEditSelf;
                  const canDelete = isPlayer;

                  const memberName = member.user 
                    ? `${member.user.firstName || ''} ${member.user.lastName || ''}`.trim() || 'Unknown'
                    : member.player 
                      ? `${member.player.firstName} ${member.player.lastName}`
                      : 'Unknown';

                  return (
                    <TableRow key={member.id} data-testid={`member-row-${member.id}`}>
                      <TableCell>
                        {memberName}
                      </TableCell>
                      <TableCell>
                        <Badge variant={isPrimaryMember ? 'default' : 'secondary'}>
                          {isPrimaryMember ? 'Primary' : isParent ? 'Parent' : 'Player'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (isPlayer && member.player) {
                                  const playerData = userPlayers.find(p => p.id === member.playerId);
                                  if (playerData) {
                                    setEditingPlayer(playerData);
                                    setIsEditDialogOpen(true);
                                  }
                                } else if (isParent) {
                                  setEditingParentMember(member);
                                  setIsEditParentDialogOpen(true);
                                }
                              }}
                              data-testid={`button-edit-member-${member.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setConfirmDeletePlayer({
                                playerId: member.playerId!,
                                playerName: member.player 
                                  ? `${member.player.firstName} ${member.player.lastName}`
                                  : 'this player',
                                memberId: member.id
                              })}
                              data-testid={`button-delete-player-${member.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-6">
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
              {isUnaffiliated ? (
                <div className="text-center py-6">
                  <Building2 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground mb-4 text-sm">
                    You'll be able to invite other parents after joining a club.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setLocation('/join')}
                    data-testid="button-join-club-invite"
                  >
                    <KeyRound className="h-4 w-4 mr-2" />
                    Join a Club
                  </Button>
                </div>
              ) : (
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
              )}
            </CardContent>
          </Card>

          {isConsentRequired && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5" />
                  Consent Forms
                </CardTitle>
                <CardDescription>
                  Consent documents for your {term.players}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isUnaffiliated ? (
                  <div className="text-center py-8">
                    <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Consent forms will be available after you join a club. Each club has specific forms you'll need to complete for your players.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => setLocation('/join')}
                      data-testid="button-join-club-consent"
                    >
                      <KeyRound className="h-4 w-4 mr-2" />
                      Join a Club
                    </Button>
                  </div>
                ) : consentLoading ? (
                  <div className="text-center py-4 text-muted-foreground">Loading consent forms...</div>
                ) : consentDocuments.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    None registered yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {consentDocuments.map((playerData) => (
                      <div key={playerData.player.id} className="border rounded-lg p-4" data-testid={`consent-player-${playerData.player.id}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {playerData.player.firstName} {playerData.player.lastName}
                            </span>
                            {playerData.player.isAdult && (
                              <Badge variant="secondary" className="text-xs">Adult</Badge>
                            )}
                          </div>
                          {playerData.hasCompletedConsent ? (
                            <Badge variant="default" className="bg-green-600" data-testid={`consent-status-complete-${playerData.player.id}`}>
                              <FileCheck className="h-3 w-3 mr-1" />
                              Complete
                            </Badge>
                          ) : (
                            <Badge variant="destructive" data-testid={`consent-status-pending-${playerData.player.id}`}>
                              {playerData.missingForms.length} Pending
                            </Badge>
                          )}
                        </div>
                        
                        {playerData.documents.length > 0 && (
                          <div className="mb-3">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Signed Document</TableHead>
                                  <TableHead>Date</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {playerData.documents.map((doc) => (
                                  <TableRow key={doc.id}>
                                    <TableCell className="font-medium">
                                      <div className="flex items-center gap-2">
                                        <FileCheck className="h-4 w-4 text-green-600" />
                                        {doc.documentTitle}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(doc.signedAt).toLocaleDateString()}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                        
                        {playerData.missingForms.length > 0 && (
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-3">
                            <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                              Missing Required Forms:
                            </div>
                            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                              {playerData.missingForms.map((form) => (
                                <li key={form.templateId} className="flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                                  {form.title}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {playerData.documents.length === 0 && playerData.missingForms.length === 0 && (
                          <div className="text-sm text-muted-foreground text-center py-2">
                            No consent forms required
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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

      <AlertDialog open={!!confirmDeletePlayer} onOpenChange={() => setConfirmDeletePlayer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Player</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {confirmDeletePlayer?.playerName}? This will permanently remove the player from the household and delete all their data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-player">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDeletePlayer && deletePlayerMutation.mutate(confirmDeletePlayer.playerId)}
              disabled={deletePlayerMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-player"
            >
              {deletePlayerMutation.isPending ? "Deleting..." : "Delete Player"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isEditParentDialogOpen} onOpenChange={(open) => {
        setIsEditParentDialogOpen(open);
        if (!open) {
          setEditingParentMember(null);
          setSelectedTransferTargetId("");
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Parent Information</DialogTitle>
            <DialogDescription>
              View and manage parent details
            </DialogDescription>
          </DialogHeader>
          {editingParentMember && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Name</Label>
                <div className="p-3 bg-muted rounded-md text-foreground">
                  {editingParentMember.user 
                    ? `${editingParentMember.user.firstName || ''} ${editingParentMember.user.lastName || ''}`.trim() || 'Unknown'
                    : 'Unknown'}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Role</Label>
                <div className="p-3 bg-muted rounded-md">
                  <Badge variant={editingParentMember.role === 'primary' ? 'default' : 'secondary'}>
                    {editingParentMember.role === 'primary' ? 'Primary Parent' : 'Parent'}
                  </Badge>
                </div>
              </div>

              {currentUserMember?.role === 'primary' && editingParentMember.userId === user?.id && (
                <div className="pt-4 border-t border-border">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm font-medium">Transfer Primary Role</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Transfer your primary parent role to another parent in the household. You will become a regular parent member.
                    </p>
                    {(() => {
                      const otherParents = userHousehold?.members.filter(
                        m => m.userId && m.userId !== user?.id
                      ) || [];
                      
                      if (otherParents.length === 0) {
                        return (
                          <p className="text-sm text-muted-foreground italic">
                            No other parents in household to transfer to. Invite another parent first.
                          </p>
                        );
                      }
                      
                      return (
                        <div className="space-y-3">
                          <Select
                            value={selectedTransferTargetId}
                            onValueChange={setSelectedTransferTargetId}
                          >
                            <SelectTrigger data-testid="select-transfer-target">
                              <SelectValue placeholder="Select a parent" />
                            </SelectTrigger>
                            <SelectContent>
                              {otherParents.map((parent) => (
                                <SelectItem key={parent.id} value={parent.id}>
                                  {parent.user 
                                    ? `${parent.user.firstName || ''} ${parent.user.lastName || ''}`.trim() || 'Unknown'
                                    : 'Unknown'}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            className="w-full"
                            disabled={!selectedTransferTargetId || transferRoleMutation.isPending}
                            onClick={() => {
                              if (selectedTransferTargetId) {
                                transferRoleMutation.mutate(selectedTransferTargetId);
                              }
                            }}
                            data-testid="button-transfer-primary-role"
                          >
                            {transferRoleMutation.isPending ? "Transferring..." : "Transfer Primary Role"}
                          </Button>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditParentDialogOpen(false);
                setEditingParentMember(null);
                setSelectedTransferTargetId("");
              }}
              data-testid="button-close-edit-parent"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showConsentModal && (pendingPlayerToAdd || newlyCreatedPlayer) && user?.id && (
        <ConsentDocumentModal
          isOpen={showConsentModal}
          onClose={() => {
            setShowConsentModal(false);
            setPendingPlayerToAdd(null);
            setNewlyCreatedPlayer(null);
          }}
          playerData={{
            id: (pendingPlayerToAdd || newlyCreatedPlayer)!.id,
            firstName: (pendingPlayerToAdd || newlyCreatedPlayer)!.firstName,
            lastName: (pendingPlayerToAdd || newlyCreatedPlayer)!.lastName,
            birthDate: (pendingPlayerToAdd || newlyCreatedPlayer)!.birthYear 
              ? `${(pendingPlayerToAdd || newlyCreatedPlayer)!.birthYear}-01-01` 
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

      <Dialog open={showJoinClubModal} onOpenChange={setShowJoinClubModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <DialogTitle className="text-xl">Join a Club First</DialogTitle>
            </div>
            <DialogDescription className="text-base pt-2">
              Before you can add players, you'll need to join a club. Each club has their own consent forms and requirements that players need to complete.
            </DialogDescription>
          </DialogHeader>
          <div className="pt-4">
            <Button 
              className="w-full gap-2" 
              size="lg"
              onClick={() => {
                setShowJoinClubModal(false);
                setLocation('/join');
              }}
              data-testid="button-go-join-club"
            >
              <KeyRound className="w-5 h-5" />
              Join a Club
            </Button>
            <Button 
              variant="ghost" 
              className="w-full mt-2"
              onClick={() => setShowJoinClubModal(false)}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
