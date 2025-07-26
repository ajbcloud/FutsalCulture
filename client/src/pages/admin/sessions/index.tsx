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
import { Plus, Edit, Trash2, Upload, Download } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function AdminSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({ title: "Please select a CSV file", variant: "destructive" });
      return;
    }

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/admin/imports/sessions', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (response.ok) {
        toast({ title: `Successfully imported ${result.imported} sessions` });
        setShowImportModal(false);
        // Refresh sessions list
        adminSessions.list().then(setSessions);
      } else {
        toast({ title: result.message || "Import failed", variant: "destructive" });
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({ title: "Import failed", variant: "destructive" });
    }
    setImporting(false);
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
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => window.open('/api/admin/template/sessions', '_blank')}
            className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>
          <Button 
            variant="outline"
            onClick={() => setShowImportModal(true)}
            className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <Link href="/admin/sessions/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Session
            </Button>
          </Link>
        </div>
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

      {/* Import Modal */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">Import Sessions from CSV</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="csvFile" className="text-zinc-300">
                Select CSV File
              </Label>
              <Input
                id="csvFile"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={importing}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            
            <div className="text-sm text-zinc-400">
              <p>CSV should include headers: title, location, ageGroup, gender, startTime, endTime, capacity, priceCents</p>
              <Button 
                variant="link" 
                onClick={() => window.open('/api/admin/template/sessions', '_blank')}
                className="p-0 h-auto text-blue-400 hover:text-blue-300"
              >
                Download template
              </Button>
            </div>

            {importing && (
              <div className="flex items-center space-x-2 text-zinc-300">
                <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                <span>Importing sessions...</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}