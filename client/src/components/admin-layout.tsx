import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { BusinessBranding } from "@/components/business-branding";
import { Button } from "@/components/ui/button";
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
  Moon
} from "lucide-react";

const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/sessions", label: "Sessions", icon: Calendar },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/discount-codes", label: "Discount Codes", icon: Tag },
  { href: "/admin/access-codes", label: "Access Codes", icon: Key },
  { href: "/admin/players", label: "Players", icon: Users },
  { href: "/admin/parents", label: "Parents", icon: Users },
  { href: "/admin/pending-registrations", label: "Pending Registrations", icon: UserCheck },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/help-requests", label: "Help Requests", icon: HelpCircle },
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

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex flex-col items-center space-y-3 flex-1 w-full max-w-full">
            <div className="w-full max-w-full px-2">
              <BusinessBranding 
                variant="large" 
                textClassName="text-foreground text-center"
                className="w-full"
              />
            </div>
            <h1 className="text-xl font-bold text-foreground text-center w-full">Admin Portal</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden absolute top-4 right-4"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <nav className="mt-6">
          <div className="px-3">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact 
                ? location === item.href 
                : location.startsWith(item.href);

              return (
                <Link key={item.href} href={item.href}>
                  <div className={`flex items-center px-3 py-2 mb-1 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}>
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User info at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-primary-foreground">
                {user?.firstName?.[0] || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.isAdmin ? 'Owner' : 'Assistant'}
                  </p>
                </div>
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
          <Link href="/api/logout">
            <Button variant="ghost" size="sm" className="w-full mt-2 text-muted-foreground hover:text-foreground">
              Logout
            </Button>
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center space-x-2">
              {/* Remove extra admin text since logo/business name is now in sidebar */}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}