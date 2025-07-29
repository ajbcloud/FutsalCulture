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
import { Checkbox } from '@/components/ui/checkbox';
import { Link } from 'wouter';
import { Plus, Edit, Trash2, Upload, Download, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { AGE_GROUPS } from '@shared/constants';
import { Pagination } from '@/components/pagination';

export default function AdminSessions() {
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [paginatedSessions, setPaginatedSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showMassUpdateModal, setShowMassUpdateModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [massUpdating, setMassUpdating] = useState(false);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    ageGroup: '',
    gender: '',
    location: '',
    status: '',
    search: '',
    dateFrom: '',
    dateTo: ''
  });
  const [massUpdateData, setMassUpdateData] = useState({
    title: '',
    location: '',
    ageGroups: [] as string[],
    genders: [] as string[],
    capacity: '',
    bookingOpenHour: '',
    bookingOpenMinute: '',
  });
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
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
      const matchesAgeGroup = !filters.ageGroup || filters.ageGroup === 'all' || 
        session.ageGroups?.includes(filters.ageGroup) || session.ageGroup === filters.ageGroup;
      const matchesGender = !filters.gender || filters.gender === 'all' || 
        session.genders?.includes(filters.gender) || session.gender === filters.gender;
      const matchesLocation = !filters.location || session.location.toLowerCase().includes(filters.location.toLowerCase());
      const matchesStatus = !filters.status || filters.status === 'all' || session.status === filters.status;
      const matchesSearch = !filters.search || 
        session.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        session.location.toLowerCase().includes(filters.search.toLowerCase());
      
      // Date filtering
      let matchesDate = true;
      if (filters.dateFrom || filters.dateTo) {
        const sessionDate = new Date(session.startTime);
        if (filters.dateFrom) {
          const fromDate = new Date(filters.dateFrom);
          fromDate.setHours(0, 0, 0, 0);
          matchesDate = matchesDate && sessionDate >= fromDate;
        }
        if (filters.dateTo) {
          const toDate = new Date(filters.dateTo);
          toDate.setHours(23, 59, 59, 999);
          matchesDate = matchesDate && sessionDate <= toDate;
        }
      }
      
      return matchesAgeGroup && matchesGender && matchesLocation && matchesStatus && matchesSearch && matchesDate;
    });
    setFilteredSessions(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [sessions, filters]);

  // Apply pagination whenever filtered sessions or pagination settings change
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedSessions(filteredSessions.slice(startIndex, endIndex));
  }, [filteredSessions, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSessions(new Set(paginatedSessions.map((s: any) => s.id)));
    } else {
      setSelectedSessions(new Set());
    }
  };

  const handleSelectSession = (sessionId: string, checked: boolean) => {
    const newSelected = new Set(selectedSessions);
    if (checked) {
      newSelected.add(sessionId);
    } else {
      newSelected.delete(sessionId);
    }
    setSelectedSessions(newSelected);
  };

  const handleMassUpdate = async () => {
    if (selectedSessions.size === 0) {
      toast({ title: "No sessions selected", variant: "destructive" });
      return;
    }

    setMassUpdating(true);
    try {
      // Prepare update data - only include fields that have values
      const updateData: any = {};
      if (massUpdateData.title.trim()) updateData.title = massUpdateData.title.trim();
      if (massUpdateData.location.trim()) updateData.location = massUpdateData.location.trim();
      if (massUpdateData.ageGroups.length > 0) updateData.ageGroups = massUpdateData.ageGroups;
      if (massUpdateData.genders.length > 0) updateData.genders = massUpdateData.genders;
      if (massUpdateData.capacity) updateData.capacity = parseInt(massUpdateData.capacity);
      if (massUpdateData.bookingOpenHour !== '') updateData.bookingOpenHour = parseInt(massUpdateData.bookingOpenHour);
      if (massUpdateData.bookingOpenMinute !== '') updateData.bookingOpenMinute = parseInt(massUpdateData.bookingOpenMinute);

      if (Object.keys(updateData).length === 0) {
        toast({ title: "No fields to update", variant: "destructive" });
        setMassUpdating(false);
        return;
      }

      // Update each selected session
      const updatePromises = Array.from(selectedSessions).map(sessionId =>
        adminSessions.update(sessionId, updateData)
      );

      await Promise.all(updatePromises);

      // Refresh sessions list
      const updatedSessions = await adminSessions.list();
      setSessions(updatedSessions);
      setFilteredSessions(updatedSessions);

      // Reset form and close modal
      setMassUpdateData({
        title: '',
        location: '',
        ageGroups: [],
        genders: [],
        capacity: '',
        bookingOpenHour: '',
        bookingOpenMinute: '',
      });
      setSelectedSessions(new Set());
      setShowMassUpdateModal(false);

      toast({ 
        title: "Mass update completed", 
        description: `Updated ${selectedSessions.size} sessions successfully` 
      });
    } catch (error) {
      console.error('Mass update error:', error);
      toast({ title: "Mass update failed", variant: "destructive" });
    }
    setMassUpdating(false);
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Sessions Management</h1>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {selectedSessions.size > 0 && (
            <Button 
              variant="outline"
              onClick={() => setShowMassUpdateModal(true)}
              className="border-orange-600 text-orange-300 hover:bg-orange-900 text-sm px-3 py-2 h-9"
              size="sm"
            >
              <Settings className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Mass Update ({selectedSessions.size})</span>
              <span className="sm:hidden">Update ({selectedSessions.size})</span>
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={() => window.open('/api/admin/template/sessions', '_blank')}
            className="border-border text-muted-foreground hover:bg-muted text-sm px-3 py-2 h-9"
            size="sm"
          >
            <Download className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Download Template</span>
            <span className="sm:hidden">Template</span>
          </Button>
          <Button 
            variant="outline"
            onClick={() => setShowImportModal(true)}
            className="border-border text-muted-foreground hover:bg-muted text-sm px-3 py-2 h-9"
            size="sm"
          >
            <Upload className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Import CSV</span>
            <span className="sm:hidden">Import</span>
          </Button>
          <Link href="/admin/sessions/new">
            <Button className="bg-blue-600 hover:bg-blue-700 text-sm px-3 py-2 h-9" size="sm">
              <Plus className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">New Session</span>
              <span className="sm:hidden">New</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-card rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3 md:gap-4">
          <div>
            <Label className="text-muted-foreground">Search</Label>
            <Input
              placeholder="Search sessions..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="bg-input border-border text-foreground"
            />
          </div>
          
          <div>
            <Label className="text-muted-foreground">Age Group</Label>
            <Select value={filters.ageGroup} onValueChange={(value) => setFilters(prev => ({ ...prev, ageGroup: value }))}>
              <SelectTrigger className="bg-input border-border text-foreground">
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
            <Label className="text-muted-foreground">Gender</Label>
            <Select value={filters.gender} onValueChange={(value) => setFilters(prev => ({ ...prev, gender: value }))}>
              <SelectTrigger className="bg-input border-border text-foreground">
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

          <div>
            <Label className="text-zinc-300">From Date</Label>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          <div>
            <Label className="text-zinc-300">To Date</Label>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>
        </div>
        
        {/* Clear Filters Button */}
        {(filters.search || filters.ageGroup || filters.gender || filters.status || filters.location || filters.dateFrom || filters.dateTo) && (
          <div className="mt-4 flex justify-end">
            <Button 
              variant="outline"
              onClick={() => setFilters({
                ageGroup: '',
                gender: '',
                location: '',
                status: '',
                search: '',
                dateFrom: '',
                dateTo: ''
              })}
              className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
            >
              Clear All Filters
            </Button>
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-card rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="text-muted-foreground w-12">
                <Checkbox
                  checked={paginatedSessions.length > 0 && paginatedSessions.every((s: any) => selectedSessions.has(s.id))}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="text-muted-foreground">Date & Time</TableHead>
              <TableHead className="text-muted-foreground">Age Group</TableHead>
              <TableHead className="text-muted-foreground">Gender</TableHead>
              <TableHead className="text-muted-foreground">Location</TableHead>
              <TableHead className="text-muted-foreground">Capacity</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedSessions.map((session: any, index: number) => (
              <React.Fragment key={session.id}>
                <TableRow 
                  className="border-border cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedSessions.has(session.id)}
                      onCheckedChange={(checked) => handleSelectSession(session.id, checked as boolean)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </TableCell>
                  <TableCell className="text-foreground">
                  {format(new Date(session.startTime), 'MMM d, yyyy h:mm a')}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {Array.isArray(session.ageGroups) ? session.ageGroups.join(', ') : session.ageGroup || 'N/A'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {Array.isArray(session.genders) ? session.genders.map((g: string) => g.charAt(0).toUpperCase() + g.slice(1)).join(', ') : session.gender || 'N/A'}
                </TableCell>
                <TableCell className="text-muted-foreground">{session.location}</TableCell>
                <TableCell className="text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <span>{session.signupCount || session.signupsCount || 0}/{session.capacity}</span>
                    <div className="w-12 bg-muted rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ 
                          width: `${Math.min(((session.signupCount || session.signupsCount || 0) / session.capacity) * 100, 100)}%` 
                        }}
                      />
                    </div>
                  </div>
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
              
              {/* Accordion Content */}
              {expandedSession === session.id && (
                <TableRow className="border-border">
                  <TableCell colSpan={8} className="p-0">
                    <div className="bg-muted p-6 rounded-lg mx-4 my-2">
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          Players signed up: {session.signupCount || session.signupsCount || 0} / {session.capacity}
                        </h3>
                        
                        {/* KPI Bar */}
                        <div className="w-full bg-muted rounded-full h-3 mb-4">
                          <div 
                            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${Math.min(((session.signupCount || session.signupsCount || 0) / session.capacity) * 100, 100)}%` 
                            }}
                          />
                        </div>
                      </div>
                      
                      {/* Player List */}
                      {session.playersSigned && session.playersSigned.length > 0 ? (
                        <div className="max-h-60 overflow-y-auto">
                          <div className="space-y-2">
                            {session.playersSigned.map((player: any) => (
                              <div key={player.playerId} className="flex justify-between items-center p-3 bg-zinc-700 rounded-lg">
                                <div className="flex-1">
                                  <span className="text-white font-medium">
                                    {player.firstName} {player.lastName}
                                  </span>
                                  <div className="text-zinc-300 text-sm">
                                    Age {new Date().getFullYear() - player.birthYear} • {player.gender}
                                    {player.soccerClub && (
                                      <span className="ml-2 text-zinc-400">• {player.soccerClub}</span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    player.paid 
                                      ? 'bg-green-900 text-green-300' 
                                      : 'bg-yellow-900 text-yellow-300'
                                  }`}>
                                    {player.paid ? 'Paid' : 'Pending'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-zinc-400 py-8">
                          No players signed up yet
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
              </React.Fragment>
            ))}
            {paginatedSessions.length === 0 && (
              <TableRow className="border-zinc-800">
                <TableCell colSpan={8} className="text-center text-zinc-400 py-8">
                  {filteredSessions.length === 0 ? 'No sessions found' : 'No sessions on this page'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {paginatedSessions.map((session: any) => (
          <div key={session.id} className="bg-card rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <Checkbox
                  checked={selectedSessions.has(session.id)}
                  onCheckedChange={(checked) => handleSelectSession(session.id, checked as boolean)}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-foreground font-medium text-sm truncate">
                    {format(new Date(session.startTime), 'MMM d, h:mm a')}
                  </h3>
                  <p className="text-muted-foreground text-xs">{session.location}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs shrink-0 ${
                session.status === 'open' ? 'bg-green-900 text-green-300' :
                session.status === 'full' ? 'bg-red-900 text-red-300' :
                'bg-yellow-900 text-yellow-300'
              }`}>
                {session.status}
              </span>
            </div>
            
            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Age Groups:</span>
                <span className="text-foreground">
                  {Array.isArray(session.ageGroups) ? session.ageGroups.join(', ') : session.ageGroup || 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Gender:</span>
                <span className="text-foreground">
                  {Array.isArray(session.genders) ? session.genders.map((g: string) => g.charAt(0).toUpperCase() + g.slice(1)).join(', ') : session.gender || 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Capacity:</span>
                <div className="flex items-center space-x-2">
                  <span className="text-foreground">{session.signupCount || session.signupsCount || 0}/{session.capacity}</span>
                  <div className="w-16 bg-muted rounded-full h-1.5">
                    <div 
                      className="bg-blue-600 h-1.5 rounded-full transition-all"
                      style={{ 
                        width: `${Math.min(((session.signupCount || session.signupsCount || 0) / session.capacity) * 100, 100)}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
                className="text-xs px-3 py-1 h-7"
              >
                {expandedSession === session.id ? 'Hide Details' : 'View Details'}
              </Button>
              <div className="flex space-x-2">
                <Link href={`/admin/sessions/${session.id}`}>
                  <Button variant="outline" size="sm" className="text-xs px-2 py-1 h-7">
                    <Edit className="w-3 h-3" />
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleDelete(session.id)}
                  className="text-red-400 hover:text-red-300 text-xs px-2 py-1 h-7"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
            
            {/* Mobile Accordion Content */}
            {expandedSession === session.id && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-foreground mb-2">
                    Players: {session.signupCount || session.signupsCount || 0} / {session.capacity}
                  </h4>
                  
                  {/* KPI Bar */}
                  <div className="w-full bg-muted rounded-full h-2 mb-3">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min(((session.signupCount || session.signupsCount || 0) / session.capacity) * 100, 100)}%` 
                      }}
                    />
                  </div>
                </div>
                
                {/* Player List */}
                {session.playersSigned && session.playersSigned.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto">
                    <div className="space-y-2">
                      {session.playersSigned.map((player: any) => (
                        <div key={player.playerId} className="flex justify-between items-center p-2 bg-zinc-800 rounded">
                          <div className="flex-1 min-w-0">
                            <span className="text-white font-medium text-sm block truncate">
                              {player.firstName} {player.lastName}
                            </span>
                            <div className="text-zinc-300 text-xs">
                              Age {new Date().getFullYear() - player.birthYear} • {player.gender}
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs shrink-0 ${
                            player.paid 
                              ? 'bg-green-900 text-green-300' 
                              : 'bg-yellow-900 text-yellow-300'
                          }`}>
                            {player.paid ? 'Paid' : 'Pending'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-zinc-400 py-4 text-sm">
                    No players signed up yet
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        
        {paginatedSessions.length === 0 && (
          <div className="bg-zinc-900 rounded-lg p-8 text-center">
            <p className="text-zinc-400">
              {filteredSessions.length === 0 ? 'No sessions found' : 'No sessions on this page'}
            </p>
          </div>
        )}
      </div>

      {/* Bottom Pagination */}
      {filteredSessions.length > 0 && (
        <Pagination
          totalItems={filteredSessions.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          className="bg-zinc-900 p-4 rounded-lg border border-zinc-800"
        />
      )}

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

      {/* Mass Update Modal */}
      <Dialog open={showMassUpdateModal} onOpenChange={setShowMassUpdateModal}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-white">Mass Update Sessions ({selectedSessions.size} selected)</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div className="text-sm text-zinc-400 mb-4">
              Only fill in the fields you want to update. Empty fields will be left unchanged.
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-zinc-300">Title</Label>
                <Input
                  value={massUpdateData.title}
                  onChange={(e) => setMassUpdateData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Leave empty to keep existing"
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              <div>
                <Label className="text-zinc-300">Location</Label>
                <Input
                  value={massUpdateData.location}
                  onChange={(e) => setMassUpdateData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Leave empty to keep existing"
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              <div>
                <Label className="text-zinc-300">Age Groups (Multi-Select)</Label>
                <div className="grid grid-cols-3 gap-2 p-3 bg-zinc-800 border border-zinc-700 rounded">
                  <label className="flex items-center space-x-2 text-sm text-zinc-300">
                    <input
                      type="checkbox"
                      checked={massUpdateData.ageGroups.length === 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setMassUpdateData(prev => ({ ...prev, ageGroups: [] }));
                        }
                      }}
                      className="rounded border-zinc-600 bg-zinc-700"
                    />
                    <span>Keep existing</span>
                  </label>
                  {AGE_GROUPS.map(age => (
                    <label key={age} className="flex items-center space-x-2 text-sm text-zinc-300">
                      <input
                        type="checkbox"
                        checked={massUpdateData.ageGroups.includes(age)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setMassUpdateData(prev => ({
                              ...prev,
                              ageGroups: [...prev.ageGroups, age]
                            }));
                          } else {
                            setMassUpdateData(prev => ({
                              ...prev,
                              ageGroups: prev.ageGroups.filter(a => a !== age)
                            }));
                          }
                        }}
                        className="rounded border-zinc-600 bg-zinc-700"
                      />
                      <span>{age}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-zinc-300">Gender (Multi-Select)</Label>
                <div className="flex flex-wrap gap-3 p-3 bg-zinc-800 border border-zinc-700 rounded">
                  <label className="flex items-center space-x-2 text-sm text-zinc-300">
                    <input
                      type="checkbox"
                      checked={massUpdateData.genders.length === 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setMassUpdateData(prev => ({ ...prev, genders: [] }));
                        }
                      }}
                      className="rounded border-zinc-600 bg-zinc-700"
                    />
                    <span>Keep existing</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm text-zinc-300">
                    <input
                      type="checkbox"
                      checked={massUpdateData.genders.includes('boys')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setMassUpdateData(prev => ({
                            ...prev,
                            genders: [...prev.genders.filter(g => g !== 'boys'), 'boys']
                          }));
                        } else {
                          setMassUpdateData(prev => ({
                            ...prev,
                            genders: prev.genders.filter(g => g !== 'boys')
                          }));
                        }
                      }}
                      className="rounded border-zinc-600 bg-zinc-700"
                    />
                    <span>Boys</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm text-zinc-300">
                    <input
                      type="checkbox"
                      checked={massUpdateData.genders.includes('girls')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setMassUpdateData(prev => ({
                            ...prev,
                            genders: [...prev.genders.filter(g => g !== 'girls'), 'girls']
                          }));
                        } else {
                          setMassUpdateData(prev => ({
                            ...prev,
                            genders: prev.genders.filter(g => g !== 'girls')
                          }));
                        }
                      }}
                      className="rounded border-zinc-600 bg-zinc-700"
                    />
                    <span>Girls</span>
                  </label>

                </div>
              </div>

              <div>
                <Label className="text-zinc-300">Capacity</Label>
                <Input
                  type="number"
                  value={massUpdateData.capacity}
                  onChange={(e) => setMassUpdateData(prev => ({ ...prev, capacity: e.target.value }))}
                  placeholder="Leave empty to keep existing"
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              <div>
                <Label className="text-zinc-300">Booking Opens At</Label>
                <div className="flex gap-2">
                  <Select 
                    value={massUpdateData.bookingOpenHour !== '' ? (() => {
                      const hour24 = parseInt(massUpdateData.bookingOpenHour);
                      if (hour24 === 0) return "12";
                      if (hour24 > 12) return (hour24 - 12).toString();
                      return hour24.toString();
                    })() : ''} 
                    onValueChange={(value) => {
                      if (value === '' || value === 'keep-existing') {
                        setMassUpdateData(prev => ({ ...prev, bookingOpenHour: '', bookingOpenMinute: '' }));
                      } else {
                        const hour12 = parseInt(value);
                        // Default to AM for new selections, preserve existing AM/PM if already set
                        const currentHour24 = massUpdateData.bookingOpenHour !== '' ? parseInt(massUpdateData.bookingOpenHour) : 8;
                        const isCurrentlyPM = currentHour24 >= 12;
                        let hour24;
                        if (isCurrentlyPM && massUpdateData.bookingOpenHour !== '') {
                          hour24 = hour12 === 12 ? 12 : hour12 + 12;
                        } else {
                          hour24 = hour12 === 12 ? 0 : hour12;
                        }
                        // Restrict to 6am-9pm range
                        if (hour24 >= 6 && hour24 <= 21) {
                          setMassUpdateData(prev => ({ ...prev, bookingOpenHour: hour24.toString() }));
                        }
                      }
                    }}
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue placeholder="Hour" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="keep-existing">Keep existing</SelectItem>
                      {Array.from({ length: 12 }, (_, i) => {
                        const hour = i + 1;
                        return (
                          <SelectItem key={hour} value={hour.toString()}>
                            {hour}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <Select 
                    value={massUpdateData.bookingOpenMinute} 
                    onValueChange={(value) => {
                      if (value !== 'keep-existing') {
                        setMassUpdateData(prev => ({ ...prev, bookingOpenMinute: value }));
                      }
                    }}
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue placeholder="Min" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="keep-existing">Keep existing</SelectItem>
                      <SelectItem value="0">00</SelectItem>
                      <SelectItem value="15">15</SelectItem>
                      <SelectItem value="30">30</SelectItem>
                      <SelectItem value="45">45</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select 
                    value={massUpdateData.bookingOpenHour !== '' ? (parseInt(massUpdateData.bookingOpenHour) < 12 ? 'AM' : 'PM') : ''} 
                    onValueChange={(value) => {
                      if (value !== 'keep-existing' && value !== '' && massUpdateData.bookingOpenHour !== '') {
                        const currentHour24 = parseInt(massUpdateData.bookingOpenHour);
                        const currentHour12 = currentHour24 === 0 ? 12 : 
                                             currentHour24 > 12 ? currentHour24 - 12 : 
                                             currentHour24;
                        let hour24;
                        if (value === 'AM') {
                          hour24 = currentHour12 === 12 ? 0 : currentHour12;
                        } else {
                          hour24 = currentHour12 === 12 ? 12 : currentHour12 + 12;
                        }
                        // Restrict to 6am-9pm range
                        if (hour24 >= 6 && hour24 <= 21) {
                          setMassUpdateData(prev => ({ ...prev, bookingOpenHour: hour24.toString() }));
                        }
                      }
                    }}
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue placeholder="AM/PM" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="keep-existing">Keep existing</SelectItem>
                      <SelectItem value="AM">AM</SelectItem>
                      <SelectItem value="PM">PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
              <Button 
                variant="outline" 
                onClick={() => setShowMassUpdateModal(false)}
                className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleMassUpdate}
                disabled={massUpdating}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {massUpdating ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Updating...
                  </>
                ) : (
                  `Update ${selectedSessions.size} Sessions`
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}