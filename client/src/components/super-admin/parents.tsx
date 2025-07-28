import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { UserCheck, Search, Filter, Building2, Mail, Phone, Users, Calendar } from "lucide-react";

interface Parent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  registrationDate: string;
  status: string;
  playerCount: number;
  totalBookings: number;
  totalSpent: number;
  lastActivity: string;
  tenantName: string;
  tenantId: string;
}

export default function SuperAdminParents() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTenant, setSelectedTenant] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [dateRange, setDateRange] = useState<any>(null);

  // Fetch tenants for filter
  const { data: tenants = [] } = useQuery({
    queryKey: ["/api/super-admin/tenants"],
    queryFn: async () => {
      const response = await fetch("/api/super-admin/tenants", {
        credentials: 'include'
      });
      return response.json();
    },
  });

  // Fetch parents with filters
  const { data: parents = [], isLoading } = useQuery<Parent[]>({
    queryKey: ["/api/super-admin/parents", selectedTenant, selectedStatus, dateRange, searchQuery],
    queryFn: async () => {
      // Mock data for now - replace with actual API call
      return [
        {
          id: "1",
          firstName: "Sarah",
          lastName: "Johnson",
          email: "sarah.johnson@email.com",
          phone: "+1234567890",
          registrationDate: "2025-06-15T10:30:00Z",
          status: "active",
          playerCount: 2,
          totalBookings: 15,
          totalSpent: 37500,
          lastActivity: "2025-07-28T14:30:00Z",
          tenantName: "Futsal Culture",
          tenantId: "tenant1"
        },
        {
          id: "2",
          firstName: "Michael",
          lastName: "Davis",
          email: "michael.davis@email.com",
          phone: "+1987654321",
          registrationDate: "2025-07-20T09:15:00Z",
          status: "active",
          playerCount: 1,
          totalBookings: 5,
          totalSpent: 15000,
          lastActivity: "2025-07-28T15:45:00Z",
          tenantName: "Elite Footwork Academy",
          tenantId: "tenant2"
        },
        {
          id: "3",
          firstName: "Jennifer",
          lastName: "Wilson",
          email: "jennifer.wilson@email.com",
          phone: "+1122334455",
          registrationDate: "2025-05-10T16:20:00Z",
          status: "inactive",
          playerCount: 1,
          totalBookings: 8,
          totalSpent: 20000,
          lastActivity: "2025-07-15T10:20:00Z",
          tenantName: "Futsal Culture",
          tenantId: "tenant1"
        },
        {
          id: "4",
          firstName: "Raj",
          lastName: "Patel",
          email: "raj.patel@email.com",
          phone: "+1555666777",
          registrationDate: "2025-04-05T11:45:00Z",
          status: "active",
          playerCount: 2,
          totalBookings: 22,
          totalSpent: 55000,
          lastActivity: "2025-07-27T09:15:00Z",
          tenantName: "Futsal Culture",
          tenantId: "tenant1"
        },
        {
          id: "5",
          firstName: "Lisa",
          lastName: "Chen",
          email: "lisa.chen@email.com",
          phone: "+1777888999",
          registrationDate: "2025-03-20T14:30:00Z",
          status: "pending",
          playerCount: 1,
          totalBookings: 0,
          totalSpent: 0,
          lastActivity: "2025-07-28T12:00:00Z",
          tenantName: "Elite Footwork Academy",
          tenantId: "tenant2"
        }
      ].filter(parent => {
        if (selectedTenant !== "all" && parent.tenantId !== selectedTenant) return false;
        if (selectedStatus !== "all" && parent.status !== selectedStatus) return false;
        if (searchQuery && 
            !parent.firstName.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !parent.lastName.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !parent.email.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !parent.tenantName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-500">Active</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-500">Pending</Badge>;
      case "suspended":
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
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

  const totalParents = parents.length;
  const activeParents = parents.filter(p => p.status === "active").length;
  const pendingParents = parents.filter(p => p.status === "pending").length;
  const totalRevenue = parents.reduce((sum, p) => sum + p.totalSpent, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Parents Management</h1>
          <p className="text-muted-foreground">Global parent accounts across all tenants ({totalParents} parents)</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Parents</p>
                <p className="text-2xl font-bold">{totalParents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Parents</p>
                <p className="text-2xl font-bold">{activeParents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
                <p className="text-2xl font-bold">{pendingParents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">${(totalRevenue / 100).toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Parent Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Input
                placeholder="Search parents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            
            <Select value={selectedTenant} onValueChange={setSelectedTenant}>
              <SelectTrigger>
                <SelectValue placeholder="All Tenants" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tenants</SelectItem>
                {tenants.map((tenant: any) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>

            <DatePickerWithRange
              date={dateRange}
              setDate={setDateRange}
              placeholder="Registration date"
            />

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery("");
                setSelectedTenant("all");
                setSelectedStatus("all");
                setDateRange(null);
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Parents Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserCheck className="w-5 h-5 mr-2" />
            Global Parents Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Players</TableHead>
                <TableHead>Total Bookings</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parents.map((parent) => (
                <TableRow key={parent.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{parent.tenantName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{parent.firstName} {parent.lastName}</p>
                      <p className="text-sm text-muted-foreground">ID: {parent.id}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="flex items-center space-x-1 mb-1">
                        <Mail className="w-3 h-3 text-muted-foreground" />
                        <p className="text-sm">{parent.email}</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Phone className="w-3 h-3 text-muted-foreground" />
                        <p className="text-sm">{parent.phone}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{new Date(parent.registrationDate).toLocaleDateString()}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(parent.registrationDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{parent.playerCount}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{parent.totalBookings}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-green-600">${(parent.totalSpent / 100).toFixed(2)}</span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{new Date(parent.lastActivity).toLocaleDateString()}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(parent.lastActivity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(parent.status)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {parents.length === 0 && (
            <div className="text-center py-8">
              <UserCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No parents found</h3>
              <p className="text-muted-foreground">Try adjusting your filters to see more parents.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}