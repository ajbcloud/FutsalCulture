import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Building2, Plus, Edit, Trash2, ExternalLink } from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  createdAt: string;
}

export default function SuperAdminTenants() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newTenantName, setNewTenantName] = useState("");
  const [newTenantSubdomain, setNewTenantSubdomain] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["/api/super-admin/tenants"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/super-admin/tenants");
      return response.json();
    },
  });

  const createTenantMutation = useMutation({
    mutationFn: async ({ name, subdomain }: { name: string; subdomain: string }) => {
      const response = await apiRequest("POST", "/api/super-admin/tenants", {
        name,
        subdomain,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/tenants"] });
      setNewTenantName("");
      setNewTenantSubdomain("");
      setIsDialogOpen(false);
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
    if (!newTenantName.trim() || !newTenantSubdomain.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    createTenantMutation.mutate({
      name: newTenantName.trim(),
      subdomain: newTenantSubdomain.trim().toLowerCase(),
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tenants Management</h1>
          <p className="text-muted-foreground">Manage futsal organizations on the platform</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create New Tenant
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Tenant</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTenant} className="space-y-4">
              <div>
                <Label htmlFor="name">Organization Name</Label>
                <Input
                  id="name"
                  value={newTenantName}
                  onChange={(e) => setNewTenantName(e.target.value)}
                  placeholder="e.g., Metro Futsal Academy"
                  required
                />
              </div>
              <div>
                <Label htmlFor="subdomain">Subdomain</Label>
                <Input
                  id="subdomain"
                  value={newTenantSubdomain}
                  onChange={(e) => setNewTenantSubdomain(e.target.value)}
                  placeholder="e.g., metro-futsal"
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Will be accessible at: {newTenantSubdomain || 'subdomain'}.futsal.app
                </p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createTenantMutation.isPending}>
                  {createTenantMutation.isPending ? "Creating..." : "Create Tenant"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tenants Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="w-5 h-5 mr-2" />
            Active Tenants ({tenants.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant Name</TableHead>
                <TableHead>Subdomain</TableHead>
                <TableHead>Active Admins</TableHead>
                <TableHead>Total Players</TableHead>
                <TableHead>Total Sessions</TableHead>
                <TableHead>Total Revenue (MTD)</TableHead>
                <TableHead>Created On</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant: Tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell className="font-medium">{tenant.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <code className="px-2 py-1 bg-muted rounded text-sm">
                        {tenant.subdomain}.futsal.app
                      </code>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">2 Admins</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">45</span> players
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">12</span> sessions
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-green-600">$2,450</span>
                  </TableCell>
                  <TableCell>
                    {new Date(tenant.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        Login as Admin
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {tenants.length === 0 && (
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No tenants yet</h3>
              <p className="text-muted-foreground">Create your first tenant to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}