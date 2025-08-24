import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { HelpCircle, Search, Filter, Building2, User, Mail, Clock, MessageSquare, Reply, CheckCircle, Eye, ExternalLink } from "lucide-react";
import { impersonateTenant } from "@/utils/impersonation";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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
  const [selectedRequest, setSelectedRequest] = useState<HelpRequest | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [viewingRequest, setViewingRequest] = useState<HelpRequest | null>(null);
  const [resolveWithReply, setResolveWithReply] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {helpRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <button
                      onClick={() => impersonateTenant(request.tenantId, request.tenantName)}
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors group"
                      title="Click to impersonate this tenant"
                    >
                      <Building2 className="w-4 h-4 text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                      <span className="font-medium underline decoration-dotted">{request.tenantName}</span>
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
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
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewingRequest(request)}
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {request.status !== "resolved" && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedRequest(request)}
                            title="Reply to request"
                          >
                            <Reply className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResolve(request)}
                            title="Mark as resolved"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
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

      {/* Reply Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => {
        setSelectedRequest(null);
        setReplyMessage("");
        setResolveWithReply(false);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reply to Help Request</DialogTitle>
            <DialogDescription>
              From: {selectedRequest?.submitterName} ({selectedRequest?.submitterEmail})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Subject</Label>
              <p className="text-sm text-muted-foreground mt-1">{selectedRequest?.subject}</p>
            </div>
            <div>
              <Label>Original Message</Label>
              <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap bg-muted p-3 rounded">
                {selectedRequest?.message}
              </p>
            </div>
            <div>
              <Label htmlFor="reply">Your Reply</Label>
              <Textarea
                id="reply"
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your reply here..."
                className="min-h-[100px] mt-1"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="resolve"
                checked={resolveWithReply}
                onChange={(e) => setResolveWithReply(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="resolve" className="cursor-pointer">
                Mark as resolved after sending reply
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setSelectedRequest(null);
              setReplyMessage("");
              setResolveWithReply(false);
            }}>
              Cancel
            </Button>
            <Button onClick={() => handleSendReply()} disabled={!replyMessage.trim()}>
              Send Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={!!viewingRequest} onOpenChange={() => setViewingRequest(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Help Request Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tenant</Label>
                <button
                  onClick={() => {
                    if (viewingRequest) {
                      impersonateTenant(viewingRequest.tenantId, viewingRequest.tenantName);
                    }
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline decoration-dotted flex items-center gap-1 mt-1"
                >
                  {viewingRequest?.tenantName}
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
              <div>
                <Label>Status</Label>
                <div className="mt-1">
                  {viewingRequest && getStatusBadge(viewingRequest.status)}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Submitter</Label>
                <p className="text-sm text-muted-foreground mt-1">{viewingRequest?.submitterName}</p>
                <p className="text-xs text-muted-foreground">{viewingRequest?.submitterEmail}</p>
              </div>
              <div>
                <Label>Submitted</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {viewingRequest && new Date(viewingRequest.submittedAt).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Category</Label>
                <div className="mt-1">
                  {viewingRequest && getCategoryBadge(viewingRequest.category)}
                </div>
              </div>
              <div>
                <Label>Priority</Label>
                <div className="mt-1">
                  {viewingRequest && getPriorityBadge(viewingRequest.priority)}
                </div>
              </div>
              <div>
                <Label>Replies</Label>
                <p className="text-sm text-muted-foreground mt-1">{viewingRequest?.replyCount || 0}</p>
              </div>
            </div>
            <div>
              <Label>Subject</Label>
              <p className="text-sm font-medium mt-1">{viewingRequest?.subject}</p>
            </div>
            <div>
              <Label>Message</Label>
              <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap bg-muted p-3 rounded">
                {viewingRequest?.message}
              </p>
            </div>
            {viewingRequest?.resolvedAt && (
              <div>
                <Label>Resolution</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Resolved on {new Date(viewingRequest.resolvedAt).toLocaleString()}
                  {viewingRequest.resolvedBy && ` by ${viewingRequest.resolvedBy}`}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingRequest(null)}>
              Close
            </Button>
            {viewingRequest?.status !== "resolved" && (
              <>
                <Button variant="outline" onClick={() => {
                  setSelectedRequest(viewingRequest);
                  setViewingRequest(null);
                }}>
                  Reply
                </Button>
                <Button onClick={() => {
                  if (viewingRequest) {
                    handleResolve(viewingRequest);
                  }
                  setViewingRequest(null);
                }}>
                  Mark Resolved
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  // Handler functions
  async function handleSendReply() {
    if (!selectedRequest || !replyMessage.trim()) return;
    
    try {
      const response = await apiRequest('POST', `/api/super-admin/help-requests/${selectedRequest.id}/reply`, {
        message: replyMessage,
        resolveWithReply
      });
      
      if (response) {
        toast({ 
          title: resolveWithReply ? "Reply sent and request resolved" : "Reply sent successfully" 
        });
        queryClient.invalidateQueries({ queryKey: ["/api/super-admin/help-requests"] });
        setSelectedRequest(null);
        setReplyMessage("");
        setResolveWithReply(false);
      }
    } catch (error) {
      toast({ 
        title: "Failed to send reply", 
        variant: "destructive" 
      });
    }
  }

  async function handleResolve(request: HelpRequest) {
    try {
      const response = await apiRequest('PATCH', `/api/super-admin/help-requests/${request.id}/resolve`, {});
      
      if (response) {
        toast({ title: "Request marked as resolved" });
        queryClient.invalidateQueries({ queryKey: ["/api/super-admin/help-requests"] });
      }
    } catch (error) {
      toast({ 
        title: "Failed to resolve request", 
        variant: "destructive" 
      });
    }
  }

}