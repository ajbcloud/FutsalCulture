import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin-layout';
import { adminHelpRequests } from '@/lib/adminApi';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { MessageSquare, CheckCircle, Reply, ExternalLink, HelpCircle, Sparkles, Crown, Mail, Phone, Clock, MapPin, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { useToast } from '../../hooks/use-toast';
import { Pagination } from '@/components/pagination';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest } from '@/lib/queryClient';
import { useHasFeature } from '@/hooks/use-feature-flags';
import { useAuth } from '@/contexts/AuthContext';
import { FEATURE_KEYS } from '@shared/schema';

// Schemas for the forms
const personalRequestSchema = z.object({
  firstName: z.string()
    .min(1, "First name is required")
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be less than 50 characters"),
  lastName: z.string()
    .min(1, "Last name is required")
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be less than 50 characters"),
  email: z.string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(100, "Email must be less than 100 characters"),
  phone: z.string().optional(),
  subject: z.string()
    .min(1, "Subject is required")
    .min(5, "Subject must be at least 5 characters")
    .max(100, "Subject must be less than 100 characters"),
  category: z.string().min(1, "Category is required"),
  priority: z.string().min(1, "Priority is required"),
  message: z.string()
    .min(1, "Message is required")
    .min(20, "Message must be at least 20 characters")
    .max(1000, "Message must be less than 1000 characters"),
});

const featureRequestSchema = z.object({
  title: z.string()
    .min(1, "Title is required")
    .min(5, "Title must be at least 5 characters")
    .max(100, "Title must be less than 100 characters"),
  description: z.string()
    .min(1, "Description is required")
    .min(20, "Description must be at least 20 characters")
    .max(1000, "Description must be less than 1000 characters"),
});

type PersonalRequest = z.infer<typeof personalRequestSchema>;
type FeatureRequestForm = z.infer<typeof featureRequestSchema>;

interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  status: 'received' | 'under_review' | 'approved' | 'in_development' | 'released';
  statusNotes?: string;
  createdAt: string;
  updatedAt: string;
  submittedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface MyHelpRequest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  subject: string;
  category: string;
  priority: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  resolved: boolean;
  resolvedAt?: string;
  resolutionNote?: string;
  createdAt: string;
  source?: string;
}

export default function AdminHelpRequests() {
  const [helpRequests, setHelpRequests] = useState<any[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<any[]>([]);
  const [paginatedRequests, setPaginatedRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [resolvingRequest, setResolvingRequest] = useState<any>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedMyRequest, setSelectedMyRequest] = useState<MyHelpRequest | null>(null);
  
  // Filter states
  const [userFilter, setUserFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [submittedFilter, setSubmittedFilter] = useState('');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { hasFeature: hasPlayerDevelopment } = useHasFeature(FEATURE_KEYS.PLAYER_DEVELOPMENT);
  const { user } = useAuth();

  // Personal request form
  const personalRequestForm = useForm<PersonalRequest>({
    resolver: zodResolver(personalRequestSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      subject: "",
      category: "",
      priority: hasPlayerDevelopment ? "high" : "medium",
      message: "",
    },
  });

  // Feature request form
  const featureRequestForm = useForm<FeatureRequestForm>({
    resolver: zodResolver(featureRequestSchema),
    defaultValues: {
      title: '',
      description: ''
    },
  });

  // Fetch feature requests
  const { data: featureRequests, isLoading: requestsLoading } = useQuery<FeatureRequest[]>({
    queryKey: ['/api/feature-requests']
  });

  // Fetch my help requests
  const { data: myHelpRequests, isLoading: myRequestsLoading } = useQuery<MyHelpRequest[]>({
    queryKey: ['/api/help/my-requests'],
    enabled: !!user,
  });

  // Personal request to PlayHQ mutation
  const personalRequestMutation = useMutation({
    mutationFn: async (data: PersonalRequest) => {
      // Set priority based on user's subscription level
      const priority = hasPlayerDevelopment ? "high" : data.priority || "medium";
      return apiRequest('/api/help', 'POST', { 
        ...data, 
        priority,
        source: "admin_portal" 
      });
    },
    onSuccess: () => {
      personalRequestForm.reset();
      toast({
        title: "Message sent successfully!",
        description: "Your request has been submitted to PlayHQ support.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Feature request mutation
  const featureRequestMutation = useMutation({
    mutationFn: async (request: FeatureRequestForm) => {
      return apiRequest('/api/feature-requests', 'POST', request);
    },
    onSuccess: () => {
      toast({
        title: "Feature request submitted",
        description: "Your request has been submitted to our development team."
      });
      featureRequestForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/feature-requests'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error submitting request",
        description: error.message || "Failed to submit feature request.",
        variant: "destructive"
      });
    }
  });

  // Handle feature request form submission
  const handleFeatureRequest = (data: FeatureRequestForm) => {
    featureRequestMutation.mutate(data);
  };

  const handlePersonalRequest = (data: PersonalRequest) => {
    personalRequestMutation.mutate(data);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'under_review': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'in_development': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'released': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'received': return 'Received';
      case 'under_review': return 'Under Review';
      case 'approved': return 'Approved';
      case 'in_development': return 'In Development';
      case 'released': return 'Released';
      default: return status;
    }
  };

  // Handle clicking on linked users
  const handleUserClick = (request: any) => {
    if (request.linkedUser && request.userType) {
      const userId = request.linkedUser.id;
      const userName = `${request.linkedUser.firstName} ${request.linkedUser.lastName}`;
      
      if (request.userType === 'parent') {
        // Navigate to parents page with filter parameter
        setLocation(`/admin/parents?filter=${encodeURIComponent(userName)}`);
      } else if (request.userType === 'player') {
        // Navigate to players page with search parameter
        setLocation(`/admin/players?search=${encodeURIComponent(userName)}`);
      }
    }
  };

  useEffect(() => {
    adminHelpRequests.list().then(data => {
      console.log('admin help requests:', data);
      setHelpRequests(data);
      setFilteredRequests(data);
      setLoading(false);
    }).catch(err => {
      console.error('Error fetching help requests:', err);
      setLoading(false);
    });
  }, []);

  // Apply filters whenever filter values or help requests change
  useEffect(() => {
    let filtered = helpRequests;

    // Filter by user (name or email)
    if (userFilter) {
      const searchTerm = userFilter.toLowerCase();
      filtered = filtered.filter(req => 
        req.firstName?.toLowerCase().includes(searchTerm) ||
        req.lastName?.toLowerCase().includes(searchTerm) ||
        `${req.firstName} ${req.lastName}`.toLowerCase().includes(searchTerm) ||
        req.email?.toLowerCase().includes(searchTerm)
      );
    }

    // Filter by status
    if (statusFilter) {
      filtered = filtered.filter(req => {
        const status = req.status || (req.resolved ? 'resolved' : 'open');
        return status === statusFilter;
      });
    }

    // Filter by source
    if (sourceFilter) {
      filtered = filtered.filter(req => req.source === sourceFilter);
    }

    // Filter by submitted date (today, this week, this month, or custom range)
    if (submittedFilter) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      filtered = filtered.filter(req => {
        const createdAt = new Date(req.createdAt);
        switch (submittedFilter) {
          case 'today':
            return createdAt >= today;
          case 'week':
            return createdAt >= thisWeek;
          case 'month':
            return createdAt >= thisMonth;
          case 'custom':
            let inRange = true;
            if (customStartDate) {
              inRange = inRange && createdAt >= new Date(customStartDate);
            }
            if (customEndDate) {
              inRange = inRange && createdAt <= new Date(customEndDate + 'T23:59:59');
            }
            return inRange;
          default:
            return true;
        }
      });
    }

    setFilteredRequests(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [helpRequests, userFilter, sourceFilter, statusFilter, submittedFilter, customStartDate, customEndDate]);

  // Apply pagination whenever filtered requests or pagination settings change
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedRequests(filteredRequests.slice(startIndex, endIndex));
  }, [filteredRequests, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleMarkResolved = async (request: any) => {
    setResolvingRequest(request);
    setResolutionNote('');
  };

  const handleConfirmResolution = async () => {
    if (!resolvingRequest || !resolutionNote.trim()) {
      toast({ 
        title: "Resolution note required", 
        description: "Please provide details about how the issue was resolved.",
        variant: "destructive" 
      });
      return;
    }

    try {
      const response = await fetch(`/api/admin/help-requests/${resolvingRequest.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ resolutionNote: resolutionNote.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast({ 
          title: "Failed to resolve help request", 
          description: errorData.message || "Unknown error occurred",
          variant: "destructive" 
        });
        return;
      }

      const resolvedRequest = await response.json();
      setHelpRequests(helpRequests.map((req: any) => 
        req.id === resolvingRequest.id ? { ...req, ...resolvedRequest } : req
      ));
      
      toast({ title: "Help request resolved successfully" });
      setResolvingRequest(null);
      setResolutionNote('');
    } catch (error) {
      console.error('Error resolving help request:', error);
      toast({ title: "Failed to resolve help request", variant: "destructive" });
    }
  };

  const handleSendReply = async (resolveAfterReply = false) => {
    if (!selectedRequest || !replyMessage.trim()) return;

    setSending(true);
    try {
      if (resolveAfterReply) {
        // Call the reply and resolve endpoint
        const response = await fetch(`/api/admin/help-requests/${selectedRequest.id}/reply-and-resolve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ 
            message: replyMessage.trim(),
            resolutionNote: replyMessage.trim() // Use reply as resolution note
          }),
        });
        if (!response.ok) throw new Error('Failed to reply and resolve');
        toast({ title: "Reply sent and request resolved" });
      } else {
        // Just send reply
        await adminHelpRequests.reply(selectedRequest.id, replyMessage);
        toast({ title: "Reply sent successfully" });
      }
      
      setSelectedRequest(null);
      setReplyMessage('');
      
      // Refresh the list to get updated data from server
      const updatedRequests = await adminHelpRequests.list();
      setHelpRequests(updatedRequests);
    } catch (error) {
      console.error('Error sending reply:', error);
      toast({ title: "Failed to send reply", variant: "destructive" });
    }
    setSending(false);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-3 md:p-6 space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <HelpCircle className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Help & Support</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              Manage parent/player requests, communicate with PlayHQ, and track feature requests
            </p>
          </div>
        </div>

        <Tabs defaultValue="help-requests" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 h-auto">
            <TabsTrigger value="help-requests" className="flex items-center gap-2 text-xs sm:text-sm p-2 sm:p-3">
              <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Parent/Player Help Requests</span>
              <span className="sm:hidden">Help Requests</span>
            </TabsTrigger>
            <TabsTrigger value="personal-requests" className="flex items-center gap-2 text-xs sm:text-sm p-2 sm:p-3">
              <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">PlayHQ</span>
              <span className="sm:hidden">PlayHQ</span>
            </TabsTrigger>
            <TabsTrigger value="feature-requests" className="flex items-center gap-2 text-xs sm:text-sm p-2 sm:p-3">
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Feature Requests</span>
              <span className="sm:hidden">Features</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Parent/Player Help Requests */}
          <TabsContent value="help-requests" className="space-y-4 md:space-y-6 mt-4">
            {/* Filter Controls */}
        <div className="bg-card p-3 md:p-4 rounded-lg border border-border">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <div>
              <Label className="text-muted-foreground text-sm">Filter by User</Label>
              <Input
                placeholder="Search name or email..."
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="bg-input border-border text-foreground mt-1"
              />
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Filter by Status</Label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full mt-1 bg-input border border-border rounded-md px-3 py-2 text-foreground text-sm"
              >
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="replied">Replied</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Filter by Source</Label>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="w-full mt-1 bg-input border border-border rounded-md px-3 py-2 text-foreground text-sm"
              >
                <option value="">All Sources</option>
                <option value="main_page">Main Page</option>
                <option value="parent_portal">Parent Portal</option>
                <option value="player_portal">Player Portal</option>
              </select>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Filter by Submitted</Label>
              <select
                value={submittedFilter}
                onChange={(e) => {
                  setSubmittedFilter(e.target.value);
                  if (e.target.value !== 'custom') {
                    setCustomStartDate('');
                    setCustomEndDate('');
                  }
                }}
                className="w-full mt-1 bg-input border border-border rounded-md px-3 py-2 text-foreground text-sm"
              >
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="custom">Custom Date Range</option>
              </select>
            </div>
          </div>
          
          {/* Custom Date Range Inputs - Only show when "Custom Date Range" is selected */}
          {submittedFilter === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <Label className="text-muted-foreground text-sm">Start Date</Label>
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-input border-border text-foreground mt-1"
                />
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">End Date</Label>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-input border-border text-foreground mt-1"
                />
              </div>
            </div>
          )}
          
          {(userFilter || sourceFilter || statusFilter || submittedFilter) && (
            <div className="mt-3 flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Showing {filteredRequests.length} of {helpRequests.length} help requests
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setUserFilter('');
                  setSourceFilter('');
                  setStatusFilter('');
                  setSubmittedFilter('');
                  setCustomStartDate('');
                  setCustomEndDate('');
                }}
                className="text-muted-foreground border-border hover:bg-accent"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-card rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="text-muted-foreground">User</TableHead>
              <TableHead className="text-muted-foreground">Message Preview</TableHead>
              <TableHead className="text-muted-foreground">Source</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Submitted</TableHead>
              <TableHead className="text-muted-foreground">Resolution</TableHead>
              <TableHead className="text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRequests.map((request: any) => (
              <TableRow key={request.id} className="border-border">
                <TableCell className="text-muted-foreground">
                  <div>
                    <div className="font-medium text-foreground flex items-center gap-2">
                      {request.linkedUser ? (
                        <button
                          onClick={() => handleUserClick(request)}
                          className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline decoration-dotted flex items-center gap-1 transition-colors"
                          title={`Go to ${request.userType} details`}
                        >
                          {request.firstName && request.lastName ? `${request.firstName} ${request.lastName}` : 'Anonymous'}
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      ) : (
                        <span>{request.firstName && request.lastName ? `${request.firstName} ${request.lastName}` : 'Anonymous'}</span>
                      )}
                      {request.linkedUser && (
                        <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-600 text-blue-600 dark:text-blue-400">
                          {request.userType}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">{request.email}</div>
                    {request.phone && <div className="text-sm text-muted-foreground">{request.phone}</div>}
                  </div>
                </TableCell>
                <TableCell className="text-foreground font-medium">
                  <div className="space-y-1">
                    <div className="font-semibold">{request.subject}</div>
                    <div className="text-sm text-muted-foreground">
                      {request.message?.substring(0, 50) + (request.message?.length > 50 ? '...' : '')}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <Badge 
                    variant="outline" 
                    className={
                      request.source === 'parent_portal' ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-600 text-blue-600 dark:text-blue-400' :
                      request.source === 'player_portal' ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-600 text-purple-600 dark:text-purple-400' :
                      'bg-muted border-border text-muted-foreground'
                    }
                  >
                    {request.source === 'parent_portal' ? 'Parent Portal' :
                     request.source === 'player_portal' ? 'Player Portal' :
                     'Main Page'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={
                      request.status === 'resolved' || request.resolved ? 'success' : 
                      request.status === 'replied' ? 'warning' : 
                      'info'
                    }
                  >
                    {request.status || (request.resolved ? 'resolved' : 'open')}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(request.createdAt), 'MMM d, yyyy h:mm a')}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <div className="space-y-2">
                    {(request.status === 'resolved' || request.resolved) && request.resolvedAt ? (
                      <div>
                        <div className="text-sm text-green-600 dark:text-green-400">
                          Resolved {format(new Date(request.resolvedAt), 'MMM d, yyyy h:mm a')}
                        </div>
                        {request.resolutionNote && (
                          <div className="text-xs text-muted-foreground mt-1 max-w-xs truncate">
                            {request.resolutionNote}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                    
                    {/* Reply History */}
                    {request.replyHistory && request.replyHistory.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
                          {request.replyHistory.length} {request.replyHistory.length === 1 ? 'reply' : 'replies'} sent:
                        </p>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {request.replyHistory.map((reply: any, index: number) => (
                            <div key={index} className="bg-accent p-2 rounded text-xs border-l-2 border-blue-500">
                              <p className="text-foreground mb-1">{reply.message}</p>
                              <p className="text-muted-foreground text-xs">
                                {format(new Date(reply.repliedAt), 'MMM d, h:mm a')}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedRequest(request)}
                    >
                      <Reply className="w-4 h-4" />
                    </Button>
                    {request.status !== 'resolved' && !request.resolved && (
                      <Button 
                        onClick={() => handleMarkResolved(request)}
                        className="bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {paginatedRequests.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  {helpRequests.length === 0 ? 'No help requests found' : 'No help requests match the current filters'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {paginatedRequests.length === 0 ? (
          <div className="bg-card rounded-lg p-6 text-center text-muted-foreground">
            {helpRequests.length === 0 ? 'No help requests found' : 'No help requests match the current filters'}
          </div>
        ) : (
          paginatedRequests.map((request: any) => (
            <Card key={request.id} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Header with user info and badges */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {request.linkedUser ? (
                          <button
                            onClick={() => handleUserClick(request)}
                            className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline decoration-dotted flex items-center gap-1 transition-colors text-sm font-medium truncate"
                            title={`Go to ${request.userType} details`}
                          >
                            {request.firstName && request.lastName ? `${request.firstName} ${request.lastName}` : 'Anonymous'}
                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          </button>
                        ) : (
                          <span className="text-sm font-medium text-foreground truncate">
                            {request.firstName && request.lastName ? `${request.firstName} ${request.lastName}` : 'Anonymous'}
                          </span>
                        )}
                        {request.linkedUser && (
                          <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-600 text-blue-600 dark:text-blue-400">
                            {request.userType}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{request.email}</div>
                      {request.phone && <div className="text-xs text-muted-foreground">{request.phone}</div>}
                    </div>
                    <div className="flex flex-col gap-1 ml-2">
                      <Badge 
                        variant={
                          request.status === 'resolved' || request.resolved ? 'success' : 
                          request.status === 'replied' ? 'warning' : 
                          'info'
                        }
                        className="text-xs"
                      >
                        {request.status || (request.resolved ? 'resolved' : 'open')}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          request.source === 'parent_portal' ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-600 text-blue-600 dark:text-blue-400' :
                          request.source === 'player_portal' ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-600 text-purple-600 dark:text-purple-400' :
                          'bg-muted border-border text-muted-foreground'
                        }`}
                      >
                        {request.source === 'parent_portal' ? 'Parent' :
                         request.source === 'player_portal' ? 'Player' :
                         'Main'}
                      </Badge>
                    </div>
                  </div>

                  {/* Subject and message */}
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-foreground">{request.subject}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">
                      {request.message}
                    </div>
                  </div>

                  {/* Footer with date and actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(request.createdAt), 'MMM d, yyyy h:mm a')}
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedRequest(request)}
                        className="h-8 px-2"
                      >
                        <Reply className="w-3 h-3" />
                        <span className="ml-1 text-xs">Reply</span>
                      </Button>
                      {request.status !== 'resolved' && !request.resolved && (
                        <Button 
                          onClick={() => handleMarkResolved(request)}
                          className="bg-green-600 hover:bg-green-700 h-8 px-2"
                          size="sm"
                        >
                          <CheckCircle className="w-3 h-3" />
                          <span className="ml-1 text-xs">Resolve</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Reply History */}
                  {request.replyHistory && request.replyHistory.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
                        {request.replyHistory.length} {request.replyHistory.length === 1 ? 'reply' : 'replies'} sent
                      </p>
                      <div className="space-y-1 max-h-24 overflow-y-auto">
                        {request.replyHistory.slice(-2).map((reply: any, index: number) => (
                          <div key={index} className="bg-accent p-2 rounded text-xs border-l-2 border-blue-500">
                            <p className="text-foreground mb-1 line-clamp-2">{reply.message}</p>
                            <p className="text-muted-foreground text-xs">
                              {format(new Date(reply.repliedAt), 'MMM d, h:mm a')}
                            </p>
                          </div>
                        ))}
                        {request.replyHistory.length > 2 && (
                          <div className="text-xs text-muted-foreground text-center">
                            +{request.replyHistory.length - 2} more replies
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Bottom Pagination */}
      {filteredRequests.length > 0 && (
        <Pagination
          totalItems={filteredRequests.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          className="bg-card p-4 rounded-lg border border-border"
        />
      )}

      {/* Reply Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="bg-card border-border max-w-2xl w-[95vw] md:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm md:text-base text-foreground">Reply to Help Request</DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-3 md:space-y-4">
              <div className="bg-muted p-3 md:p-4 rounded-lg">
                <p className="text-xs md:text-sm text-muted-foreground mb-2">
                  <span className="block md:inline">From: {selectedRequest.firstName} {selectedRequest.lastName}</span>
                  <span className="block md:inline md:ml-2">({selectedRequest.email})</span>
                  <span className="block md:inline md:ml-2">{format(new Date(selectedRequest.createdAt), 'MMM d, yyyy h:mm a')}</span>
                </p>
                {selectedRequest.phone && (
                  <p className="text-xs md:text-sm text-muted-foreground mb-2">Phone: {selectedRequest.phone}</p>
                )}
                <div className="space-y-2">
                  <p className="text-xs md:text-sm text-muted-foreground">
                    <span className="font-medium">Subject:</span> {selectedRequest.subject}
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    <span className="font-medium">Category:</span> {selectedRequest.category} | <span className="font-medium">Priority:</span> {selectedRequest.priority}
                  </p>
                  <p className="text-sm md:text-base text-foreground">{selectedRequest.message}</p>
                </div>
              </div>

              <div>
                <Label htmlFor="replyMessage" className="text-sm md:text-base text-foreground">Your Reply</Label>
                <Textarea
                  id="replyMessage"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply here..."
                  className="bg-input border-border text-foreground min-h-24 md:min-h-32 mt-1"
                  disabled={sending}
                />
              </div>

              <div className="flex flex-col md:flex-row justify-end space-y-2 md:space-y-0 md:space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedRequest(null)}
                  disabled={sending}
                  className="bg-red-600 hover:bg-red-700 text-white border-red-600 text-sm"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleSendReply(false)}
                  disabled={sending || !replyMessage.trim()}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white text-sm"
                >
                  {sending ? 'Sending...' : 'Reply'}
                </Button>
                <Button 
                  onClick={() => handleSendReply(true)}
                  disabled={sending || !replyMessage.trim()}
                  className="bg-green-600 hover:bg-green-700 text-white text-sm"
                >
                  {sending ? 'Sending...' : 'Reply & Mark Resolved'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Resolution Dialog */}
      <Dialog open={!!resolvingRequest} onOpenChange={() => setResolvingRequest(null)}>
        <DialogContent className="bg-card border-border w-[95vw] md:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm md:text-base text-foreground">Resolve Help Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-foreground">Request from {resolvingRequest?.firstName} {resolvingRequest?.lastName}</Label>
              <div className="p-3 bg-muted rounded-lg border border-border mt-1">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Subject:</span> {resolvingRequest?.subject}
                  </p>
                  <p className="text-foreground whitespace-pre-wrap">{resolvingRequest?.message}</p>
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="resolutionNote" className="text-foreground">Resolution Details * (minimum 10 characters)</Label>
              <Textarea
                id="resolutionNote"
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                className="bg-input border-border text-foreground mt-1"
                rows={4}
                placeholder="Describe how you resolved this issue and what actions were taken..."
                required
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-muted-foreground">
                  {resolutionNote.trim().length}/10 characters minimum
                </p>
                <p className="text-xs text-muted-foreground">
                  This note will be logged for future reference and quality assurance.
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setResolvingRequest(null)}>
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmResolution}
                disabled={!resolutionNote.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                Mark as Resolved
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
          </TabsContent>

          {/* Tab 2: PlayHQ - Personal Requests & View Past Requests */}
          <TabsContent value="personal-requests" className="space-y-6">
            
            {/* Section 1: View Past Requests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  My PlayHQ Requests
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  View and track your submitted requests to PlayHQ support.
                </p>
              </CardHeader>
              <CardContent>
                {myRequestsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
                  </div>
                ) : !myHelpRequests || myHelpRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No PlayHQ requests found</h3>
                    <p className="text-sm text-muted-foreground">
                      You haven't submitted any requests to PlayHQ yet. Use the form below to submit a new request.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myHelpRequests.map((request) => (
                      <Card key={request.id} className="border-border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-medium text-foreground truncate">{request.subject}</h3>
                                <div className="flex gap-1">
                                  <Badge 
                                    variant={
                                      request.status === 'resolved' ? 'default' : 
                                      request.status === 'in_progress' ? 'secondary' : 
                                      'outline'
                                    }
                                    className={
                                      request.status === 'resolved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                      request.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                    }
                                  >
                                    {request.status === 'resolved' ? 'Resolved' : request.status === 'in_progress' ? 'In Progress' : 'Open'}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {request.category.replace('_', ' ')}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs capitalize">
                                    {request.priority}
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{request.message}</p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(request.createdAt), 'MMM d, yyyy h:mm a')}
                                </div>
                                {request.email && (
                                  <div className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {request.email}
                                  </div>
                                )}
                                {request.phone && (
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {request.phone}
                                  </div>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedMyRequest(request)}
                              className="ml-4"
                            >
                              View Details
                            </Button>
                          </div>
                          {request.resolved && request.resolvedAt && (
                            <div className="mt-3 pt-3 border-t border-border">
                              <div className="flex items-center gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-green-600 font-medium">
                                  Resolved on {format(new Date(request.resolvedAt), 'MMM d, yyyy h:mm a')}
                                </span>
                              </div>
                              {request.resolutionNote && (
                                <p className="text-sm text-muted-foreground mt-2 pl-6">
                                  {request.resolutionNote}
                                </p>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section 2: Submit New Request */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Submit New Request to PlayHQ
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Send a direct message to PlayHQ support for personal assistance with your account or business needs.
                </p>
              </CardHeader>
              <CardContent>
                <Form {...personalRequestForm}>
                  <form onSubmit={personalRequestForm.handleSubmit(handlePersonalRequest)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={personalRequestForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your first name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={personalRequestForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your last name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={personalRequestForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="your.email@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={personalRequestForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="(555) 123-4567" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={personalRequestForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="technical">Technical Issue</SelectItem>
                                <SelectItem value="billing">Billing Question</SelectItem>
                                <SelectItem value="feature">Feature Request</SelectItem>
                                <SelectItem value="account">Account Support</SelectItem>
                                <SelectItem value="general">General Inquiry</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex items-end">
                        {hasPlayerDevelopment ? (
                          <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800 h-10">
                            <Crown className="h-4 w-4" />
                            Elite Priority Support
                          </div>
                        ) : (
                          <div className="h-10"> {/* Empty space to maintain layout */} </div>
                        )}
                      </div>
                    </div>

                    <FormField
                      control={personalRequestForm.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject</FormLabel>
                          <FormControl>
                            <Input placeholder="Brief description of your request" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={personalRequestForm.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Please provide detailed information about your request..."
                              rows={6}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={personalRequestMutation.isPending}
                        className="min-w-[120px]"
                      >
                        {personalRequestMutation.isPending ? "Sending..." : "Send Request"}
                      </Button>
                    </div>
                  </form>
                </Form>

                {hasPlayerDevelopment && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Crown className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">Elite Priority Support</h3>
                        <div className="space-y-2 text-sm text-purple-800 dark:text-purple-200">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>4-hour response guarantee</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>Direct phone line: 1-800-PLAYHQ-1</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <span>Escalated to senior support team</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Feature Requests */}
          <TabsContent value="feature-requests" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Submit New Feature Request */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Submit Feature Request
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Suggest new features or improvements for the platform.
                  </p>
                </CardHeader>
                <CardContent>
                  <Form {...featureRequestForm}>
                    <form onSubmit={featureRequestForm.handleSubmit(handleFeatureRequest)} className="space-y-4">
                      <FormField
                        control={featureRequestForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Feature Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Brief title for your feature request" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={featureRequestForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe the feature, why it would be useful, and how it should work..."
                                rows={6}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          disabled={featureRequestMutation.isPending}
                          className="min-w-[120px]"
                        >
                          {featureRequestMutation.isPending ? "Submitting..." : "Submit Request"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Your Feature Requests */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Feature Requests</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Track the status of your submitted feature requests.
                  </p>
                </CardHeader>
                <CardContent>
                  {requestsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
                    </div>
                  ) : featureRequests && featureRequests.length > 0 ? (
                    <div className="space-y-4">
                      {featureRequests.map((request) => (
                        <div key={request.id} className="border border-border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-medium text-foreground">{request.title}</h3>
                            <Badge className={getStatusColor(request.status)}>
                              {getStatusText(request.status)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {request.description}
                          </p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Submitted {format(new Date(request.createdAt), 'MMM d, yyyy')}</span>
                            {request.statusNotes && (
                              <span className="text-blue-600 dark:text-blue-400">Notes available</span>
                            )}
                          </div>
                          {request.statusNotes && (
                            <div className="mt-2 p-2 bg-muted rounded text-xs">
                              <span className="font-medium">Status Notes:</span> {request.statusNotes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No feature requests submitted yet.</p>
                      <p className="text-sm">Submit your first request to get started!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* My Help Request Details Dialog */}
        <Dialog open={!!selectedMyRequest} onOpenChange={(open) => !open && setSelectedMyRequest(null)}>
          <DialogContent className="bg-card border-border max-w-2xl w-[95vw] md:w-full max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-sm md:text-base text-foreground">Help Request Details</DialogTitle>
            </DialogHeader>
            
            {selectedMyRequest && (
              <div className="space-y-3 md:space-y-4">
                <div className="bg-muted p-3 md:p-4 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-foreground mb-1">{selectedMyRequest.subject}</h3>
                      <div className="flex gap-2 mb-2">
                        <Badge 
                          variant={
                            selectedMyRequest.status === 'resolved' ? 'default' : 
                            selectedMyRequest.status === 'in_progress' ? 'secondary' : 
                            'outline'
                          }
                          className={
                            selectedMyRequest.status === 'resolved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            selectedMyRequest.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          }
                        >
                          {selectedMyRequest.status === 'resolved' ? 'Resolved' : selectedMyRequest.status === 'in_progress' ? 'In Progress' : 'Open'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {selectedMyRequest.category.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className="text-xs capitalize">
                          {selectedMyRequest.priority}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Submitted:</span>
                      <span className="text-foreground">{format(new Date(selectedMyRequest.createdAt), 'MMM d, yyyy h:mm a')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Email:</span>
                      <span className="text-foreground">{selectedMyRequest.email}</span>
                    </div>
                    {selectedMyRequest.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Phone:</span>
                        <span className="text-foreground">{selectedMyRequest.phone}</span>
                      </div>
                    )}
                    {selectedMyRequest.source && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Source:</span>
                        <span className="text-foreground">{selectedMyRequest.source.replace('_', ' ')}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-foreground font-medium">Message</Label>
                  <div className="bg-muted p-3 rounded-lg mt-1">
                    <p className="text-foreground whitespace-pre-wrap">{selectedMyRequest.message}</p>
                  </div>
                </div>

                {selectedMyRequest.resolved && selectedMyRequest.resolvedAt && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-800 dark:text-green-200">
                        Resolved on {format(new Date(selectedMyRequest.resolvedAt), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                    {selectedMyRequest.resolutionNote && (
                      <div>
                        <Label className="text-green-800 dark:text-green-200 font-medium">Resolution</Label>
                        <p className="text-green-700 dark:text-green-300 mt-1">{selectedMyRequest.resolutionNote}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setSelectedMyRequest(null)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}