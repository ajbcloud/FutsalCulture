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
import { format } from 'date-fns';
import { MessageSquare, CheckCircle, Reply } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { useToast } from '../../hooks/use-toast';
import { Pagination } from '@/components/pagination';

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
  
  // Filter states
  const [userFilter, setUserFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  const { toast } = useToast();

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

    // Filter by date range
    if (startDateFilter) {
      filtered = filtered.filter(req => 
        new Date(req.createdAt) >= new Date(startDateFilter)
      );
    }
    if (endDateFilter) {
      filtered = filtered.filter(req => 
        new Date(req.createdAt) <= new Date(endDateFilter + 'T23:59:59')
      );
    }

    setFilteredRequests(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [helpRequests, userFilter, statusFilter, startDateFilter, endDateFilter]);

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
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Help Requests</h1>
        
        {/* Filter Controls */}
        <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label className="text-zinc-300 text-sm">Filter by User</Label>
              <Input
                placeholder="Search name or email..."
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-zinc-300 text-sm">Filter by Status</Label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
              >
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="replied">Replied</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div>
              <Label className="text-zinc-300 text-sm">Start Date</Label>
              <Input
                type="date"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-zinc-300 text-sm">End Date</Label>
              <Input
                type="date"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white mt-1"
              />
            </div>
          </div>
          {(userFilter || statusFilter || startDateFilter || endDateFilter) && (
            <div className="mt-3 flex justify-between items-center">
              <p className="text-sm text-zinc-400">
                Showing {filteredRequests.length} of {helpRequests.length} help requests
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setUserFilter('');
                  setStatusFilter('');
                  setStartDateFilter('');
                  setEndDateFilter('');
                }}
                className="text-zinc-300 border-zinc-600 hover:bg-zinc-800"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>

        {/* Top Pagination */}
        {filteredRequests.length > 0 && (
          <Pagination
            totalItems={filteredRequests.length}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            className="bg-zinc-900 p-4 rounded-lg border border-zinc-800"
          />
        )}

      <div className="bg-zinc-900 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800">
              <TableHead className="text-zinc-300">User</TableHead>
              <TableHead className="text-zinc-300">Message Preview</TableHead>
              <TableHead className="text-zinc-300">Status</TableHead>
              <TableHead className="text-zinc-300">Submitted</TableHead>
              <TableHead className="text-zinc-300">Resolution</TableHead>
              <TableHead className="text-zinc-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRequests.map((request: any) => (
              <TableRow key={request.id} className="border-zinc-800">
                <TableCell className="text-zinc-300">
                  <div>
                    <div className="font-medium text-white">{request.firstName && request.lastName ? `${request.firstName} ${request.lastName}` : 'Anonymous'}</div>
                    <div className="text-sm text-zinc-400">{request.email}</div>
                    {request.phone && <div className="text-sm text-zinc-400">{request.phone}</div>}
                  </div>
                </TableCell>
                <TableCell className="text-white font-medium">
                  <div className="space-y-1">
                    <div className="font-semibold">{request.subject}</div>
                    <div className="text-sm text-zinc-400">
                      {request.message?.substring(0, 50) + (request.message?.length > 50 ? '...' : '')}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={
                      request.status === 'resolved' || request.resolved ? 'default' : 
                      request.status === 'replied' ? 'secondary' : 
                      'secondary'
                    }
                    className={
                      request.status === 'resolved' || request.resolved ? 'bg-green-900 text-green-300' : 
                      request.status === 'replied' ? 'bg-yellow-900 text-yellow-300' : 
                      'bg-zinc-700 text-zinc-400'
                    }
                  >
                    {request.status || (request.resolved ? 'resolved' : 'open')}
                  </Badge>
                </TableCell>
                <TableCell className="text-zinc-300">
                  {format(new Date(request.createdAt), 'MMM d, yyyy h:mm a')}
                </TableCell>
                <TableCell className="text-zinc-300">
                  <div className="space-y-2">
                    {(request.status === 'resolved' || request.resolved) && request.resolvedAt ? (
                      <div>
                        <div className="text-sm text-green-400">
                          Resolved {format(new Date(request.resolvedAt), 'MMM d, yyyy h:mm a')}
                        </div>
                        {request.resolutionNote && (
                          <div className="text-xs text-zinc-400 mt-1 max-w-xs truncate">
                            {request.resolutionNote}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-zinc-500">-</span>
                    )}
                    
                    {/* Reply History */}
                    {request.replyHistory && request.replyHistory.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-zinc-700">
                        <p className="text-xs text-blue-400 mb-2">
                          {request.replyHistory.length} {request.replyHistory.length === 1 ? 'reply' : 'replies'} sent:
                        </p>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {request.replyHistory.map((reply: any, index: number) => (
                            <div key={index} className="bg-zinc-800 p-2 rounded text-xs border-l-2 border-blue-500">
                              <p className="text-zinc-200 mb-1">{reply.message}</p>
                              <p className="text-zinc-500 text-xs">
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
                <TableCell colSpan={6} className="text-center text-zinc-400 py-8">
                  {helpRequests.length === 0 ? 'No help requests found' : 'No help requests match the current filters'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Bottom Pagination */}
      {filteredRequests.length > 0 && (
        <Pagination
          totalItems={filteredRequests.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          className="bg-zinc-900 p-4 rounded-lg border border-zinc-800"
        />
      )}

      {/* Reply Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Reply to Help Request</DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="bg-zinc-800 p-4 rounded-lg">
                <p className="text-sm text-zinc-400 mb-2">
                  From: {selectedRequest.firstName} {selectedRequest.lastName} ({selectedRequest.email}) | {format(new Date(selectedRequest.createdAt), 'MMM d, yyyy h:mm a')}
                </p>
                {selectedRequest.phone && (
                  <p className="text-sm text-zinc-400 mb-2">Phone: {selectedRequest.phone}</p>
                )}
                <div className="space-y-2">
                  <p className="text-sm text-zinc-400">
                    <span className="font-medium">Subject:</span> {selectedRequest.subject}
                  </p>
                  <p className="text-sm text-zinc-400">
                    <span className="font-medium">Category:</span> {selectedRequest.category} | <span className="font-medium">Priority:</span> {selectedRequest.priority}
                  </p>
                  <p className="text-zinc-300">{selectedRequest.message}</p>
                </div>
              </div>

              <div>
                <Label htmlFor="replyMessage" className="text-zinc-300">Your Reply</Label>
                <Textarea
                  id="replyMessage"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply here..."
                  className="bg-zinc-800 border-zinc-700 text-white min-h-32"
                  disabled={sending}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedRequest(null)}
                  disabled={sending}
                  className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleSendReply(false)}
                  disabled={sending || !replyMessage.trim()}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  {sending ? 'Sending...' : 'Reply'}
                </Button>
                <Button 
                  onClick={() => handleSendReply(true)}
                  disabled={sending || !replyMessage.trim()}
                  className="bg-green-600 hover:bg-green-700 text-white"
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
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">Resolve Help Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-zinc-300">Request from {resolvingRequest?.firstName} {resolvingRequest?.lastName}</Label>
              <div className="p-3 bg-zinc-800 rounded-lg border border-zinc-700 mt-1">
                <div className="space-y-2">
                  <p className="text-sm text-zinc-400">
                    <span className="font-medium">Subject:</span> {resolvingRequest?.subject}
                  </p>
                  <p className="text-white whitespace-pre-wrap">{resolvingRequest?.message}</p>
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="resolutionNote" className="text-zinc-300">Resolution Details * (minimum 10 characters)</Label>
              <Textarea
                id="resolutionNote"
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white mt-1"
                rows={4}
                placeholder="Describe how you resolved this issue and what actions were taken..."
                required
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-zinc-500">
                  {resolutionNote.trim().length}/10 characters minimum
                </p>
                <p className="text-xs text-zinc-400">
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
      </div>
    </AdminLayout>
  );
}