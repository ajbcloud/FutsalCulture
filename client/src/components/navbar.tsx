import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Menu, User, X } from "lucide-react";

export default function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-zinc-900 border-b border-zinc-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-green-400">Futsal Culture</h1>
            </Link>
            <div className="hidden md:block ml-10">
              <div className="flex space-x-8">
                <Link href={isAuthenticated ? "/dashboard" : "/sessions"} className="text-white font-medium hover:text-green-400">
                  Sessions
                </Link>
                {isAuthenticated && (
                  <Link href="/dashboard" className="text-zinc-400 hover:text-white">
                    Dashboard
                  </Link>
                )}
                <Link href="/help" className="text-zinc-400 hover:text-white">
                  Help
                </Link>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {!isAuthenticated ? (
              <Button asChild>
                <a href="/api/login">Parent Login</a>
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.profileImageUrl} alt={user?.firstName || "User"} />
                      <AvatarFallback>
                        {user?.firstName?.[0] || <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  {user?.isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">Admin Panel</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <a href="/api/logout">Logout</a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-zinc-800">
              <Link href={isAuthenticated ? "/dashboard" : "/sessions"} className="block px-3 py-2 text-white font-medium hover:text-green-400">
                Sessions
              </Link>
              {isAuthenticated && (
                <Link href="/dashboard" className="block px-3 py-2 text-zinc-400 hover:text-white">
                  Dashboard
                </Link>
              )}
              <Link href="/help" className="block px-3 py-2 text-zinc-400 hover:text-white">
                Help
              </Link>
              {!isAuthenticated ? (
                <a href="/api/login" className="block px-3 py-2 text-blue-400 hover:text-blue-300">
                  Parent Login
                </a>
              ) : (
                <>
                  <Link href="/profile" className="block px-3 py-2 text-zinc-400 hover:text-white">
                    Profile
                  </Link>
                  {user?.isAdmin && (
                    <Link href="/admin" className="block px-3 py-2 text-zinc-400 hover:text-white">
                      Admin Panel
                    </Link>
                  )}
                  <a href="/api/logout" className="block px-3 py-2 text-red-400 hover:text-red-300">
                    Logout
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
