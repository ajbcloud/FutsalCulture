import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import SuperAdminOverview from "@/components/super-admin/overview";
import SuperAdminTenants from "@/components/super-admin/tenants";
import SuperAdminAnalytics from "@/components/super-admin/analytics";
import SuperAdminSettings from "@/components/super-admin/settings";
import SuperAdminSessions from "@/components/super-admin/sessions";
import SuperAdminPayments from "@/components/super-admin/payments";
import SuperAdminRegistrations from "@/components/super-admin/registrations";
import SuperAdminParents from "@/components/super-admin/parents";
import SuperAdminPlayers from "@/components/super-admin/players";
import SuperAdminHelpRequests from "@/components/super-admin/help-requests";
import Analytics from "@/pages/super-admin/analytics";
import PlatformBilling from "@/pages/super-admin/platform-billing";
import SuperAdminDunning from "@/pages/super-admin/dunning";
import IntegrationsHealth from "@/pages/super-admin/integrations-health";
import CommsDeliverability from "@/pages/super-admin/comms";
import SecurityAudit from "@/pages/super-admin/security";
import PlanManagement from "@/pages/super-admin/plan-management";

import { 
  Building2, 
  Settings, 
  Users, 
  Sun, 
  Moon, 
  LogOut, 
  User, 
  UserCheck,
  BarChart3,
  Calendar,
  CreditCard,
  ClipboardList,
  HelpCircle,
  Home,
  Menu,
  X,
  Shirt,
  TrendingUp,
  Webhook,
  Mail,
  Shield,
  Crown
} from "lucide-react";
import playHQLogo from "@assets/PlayHQ_1753846544553.png";

export default function SuperAdminPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirect if not super admin
  if (!user?.isSuperAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-red-600">Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access the Super Admin portal.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Get base path without query parameters for navigation
  const basePath = location.split('?')[0];
  
  // Navigation sections
  const companySection = [
    { name: "Overview", href: "/super-admin", icon: Home, current: basePath === "/super-admin" },
    { name: "Plan Management", href: "/super-admin/plan-management", icon: Crown, current: basePath === "/super-admin/plan-management" },
    { name: "Analytics", href: "/super-admin/analytics", icon: BarChart3, current: basePath === "/super-admin/analytics" },
    { name: "Platform Billing", href: "/super-admin/platform-billing", icon: CreditCard, current: basePath === "/super-admin/platform-billing" },
    { name: "Payment Recovery", href: "/super-admin/dunning", icon: TrendingUp, current: basePath === "/super-admin/dunning" },
    { name: "Integrations Health", href: "/super-admin/integrations-health", icon: Webhook, current: basePath === "/super-admin/integrations-health" },
    { name: "Comms Deliverability", href: "/super-admin/comms", icon: Mail, current: basePath === "/super-admin/comms" },
    { name: "Security & Audit", href: "/super-admin/security", icon: Shield, current: basePath === "/super-admin/security" },
    { name: "Settings", href: "/super-admin/settings", icon: Settings, current: basePath === "/super-admin/settings" },
  ];

  const clientActivitySection = [
    { name: "Tenants", href: "/super-admin/tenants", icon: Building2, current: basePath === "/super-admin/tenants" },
    { name: "Sessions", href: "/super-admin/sessions", icon: Calendar, current: basePath === "/super-admin/sessions" },
    { name: "Payments", href: "/super-admin/payments", icon: CreditCard, current: basePath === "/super-admin/payments" },
    { name: "Registrations", href: "/super-admin/registrations", icon: ClipboardList, current: basePath === "/super-admin/registrations" },
    { name: "Parents", href: "/super-admin/parents", icon: UserCheck, current: basePath === "/super-admin/parents" },
    { name: "Players", href: "/super-admin/players", icon: Shirt, current: basePath === "/super-admin/players" },
    { name: "Help Requests", href: "/super-admin/help", icon: HelpCircle, current: basePath === "/super-admin/help" },
  ];

  // Render current page content
  const renderPageContent = () => {
    // Get base path without query parameters
    const basePath = location.split('?')[0];
    
    switch (basePath) {
      case "/super-admin/tenants":
        return <SuperAdminTenants />;
      case "/super-admin/analytics":
        return <Analytics />;
      case "/super-admin/plan-management":
        return <PlanManagement />;
      case "/super-admin/platform-billing":
        return <PlatformBilling />;
      case "/super-admin/dunning":
        return <SuperAdminDunning />;
      case "/super-admin/integrations-health":
        return <IntegrationsHealth />;
      case "/super-admin/comms":
        return <CommsDeliverability />;
      case "/super-admin/security":
        return <SecurityAudit />;
      case "/super-admin/settings":
        return <SuperAdminSettings />;
      case "/super-admin/sessions":
        return <SuperAdminSessions />;
      case "/super-admin/payments":
        return <SuperAdminPayments />;
      case "/super-admin/registrations":
        return <SuperAdminRegistrations />;
      case "/super-admin/parents":
        return <SuperAdminParents />;
      case "/super-admin/players":
        return <SuperAdminPlayers />;
      case "/super-admin/help":
        return <SuperAdminHelpRequests />;
      default:
        return <SuperAdminOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-background">

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex">
        {/* Sidebar - Mobile First */}
        <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out md:translate-x-0 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          {/* Fixed header */}
          <div className="flex items-center justify-between p-3 md:p-4 border-b border-border flex-shrink-0">
            <div className="flex flex-col items-center space-y-2 flex-1 w-full max-w-full">
              <img 
                src={playHQLogo} 
                alt="PlayHQ Logo" 
                className="w-10 h-7 md:w-12 md:h-8 object-contain"
              />
              <h1 className="text-base md:text-lg font-bold text-foreground text-center w-full leading-tight">Platform Super Admin</h1>
            </div>
            <Button
              variant="ghost"
              className="h-11 w-11 md:hidden absolute top-4 right-4"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Scrollable navigation area with sections */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <nav className="py-6">
              {/* Company Section */}
              <div className="px-3 mb-6">
                <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Company
                </h3>
                <div className="space-y-1">
                  {companySection.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link key={item.href} href={item.href}>
                        <div 
                          className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                            item.current 
                              ? 'bg-primary text-primary-foreground' 
                              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                          }`}
                          onClick={() => setSidebarOpen(false)}
                        >
                          <Icon className="w-5 h-5 mr-3" />
                          {item.name}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Client Activity Section */}
              <div className="px-3">
                <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Client Activity
                </h3>
                <div className="space-y-1">
                  {clientActivitySection.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link key={item.href} href={item.href}>
                        <div 
                          className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                            item.current 
                              ? 'bg-primary text-primary-foreground' 
                              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                          }`}
                          onClick={() => setSidebarOpen(false)}
                        >
                          <Icon className="w-5 h-5 mr-3" />
                          {item.name}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </nav>
          </div>

          {/* Fixed user info at bottom */}
          <div className="p-4 border-t border-border bg-card flex-shrink-0">
            <div className="flex items-center justify-between">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-3 h-auto p-2 w-full justify-start">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.profileImageUrl || ""} alt={user?.firstName || ""} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-sm">
                        {user?.firstName?.[0]?.toUpperCase() || 'S'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        Super Admin
                      </p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="start" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs text-muted-foreground">Super Admin</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  
                  {/* Portal Navigation */}
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Parent Profile
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Admin Portal
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild>
                    <Link href="/help" className="cursor-pointer">
                      <HelpCircle className="mr-2 h-4 w-4" />
                      Help
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a href="/api/logout" className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <button
                type="button"
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
        <div className="md:pl-64">
          {/* Top bar */}
          <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                className="h-11 w-11 md:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              
              <div className="flex items-center space-x-2">
                {/* Empty for now */}
              </div>
            </div>
          </div>

          {/* Page content - Mobile First */}
          <main className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto">
            <div className="space-y-8">
              {renderPageContent()}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}