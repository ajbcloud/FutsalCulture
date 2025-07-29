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
import { useLocation, Link } from 'wouter';
import { Pagination } from '../../components/pagination';

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
  const [paginatedParents, setPaginatedParents] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
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
    const searchParam = urlParams.get('search');
    const parentIdParam = urlParams.get('parentId');
    
    // Handle search parameter from recent activity clicks
    if (searchParam) {
      setFilters(prev => ({
        ...prev,
        search: searchParam
      }));
      setUrlFilter(searchParam);
    }
    
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
  }, [location]); // Re-run when location changes

  useEffect(() => {
    // Always apply client-side filtering based on current filter values
    let filtered = parents.filter((parent: any) => {
      const fullName = `${parent.firstName} ${parent.lastName}`.toLowerCase();
      const searchTerm = filters.search.toLowerCase();
      
      const matchesSearch = !filters.search || 
        parent.firstName.toLowerCase().includes(searchTerm) ||
        parent.lastName.toLowerCase().includes(searchTerm) ||
        parent.email.toLowerCase().includes(searchTerm) ||
        fullName.includes(searchTerm);
      
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
    setCurrentPage(1); // Reset to first page when filters change
  }, [parents, filters]);

  // Apply pagination whenever filtered parents or pagination settings change
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedParents(filteredParents.slice(startIndex, endIndex));
  }, [filteredParents, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

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
    return <Badge variant="secondary" className="bg-muted text-muted-foreground">Parent</Badge>;
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
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Parents Management</h1>
          <div className="text-sm text-muted-foreground">
            Total: {parents.length} accounts
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total Parents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{parents.length}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Active Parents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {parents.filter((p: any) => p.playersCount > 0).length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">
                {parents.filter((p: any) => p.isAdmin).length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total Players</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">
                {parents.reduce((sum: number, p: any) => sum + (p.playersCount || 0), 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Controls */}
        <div className="bg-card rounded-lg p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            <div>
              <Label className="text-muted-foreground">Search</Label>
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
                className="bg-input border-border text-foreground"
              />
            </div>
            
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger className="bg-input border-border text-foreground">
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
              <Label className="text-muted-foreground">Role</Label>
              <Select value={filters.role} onValueChange={(value) => setFilters(prev => ({ ...prev, role: value }))}>
                <SelectTrigger className="bg-input border-border text-foreground">
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

        {/* Desktop Table View */}
        <div className="hidden md:block bg-card rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-muted-foreground">Name</TableHead>
                <TableHead className="text-muted-foreground">Email</TableHead>
                <TableHead className="text-muted-foreground">Phone</TableHead>
                <TableHead className="text-muted-foreground">Role</TableHead>
                <TableHead className="text-muted-foreground">Players</TableHead>
                <TableHead className="text-muted-foreground">Last Activity</TableHead>
                <TableHead className="text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedParents.map((parent: any) => {
                const isExpanded = expandedParentIds.has(parent.id);
                return (
                  <React.Fragment key={parent.id}>
                    <TableRow className="border-border">
                      <TableCell className="text-foreground">
                        {parent.firstName} {parent.lastName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{parent.email}</TableCell>
                      <TableCell className="text-muted-foreground">{parent.phone || '-'}</TableCell>
                      <TableCell>{getRoleDisplay(parent)}</TableCell>
                      <TableCell className="text-muted-foreground">
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
                          className="flex items-center gap-1 p-1 hover:bg-muted rounded"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-green-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                          <Users className="w-4 h-4" />
                          {parent.playersCount || 0}
                        </button>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
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
                      <TableRow className="bg-muted/20">
                        <TableCell colSpan={7} className="px-8 py-2">
                          <div className="text-sm text-muted-foreground">
                            {loadingPlayers.has(parent.id) ? (
                              <div className="space-y-1">
                                <p className="font-medium text-foreground">Players:</p>
                                <p className="text-muted-foreground">Loading player details...</p>
                              </div>
                            ) : parentPlayers[parent.id] && parentPlayers[parent.id].length > 0 ? (
                              <div className="space-y-2">
                                <p className="font-medium text-foreground">Players:</p>
                                {parentPlayers[parent.id].map((player: any) => (
                                  <div key={player.id} className="flex justify-between items-center bg-card p-2 rounded">
                                    <div>
                                      <Link 
                                        href={`/admin/players?playerId=${player.id}`}
                                        className="text-white font-medium hover:text-blue-400 cursor-pointer underline"
                                      >
                                        {player.firstName} {player.lastName}
                                      </Link>
                                      <span className="text-muted-foreground ml-2">
                                        ({player.ageGroup}, {player.gender})
                                        {player.soccerClub && <span className="text-muted-foreground"> • {player.soccerClub}</span>}
                                      </span>
                                      {player.canAccessPortal && (
                                        <Badge className="ml-2 bg-green-900 text-green-300 text-xs">Portal Access</Badge>
                                      )}
                                    </div>
                                    <div className="text-right text-xs text-muted-foreground">
                                      {player.signupCount || 0} bookings
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-muted-foreground">No players registered</p>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
              {paginatedParents.length === 0 && (
                <TableRow className="border-zinc-800">
                  <TableCell colSpan={7} className="text-center text-zinc-400 py-8">
                    {filteredParents.length === 0 ? 'No parents found' : 'No parents on this page'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {paginatedParents.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 bg-card rounded-lg">
              {filteredParents.length === 0 ? 'No parents found' : 'No parents on this page'}
            </div>
          ) : (
            paginatedParents.map((parent: any) => {
              const isExpanded = expandedParentIds.has(parent.id);
              return (
                <div key={parent.id} className="bg-card rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-lg truncate">
                        {parent.firstName} {parent.lastName}
                      </h3>
                      <p className="text-muted-foreground text-sm truncate">{parent.email}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {getRoleDisplay(parent)}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {parent.phone && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Phone:</span>
                        <span className="text-foreground">{parent.phone}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Players:</span>
                      <button
                        onClick={() => {
                          const nextExpanded = new Set(expandedParentIds);
                          if (isExpanded) {
                            nextExpanded.delete(parent.id);
                          } else {
                            nextExpanded.add(parent.id);
                            loadPlayersForParent(parent.id);
                          }
                          setExpandedParentIds(nextExpanded);
                        }}
                        className="flex items-center gap-1 text-muted-foreground hover:text-blue-400"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3 h-3 text-green-400" />
                        ) : (
                          <ChevronRight className="w-3 h-3 text-muted-foreground" />
                        )}
                        <Users className="w-3 h-3" />
                        {parent.playersCount || 0}
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Last Login:</span>
                      <span className="text-foreground">
                        {parent.lastLogin ? new Date(parent.lastLogin).toLocaleDateString() : 'Never'}
                      </span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-border pt-3 mb-3">
                      {loadingPlayers.has(parent.id) ? (
                        <p className="text-zinc-500 text-sm">Loading player details...</p>
                      ) : parentPlayers[parent.id] && parentPlayers[parent.id].length > 0 ? (
                        <div className="space-y-2">
                          <p className="font-medium text-zinc-300 text-sm">Players:</p>
                          {parentPlayers[parent.id].map((player: any) => (
                            <div key={player.id} className="bg-zinc-900 p-2 rounded text-sm">
                              <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0">
                                  <Link 
                                    href={`/admin/players?playerId=${player.id}`}
                                    className="text-white font-medium hover:text-blue-400 cursor-pointer underline block truncate"
                                  >
                                    {player.firstName} {player.lastName}
                                  </Link>
                                  <p className="text-zinc-400 text-xs">
                                    {player.ageGroup} • {player.gender}
                                    {player.soccerClub && <span> • {player.soccerClub}</span>}
                                  </p>
                                  {player.canAccessPortal && (
                                    <Badge className="mt-1 bg-green-900 text-green-300 text-xs">Portal</Badge>
                                  )}
                                </div>
                                <div className="text-right text-xs text-zinc-400 shrink-0 ml-2">
                                  {player.signupCount || 0} bookings
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-zinc-500 text-sm">No players registered</p>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <div></div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(parent)}
                        className="text-xs px-3 py-1 h-7"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDelete(parent.id)}
                        className="text-red-400 hover:text-red-300 text-xs px-3 py-1 h-7"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Pagination */}
        {filteredParents.length > 0 && (
          <Pagination
            totalItems={filteredParents.length}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            className="bg-zinc-900 p-4 rounded-lg border border-zinc-800"
          />
        )}
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