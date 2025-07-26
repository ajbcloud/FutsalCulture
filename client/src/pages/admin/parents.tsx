import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin-layout';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Edit, Trash2, Users, UserCheck, UserX, ChevronDown, ChevronRight, X } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { adminParents, adminPlayers } from '../../lib/adminApi';
import { useLocation } from 'wouter';

export default function AdminParents() {
  const [parents, setParents] = useState<any[]>([]);
  const [filteredParents, setFilteredParents] = useState<any[]>([]);
  const [expandedParentIds, setExpandedParentIds] = useState<Set<string>>(new Set());
  const [parentPlayers, setParentPlayers] = useState<{[key: string]: any[]}>({});
  const [loadingPlayers, setLoadingPlayers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedParent, setSelectedParent] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    isAdmin: false,
    isAssistant: false
  });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    role: ''
  });
  const [urlFilter, setUrlFilter] = useState<string | null>(null);
  const { toast } = useToast();
  const [location] = useLocation();

  const loadParents = async (filterParams?: { filter?: string; parentId?: string }) => {
    try {
      const params = new URLSearchParams();
      if (filterParams?.filter) params.append('filter', filterParams.filter);
      if (filterParams?.parentId) params.append('parentId', filterParams.parentId);
      
      const queryString = params.toString();
      const url = queryString ? `/api/admin/parents?${queryString}` : '/api/admin/parents';
      
      const response = await fetch(url);
      const data = await response.json();
      console.log('admin parents:', data);
      
      // Handle error response
      if (data.error) {
        console.error('Server error:', data.error);
        setParents([]);
        setFilteredParents([]);
        setLoading(false);
        return;
      }
      
      // Ensure data is an array
      const parentsArray = Array.isArray(data) ? data : [];
      setParents(parentsArray);
      setFilteredParents(parentsArray);
      
      // If we have player data, populate it
      if (filterParams?.parentId && parentsArray.length > 0 && parentsArray[0].players) {
        setParentPlayers(prev => ({
          ...prev,
          [filterParams.parentId!]: parentsArray[0].players
        }));
        setExpandedParentIds(new Set([filterParams.parentId]));
      }
      
      // Special handling for parentId filtering - ensure immediate display
      if (filterParams?.parentId && parentsArray.length > 0) {
        setFilteredParents(parentsArray);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching parents:', error);
      setParents([]);
      setFilteredParents([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check for URL filter parameters
    const urlParams = new URLSearchParams(window.location.search);
    const filterParam = urlParams.get('filter');
    const parentIdParam = urlParams.get('parentId');
    
    if (filterParam || parentIdParam) {
      const decodedFilter = filterParam ? decodeURIComponent(filterParam) : undefined;
      setUrlFilter(decodedFilter || null);
      if (decodedFilter) {
        setFilters(prev => ({
          ...prev,
          search: decodedFilter
        }));
      }
      
      loadParents({ 
        filter: decodedFilter, 
        parentId: parentIdParam || undefined 
      });
    } else {
      loadParents();
    }
  }, []);

  useEffect(() => {
    // If we have a URL filter (from clicking parent name), don't apply client-side filtering
    // The server has already done the filtering
    if (urlFilter) {
      setFilteredParents(parents);
      return;
    }

    // Only apply client-side filtering when there's no URL filter
    let filtered = parents.filter((parent: any) => {
      const matchesSearch = !filters.search || 
        parent.firstName.toLowerCase().includes(filters.search.toLowerCase()) ||
        parent.lastName.toLowerCase().includes(filters.search.toLowerCase()) ||
        parent.email.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesStatus = !filters.status || filters.status === 'all' ||
        (filters.status === 'active' && parent.playersCount > 0) ||
        (filters.status === 'inactive' && parent.playersCount === 0);
      
      const matchesRole = !filters.role || filters.role === 'all' ||
        (filters.role === 'admin' && parent.isAdmin) ||
        (filters.role === 'assistant' && parent.isAssistant) ||
        (filters.role === 'parent' && !parent.isAdmin && !parent.isAssistant);
      
      return matchesSearch && matchesStatus && matchesRole;
    });
    setFilteredParents(filtered);
  }, [parents, filters, urlFilter]);

  const handleEdit = (parent: any) => {
    setSelectedParent(parent);
    setEditForm({
      firstName: parent.firstName,
      lastName: parent.lastName,
      email: parent.email,
      phone: parent.phone || '',
      isAdmin: parent.isAdmin,
      isAssistant: parent.isAssistant
    });
    setShowEditModal(true);
  };

  const handleSave = async () => {
    try {
      await adminParents.update(selectedParent?.id, editForm);
      toast({ title: "Parent updated successfully" });
      setShowEditModal(false);
      loadParents();
    } catch (error) {
      console.error('Error updating parent:', error);
      toast({ title: "Error updating parent", variant: "destructive" });
    }
  };

  const handleDelete = async (parentId: string) => {
    if (confirm('Are you sure you want to delete this parent account? This will also remove all associated players.')) {
      try {
        await adminParents.delete(parentId);
        toast({ title: "Parent deleted successfully" });
        loadParents();
      } catch (error) {
        console.error('Error deleting parent:', error);
        toast({ title: "Error deleting parent", variant: "destructive" });
      }
    }
  };

  const loadPlayersForParent = async (parentId: string) => {
    if (parentPlayers[parentId] || loadingPlayers.has(parentId)) {
      return; // Already loaded or loading
    }

    setLoadingPlayers(prev => new Set(prev).add(parentId));

    try {
      const allPlayers = await adminPlayers.list();
      const parentPlayersList = allPlayers.filter((player: any) => player.parentId === parentId);
      setParentPlayers(prev => ({
        ...prev,
        [parentId]: parentPlayersList
      }));
    } catch (error) {
      console.error('Error loading players for parent:', error);
      setParentPlayers(prev => ({
        ...prev,
        [parentId]: []
      }));
    } finally {
      setLoadingPlayers(prev => {
        const next = new Set(prev);
        next.delete(parentId);
        return next;
      });
    }
  };

  const getRoleDisplay = (parent: any) => {
    if (parent.isAdmin) return <Badge className="bg-red-900 text-red-300">Admin</Badge>;
    if (parent.isAssistant) return <Badge className="bg-blue-900 text-blue-300">Assistant</Badge>;
    return <Badge variant="secondary" className="bg-zinc-700 text-zinc-300">Parent</Badge>;
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
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white">Parents Management</h1>
            {urlFilter && (
              <div className="flex items-center gap-2 bg-blue-900/30 border border-blue-700 rounded-lg px-3 py-1">
                <span className="text-sm text-blue-300">Filtered by:</span>
                <span className="text-sm text-white font-medium">{urlFilter}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 text-blue-300 hover:text-white"
                  onClick={() => {
                    setUrlFilter(null);
                    setFilters(prev => ({ ...prev, search: '' }));
                    window.history.replaceState({}, '', '/admin/parents');
                    loadParents(); // Reload all parents when clearing filter
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
          <div className="text-sm text-zinc-400">
            Total: {parents.length} accounts
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-zinc-300">Total Parents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{parents.length}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-zinc-300">Active Parents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {parents.filter((p: any) => p.playersCount > 0).length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-zinc-300">Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">
                {parents.filter((p: any) => p.isAdmin).length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-zinc-300">Total Players</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">
                {parents.reduce((sum: number, p: any) => sum + (p.playersCount || 0), 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Controls */}
        <div className="bg-zinc-900 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label className="text-zinc-300">Search</Label>
              <Input
                placeholder="Search parents..."
                value={filters.search}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilters(prev => ({ ...prev, search: value }));
                  // Clear URL filter when manually searching
                  if (urlFilter && value !== urlFilter) {
                    setUrlFilter(null);
                    window.history.replaceState({}, '', '/admin/parents');
                  }
                }}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            
            <div>
              <Label className="text-zinc-300">Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active (has players)</SelectItem>
                  <SelectItem value="inactive">Inactive (no players)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-zinc-300">Role</Label>
              <Select value={filters.role} onValueChange={(value) => setFilters(prev => ({ ...prev, role: value }))}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                  <SelectItem value="assistant">Assistants</SelectItem>
                  <SelectItem value="parent">Parents</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Parents Table */}
        <div className="bg-zinc-900 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800">
                <TableHead className="text-zinc-300">Name</TableHead>
                <TableHead className="text-zinc-300">Email</TableHead>
                <TableHead className="text-zinc-300">Phone</TableHead>
                <TableHead className="text-zinc-300">Role</TableHead>
                <TableHead className="text-zinc-300">Players</TableHead>
                <TableHead className="text-zinc-300">Last Activity</TableHead>
                <TableHead className="text-zinc-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParents.map((parent: any) => {
                const isExpanded = expandedParentIds.has(parent.id);
                return (
                  <React.Fragment key={parent.id}>
                    <TableRow className="border-zinc-800">
                      <TableCell className="text-white">
                        {parent.firstName} {parent.lastName}
                      </TableCell>
                      <TableCell className="text-zinc-300">{parent.email}</TableCell>
                      <TableCell className="text-zinc-300">{parent.phone || '-'}</TableCell>
                      <TableCell>{getRoleDisplay(parent)}</TableCell>
                      <TableCell className="text-zinc-300">
                        <button
                          onClick={() => {
                            const nextExpanded = new Set(expandedParentIds);
                            if (isExpanded) {
                              nextExpanded.delete(parent.id);
                            } else {
                              nextExpanded.add(parent.id);
                              // Load players when expanding
                              loadPlayersForParent(parent.id);
                            }
                            setExpandedParentIds(nextExpanded);
                          }}
                          className="flex items-center gap-1 p-1 hover:bg-zinc-700 rounded"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-green-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-zinc-400" />
                          )}
                          <Users className="w-4 h-4" />
                          {parent.playersCount || 0}
                        </button>
                      </TableCell>
                      <TableCell className="text-zinc-300">
                        {parent.lastLogin ? new Date(parent.lastLogin).toLocaleDateString() : 'Never'}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEdit(parent)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDelete(parent.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    {isExpanded && (
                      <TableRow className="bg-zinc-900">
                        <TableCell colSpan={7} className="px-8 py-2">
                          <div className="text-sm text-zinc-400">
                            {loadingPlayers.has(parent.id) ? (
                              <div className="space-y-1">
                                <p className="font-medium text-zinc-300">Players:</p>
                                <p className="text-zinc-500">Loading player details...</p>
                              </div>
                            ) : parentPlayers[parent.id] && parentPlayers[parent.id].length > 0 ? (
                              <div className="space-y-2">
                                <p className="font-medium text-zinc-300">Players:</p>
                                {parentPlayers[parent.id].map((player: any) => (
                                  <div key={player.id} className="flex justify-between items-center bg-zinc-800 p-2 rounded">
                                    <div>
                                      <span className="text-white font-medium">
                                        {player.firstName} {player.lastName}
                                      </span>
                                      <span className="text-zinc-400 ml-2">
                                        ({player.ageGroup}, {player.gender})
                                      </span>
                                      {player.canAccessPortal && (
                                        <Badge className="ml-2 bg-green-900 text-green-300 text-xs">Portal Access</Badge>
                                      )}
                                    </div>
                                    <div className="text-right text-xs text-zinc-400">
                                      {player.signupCount || 0} bookings
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-zinc-500">No players registered</p>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
              {filteredParents.length === 0 && (
                <TableRow className="border-zinc-800">
                  <TableCell colSpan={7} className="text-center text-zinc-400 py-8">
                    No parents found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Parent Account</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-zinc-300">First Name</Label>
                <Input
                  id="firstName"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-zinc-300">Last Name</Label>
                <Input
                  id="lastName"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-zinc-300">Email</Label>
              <Input
                id="email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            <div>
              <Label htmlFor="phone" className="text-zinc-300">Phone</Label>
              <Input
                id="phone"
                value={editForm.phone}
                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Permissions</Label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 text-zinc-300">
                  <input
                    type="checkbox"
                    checked={editForm.isAdmin}
                    onChange={(e) => setEditForm(prev => ({ ...prev, isAdmin: e.target.checked }))}
                    className="rounded border-zinc-700"
                  />
                  <span>Admin Access</span>
                </label>
                <label className="flex items-center space-x-2 text-zinc-300">
                  <input
                    type="checkbox"
                    checked={editForm.isAssistant}
                    onChange={(e) => setEditForm(prev => ({ ...prev, isAssistant: e.target.checked }))}
                    className="rounded border-zinc-700"
                  />
                  <span>Assistant Access</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}