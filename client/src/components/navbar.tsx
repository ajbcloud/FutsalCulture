import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useHelpRequestsEnabled } from "@/hooks/use-help-requests-enabled";
import { useUserTerminology } from "@/hooks/use-user-terminology";
import { BusinessBranding } from "@/components/business-branding";
import { Button } from "@/components/ui/button";
import { CustomAvatar } from "@/components/custom-avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Menu, User, X, Sun, Moon, LogOut, Settings, Shield, HelpCircle, Home } from "lucide-react";

export default function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const helpRequestsEnabled = useHelpRequestsEnabled();
  const { term } = useUserTerminology();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            {/* Mobile hamburger menu button - moved to left */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="mr-3 p-2 text-muted-foreground hover:text-foreground md:hidden h-11 w-11 flex items-center justify-center"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            
            <Link href="/" className="flex-shrink-0">
              <BusinessBranding 
                variant="default" 
                textClassName="text-green-400"
              />
            </Link>
            
            {/* Desktop navigation */}
            <div className="hidden md:block ml-10">
              <div className="flex border-b border-border">
                {isAuthenticated ? (
                  <>
                    <Link href="/dashboard" className="px-4 py-2 text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-primary transition-colors">
                      Home
                    </Link>
                    <Link href="/calendar" className="px-4 py-2 text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-primary transition-colors">
                      Calendar
                    </Link>
                    <Link href="/household" className="px-4 py-2 text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-primary transition-colors">
                      Household
                    </Link>
                    <Link href="/payments/history" className="px-4 py-2 text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-primary transition-colors">
                      Payments
                    </Link>
                    {helpRequestsEnabled && (
                      <Link href="/help" className="px-4 py-2 text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-primary transition-colors">
                        Help
                      </Link>
                    )}
                  </>
                ) : (
                  <>
                    <Link href="/" className="px-4 py-2 text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-primary transition-colors">
                      Home
                    </Link>
                    <Link href="/sessions" className="px-4 py-2 text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-primary transition-colors">
                      Sessions
                    </Link>
                    {helpRequestsEnabled && (
                      <Link href="/help" className="px-4 py-2 text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-primary transition-colors">
                        Help
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Theme Toggle - hidden on mobile, shown on desktop */}
            <button
              type="button"
              onClick={toggleTheme}
              className="hidden md:flex h-8 w-8 p-0 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent items-center justify-center"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            
            {!isAuthenticated ? (
              <Button asChild className="h-11 px-4 sm:h-auto sm:px-3">
                <Link href="/login">{term} Login</Link>
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-11 w-11 sm:h-8 sm:w-8 rounded-full">
                    <CustomAvatar
                      src={user?.profileImageUrl || undefined}
                      alt={`${user?.firstName} ${user?.lastName}` || "User"}
                      fallbackText={user?.firstName?.[0]}
                      backgroundColor={user?.avatarColor || "#2563eb"}
                      textColor={user?.avatarTextColor || undefined}
                      size="md"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer">
                      <Home className="mr-2 h-4 w-4" />
                      Home
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  
                  {(user?.isAdmin || user?.isAssistant) && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Admin Portal
                      </Link>
                    </DropdownMenuItem>
                  )}
                  
                  {user?.isSuperAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/super-admin" className="cursor-pointer">
                        <Shield className="mr-2 h-4 w-4" />
                        Super Admin
                      </Link>
                    </DropdownMenuItem>
                  )}
                  
                  {helpRequestsEnabled && (
                    <DropdownMenuItem asChild>
                      <Link href="/help" className="cursor-pointer">
                        <HelpCircle className="mr-2 h-4 w-4" />
                        Help
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
            )}
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-muted border-t border-border">
              {isAuthenticated ? (
                <>
                  <Link 
                    href="/dashboard" 
                    className="block px-4 py-4 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Home
                  </Link>
                  <Link 
                    href="/calendar" 
                    className="block px-4 py-4 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Calendar
                  </Link>
                  <Link 
                    href="/household" 
                    className="block px-4 py-4 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Household
                  </Link>
                  <Link 
                    href="/payments/history" 
                    className="block px-4 py-4 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Payments
                  </Link>
                  {helpRequestsEnabled && (
                    <Link 
                      href="/help" 
                      className="block px-4 py-4 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Help
                    </Link>
                  )}
                  <Link 
                    href="/profile" 
                    className="block px-4 py-4 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  {(user?.isAdmin || user?.isAssistant) && (
                    <Link 
                      href="/admin" 
                      className="block px-4 py-4 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admin Portal
                    </Link>
                  )}
                  {user?.isSuperAdmin && (
                    <Link 
                      href="/super-admin" 
                      className="block px-4 py-4 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Super Admin
                    </Link>
                  )}
                  <button 
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
                    className="block px-4 py-4 text-red-500 hover:text-red-400 hover:bg-accent rounded-md transition-colors w-full text-left"
                  >
                    Logout
                  </button>
                  
                  {/* Theme Toggle in Mobile Menu */}
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="flex items-center px-4 py-4 w-full text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                  >
                    {theme === 'dark' ? <Sun className="w-4 h-4 mr-3" /> : <Moon className="w-4 h-4 mr-3" />}
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    href="/" 
                    className="block px-4 py-4 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Home
                  </Link>
                  <Link 
                    href="/sessions" 
                    className="block px-4 py-4 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sessions
                  </Link>
                  {helpRequestsEnabled && (
                    <Link 
                      href="/help" 
                      className="block px-4 py-4 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Help
                    </Link>
                  )}
                  <a 
                    href="/login" 
                    className="block px-4 py-4 text-primary hover:text-primary/80 hover:bg-accent rounded-md transition-colors"
                  >
                    {term} Login
                  </a>
                  
                  {/* Theme Toggle in Mobile Menu */}
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="flex items-center px-4 py-4 w-full text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                  >
                    {theme === 'dark' ? <Sun className="w-4 h-4 mr-3" /> : <Moon className="w-4 h-4 mr-3" />}
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
