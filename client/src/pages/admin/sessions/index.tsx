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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { AGE_GROUPS } from '@shared/constants';

export default function AdminSessions() {
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [filters, setFilters] = useState({
    ageGroup: '',
    gender: '',
    location: '',
    status: '',
    search: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    adminSessions.list().then(data => {
      console.log('admin sessions:', data);
      setSessions(data);
      setFilteredSessions(data);
      setLoading(false);
    }).catch(err => {
      console.error('Error fetching sessions:', err);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let filtered = sessions.filter((session: any) => {
      const matchesAgeGroup = !filters.ageGroup || filters.ageGroup === 'all' || session.ageGroup === filters.ageGroup;
      const matchesGender = !filters.gender || filters.gender === 'all' || session.gender === filters.gender;
      const matchesLocation = !filters.location || session.location.toLowerCase().includes(filters.location.toLowerCase());
      const matchesStatus = !filters.status || filters.status === 'all' || session.status === filters.status;
      const matchesSearch = !filters.search || 
        session.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        session.location.toLowerCase().includes(filters.search.toLowerCase());
      
      return matchesAgeGroup && matchesGender && matchesLocation && matchesStatus && matchesSearch;
    });
    setFilteredSessions(filtered);
  }, [sessions, filters]);

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

      {/* Filter Controls */}
      <div className="bg-zinc-900 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <Label className="text-zinc-300">Search</Label>
            <Input
              placeholder="Search sessions..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>
          
          <div>
            <Label className="text-zinc-300">Age Group</Label>
            <Select value={filters.ageGroup} onValueChange={(value) => setFilters(prev => ({ ...prev, ageGroup: value }))}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="All Ages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ages</SelectItem>
                {AGE_GROUPS.map(age => (
                  <SelectItem key={age} value={age}>{age}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-zinc-300">Gender</Label>
            <Select value={filters.gender} onValueChange={(value) => setFilters(prev => ({ ...prev, gender: value }))}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="All Genders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="boys">Boys</SelectItem>
                <SelectItem value="girls">Girls</SelectItem>
                <SelectItem value="mixed">Mixed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-zinc-300">Status</Label>
            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="full">Full</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-zinc-300">Location</Label>
            <Input
              placeholder="Filter by location..."
              value={filters.location}
              onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>
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
            {filteredSessions.map((session: any) => (
              <TableRow key={session.id} className="border-zinc-800">
                <TableCell className="text-white">
                  {format(new Date(session.startTime), 'MMM d, yyyy h:mm a')}
                </TableCell>
                <TableCell className="text-zinc-300">
                  {Array.isArray(session.ageGroups) ? session.ageGroups.join(', ') : session.ageGroup || 'N/A'}
                </TableCell>
                <TableCell className="text-zinc-300">
                  {Array.isArray(session.genders) ? session.genders.map(g => g.charAt(0).toUpperCase() + g.slice(1)).join(', ') : session.gender || 'N/A'}
                </TableCell>
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
            {filteredSessions.length === 0 && (
              <TableRow className="border-zinc-800">
                <TableCell colSpan={7} className="text-center text-zinc-400 py-8">
                  No sessions found
                </TableCell>
              </TableRow>
            )}
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