import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { BusinessBranding } from "@/components/business-branding";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Menu, User, X, Sun, Moon } from "lucide-react";

export default function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <BusinessBranding 
                variant="default" 
                textClassName="text-green-400"
              />
            </Link>
            
            {/* Mobile hamburger menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="ml-4 p-2 text-muted-foreground hover:text-foreground md:hidden h-11 w-11 flex items-center justify-center"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            
            {/* Desktop navigation */}
            <div className="hidden md:block ml-10">
              <div className="flex border-b border-border">
                {isAuthenticated ? (
                  <>
                    <Link href="/" className="px-4 py-2 text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-primary transition-colors">
                      Home
                    </Link>
                    <Link href="/calendar" className="px-4 py-2 text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-primary transition-colors">
                      Calendar
                    </Link>
                    <Link href="/help" className="px-4 py-2 text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-primary transition-colors">
                      Help
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/" className="px-4 py-2 text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-primary transition-colors">
                      Home
                    </Link>
                    <Link href="/sessions" className="px-4 py-2 text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-primary transition-colors">
                      Sessions
                    </Link>
                    <Link href="/help" className="px-4 py-2 text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-primary transition-colors">
                      Help
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Theme Toggle - smaller on mobile */}
            <button
              type="button"
              onClick={toggleTheme}
              className="h-11 w-11 sm:h-8 sm:w-8 p-0 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent flex items-center justify-center"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            
            {!isAuthenticated ? (
              <Button asChild className="h-11 px-4 sm:h-auto sm:px-3">
                <a href="/api/login">Parent Login</a>
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-11 w-11 sm:h-8 sm:w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.profileImageUrl || undefined} alt={`${user?.firstName} ${user?.lastName}` || "User"} />
                      <AvatarFallback>
                        {user?.firstName?.[0] || <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Parent Profile</Link>
                  </DropdownMenuItem>
                  {(user?.isAdmin || user?.isAssistant) && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">Admin Portal</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <a href="/api/logout">Logout</a>
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
                    href="/" 
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
                    href="/help" 
                    className="block px-4 py-4 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Help
                  </Link>
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
                  <a 
                    href="/api/logout" 
                    className="block px-4 py-4 text-red-500 hover:text-red-400 hover:bg-accent rounded-md transition-colors"
                  >
                    Logout
                  </a>
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
                  <Link 
                    href="/help" 
                    className="block px-4 py-4 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Help
                  </Link>
                  <a 
                    href="/api/login" 
                    className="block px-4 py-4 text-primary hover:text-primary/80 hover:bg-accent rounded-md transition-colors"
                  >
                    Parent Login
                  </a>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
