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
import { MessageSquare, CheckCircle } from 'lucide-react';

export default function AdminHelpRequests() {
  const [helpRequests, setHelpRequests] = useState([]);
  const [loading, setLoading] = useState(true);

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
    } catch (error) {
      console.error('Error marking help request as resolved:', error);
    }
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
              <TableHead className="text-zinc-300">Subject</TableHead>
              <TableHead className="text-zinc-300">Category</TableHead>
              <TableHead className="text-zinc-300">User</TableHead>
              <TableHead className="text-zinc-300">Priority</TableHead>
              <TableHead className="text-zinc-300">Status</TableHead>
              <TableHead className="text-zinc-300">Created</TableHead>
              <TableHead className="text-zinc-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {helpRequests.map((request: any) => (
              <TableRow key={request.id} className="border-zinc-800">
                <TableCell className="text-white font-medium">
                  {request.subject}
                </TableCell>
                <TableCell className="text-zinc-300">{request.category}</TableCell>
                <TableCell className="text-zinc-300">
                  {request.userEmail || 'Anonymous'}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="secondary"
                    className={
                      request.priority === 'high' ? 'bg-red-900 text-red-300' :
                      request.priority === 'medium' ? 'bg-yellow-900 text-yellow-300' :
                      'bg-green-900 text-green-300'
                    }
                  >
                    {request.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={request.status === 'resolved' ? 'default' : 'secondary'}
                    className={request.status === 'resolved' ? 'bg-green-900 text-green-300' : 'bg-zinc-700 text-zinc-400'}
                  >
                    {request.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-zinc-300">
                  {format(new Date(request.createdAt), 'MMM d, yyyy')}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <MessageSquare className="w-4 h-4" />
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
                <TableCell colSpan={7} className="text-center text-zinc-400 py-8">
                  No help requests found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
}