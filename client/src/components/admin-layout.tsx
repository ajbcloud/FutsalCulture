import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { BusinessBranding } from "@/components/business-branding";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CustomAvatar } from "@/components/custom-avatar";
import { TrialStatusIndicator } from "@/components/trial-status-indicator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  LayoutDashboard, 
  Calendar, 
  CreditCard, 
  Users, 
  Upload, 
  BarChart3, 
  HelpCircle, 
  Settings,
  Menu,
  X,
  UserCheck,
  Tag,
  Key,
  Sun,
  Moon,
  LogOut,
  Shield,
  Shirt,
  Sparkles,
  TrendingUp,
  Mail,
  UserPlus,
  MessageSquare,
  GraduationCap,
  Pencil,
  Loader2
} from "lucide-react";
import { useHasFeature } from "@/hooks/use-feature-flags";
import { FEATURE_KEYS } from "@shared/feature-flags";
import { useTenantPlan } from "@/hooks/useTenantPlan";
import { ClubSwitcher } from "@/components/club-switcher";
import { RoleSwitcher } from "@/components/role-switcher";

type CoachPermissions = {
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
};

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  featureKey?: string;
  isSuperAdminOnly?: boolean;
  isAdminOnly?: boolean;
  coachPermission?: keyof CoachPermissions;
};

const adminNavItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/sessions", label: "Sessions", icon: Calendar, coachPermission: 'canManageSessions' },
  { href: "/admin/payments", label: "Payments", icon: CreditCard, coachPermission: 'canViewFinancials' },
  { href: "/admin/players", label: "Players", icon: Shirt, coachPermission: 'canViewPii' },
  { href: "/admin/parents", label: "Parents", icon: Users, coachPermission: 'canViewPii' },
  { href: "/admin/coaches", label: "Coaches", icon: GraduationCap, isAdminOnly: true },
  { href: "/admin/invitations", label: "Invitations", icon: UserPlus, isAdminOnly: true },
  { href: "/admin/credits", label: "Credits", icon: CreditCard, coachPermission: 'canIssueCredits' },
  { href: "/admin/pending-registrations", label: "Pending Registrations", icon: UserCheck, isAdminOnly: true },
  { href: "/admin/communications", label: "Communications", icon: Mail, featureKey: FEATURE_KEYS.NOTIFICATIONS_SMS, isAdminOnly: true },
  { href: "/admin/sms-credits", label: "SMS Credits", icon: MessageSquare, featureKey: FEATURE_KEYS.NOTIFICATIONS_SMS, isAdminOnly: true },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3, coachPermission: 'canViewAnalytics' },
  { href: "/admin/player-development", label: "Player Development", icon: TrendingUp, featureKey: FEATURE_KEYS.PLAYER_DEVELOPMENT },
  { href: "/admin/help-requests", label: "Help Requests", icon: HelpCircle },
  { href: "/admin/billing", label: "Billing", icon: Sparkles, isAdminOnly: true },
  { href: "/admin/settings", label: "Settings", icon: Settings, isAdminOnly: true },
  { href: "/super-admin", label: "Super Admin Portal", icon: Shield, isSuperAdminOnly: true },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const { user, logout, refreshUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { data: tenantPlan } = useTenantPlan();
  const { hasFeature: hasPlayerDevelopment } = useHasFeature(FEATURE_KEYS.PLAYER_DEVELOPMENT);
  const { hasFeature: hasSmsNotifications } = useHasFeature(FEATURE_KEYS.NOTIFICATIONS_SMS);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Profile edit state
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
  });

  // Update profile form when user changes
  useState(() => {
    setProfileForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
    });
  });

  // Profile update mutation
  const profileMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string }) => {
      const response = await apiRequest('PUT', '/api/user/profile', {
        firstName: data.firstName,
        lastName: data.lastName,
        email: user?.email || '',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update profile');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your name has been updated successfully.",
      });
      setShowProfileDialog(false);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      refreshUser();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fetch coach permissions for assistants
  const { data: coachData } = useQuery<{ tenants: Array<{ tenantId: string; permissions: CoachPermissions }> }>({
    queryKey: ['/api/coach/my-tenants'],
    enabled: user?.isAssistant && !user?.isAdmin,
  });

  // Get current tenant's permissions if user is a coach
  const coachPermissions = useMemo(() => {
    if (!user?.isAssistant || user?.isAdmin || !coachData?.tenants) return null;
    const currentTenant = coachData.tenants.find((t) => t.tenantId === user.tenantId);
    return currentTenant?.permissions || null;
  }, [user, coachData]);
  
  const planId = tenantPlan?.planId || 'free';
  const planName = planId.charAt(0).toUpperCase() + planId.slice(1);
  
  const getPlanBadgeStyles = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'core':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30';
      case 'growth':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30 hover:bg-purple-500/30';
      case 'elite':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30';
      default: // free
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30 hover:bg-gray-500/30';
    }
  };

  // Filter navigation items based on feature access and user role
  const visibleNavItems = adminNavItems.filter(item => {
    // Super admin check
    if (item.isSuperAdminOnly && !user?.isSuperAdmin) return false;
    
    // Feature flag checks
    if (item.featureKey === FEATURE_KEYS.PLAYER_DEVELOPMENT && !hasPlayerDevelopment) return false;
    if (item.featureKey === FEATURE_KEYS.NOTIFICATIONS_SMS && !hasSmsNotifications) return false;
    
    // For coaches (isAssistant but not isAdmin), check permissions
    if (user?.isAssistant && !user?.isAdmin) {
      // Block admin-only items completely for coaches
      if (item.isAdminOnly) return false;
      
      // If item requires a permission, check it
      if (item.coachPermission) {
        // If permissions haven't loaded yet, hide permission-gated items
        if (!coachPermissions) return false;
        return coachPermissions[item.coachPermission] === true;
      }
    }
    
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 sm:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Mobile First */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out sm:translate-x-0 flex flex-col ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Fixed header with business branding, admin portal title, and user info */}
        <div className="p-4 border-b border-border flex-shrink-0">
          <div className="flex flex-col items-center space-y-3 w-full max-w-full">
            <div className="w-full max-w-full px-2">
              <BusinessBranding 
                variant="large" 
                textClassName="text-foreground text-center"
                className="w-full"
              />
            </div>
            <h1 className="text-xl font-bold theme-nav-title text-center w-full admin-nav-title">Admin Portal</h1>
            
            {/* Club switcher for coaches with multiple club assignments */}
            <ClubSwitcher />
            
            {/* Role switcher for coaches who are also parents */}
            {user?.isAssistant && <RoleSwitcher />}
          </div>
          <Button
            variant="ghost"
            className="h-11 w-11 sm:hidden absolute top-4 right-4"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Scrollable navigation area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <nav className="py-6">
            <div className="px-3 space-y-1">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact 
                  ? location === item.href 
                  : location.startsWith(item.href);

                return (
                  <Link key={item.href} href={item.href}>
                    <div 
                      className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                        isActive 
                          ? 'bg-primary text-primary-foreground admin-nav-active' 
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      <span className={`admin-nav-text ${isActive ? 'theme-nav-active-text' : 'theme-nav-text'}`}>{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>

        {/* Trial Status Indicator */}
        <div className="px-3 py-2 bg-card flex-shrink-0">
          <TrialStatusIndicator />
        </div>

        {/* User account info at bottom */}
        <div className="px-4 py-3 border-t border-border bg-card flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CustomAvatar
                src={user?.profileImageUrl || undefined}
                alt={user?.firstName || "User"}
                fallbackText={user?.firstName?.[0]?.toUpperCase() || 'A'}
                backgroundColor={user?.avatarColor || "#10b981"}
                textColor={user?.avatarTextColor || undefined}
                size="md"
              />
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <button
                    onClick={() => {
                      setProfileForm({
                        firstName: user?.firstName || '',
                        lastName: user?.lastName || '',
                      });
                      setShowProfileDialog(true);
                    }}
                    className="p-1 text-muted-foreground hover:text-foreground rounded"
                    title="Edit profile"
                    data-testid="button-edit-profile"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </div>
                {user?.email && (
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                )}
                {!user?.isSuperAdmin && (
                  <Badge 
                    variant="outline" 
                    className={`text-[10px] px-1.5 py-0 h-4 font-medium ${getPlanBadgeStyles(planId)}`}
                    data-testid="badge-plan-level"
                  >
                    {planName} Plan
                  </Badge>
                )}
                {user?.isSuperAdmin && (
                  <Badge 
                    variant="outline" 
                    className="text-[10px] px-1.5 py-0 h-4 font-medium bg-red-500/20 text-red-400 border-red-500/30"
                  >
                    Super Admin
                  </Badge>
                )}
              </div>
            </div>

            <button
              onClick={toggleTheme}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent flex items-center justify-center"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Profile Edit Dialog */}
        <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>
                Update your name as it appears in the app.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="profile-firstName">First Name</Label>
                <Input
                  id="profile-firstName"
                  value={profileForm.firstName}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="First name"
                  data-testid="input-profile-firstname"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-lastName">Last Name</Label>
                <Input
                  id="profile-lastName"
                  value={profileForm.lastName}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Last name"
                  data-testid="input-profile-lastname"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowProfileDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => profileMutation.mutate(profileForm)}
                disabled={profileMutation.isPending}
                data-testid="button-save-profile"
              >
                {profileMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Logout button at bottom */}
        <div className="px-4 pb-4 bg-card flex-shrink-0">
          <button
            onClick={async () => {
              setSidebarOpen(false);
              await logout();
              window.location.href = '/';
            }}
            className="w-full flex items-center px-3 py-2 rounded-lg transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-3" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </div>

      {/* Main content - Mobile First */}
      <div className="sm:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              className="h-11 w-11 sm:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center space-x-2">
              {/* Remove extra admin text since logo/business name is now in sidebar */}
            </div>
          </div>
        </div>

        {/* Page content - Mobile First */}
        <main className="p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}