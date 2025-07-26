import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin-layout';
import { adminSessions } from '@/lib/adminApi';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Link } from 'wouter';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminSessions.list().then(data => {
      console.log('admin sessions:', data);
      setSessions(data);
      setLoading(false);
    }).catch(err => {
      console.error('Error fetching sessions:', err);
      setLoading(false);
    });
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this session?')) {
      try {
        await adminSessions.delete(id);
        setSessions(sessions.filter((s: any) => s.id !== id));
      } catch (error) {
        console.error('Error deleting session:', error);
      }
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Sessions Management</h1>
        <Link href="/admin/sessions/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            New Session
          </Button>
        </Link>
      </div>

      <div className="bg-zinc-900 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800">
              <TableHead className="text-zinc-300">Date & Time</TableHead>
              <TableHead className="text-zinc-300">Age Group</TableHead>
              <TableHead className="text-zinc-300">Gender</TableHead>
              <TableHead className="text-zinc-300">Location</TableHead>
              <TableHead className="text-zinc-300">Capacity</TableHead>
              <TableHead className="text-zinc-300">Status</TableHead>
              <TableHead className="text-zinc-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session: any) => (
              <TableRow key={session.id} className="border-zinc-800">
                <TableCell className="text-white">
                  {format(new Date(session.startTime), 'MMM d, yyyy h:mm a')}
                </TableCell>
                <TableCell className="text-zinc-300">{session.ageGroup}</TableCell>
                <TableCell className="text-zinc-300">{session.gender}</TableCell>
                <TableCell className="text-zinc-300">{session.location}</TableCell>
                <TableCell className="text-zinc-300">
                  {session.signupsCount || 0}/{session.capacity}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    session.status === 'open' ? 'bg-green-900 text-green-300' :
                    session.status === 'full' ? 'bg-red-900 text-red-300' :
                    'bg-yellow-900 text-yellow-300'
                  }`}>
                    {session.status}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Link href={`/admin/sessions/${session.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDelete(session.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
}