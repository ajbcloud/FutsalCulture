import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { CreditCard, Search, Filter, Building2, DollarSign, TrendingUp, AlertCircle } from "lucide-react";

interface Payment {
  id: string;
  amount: number;
  status: string;
  method: string;
  date: string;
  playerName: string;
  parentName: string;
  sessionTitle: string;
  tenantName: string;
  tenantId: string;
  stripePaymentId?: string;
}

export default function SuperAdminPayments() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTenant, setSelectedTenant] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedMethod, setSelectedMethod] = useState("all");
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

  // Fetch payments with filters
  const { data: payments = [], isLoading } = useQuery<Payment[]>({
    queryKey: ["/api/super-admin/payments", selectedTenant, selectedStatus, selectedMethod, dateRange, searchQuery],
    queryFn: async () => {
      // Mock data for now - replace with actual API call
      return [
        {
          id: "1",
          amount: 2500,
          status: "completed",
          method: "stripe",
          date: "2025-07-28T10:30:00Z",
          playerName: "Alex Johnson",
          parentName: "Sarah Johnson",
          sessionTitle: "Morning Training",
          tenantName: "Futsal Culture",
          tenantId: "tenant1",
          stripePaymentId: "pi_3OB1234567890"
        },
        {
          id: "2",
          amount: 3000,
          status: "pending",
          method: "venmo",
          date: "2025-07-28T15:45:00Z",
          playerName: "Emma Davis",
          parentName: "Michael Davis",
          sessionTitle: "Elite Training",
          tenantName: "Elite Footwork Academy",
          tenantId: "tenant2"
        },
        {
          id: "3",
          amount: 2500,
          status: "failed",
          method: "stripe",
          date: "2025-07-27T14:20:00Z",
          playerName: "Tyler Wilson",
          parentName: "Jennifer Wilson",
          sessionTitle: "Weekend Skills",
          tenantName: "Futsal Culture",
          tenantId: "tenant1",
          stripePaymentId: "pi_3OB9876543210"
        },
        {
          id: "4",
          amount: 2500,
          status: "completed",
          method: "stripe",
          date: "2025-07-27T09:15:00Z",
          playerName: "Maya Patel",
          parentName: "Raj Patel",
          sessionTitle: "Morning Training",
          tenantName: "Futsal Culture",
          tenantId: "tenant1",
          stripePaymentId: "pi_3OB1122334455"
        }
      ].filter(payment => {
        if (selectedTenant !== "all" && payment.tenantId !== selectedTenant) return false;
        if (selectedStatus !== "all" && payment.status !== selectedStatus) return false;
        if (selectedMethod !== "all" && payment.method !== selectedMethod) return false;
        if (searchQuery && 
            !payment.playerName.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !payment.parentName.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !payment.sessionTitle.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !payment.tenantName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
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

  const getMethodBadge = (method: string) => {
    switch (method) {
      case "stripe":
        return <Badge variant="outline" className="text-purple-600">Stripe</Badge>;
      case "venmo":
        return <Badge variant="outline" className="text-blue-600">Venmo</Badge>;
      case "cash":
        return <Badge variant="outline" className="text-green-600">Cash</Badge>;
      default:
        return <Badge variant="outline">{method}</Badge>;
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

  const totalRevenue = payments.filter(p => p.status === "completed").reduce((sum, p) => sum + p.amount, 0);
  const pendingRevenue = payments.filter(p => p.status === "pending").reduce((sum, p) => sum + p.amount, 0);
  const failedPayments = payments.filter(p => p.status === "failed").length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payments Management</h1>
          <p className="text-muted-foreground">Global payment monitoring across all tenants ({payments.length} payments)</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">${(totalRevenue / 100).toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pending Revenue</p>
                <p className="text-2xl font-bold">${(pendingRevenue / 100).toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Failed Payments</p>
                <p className="text-2xl font-bold">{failedPayments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">{payments.length}</p>
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
            Payment Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div>
              <Input
                placeholder="Search payments..."
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
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedMethod} onValueChange={setSelectedMethod}>
              <SelectTrigger>
                <SelectValue placeholder="All Methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="venmo">Venmo</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
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
                setSelectedMethod("all");
                setDateRange(null);
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Global Payments Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Player</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Session</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{payment.tenantName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">#{payment.id}</p>
                      {payment.stripePaymentId && (
                        <p className="text-xs text-muted-foreground">{payment.stripePaymentId}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{payment.playerName}</span>
                  </TableCell>
                  <TableCell>
                    <span>{payment.parentName}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{payment.sessionTitle}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-green-600">${(payment.amount / 100).toFixed(2)}</span>
                  </TableCell>
                  <TableCell>
                    {getMethodBadge(payment.method)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(payment.status)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p>{new Date(payment.date).toLocaleDateString()}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(payment.date).toLocaleTimeString()}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {payments.length === 0 && (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No payments found</h3>
              <p className="text-muted-foreground">Try adjusting your filters to see more payments.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}