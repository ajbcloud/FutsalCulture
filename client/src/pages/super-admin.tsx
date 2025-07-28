import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { BusinessBranding } from "@/components/business-branding";
import { Building2, Plus, Settings, Users, TrendingUp, Sun, Moon, LogOut, User, Shield, UserCheck } from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  createdAt: string;
}

export default function SuperAdminPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newTenantName, setNewTenantName] = useState("");
  const [newTenantSubdomain, setNewTenantSubdomain] = useState("");

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

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["/api/super-admin/tenants"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/super-admin/tenants");
      return response.json();
    },
  });

  const createTenantMutation = useMutation({
    mutationFn: async (data: { name: string; subdomain: string }) => {
      const response = await apiRequest("POST", "/api/super-admin/tenants", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/tenants"] });
      setNewTenantName("");
      setNewTenantSubdomain("");
      toast({
        title: "Success",
        description: "Tenant created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create tenant",
        variant: "destructive",
      });
    },
  });

  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName || !newTenantSubdomain) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    createTenantMutation.mutate({
      name: newTenantName,
      subdomain: newTenantSubdomain,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0">
                <BusinessBranding 
                  variant="default" 
                  textClassName="text-green-400"
                />
              </Link>
              <div className="ml-6">
                <h1 className="text-lg font-semibold text-foreground">Super Admin Portal</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent flex items-center justify-center"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.profileImageUrl || ""} alt={user?.firstName || ""} />
                      <AvatarFallback className="bg-green-600 text-white text-sm">
                        {user?.firstName?.[0]?.toUpperCase() || 'A'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
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
                      <UserCheck className="mr-2 h-4 w-4" />
                      Admin Portal
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild>
                    <Link href="/super-admin" className="cursor-pointer">
                      <Shield className="mr-2 h-4 w-4" />
                      Super Admin
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild>
                    <Link href="/help" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
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
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">Platform Management</h2>
          <p className="text-muted-foreground">
            Manage multiple futsal organizations and tenant accounts
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tenants.length}</div>
              <p className="text-xs text-muted-foreground">
                Active organizations
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platform Health</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Online</div>
              <p className="text-xs text-muted-foreground">
                All systems operational
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Access</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">Super Admin</div>
              <p className="text-xs text-muted-foreground">
                Full platform access
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Create New Tenant */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Organization
            </CardTitle>
            <CardDescription>
              Add a new futsal organization to the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTenant} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tenantName">Organization Name</Label>
                  <Input
                    id="tenantName"
                    value={newTenantName}
                    onChange={(e) => setNewTenantName(e.target.value)}
                    placeholder="e.g., Elite Soccer Academy"
                  />
                </div>
                <div>
                  <Label htmlFor="tenantSubdomain">Subdomain</Label>
                  <Input
                    id="tenantSubdomain"
                    value={newTenantSubdomain}
                    onChange={(e) => setNewTenantSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="e.g., elite-soccer"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This will be their unique URL: {newTenantSubdomain || 'subdomain'}.yoursite.com
                  </p>
                </div>
              </div>
              <Button 
                type="submit" 
                disabled={createTenantMutation.isPending}
                className="w-full md:w-auto"
              >
                {createTenantMutation.isPending ? "Creating..." : "Create Organization"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Existing Tenants */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Organizations
            </CardTitle>
            <CardDescription>
              Manage existing futsal organizations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tenants.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No organizations created yet</p>
                <p className="text-sm text-muted-foreground">Create your first organization above</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tenants.map((tenant: Tenant) => (
                  <div
                    key={tenant.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold">{tenant.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {tenant.subdomain}.yoursite.com
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Created {new Date(tenant.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Active</Badge>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-1" />
                        Manage
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}