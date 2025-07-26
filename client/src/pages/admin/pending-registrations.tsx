import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin-layout';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { useToast } from '../../hooks/use-toast';
import { format } from 'date-fns';
import { Check, X, User, Users } from 'lucide-react';

interface PendingRegistration {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  type: 'parent' | 'player';
  registrationStatus: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  parentId?: string;
}

export default function AdminPendingRegistrations() {
  const [registrations, setRegistrations] = useState<PendingRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingRegistrations();
  }, []);

  const fetchPendingRegistrations = async () => {
    try {
      const response = await fetch('/api/admin/pending-registrations');
      if (!response.ok) throw new Error('Failed to fetch pending registrations');
      const data = await response.json();
      setRegistrations(data);
    } catch (error) {
      console.error('Error fetching pending registrations:', error);
      toast({
        title: "Error",
        description: "Failed to load pending registrations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string, type: string) => {
    setProcessing(id);
    try {
      const response = await fetch(`/api/admin/registrations/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });

      if (!response.ok) throw new Error('Failed to approve registration');

      toast({
        title: "Success",
        description: `${type === 'parent' ? 'Parent' : 'Player'} registration approved`,
      });

      // Refresh the list
      fetchPendingRegistrations();
    } catch (error) {
      console.error('Error approving registration:', error);
      toast({
        title: "Error",
        description: "Failed to approve registration",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: string, type: string) => {
    if (!rejectReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    setProcessing(id);
    try {
      const response = await fetch(`/api/admin/registrations/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, reason: rejectReason }),
      });

      if (!response.ok) throw new Error('Failed to reject registration');

      toast({
        title: "Success",
        description: `${type === 'parent' ? 'Parent' : 'Player'} registration rejected`,
      });

      setShowRejectDialog(null);
      setRejectReason('');
      // Refresh the list
      fetchPendingRegistrations();
    } catch (error) {
      console.error('Error rejecting registration:', error);
      toast({
        title: "Error",
        description: "Failed to reject registration",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-zinc-400">Loading pending registrations...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Pending Registrations</h1>
        <Badge variant="secondary" className="bg-yellow-900/30 text-yellow-400 border-yellow-600">
          {registrations.length} Pending
        </Badge>
      </div>

      {registrations.length === 0 ? (
        <div className="bg-zinc-900 rounded-lg p-8 text-center">
          <Users className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No Pending Registrations</h3>
          <p className="text-zinc-400">All registrations are up to date!</p>
        </div>
      ) : (
        <div className="bg-zinc-900 rounded-lg border border-zinc-700">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-700 hover:bg-zinc-800/50">
                <TableHead className="text-zinc-300">Type</TableHead>
                <TableHead className="text-zinc-300">Name</TableHead>
                <TableHead className="text-zinc-300">Email</TableHead>
                <TableHead className="text-zinc-300">Phone</TableHead>
                <TableHead className="text-zinc-300">Registered</TableHead>
                <TableHead className="text-zinc-300">Status</TableHead>
                <TableHead className="text-zinc-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrations.map((registration) => (
                <TableRow key={registration.id} className="border-zinc-700 hover:bg-zinc-800/30">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {registration.type === 'parent' ? (
                        <User className="w-4 h-4 text-blue-400" />
                      ) : (
                        <Users className="w-4 h-4 text-green-400" />
                      )}
                      <span className="capitalize text-zinc-300">{registration.type}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-300">
                    {registration.firstName} {registration.lastName}
                  </TableCell>
                  <TableCell className="text-zinc-300">{registration.email}</TableCell>
                  <TableCell className="text-zinc-300">{registration.phone || '-'}</TableCell>
                  <TableCell className="text-zinc-300">
                    {format(new Date(registration.createdAt), 'MMM d, yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-yellow-900/30 text-yellow-400 border-yellow-600">
                      {registration.registrationStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApprove(registration.id, registration.type)}
                        disabled={processing === registration.id}
                        className="border-green-600 text-green-400 hover:bg-green-900/30"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Approve
                      </Button>
                      
                      <Dialog 
                        open={showRejectDialog === registration.id} 
                        onOpenChange={(open) => setShowRejectDialog(open ? registration.id : null)}
                      >
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={processing === registration.id}
                            className="border-red-600 text-red-400 hover:bg-red-900/30"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Reject
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-zinc-900 border-zinc-700">
                          <DialogHeader>
                            <DialogTitle className="text-white">
                              Reject Registration: {registration.firstName} {registration.lastName}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="reason" className="text-zinc-300">Reason for Rejection</Label>
                              <Textarea
                                id="reason"
                                placeholder="Please provide a reason for rejecting this registration..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="bg-zinc-800 border-zinc-600 text-white"
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setShowRejectDialog(null);
                                  setRejectReason('');
                                }}
                                className="border-zinc-600 text-zinc-300"
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => handleReject(registration.id, registration.type)}
                                disabled={processing === registration.id || !rejectReason.trim()}
                              >
                                Reject Registration
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AdminLayout>
  );
}