import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { HelpCircle, Search, Filter, Building2, User, Mail, Clock, MessageSquare } from "lucide-react";

interface HelpRequest {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  submitterName: string;
  submitterEmail: string;
  submitterType: string;
  message: string;
  submittedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  replyCount: number;
  tenantName: string;
  tenantId: string;
}

export default function SuperAdminHelpRequests() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTenant, setSelectedTenant] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
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

  // Fetch help requests with filters
  const { data: helpRequests = [], isLoading } = useQuery<HelpRequest[]>({
    queryKey: ["/api/super-admin/help-requests", selectedTenant, selectedStatus, selectedCategory, selectedPriority, dateRange, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedTenant !== "all") params.set("tenantId", selectedTenant);
      if (selectedStatus !== "all") params.set("status", selectedStatus);
      if (selectedCategory !== "all") params.set("category", selectedCategory);
      if (selectedPriority !== "all") params.set("priority", selectedPriority);
      if (dateRange?.from) params.set("dateFrom", dateRange.from.toISOString());
      if (dateRange?.to) params.set("dateTo", dateRange.to.toISOString());
      if (searchQuery) params.set("search", searchQuery);

      const response = await fetch(`/api/super-admin/help-requests?${params}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch help requests');
      const data = await response.json();
      
      // Transform the data to match the expected interface
      return data.map((request: any) => ({
        id: request.id,
        subject: request.subject,
        category: request.category,
        priority: request.priority,
        status: request.status,
        submitterName: `${request.firstName || ''} ${request.lastName || ''}`.trim() || request.userName || 'Unknown User',
        submitterEmail: request.email || 'no-email@example.com',
        submitterType: "parent", // Default to parent for now
        message: request.message,
        submittedAt: request.createdAt,
        resolvedAt: request.resolvedAt,
        resolvedBy: request.resolvedBy,
        replyCount: request.replyHistory?.length || 0,
        tenantName: request.tenantName || 'Unknown Tenant',
        tenantId: request.tenantId
      }));
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="destructive">Open</Badge>;
      case "replied":
        return <Badge variant="secondary" className="bg-yellow-500">Replied</Badge>;
      case "resolved":
        return <Badge variant="default" className="bg-green-500">Resolved</Badge>;
      case "closed":
        return <Badge variant="outline">Closed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">High</Badge>;
      case "medium":
        return <Badge variant="secondary" className="bg-yellow-500">Medium</Badge>;
      case "low":
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "payment":
        return <Badge variant="outline" className="text-green-600">Payment</Badge>;
      case "technical":
        return <Badge variant="outline" className="text-blue-600">Technical</Badge>;
      case "session":
        return <Badge variant="outline" className="text-purple-600">Session</Badge>;
      case "account":
        return <Badge variant="outline" className="text-orange-600">Account</Badge>;
      default:
        return <Badge variant="outline">{category}</Badge>;
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

  const totalRequests = helpRequests.length;
  const openRequests = helpRequests.filter(r => r.status === "open").length;
  const repliedRequests = helpRequests.filter(r => r.status === "replied").length;
  const resolvedRequests = helpRequests.filter(r => r.status === "resolved").length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Help Requests Management</h1>
          <p className="text-muted-foreground">Global help requests across all tenants ({totalRequests} requests)</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <HelpCircle className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{totalRequests}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Open</p>
                <p className="text-2xl font-bold">{openRequests}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Replied</p>
                <p className="text-2xl font-bold">{repliedRequests}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <HelpCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold">{resolvedRequests}</p>
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
            Help Request Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div>
              <Input
                placeholder="Search requests..."
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
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="replied">Replied</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="session">Session</SelectItem>
                <SelectItem value="account">Account</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger>
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery("");
                setSelectedTenant("all");
                setSelectedStatus("all");
                setSelectedCategory("all");
                setSelectedPriority("all");
                setDateRange(null);
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Help Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <HelpCircle className="w-5 h-5 mr-2" />
            Global Help Requests Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Submitter</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Replies</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Resolved</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {helpRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{request.tenantName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{request.subject}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{request.message}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="flex items-center space-x-1 mb-1">
                        <User className="w-3 h-3 text-muted-foreground" />
                        <p className="font-medium">{request.submitterName}</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Mail className="w-3 h-3 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">{request.submitterEmail}</p>
                      </div>
                      <Badge variant="outline" className="text-xs mt-1">
                        {request.submitterType}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getCategoryBadge(request.category)}
                  </TableCell>
                  <TableCell>
                    {getPriorityBadge(request.priority)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(request.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="w-4 h-4 text-muted-foreground" />
                      <span>{request.replyCount}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{new Date(request.submittedAt).toLocaleDateString()}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(request.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {request.resolvedAt ? (
                      <div>
                        <p className="text-sm">{new Date(request.resolvedAt).toLocaleDateString()}</p>
                        <p className="text-xs text-muted-foreground">{request.resolvedBy}</p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {helpRequests.length === 0 && (
            <div className="text-center py-8">
              <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No help requests found</h3>
              <p className="text-muted-foreground">Try adjusting your filters to see more requests.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}