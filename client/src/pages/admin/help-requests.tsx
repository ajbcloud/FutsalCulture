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
import { useToast } from '../../hooks/use-toast';

export default function AdminHelpRequests() {
  const [helpRequests, setHelpRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    adminHelpRequests.list().then(data => {
      console.log('admin help requests:', data);
      setHelpRequests(data);
      setLoading(false);
    }).catch(err => {
      console.error('Error fetching help requests:', err);
      setLoading(false);
    });
  }, []);

  const handleMarkResolved = async (id: string) => {
    try {
      await adminHelpRequests.markResolved(id);
      setHelpRequests(helpRequests.map((req: any) => 
        req.id === id ? { ...req, status: 'resolved' } : req
      ));
      toast({ title: "Help request marked as resolved" });
    } catch (error) {
      console.error('Error marking help request as resolved:', error);
      toast({ title: "Failed to mark as resolved", variant: "destructive" });
    }
  };

  const handleSendReply = async () => {
    if (!selectedRequest || !replyMessage.trim()) return;

    setSending(true);
    try {
      await adminHelpRequests.reply(selectedRequest.id, replyMessage);
      toast({ title: "Reply sent successfully" });
      setSelectedRequest(null);
      setReplyMessage('');
      // Mark as resolved and update list
      setHelpRequests(helpRequests.map((req: any) => 
        req.id === selectedRequest.id ? { ...req, status: 'resolved' } : req
      ));
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
      <h1 className="text-2xl font-bold text-white mb-6">Help Requests</h1>

      <div className="bg-zinc-900 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800">
              <TableHead className="text-zinc-300">User</TableHead>
              <TableHead className="text-zinc-300">Message Preview</TableHead>
              <TableHead className="text-zinc-300">Priority</TableHead>
              <TableHead className="text-zinc-300">Status</TableHead>
              <TableHead className="text-zinc-300">Created</TableHead>
              <TableHead className="text-zinc-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {helpRequests.map((request: any) => (
              <TableRow key={request.id} className="border-zinc-800">
                <TableCell className="text-zinc-300">
                  <div>
                    <div className="font-medium text-white">{request.name || 'Anonymous'}</div>
                    <div className="text-sm text-zinc-400">{request.email}</div>
                    {request.phone && <div className="text-sm text-zinc-400">{request.phone}</div>}
                  </div>
                </TableCell>
                <TableCell className="text-white font-medium">
                  {request.note?.substring(0, 50) + (request.note?.length > 50 ? '...' : '')}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="secondary"
                    className={
                      request.priority === 'urgent' ? 'bg-red-900 text-red-300' :
                      request.priority === 'high' ? 'bg-orange-900 text-orange-300' :
                      request.priority === 'medium' ? 'bg-yellow-900 text-yellow-300' :
                      'bg-green-900 text-green-300'
                    }
                  >
                    {request.priority || 'medium'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={request.status === 'resolved' || request.resolved ? 'default' : 'secondary'}
                    className={request.status === 'resolved' || request.resolved ? 'bg-green-900 text-green-300' : 'bg-zinc-700 text-zinc-400'}
                  >
                    {request.status || (request.resolved ? 'resolved' : 'open')}
                  </Badge>
                </TableCell>
                <TableCell className="text-zinc-300">
                  {format(new Date(request.createdAt), 'MMM d, yyyy')}
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
                    {request.status !== 'resolved' && (
                      <Button 
                        onClick={() => handleMarkResolved(request.id)}
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
            {helpRequests.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-zinc-400 py-8">
                  No help requests found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

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
                  From: {selectedRequest.name} ({selectedRequest.email}) | {format(new Date(selectedRequest.createdAt), 'MMM d, yyyy h:mm a')}
                </p>
                {selectedRequest.phone && (
                  <p className="text-sm text-zinc-400 mb-2">Phone: {selectedRequest.phone}</p>
                )}
                <p className="text-sm text-zinc-400 mb-2">Priority: {selectedRequest.priority}</p>
                <p className="text-zinc-300">{selectedRequest.note}</p>
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
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSendReply}
                  disabled={sending || !replyMessage.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {sending ? 'Sending...' : 'Send Reply & Mark Resolved'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}