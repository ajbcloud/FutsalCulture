import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { BusinessBranding } from "@/components/business-branding";
import { Button } from "@/components/ui/button";
import { CustomAvatar } from "@/components/custom-avatar";
import { TrialStatusIndicator } from "@/components/trial-status-indicator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
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
  User,
  Shield,
  Shirt,
  Sparkles,
  TrendingUp,
  Mail,
  UserPlus,
  MessageSquare
} from "lucide-react";
import { useHasFeature } from "@/hooks/use-feature-flags";
import { FEATURE_KEYS } from "@shared/feature-flags";
import { useTenantPlan } from "@/hooks/useTenantPlan";

const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/sessions", label: "Sessions", icon: Calendar },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/players", label: "Players", icon: Shirt },
  { href: "/admin/parents", label: "Parents", icon: Users },
  { href: "/admin/invitations", label: "Invitations", icon: UserPlus },
  { href: "/admin/credits", label: "Credits", icon: CreditCard },
  { href: "/admin/pending-registrations", label: "Pending Registrations", icon: UserCheck },
  { href: "/admin/communications", label: "Communications", icon: Mail, featureKey: FEATURE_KEYS.NOTIFICATIONS_SMS },
  { href: "/admin/sms-credits", label: "SMS Credits", icon: MessageSquare, featureKey: FEATURE_KEYS.NOTIFICATIONS_SMS },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/player-development", label: "Player Development", icon: TrendingUp, featureKey: FEATURE_KEYS.PLAYER_DEVELOPMENT },
  { href: "/admin/help-requests", label: "Help Requests", icon: HelpCircle },
  { href: "/admin/billing", label: "Billing", icon: Sparkles },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { data: tenantPlan } = useTenantPlan();
  const { hasFeature: hasPlayerDevelopment } = useHasFeature(FEATURE_KEYS.PLAYER_DEVELOPMENT);
  const { hasFeature: hasSmsNotifications } = useHasFeature(FEATURE_KEYS.NOTIFICATIONS_SMS);
  
  const planName = tenantPlan?.planId ? tenantPlan.planId.charAt(0).toUpperCase() + tenantPlan.planId.slice(1) : 'Free';

  // Filter navigation items based on feature access
  const visibleNavItems = adminNavItems.filter(item => {
    if (item.featureKey && item.featureKey === FEATURE_KEYS.PLAYER_DEVELOPMENT) {
      return hasPlayerDevelopment;
    }
    if (item.featureKey && item.featureKey === FEATURE_KEYS.NOTIFICATIONS_SMS) {
      return hasSmsNotifications;
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
        {/* Fixed header */}
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <div className="flex flex-col items-center space-y-3 flex-1 w-full max-w-full">
            <div className="w-full max-w-full px-2">
              <BusinessBranding 
                variant="large" 
                textClassName="text-foreground text-center"
                className="w-full"
              />
            </div>
            <h1 className="text-xl font-bold theme-nav-title text-center w-full admin-nav-title">Admin Portal</h1>
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

        {/* Trial Status Indicator - fixed above user profile */}
        <div className="px-3 py-2 bg-card flex-shrink-0">
          <TrialStatusIndicator />
        </div>

        {/* Fixed user info at bottom */}
        <div className="p-4 border-t border-border bg-card flex-shrink-0">
          <div className="flex items-center justify-between">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-3 h-auto p-2 w-full justify-start">
                  <CustomAvatar
                    src={user?.profileImageUrl || undefined}
                    alt={user?.firstName || "User"}
                    fallbackText={user?.firstName?.[0]?.toUpperCase() || 'A'}
                    backgroundColor={user?.avatarColor || "#10b981"}
                    textColor={user?.avatarTextColor || undefined}
                    size="md"
                  />
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user?.firstName} {user?.lastName}
                    </p>
                    {user?.email && (
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    )}
                    {!user?.isSuperAdmin && (
                      <p className="text-xs text-muted-foreground truncate">
                        {planName} Plan
                      </p>
                    )}
                    {user?.isSuperAdmin && (
                      <p className="text-xs text-muted-foreground truncate">
                        Super Admin
                      </p>
                    )}
                    {user?.role === 'tenant_admin' && !user?.isSuperAdmin && (
                      <p className="text-xs text-muted-foreground truncate">
                        Owner
                      </p>
                    )}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                    {user?.email && (
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    )}
                    {!user?.isSuperAdmin && (
                      <p className="text-xs text-muted-foreground">
                        {planName} Plan
                      </p>
                    )}
                    {user?.isSuperAdmin && (
                      <p className="text-xs text-muted-foreground">
                        Super Admin
                      </p>
                    )}
                    {user?.role === 'tenant_admin' && !user?.isSuperAdmin && (
                      <p className="text-xs text-muted-foreground">
                        Owner
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                
                {/* Portal Navigation */}
                
                <DropdownMenuItem asChild>
                  <Link href="/admin" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Admin Portal
                  </Link>
                </DropdownMenuItem>
                
                {user?.isSuperAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/super-admin" className="cursor-pointer">
                      <Shield className="mr-2 h-4 w-4" />
                      Super Admin Portal
                    </Link>
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onClick={async () => {
                    try {
                      await fetch('/api/auth/logout', {
                        method: 'POST',
                        credentials: 'include'
                      });
                      window.location.href = '/';
                    } catch (error) {
                      console.error('Logout error:', error);
                      window.location.href = '/';
                    }
                  }}
                  className="cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              onClick={toggleTheme}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent flex items-center justify-center"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
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