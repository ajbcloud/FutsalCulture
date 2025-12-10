import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation, useSearch } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Navbar from "@/components/navbar";
import PlayerPortalControls from "@/components/player-portal-controls";
import PlayerForm from "@/components/player-form";
import SessionCard from "@/components/session-card";
import EnhancedSessionCard from "@/components/enhanced-session-card";
import WaitlistOffers from "@/components/waitlist-offers";
import { SessionPaymentModal } from "@/components/session-payment-modal";
import { ParentSessionHistoryDropdown } from "@/components/parent-session-history-dropdown";
import HouseholdSection from "@/components/household-section";
import ConsentDocumentModal from "@/components/consent/ConsentDocumentModal";


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Trash2, Plus, Calendar, Users, Clock, ArrowRight, Sparkles, CalendarDays, UserPlus, Home, Building2, KeyRound, CheckCircle2, X } from "lucide-react";
import { format } from "date-fns";
import { players, signups, futsalSessions, NotificationPreferences } from "@shared/schema";

type Player = typeof players.$inferSelect;
type Signup = typeof signups.$inferSelect;
type FutsalSession = typeof futsalSessions.$inferSelect;
import { calculateAgeGroup, isSessionEligibleForPlayer, isSessionBookingOpen, getSessionStatusColor, getSessionStatusText } from "@shared/utils";
import { ReservationCountdown } from "@/components/reservation-countdown";
import { AGE_GROUPS } from "@shared/constants";

export default function Dashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [localReservedSessions, setLocalReservedSessions] = useState<Set<string>>(new Set());
  const [, setLocation] = useLocation();

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPaymentSession, setSelectedPaymentSession] = useState<{
    session: FutsalSession;
    player: Player;
    signup: any;
  } | null>(null);

  // Consent modal state
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentPlayerData, setConsentPlayerData] = useState<{
    id: string;
    firstName: string;
    lastName: string;
    birthDate: string;
  } | null>(null);

  // Welcome banner for new household members
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);

  // Sync tab state with URL query params - MUST be with other hooks before any computed values
  const searchString = useSearch();
  const getTabFromUrl = useCallback(() => {
    const params = new URLSearchParams(searchString);
    const tabParam = params.get('tab');
    return tabParam === 'household' ? 'household' : 'overview';
  }, [searchString]);

  const [activeTab, setActiveTab] = useState(getTabFromUrl);

  // Update tab when URL changes (e.g., from redirect)
  useEffect(() => {
    const newTab = getTabFromUrl();
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
  }, [searchString, getTabFromUrl, activeTab]);

  // Check for joined=household in URL (welcome banner for new household members)
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    if (params.get('joined') === 'household') {
      setShowWelcomeBanner(true);
      // Clear the URL param without triggering a navigation
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchString]);

  // Update URL when tab changes
  const handleTabChange = useCallback((newTab: string) => {
    setActiveTab(newTab);
    const newUrl = newTab === 'overview' ? '/dashboard' : `/dashboard?tab=${newTab}`;
    setLocation(newUrl, { replace: true });
  }, [setLocation]);

  const { data: players = [], isLoading: playersLoading } = useQuery<Player[]>({
    queryKey: ["/api/players"],
    enabled: isAuthenticated,
  });

  const { data: signups = [], isLoading: signupsLoading } = useQuery<Array<Signup & { player: Player; session: FutsalSession }>>({
    queryKey: ["/api/signups"],
    enabled: isAuthenticated,
  });

  const { data: notificationPrefs, isLoading: prefsLoading } = useQuery<NotificationPreferences>({
    queryKey: ["/api/notification-preferences"],
    enabled: isAuthenticated,
  });

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<FutsalSession[]>({
    queryKey: ["/api/sessions", "includePast"],
    queryFn: async () => {
      const response = await fetch("/api/sessions?includePast=true");
      if (!response.ok) {
        throw new Error("Failed to fetch sessions");
      }
      return response.json();
    },
    enabled: isAuthenticated,
  });

  // Fetch age policy to determine household requirements
  type AgePolicy = {
    audienceMode?: 'youth_only' | 'mixed' | 'adult_only';
    householdPolicy?: {
      householdRequired: boolean;
      requiresHouseholdForMinors: boolean;
      adultCanSkipHousehold: boolean;
      description: string;
    };
  };

  const { data: agePolicy } = useQuery<AgePolicy>({
    queryKey: ["/api/tenant/age-policy"],
    queryFn: () => fetch("/api/tenant/age-policy", { credentials: 'include' }).then(res => res.json()),
    enabled: isAuthenticated,
  });

  // Fetch households to check if user has a household
  type HouseholdMember = { userId?: string | null };
  type Household = { members: HouseholdMember[] };
  
  const { data: households = [] } = useQuery<Household[]>({
    queryKey: ["/api/households"],
    enabled: isAuthenticated && !!user?.tenantId,
  });

  const userHasHousehold = households.some(h => 
    h.members?.some(m => m.userId === user?.id)
  );

  // Query for household consent documents to check for missing consent forms
  type HouseholdConsentData = {
    player: {
      id: string;
      firstName: string;
      lastName: string;
      isAdult: boolean;
      birthYear: number | null;
    };
    documents: any[];
    missingForms: Array<{
      templateId: string;
      templateType: string;
      title: string;
    }>;
    hasCompletedConsent: boolean;
  };

  // Check if user is unaffiliated (no club membership) - must be computed before using in queries
  const isUnaffiliated = user?.isUnaffiliated === true;

  const { data: householdConsentData = [], refetch: refetchConsentData } = useQuery<HouseholdConsentData[]>({
    queryKey: ["/api/household/consent-documents"],
    enabled: isAuthenticated && !!user?.tenantId && !isUnaffiliated,
  });

  // Find players (minors) who need consent forms signed
  const playersNeedingConsent = householdConsentData.filter(
    (data) => !data.player.isAdult && data.missingForms.length > 0
  );

  // Show consent modal automatically when there are minors with missing consent forms
  // But wait until welcome banner is dismissed first
  useEffect(() => {
    if (playersNeedingConsent.length > 0 && !showConsentModal && !consentPlayerData && !showWelcomeBanner) {
      const firstPlayerNeedingConsent = playersNeedingConsent[0];
      setConsentPlayerData({
        id: firstPlayerNeedingConsent.player.id,
        firstName: firstPlayerNeedingConsent.player.firstName,
        lastName: firstPlayerNeedingConsent.player.lastName,
        birthDate: firstPlayerNeedingConsent.player.birthYear 
          ? `${firstPlayerNeedingConsent.player.birthYear}-01-01`
          : '',
      });
      setShowConsentModal(true);
    }
  }, [playersNeedingConsent, showConsentModal, consentPlayerData, showWelcomeBanner]);

  const handleConsentComplete = () => {
    setShowConsentModal(false);
    setConsentPlayerData(null);
    // Refetch consent data to check if there are more players needing consent
    refetchConsentData();
    queryClient.invalidateQueries({ queryKey: ["/api/household/consent-documents"] });
    toast({
      title: "Consent forms signed",
      description: "Thank you for completing the required consent forms.",
    });
  };

  const handleConsentClose = () => {
    // User cannot close the modal if there are still players needing consent
    if (playersNeedingConsent.length > 0) {
      toast({
        title: "Consent required",
        description: "Please complete the consent forms before continuing.",
        variant: "destructive",
      });
      return;
    }
    setShowConsentModal(false);
    setConsentPlayerData(null);
  };

  // Determine if player creation should be blocked based on age policy
  const householdRequired = agePolicy?.householdPolicy?.householdRequired === true;
  const needsHouseholdFirst = householdRequired && !userHasHousehold;
  
  // For mixed mode: minors need household but adults don't
  const isMixedMode = agePolicy?.audienceMode === 'mixed';
  const requiresHouseholdForMinors = agePolicy?.householdPolicy?.requiresHouseholdForMinors === true;
  const showMinorHouseholdWarning = isMixedMode && requiresHouseholdForMinors && !userHasHousehold;

  const deletePlayerMutation = useMutation({
    mutationFn: async (playerId: string) => {
      await apiRequest("DELETE", `/api/players/${playerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      toast({
        title: "Success",
        description: "Player deleted successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete player",
        variant: "destructive",
      });
    },
  });

  const cancelSignupMutation = useMutation({
    mutationFn: async (signupId: string) => {
      await apiRequest("DELETE", `/api/signups/${signupId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/signups"] });
      toast({
        title: "Success",
        description: "Reservation cancelled successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to cancel reservation",
        variant: "destructive",
      });
    },
  });

  const updateNotificationsMutation = useMutation({
    mutationFn: async (preferences: { email: boolean; sms: boolean }) => {
      const response = await apiRequest("POST", "/api/notification-preferences", preferences);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notification-preferences"] });
      toast({
        title: "Success",
        description: "Notification preferences updated",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update preferences",
        variant: "destructive",
      });
    },
  });

  const createSignupMutation = useMutation({
    mutationFn: async (data: { playerId: string; sessionId: string }) => {
      const response = await apiRequest("POST", "/api/signups", data);
      return response.json();
    },
    onSuccess: (signup) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/signups"] });
      toast({
        title: "Success",
        description: "Spot reserved! Complete payment to confirm.",
      });
      window.location.href = `/checkout/${signup.id}`;
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to reserve spot",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Redirect admins to appropriate portal
  useEffect(() => {
    if (!isLoading && user) {
      if (user.isSuperAdmin) {
        setLocation('/super-admin', { replace: true });
      } else if (user.isAdmin || user.isAssistant) {
        setLocation('/admin', { replace: true });
      }
    }
  }, [isLoading, user, setLocation]);

  // Show loading state while redirecting admins to prevent flicker
  if (!isLoading && user && (user.isSuperAdmin || user.isAdmin || user.isAssistant)) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isLoading || playersLoading || signupsLoading || prefsLoading || sessionsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const upcomingSignups = signups.filter(signup => 
    new Date(signup.session.startTime) > new Date()
  );

  const todaySessions = sessions.filter(session => {
    const sessionDate = new Date(session.startTime);
    const now = new Date();
    const today = new Date();
    const isToday = sessionDate.toDateString() === today.toDateString();
    
    if (!isToday) return false;
    if (sessionDate <= now) return false;
    
    if (players.length === 0) {
      return false;
    }
    
    return players.some(player => isSessionEligibleForPlayer(session, player));
  });

  const reservedSessionIds = new Set(
    signups
      .filter(signup => {
        const sessionDate = new Date(signup.session.startTime);
        const today = new Date();
        return sessionDate.toDateString() === today.toDateString();
      })
      .map(signup => signup.sessionId)
  );

  const actualReservedSessionIds = new Set(
    Array.from(reservedSessionIds).filter(sessionId => 
      !localReservedSessions.has(`cleared-${sessionId}`)
    )
  );

  const paidSessionsCount = signups.filter(s => s.paid).length;
  const pendingPayments = upcomingSignups.filter(s => !s.paid).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navbar />
      
      {/* Welcome Banner for new household members */}
      {showWelcomeBanner && (
        <div className="bg-gradient-to-r from-green-500/10 via-green-500/5 to-green-500/10 border-b border-green-500/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-500/20">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-800 dark:text-green-200">Welcome to the household!</h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    You've successfully joined. You can now view and manage all players in this household.
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowWelcomeBanner(false)}
                className="text-green-700 dark:text-green-300 hover:bg-green-500/10"
                data-testid="button-dismiss-welcome"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Unaffiliated User Banner - Join a Club CTA */}
      {isUnaffiliated && (
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-b border-primary/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="p-3 rounded-full bg-primary/20">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="font-semibold text-foreground">Join a Club</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Have an invite code? Join a club to start booking sessions and accessing training programs.
                </p>
              </div>
              <Button 
                onClick={() => setLocation('/join')}
                className="gap-2 flex-shrink-0"
                data-testid="button-join-club-cta"
              >
                <KeyRound className="w-4 h-4" />
                Enter Invite Code
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Dashboard Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="overview" className="gap-2" data-testid="tab-overview">
              <Calendar className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="household" className="gap-2" data-testid="tab-household">
              <Home className="w-4 h-4" />
              Household
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6">
            {/* Overview Tab Content - Original Dashboard */}
            {/* Modern Hero Section */}
            <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
                Hey{user?.firstName ? `, ${user.firstName}` : ''}!
              </h1>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                <span>{isUnaffiliated ? 'Welcome to PlayHQ' : 'Welcome back'}</span>
              </div>
              <p className="text-lg text-muted-foreground max-w-xl">
                {isUnaffiliated 
                  ? "When you're ready, join a club to start booking sessions. Once you join a club, you can set up your household and add your players."
                  : "Ready to book today's training sessions? Let's get your players on the field."}
              </p>
            </div>
            
            {/* Quick Stats - Show different stats for unaffiliated users */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 text-center hover:border-primary/30 transition-colors">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary mx-auto mb-2">
                  <Users className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold text-foreground tabular-nums">{players.length}</p>
                <p className="text-xs text-muted-foreground">Players</p>
              </div>
              {!isUnaffiliated && (
                <>
                  <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 text-center hover:border-primary/30 transition-colors">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500/10 text-green-500 mx-auto mb-2">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <p className="text-2xl font-bold text-foreground tabular-nums">{paidSessionsCount}</p>
                    <p className="text-xs text-muted-foreground">Sessions Booked</p>
                  </div>
                  <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 text-center hover:border-primary/30 transition-colors col-span-2 sm:col-span-1">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 mx-auto mb-2">
                      <Clock className="w-5 h-5" />
                    </div>
                    <p className="text-2xl font-bold text-foreground tabular-nums">{pendingPayments}</p>
                    <p className="text-xs text-muted-foreground">Pending Payment</p>
                  </div>
                </>
              )}
              {isUnaffiliated && (
                <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 text-center hover:border-primary/30 transition-colors">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 mx-auto mb-2">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-bold text-foreground tabular-nums">0</p>
                  <p className="text-xs text-muted-foreground">Clubs Joined</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Waitlist Offers Section - Only show for club members */}
      {!isUnaffiliated && (
        <section className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <WaitlistOffers />
        </section>
      )}

      {/* Today's Sessions Section - Only show for club members */}
      {isUnaffiliated ? (
        <section className="py-8 sm:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="border-dashed border-2 bg-card/50">
              <CardContent className="flex flex-col items-center justify-center py-16 px-8 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Building2 className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Join a Club to Book Sessions</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  To book training sessions, you'll need to join a club first. Ask your club for an invite code.
                </p>
                <Button 
                  size="lg" 
                  className="gap-2"
                  onClick={() => setLocation('/join')}
                  data-testid="button-join-club-sessions"
                >
                  <KeyRound className="w-5 h-5" />
                  Enter Invite Code
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      ) : (
        <section className="py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Today's Sessions</h2>
              <p className="text-muted-foreground">Sessions available for booking today</p>
            </div>
            <Button 
              variant="outline" 
              className="gap-2 group"
              onClick={() => setLocation('/calendar')}
              data-testid="button-view-future-sessions"
            >
              <CalendarDays className="w-4 h-4" />
              View Future Sessions
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </div>

          {todaySessions.length === 0 ? (
            <Card className="border-dashed border-2 bg-card/50">
              <CardContent className="flex flex-col items-center justify-center py-16 px-8 text-center">
                {players.length === 0 ? (
                  <>
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                      <UserPlus className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Add Your First Player</h3>
                    <p className="text-muted-foreground mb-6 max-w-sm">
                      Get started by adding a player to your household. You'll then see all available sessions they're eligible for.
                    </p>
                    <Button 
                      size="lg" 
                      className="gap-2" 
                      onClick={() => handleTabChange("household")}
                      data-testid="button-add-first-player"
                    >
                      <Home className="w-5 h-5" />
                      {userHasHousehold ? "Add Player" : "Go to Household"}
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
                      <Calendar className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">No Sessions Today</h3>
                    <p className="text-muted-foreground mb-6 max-w-sm">
                      There are no eligible sessions scheduled for today. Check out upcoming sessions in the calendar.
                    </p>
                    <Button 
                      variant="outline"
                      size="lg"
                      className="gap-2"
                      onClick={() => {
                        const playerAgeGroups = Array.from(new Set(players.map(player => calculateAgeGroup(player.birthYear))));
                        const playerGenders = Array.from(new Set(players.map(player => player.gender)));
                        
                        const params = new URLSearchParams();
                        if (playerAgeGroups.length > 0) {
                          params.set('ages', playerAgeGroups.join(','));
                        }
                        if (playerGenders.length > 0) {
                          params.set('genders', playerGenders.join(','));
                        }
                        params.set('eligibleOnly', 'true');
                        
                        const url = `/calendar${params.toString() ? `?${params.toString()}` : ''}`;
                        setLocation(url);
                      }}
                      data-testid="button-view-eligible-sessions"
                    >
                      <CalendarDays className="w-5 h-5" />
                      View Upcoming Sessions
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {todaySessions.map((session) => {
                const reservationSignup = signups.find(signup => 
                  signup.sessionId === session.id && 
                  !signup.paid && (
                    !signup.reservationExpiresAt || 
                    new Date(signup.reservationExpiresAt) > new Date()
                  )
                );

                return (
                  <EnhancedSessionCard 
                    key={session.id} 
                    session={session} 
                    isReserved={actualReservedSessionIds.has(session.id) || localReservedSessions.has(session.id)}
                    reservationSignup={reservationSignup}
                    onReservationChange={(sessionId, reserved) => {
                      if (reserved) {
                        setLocalReservedSessions(prev => {
                          const next = new Set(prev);
                          next.add(sessionId);
                          next.delete(`cleared-${sessionId}`);
                          return next;
                        });
                      } else {
                        setLocalReservedSessions(prev => {
                          const next = new Set(prev);
                          next.delete(sessionId);
                          next.add(`cleared-${sessionId}`);
                          return next;
                        });
                      }
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>
      )}

      {/* Player Management Section */}
      <section className="py-8 sm:py-12 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Your Players</h2>
              <p className="text-muted-foreground">Manage your household players and their bookings</p>
            </div>
            <Button 
              className="gap-2" 
              onClick={() => handleTabChange("household")}
              data-testid="button-add-player"
            >
              <Plus className="w-4 h-4" />
              Add Player
            </Button>
          </div>

          {/* Show household requirement notice if needed */}
          {needsHouseholdFirst && (
            <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 mb-6">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <Home className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Household Required</p>
                  <p className="text-sm text-muted-foreground">
                    This organization requires you to create a household before adding players.{' '}
                    <button 
                      className="text-primary hover:underline"
                      onClick={() => handleTabChange("household")}
                    >
                      Go to Household tab
                    </button>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {players.length === 0 ? (
            <Card className="border-dashed border-2 bg-card/50">
              <CardContent className="flex flex-col items-center justify-center py-16 px-8 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No Players Yet</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  {userHasHousehold 
                    ? "Add players to your household to start booking training sessions."
                    : "Create your household first, then add players to start booking sessions."
                  }
                </p>
                <Button 
                  size="lg" 
                  className="gap-2" 
                  onClick={() => handleTabChange("household")}
                  data-testid="button-add-first-player-section"
                >
                  <Home className="w-5 h-5" />
                  {userHasHousehold ? "Add Players" : "Go to Household"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {players.map((player) => {
                const playerAgeGroup = calculateAgeGroup(player.birthYear);
                const playerUpcomingReservations = upcomingSignups.filter(signup => 
                  signup.playerId === player.id
                );
                
                return (
                  <Card key={player.id} className="overflow-hidden bg-card hover:shadow-lg transition-shadow">
                    <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-lg font-bold text-primary">
                              {player.firstName.charAt(0)}{player.lastName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <CardTitle className="text-foreground text-lg sm:text-xl">
                              {player.firstName} {player.lastName}
                            </CardTitle>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {playerAgeGroup}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                Born {player.birthYear} • {new Date().getFullYear() - player.birthYear}y • {player.gender}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-9 w-9"
                                onClick={() => {
                                  setEditingPlayer(player);
                                  setIsEditDialogOpen(true);
                                }}
                                data-testid={`button-edit-player-${player.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-card border-border">
                              <DialogHeader>
                                <DialogTitle className="text-foreground">Edit Player</DialogTitle>
                              </DialogHeader>
                              <PlayerForm 
                                player={editingPlayer} 
                                onSuccess={() => {
                                  setIsEditDialogOpen(false);
                                  setEditingPlayer(null);
                                }} 
                              />
                            </DialogContent>
                          </Dialog>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => deletePlayerMutation.mutate(player.id)}
                            disabled={deletePlayerMutation.isPending}
                            data-testid={`button-delete-player-${player.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {/* Upcoming Reservations */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-foreground">Upcoming Reservations</h4>
                          <Badge variant="outline" className="text-xs">
                            {playerUpcomingReservations.length} upcoming
                          </Badge>
                        </div>
                        
                        {playerUpcomingReservations.length > 0 ? (
                          <div className="space-y-3">
                            {playerUpcomingReservations.map(reservation => (
                              <div 
                                key={reservation.id} 
                                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-lg bg-muted/50 border border-border/50"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-foreground">{reservation.session.title}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {format(new Date(reservation.session.startTime), 'EEEE, MMMM d')} at {format(new Date(reservation.session.startTime), 'h:mm a')}
                                  </p>
                                  <p className="text-sm text-muted-foreground">{reservation.session.location}</p>
                                </div>
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                  {reservation.paid ? (
                                    <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 justify-center">
                                      Confirmed
                                    </Badge>
                                  ) : (
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        setSelectedPaymentSession({
                                          session: reservation.session,
                                          player: player,
                                          signup: reservation
                                        });
                                        setPaymentModalOpen(true);
                                      }}
                                      className="bg-green-600 hover:bg-green-700"
                                      data-testid="button-pay-now"
                                    >
                                      Pay Now
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      cancelSignupMutation.mutate(reservation.id, {
                                        onSuccess: () => {
                                          queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
                                        }
                                      });
                                    }}
                                    disabled={cancelSignupMutation.isPending}
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    data-testid="button-cancel-reservation"
                                  >
                                    {cancelSignupMutation.isPending ? "Cancelling..." : "Cancel"}
                                  </Button>
                                </div>
                                
                                {!reservation.paid && reservation.reservationExpiresAt && (
                                  <div className="w-full sm:hidden">
                                    <ReservationCountdown 
                                      expiresAt={typeof reservation.reservationExpiresAt === 'string' 
                                        ? reservation.reservationExpiresAt 
                                        : new Date(reservation.reservationExpiresAt).toISOString()}
                                      onExpired={() => {
                                        queryClient.invalidateQueries({ queryKey: ['/api/signups'] });
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic py-4">No upcoming reservations for this player.</p>
                        )}
                      </div>
                      
                      {/* Session History */}
                      <div className="mt-6 pt-6 border-t border-border/50">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-foreground">Session History</h4>
                          <ParentSessionHistoryDropdown
                            playerId={player.id}
                            sessionCount={signups.filter(s => s.playerId === player.id && s.paid).length}
                            playerName={`${player.firstName} ${player.lastName}`}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Click the session count to view detailed history
                        </p>
                      </div>
                      
                      <PlayerPortalControls player={player} />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
            </section>

            {/* Payment Modal */}
            {selectedPaymentSession && (
              <SessionPaymentModal
                isOpen={paymentModalOpen}
                onClose={() => {
                  setPaymentModalOpen(false);
                  setSelectedPaymentSession(null);
                }}
                session={{
                  id: selectedPaymentSession.session.id,
                  location: selectedPaymentSession.session.location,
                  startTime: typeof selectedPaymentSession.session.startTime === 'string' 
                    ? selectedPaymentSession.session.startTime 
                    : selectedPaymentSession.session.startTime.toISOString(),
                  ageGroup: selectedPaymentSession.session.ageGroups?.[0] || 'Unknown',
                  priceCents: selectedPaymentSession.session.priceCents,
                  title: selectedPaymentSession.session.title
                }}
                player={selectedPaymentSession.player}
                signup={selectedPaymentSession.signup}
              />
            )}
          </TabsContent>

          <TabsContent value="household" className="mt-6">
            <HouseholdSection />
          </TabsContent>
        </Tabs>
      </div>

      {/* Consent Form Modal - shown when minors have unsigned consent forms */}
      {showConsentModal && consentPlayerData && (
        <ConsentDocumentModal
          isOpen={showConsentModal}
          onClose={handleConsentClose}
          onComplete={handleConsentComplete}
          isParentSigning={true}
          playerData={consentPlayerData}
          parentData={{
            id: user?.id,
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
          }}
        />
      )}
    </div>
  );
}
