import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin-layout';
import { adminPlayers } from '@/lib/adminApi';
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
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Textarea } from '../../components/ui/textarea';
import { useToast } from '../../hooks/use-toast';
import { Upload, Download, Edit, Users, UserCheck, Activity, Target } from 'lucide-react';
import { format } from 'date-fns';
import { Link, useLocation } from 'wouter';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { AGE_GROUPS, calculateAgeGroupFromAge } from '@shared/constants';
import { Pagination } from '@/components/pagination';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export default function AdminPlayers() {
  const [players, setPlayers] = useState<any[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<any[]>([]);
  const [paginatedPlayers, setPaginatedPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    birthYear: new Date().getFullYear(),
    gender: 'boys' as 'boys' | 'girls',
    soccerClub: '',
    canAccessPortal: false,
    canBookAndPay: false,
    email: '',
    phoneNumber: ''
  });
  const [filters, setFilters] = useState({
    ageGroup: '',
    gender: '',
    portalAccess: '',
    soccerClub: '',
    search: ''
  });
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  const { toast } = useToast();
  const [location] = useLocation();

  // Check for URL parameters on load and when location changes
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchTerm = urlParams.get('search');
    const playerId = urlParams.get('playerId');
    
    console.log('Players page URL params:', { searchTerm, playerId });
    
    // Load players first, then apply filters
    loadPlayers(searchTerm, playerId);
  }, [location]); // Re-run when location changes

  const loadPlayers = async (searchTerm?: string | null, playerId?: string | null) => {
    try {
      setLoading(true);
      
      const data = await adminPlayers.list();
      console.log('admin players:', data);
      
      setPlayers(data);
      
      // Update filters state if we have URL parameters
      if (searchTerm) {
        setFilters(prev => ({ ...prev, search: searchTerm }));
      }
      
      // Don't pre-filter here - let the main filtering useEffect handle it
      setFilteredPlayers(data);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading players:', error);
      setLoading(false);
    }
  };

  // Calculate player statistics
  const calculatePlayerStats = () => {
    const totalPlayers = players.length;
    const activePortalUsers = players.filter(p => p.canAccessPortal).length;
    const ageGroups = players.reduce((acc, player) => {
      const age = new Date().getFullYear() - player.birthYear;
      const ageGroup = calculateAgeGroupFromAge(age);
      acc[ageGroup] = (acc[ageGroup] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const mostPopularAgeGroup = Object.entries(ageGroups).reduce((a, b) => 
      ageGroups[a[0]] > ageGroups[b[0]] ? a : b, ['', 0])[0] || 'N/A';
    const genderSplit = players.reduce((acc, player) => {
      acc[player.gender] = (acc[player.gender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalPlayers,
      activePortalUsers,
      mostPopularAgeGroup,
      boysCount: genderSplit.boys || 0,
      girlsCount: genderSplit.girls || 0,
      canBookAndPay: players.filter(p => p.canBookAndPay).length
    };
  };

  const playerStats = calculatePlayerStats();

  // This useEffect is no longer needed since the one above handles all cases

  // This useEffect is also no longer needed since filtering is handled above

  useEffect(() => {
    let filtered = players.filter((player: any) => {
      const age = new Date().getFullYear() - player.birthYear;
      const ageGroup = calculateAgeGroupFromAge(age);
      
      const matchesAgeGroup = !filters.ageGroup || filters.ageGroup === 'all' || ageGroup === filters.ageGroup;
      const matchesGender = !filters.gender || filters.gender === 'all' || player.gender === filters.gender;
      const matchesPortalAccess = !filters.portalAccess || filters.portalAccess === 'all' ||
        (filters.portalAccess === 'enabled' && player.canAccessPortal) ||
        (filters.portalAccess === 'disabled' && !player.canAccessPortal);
      const matchesSoccerClub = !filters.soccerClub || filters.soccerClub === 'all' || 
        (player.soccerClub && player.soccerClub.toLowerCase().includes(filters.soccerClub.toLowerCase()));
      const matchesSearch = !filters.search || 
        player.firstName.toLowerCase().includes(filters.search.toLowerCase()) ||
        player.lastName.toLowerCase().includes(filters.search.toLowerCase()) ||
        `${player.firstName} ${player.lastName}`.toLowerCase().includes(filters.search.toLowerCase());
      

      
      return matchesAgeGroup && matchesGender && matchesPortalAccess && matchesSoccerClub && matchesSearch;
    });
    

    setFilteredPlayers(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [players, filters]);

  // Apply pagination whenever filtered players or pagination settings change
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedPlayers(filteredPlayers.slice(startIndex, endIndex));
  }, [filteredPlayers, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
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
      
      const response = await fetch('/api/admin/imports/players', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (response.ok) {
        toast({ title: `Successfully imported ${result.imported} players` });
        setShowImportModal(false);
        // Refresh players list
        adminPlayers.list().then(setPlayers);
      } else {
        toast({ title: result.message || "Import failed", variant: "destructive" });
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({ title: "Import failed", variant: "destructive" });
    }
    setImporting(false);
  };

  const handleEditPlayer = (player: any) => {
    setEditingPlayer(player);
    setEditForm({
      firstName: player.firstName || '',
      lastName: player.lastName || '',
      birthYear: player.birthYear || new Date().getFullYear(),
      gender: player.gender || 'boys',
      soccerClub: player.soccerClub || '',
      canAccessPortal: player.canAccessPortal || false,
      canBookAndPay: player.canBookAndPay || false,
      email: player.email || '',
      phoneNumber: player.phoneNumber || ''
    });
    setShowEditModal(true);
  };

  const handleUpdatePlayer = async () => {
    if (!editingPlayer) return;

    try {
      setImporting(true); // Reuse importing state for loading
      
      const response = await fetch(`/api/admin/players/${editingPlayer.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        throw new Error('Failed to update player');
      }

      const updatedPlayer = await response.json();

      // Update the player in the local state
      setPlayers(prev => prev.map(p => p.id === editingPlayer.id ? updatedPlayer : p));
      
      setShowEditModal(false);
      setEditingPlayer(null);
      
      toast({
        title: "Success",
        description: "Player updated successfully",
      });
    } catch (error) {
      console.error('Error updating player:', error);
      toast({
        title: "Error",
        description: "Failed to update player",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Player Management</h1>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Button 
            variant="outline" 
            onClick={() => window.open('/api/admin/template/players', '_blank')}
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
        </div>
      </div>

      {/* Player Statistics KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Players</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{playerStats.totalPlayers}</div>
            <p className="text-xs text-muted-foreground">
              {playerStats.boysCount} boys, {playerStats.girlsCount} girls
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Portal Access</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{playerStats.activePortalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {playerStats.totalPlayers > 0 ? Math.round((playerStats.activePortalUsers / playerStats.totalPlayers) * 100) : 0}% of players
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Most Popular Age</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{playerStats.mostPopularAgeGroup}</div>
            <p className="text-xs text-muted-foreground">
              Primary age group
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Can Book & Pay</CardTitle>
            <Activity className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{playerStats.canBookAndPay}</div>
            <p className="text-xs text-muted-foreground">
              Booking privileges enabled
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Controls */}
      <div className="bg-card rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
          <div>
            <Label className="text-muted-foreground">Search</Label>
            <Input
              placeholder="Search players..."
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
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-muted-foreground">Portal Access</Label>
            <Select value={filters.portalAccess} onValueChange={(value) => setFilters(prev => ({ ...prev, portalAccess: value }))}>
              <SelectTrigger className="bg-input border-border text-foreground">
                <SelectValue placeholder="All Players" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Players</SelectItem>
                <SelectItem value="enabled">Portal Enabled</SelectItem>
                <SelectItem value="disabled">Portal Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-muted-foreground">Soccer Club</Label>
            <Input
              placeholder="Filter by club..."
              value={filters.soccerClub}
              onChange={(e) => setFilters(prev => ({ ...prev, soccerClub: e.target.value }))}
              className="bg-input border-border text-foreground"
            />
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-card rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="text-muted-foreground">Player Name</TableHead>
              <TableHead className="text-muted-foreground">Age</TableHead>
              <TableHead className="text-muted-foreground">Gender</TableHead>
              <TableHead className="text-muted-foreground">Soccer Club</TableHead>
              <TableHead className="text-muted-foreground">Parent 1</TableHead>
              <TableHead className="text-muted-foreground">Parent 2</TableHead>
              <TableHead className="text-muted-foreground">Portal Access</TableHead>
              <TableHead className="text-muted-foreground">Sessions</TableHead>
              <TableHead className="text-muted-foreground">Last Activity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedPlayers.map((player: any) => (
              <TableRow key={player.id} className="border-border">
                <TableCell className="text-foreground">
                  <button
                    onClick={() => handleEditPlayer(player)}
                    className="text-blue-400 hover:text-blue-300 cursor-pointer underline bg-transparent border-none p-0 font-inherit"
                  >
                    {player.firstName} {player.lastName}
                  </button>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date().getFullYear() - player.birthYear}
                </TableCell>
                <TableCell className="text-muted-foreground">{player.gender}</TableCell>
                <TableCell className="text-muted-foreground">
                  {player.soccerClub || <span className="text-muted-foreground/60 italic">No club</span>}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {player.parentName ? (
                    <Link href={`/admin/parents?filter=${encodeURIComponent(player.parentName)}&parentId=${player.parentId}`}>
                      <span className="text-blue-400 hover:text-blue-300 cursor-pointer underline">
                        {player.parentName}
                      </span>
                    </Link>
                  ) : (
                    <span className="text-muted-foreground/60">—</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {player.parent2Name ? (
                    <Link href={`/admin/parents?filter=${encodeURIComponent(player.parent2Name)}&parentId=${player.parent2Id}`}>
                      <span className="text-blue-400 hover:text-blue-300 cursor-pointer underline">
                        {player.parent2Name}
                      </span>
                    </Link>
                  ) : (
                    <span className="text-muted-foreground/60">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={player.canAccessPortal ? "default" : "secondary"}
                    className={player.canAccessPortal ? "bg-green-900 text-green-300" : "bg-muted text-muted-foreground"}
                  >
                    {player.canAccessPortal ? 'Enabled' : 'Disabled'}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {player.signupsCount || 0}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {player.lastActivity ? format(new Date(player.lastActivity), 'MMM d, yyyy') : 'Never'}
                </TableCell>
              </TableRow>
            ))}
            {paginatedPlayers.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  {filteredPlayers.length === 0 ? 'No players found' : 'No players on this page'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {paginatedPlayers.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 bg-card rounded-lg">
            {filteredPlayers.length === 0 ? 'No players found' : 'No players on this page'}
          </div>
        ) : (
          paginatedPlayers.map((player: any) => (
            <div key={player.id} className="bg-card rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => handleEditPlayer(player)}
                    className="text-blue-400 hover:text-blue-300 cursor-pointer underline bg-transparent border-none p-0 font-inherit text-left"
                  >
                    <h3 className="font-bold text-white text-lg truncate">
                      {player.firstName} {player.lastName}
                    </h3>
                  </button>
                  <p className="text-muted-foreground text-sm">
                    {new Date().getFullYear() - player.birthYear} years • {player.gender}
                  </p>
                </div>
                <Badge 
                  variant={player.canAccessPortal ? "default" : "secondary"}
                  className={`shrink-0 text-xs ${player.canAccessPortal ? "bg-green-900 text-green-300" : "bg-muted text-muted-foreground"}`}
                >
                  {player.canAccessPortal ? 'Portal' : 'No Portal'}
                </Badge>
              </div>

              <div className="space-y-2">
                {player.soccerClub && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Club:</span>
                    <span className="text-foreground">{player.soccerClub}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Sessions:</span>
                  <span className="text-foreground">{player.signupsCount || 0}</span>
                </div>

                {player.parentName && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Parent:</span>
                    <Link href={`/admin/parents?filter=${encodeURIComponent(player.parentName)}&parentId=${player.parentId}`}>
                      <span className="text-blue-400 hover:text-blue-300 cursor-pointer underline max-w-32 truncate inline-block">
                        {player.parentName}
                      </span>
                    </Link>
                  </div>
                )}

                {player.parent2Name && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Parent 2:</span>
                    <Link href={`/admin/parents?filter=${encodeURIComponent(player.parent2Name)}&parentId=${player.parent2Id}`}>
                      <span className="text-blue-400 hover:text-blue-300 cursor-pointer underline max-w-32 truncate inline-block">
                        {player.parent2Name}
                      </span>
                    </Link>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Last Activity:</span>
                  <span className="text-foreground">
                    {player.lastActivity ? format(new Date(player.lastActivity), 'MMM d') : 'Never'}
                  </span>
                </div>
              </div>

              <div className="flex justify-end mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEditPlayer(player)}
                  className="text-xs px-3 py-1 h-7"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom Pagination */}
      {filteredPlayers.length > 0 && (
        <Pagination
          totalItems={filteredPlayers.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          className="bg-card p-4 rounded-lg border border-border"
        />
      )}

      {/* Import Modal */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-white">Import Players from CSV</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="csvFile" className="text-muted-foreground">
                Select CSV File
              </Label>
              <Input
                id="csvFile"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={importing}
                className="bg-input border-border text-foreground"
              />
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>CSV should include headers: firstName, lastName, birthYear, gender, parentEmail, parentPhone, canAccessPortal, canBookAndPay</p>
              <Button 
                variant="link" 
                onClick={() => window.open('/api/admin/template/players', '_blank')}
                className="p-0 h-auto text-blue-400 hover:text-blue-300"
              >
                Download template
              </Button>
            </div>

            {importing && (
              <div className="flex items-center space-x-2 text-muted-foreground">
                <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                <span>Importing players...</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Player Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">
              Edit Player: {editingPlayer?.firstName} {editingPlayer?.lastName}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-muted-foreground">First Name</Label>
                <Input
                  id="firstName"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                  className="bg-input border-border text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-muted-foreground">Last Name</Label>
                <Input
                  id="lastName"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                  className="bg-input border-border text-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="birthYear" className="text-muted-foreground">Birth Year</Label>
                <Input
                  id="birthYear"
                  type="number"
                  min="2005"
                  max="2018"
                  value={editForm.birthYear}
                  onChange={(e) => setEditForm(prev => ({ ...prev, birthYear: parseInt(e.target.value) || new Date().getFullYear() }))}
                  className="bg-input border-border text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="gender" className="text-muted-foreground">Gender</Label>
                <Select value={editForm.gender} onValueChange={(value: 'boys' | 'girls') => setEditForm(prev => ({ ...prev, gender: value }))}>
                  <SelectTrigger className="bg-input border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="boys">Boys</SelectItem>
                    <SelectItem value="girls">Girls</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="soccerClub" className="text-muted-foreground">Soccer Club</Label>
              <Input
                id="soccerClub"
                value={editForm.soccerClub}
                onChange={(e) => setEditForm(prev => ({ ...prev, soccerClub: e.target.value }))}
                placeholder="Enter soccer club name"
                className="bg-input border-border text-foreground"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email" className="text-muted-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="player@example.com"
                  className="bg-input border-border text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="phoneNumber" className="text-muted-foreground">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  value={editForm.phoneNumber}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  placeholder="555-123-4567"
                  className="bg-input border-border text-foreground"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-card rounded-lg">
                <div>
                  <Label className="text-muted-foreground">Portal Access</Label>
                  <p className="text-sm text-muted-foreground">Allow player to access their own portal (age 13+)</p>
                </div>
                <Switch
                  checked={editForm.canAccessPortal}
                  onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, canAccessPortal: checked }))}
                  disabled={new Date().getFullYear() - editForm.birthYear < 13}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-card rounded-lg">
                <div>
                  <Label className="text-muted-foreground">Booking & Payment</Label>
                  <p className="text-sm text-muted-foreground">Allow player to book sessions and make payments</p>
                </div>
                <Switch
                  checked={editForm.canBookAndPay}
                  onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, canBookAndPay: checked }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowEditModal(false)}
                disabled={importing}
                className="border-border text-muted-foreground hover:bg-muted"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdatePlayer}
                disabled={importing}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {importing ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Updating...
                  </>
                ) : (
                  'Update Player'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}