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

import { 
  Building2, 
  Settings, 
  Users, 
  Sun, 
  Moon, 
  LogOut, 
  User, 
  Shield, 
  UserCheck,
  BarChart3,
  Calendar,
  CreditCard,
  ClipboardList,
  HelpCircle,
  Home,
  Menu,
  X
} from "lucide-react";

export default function SuperAdminPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();
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

  // Navigation items
  const navigation = [
    { name: "Overview", href: "/super-admin", icon: Home, current: location === "/super-admin" },
    { name: "Tenants", href: "/super-admin/tenants", icon: Building2, current: location === "/super-admin/tenants" },
    { name: "Sessions", href: "/super-admin/sessions", icon: Calendar, current: location === "/super-admin/sessions" },
    { name: "Payments", href: "/super-admin/payments", icon: CreditCard, current: location === "/super-admin/payments" },
    { name: "Registrations", href: "/super-admin/registrations", icon: ClipboardList, current: location === "/super-admin/registrations" },
    { name: "Parents", href: "/super-admin/parents", icon: UserCheck, current: location === "/super-admin/parents" },
    { name: "Players", href: "/super-admin/players", icon: Users, current: location === "/super-admin/players" },
    { name: "Analytics", href: "/super-admin/analytics", icon: BarChart3, current: location === "/super-admin/analytics" },
    { name: "Help Requests", href: "/super-admin/help", icon: HelpCircle, current: location === "/super-admin/help" },
    { name: "Settings", href: "/super-admin/settings", icon: Settings, current: location === "/super-admin/settings" },
  ];

  // Render current page content
  const renderPageContent = () => {
    switch (location) {
      case "/super-admin/tenants":
        return <SuperAdminTenants />;
      case "/super-admin/analytics":
        return <SuperAdminAnalytics />;
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
        <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex flex-col items-center space-y-3 flex-1 w-full max-w-full">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-foreground text-center w-full">Platform Super Admin</h1>
            </div>
            <Button
              variant="ghost"
              className="h-11 w-11 md:hidden absolute top-4 right-4"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <nav className="mt-6">
            <div className="px-3">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <div className={`flex items-center px-3 py-2 mb-1 rounded-lg transition-colors ${
                      item.current 
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}>
                      <Icon className="w-5 h-5 mr-3" />
                      {item.name}
                    </div>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* User info at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
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
                    <Link href="/" className="cursor-pointer">
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
          <main className="p-4 md:p-6">
            {renderPageContent()}
          </main>
        </div>
      </div>
    </div>
  );
}