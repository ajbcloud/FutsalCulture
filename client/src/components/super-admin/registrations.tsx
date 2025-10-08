import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { ClipboardList, Search, Filter, Building2, Users, Clock, CheckCircle, AlertCircle } from "lucide-react";

interface Registration {
  id: string;
  playerName: string;
  parentName: string;
  email: string;
  phone: string;
  sessionTitle: string;
  sessionDate: string;
  registrationDate: string;
  status: string;
  paymentStatus: string;
  amount: number;
  tenantName: string;
  tenantId: string;
}

export default function SuperAdminRegistrations() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTenant, setSelectedTenant] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState("all");
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

  // Fetch registrations with filters
  const { data: registrations = [], isLoading } = useQuery<Registration[]>({
    queryKey: ["/api/super-admin/registrations", selectedTenant, selectedStatus, selectedPaymentStatus, dateRange, searchQuery],
    queryFn: async () => {
      // Mock data for now - replace with actual API call
      return [
        {
          id: "1",
          playerName: "Alex Johnson",
          parentName: "Sarah Johnson",
          email: "sarah.johnson@email.com",
          phone: "+1234567890",
          sessionTitle: "Morning Training Session",
          sessionDate: "2025-07-29T09:00:00Z",
          registrationDate: "2025-07-27T10:30:00Z",
          status: "confirmed",
          paymentStatus: "paid",
          amount: 2500,
          tenantName: "Futsal Culture",
          tenantId: "tenant1"
        },
        {
          id: "2",
          playerName: "Emma Davis",
          parentName: "Michael Davis",
          email: "michael.davis@email.com",
          phone: "+1987654321",
          sessionTitle: "Elite Training",
          sessionDate: "2025-07-29T18:00:00Z",
          registrationDate: "2025-07-28T15:45:00Z",
          status: "pending",
          paymentStatus: "pending",
          amount: 3000,
          tenantName: "Elite Footwork Academy",
          tenantId: "tenant2"
        },
        {
          id: "3",
          playerName: "Tyler Wilson",
          parentName: "Jennifer Wilson",
          email: "jennifer.wilson@email.com",
          phone: "+1122334455",
          sessionTitle: "Weekend Skills",
          sessionDate: "2025-07-30T10:00:00Z",
          registrationDate: "2025-07-27T14:20:00Z",
          status: "cancelled",
          paymentStatus: "refunded",
          amount: 2500,
          tenantName: "Futsal Culture",
          tenantId: "tenant1"
        },
        {
          id: "4",
          playerName: "Maya Patel",
          parentName: "Raj Patel",
          email: "raj.patel@email.com",
          phone: "+1555666777",
          sessionTitle: "Morning Training Session",
          sessionDate: "2025-07-29T09:00:00Z",
          registrationDate: "2025-07-26T09:15:00Z",
          status: "confirmed",
          paymentStatus: "paid",
          amount: 2500,
          tenantName: "Futsal Culture",
          tenantId: "tenant1"
        }
      ].filter(registration => {
        if (selectedTenant !== "all" && registration.tenantId !== selectedTenant) return false;
        if (selectedStatus !== "all" && registration.status !== selectedStatus) return false;
        if (selectedPaymentStatus !== "all" && registration.paymentStatus !== selectedPaymentStatus) return false;
        if (searchQuery && 
            !registration.playerName.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !registration.parentName.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !registration.email.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !registration.sessionTitle.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !registration.tenantName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge variant="default" className="bg-green-500">Confirmed</Badge>;
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-500">Pending</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      case "no-show":
        return <Badge variant="outline" className="text-orange-500">No Show</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge variant="default" className="bg-green-500">Paid</Badge>;
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-500">Pending</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "refunded":
        return <Badge variant="outline" className="text-blue-500">Refunded</Badge>;
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

  const totalRegistrations = registrations.length;
  const confirmedRegistrations = registrations.filter(r => r.status === "confirmed").length;
  const pendingRegistrations = registrations.filter(r => r.status === "pending").length;
  const totalRevenue = registrations.filter(r => r.paymentStatus === "paid").reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Registrations Management</h1>
          <p className="text-muted-foreground">Monitor registrations across all tenants ({totalRegistrations} registrations)</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ClipboardList className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Registrations</p>
                <p className="text-2xl font-bold">{totalRegistrations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Confirmed</p>
                <p className="text-2xl font-bold">{confirmedRegistrations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{pendingRegistrations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
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
            Registration Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div>
              <Input
                placeholder="Search registrations..."
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
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no-show">No Show</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedPaymentStatus} onValueChange={setSelectedPaymentStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>

            <DatePickerWithRange
              date={dateRange}
              setDate={setDateRange}
              placeholder="Select dates"
            />

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery("");
                setSelectedTenant("all");
                setSelectedStatus("all");
                setSelectedPaymentStatus("all");
                setDateRange(null);
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Registrations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ClipboardList className="w-5 h-5 mr-2" />
            Global Registrations Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Player</TableHead>
                <TableHead>Adult</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Session</TableHead>
                <TableHead>Session Date</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrations.map((registration) => (
                <TableRow key={registration.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{registration.tenantName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{registration.playerName}</span>
                  </TableCell>
                  <TableCell>
                    <span>{registration.parentName}</span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{registration.email}</p>
                      <p className="text-xs text-muted-foreground">{registration.phone}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{registration.sessionTitle}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm">{new Date(registration.sessionDate).toLocaleDateString()}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(registration.sessionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{new Date(registration.registrationDate).toLocaleDateString()}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(registration.registrationDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(registration.status)}
                  </TableCell>
                  <TableCell>
                    {getPaymentStatusBadge(registration.paymentStatus)}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">${(registration.amount / 100).toFixed(2)}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {registrations.length === 0 && (
            <div className="text-center py-8">
              <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No registrations found</h3>
              <p className="text-muted-foreground">Try adjusting your filters to see more registrations.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}