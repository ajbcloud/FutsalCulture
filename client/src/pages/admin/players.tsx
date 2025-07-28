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
import { Upload, Download } from 'lucide-react';
import { format } from 'date-fns';
import { Link, useLocation } from 'wouter';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { AGE_GROUPS, calculateAgeGroupFromAge } from '@shared/constants';
import { Pagination } from '@/components/pagination';

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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Player Management</h1>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => window.open('/api/admin/template/players', '_blank')}
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
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-zinc-900 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <Label className="text-zinc-300">Search</Label>
            <Input
              placeholder="Search players..."
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
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-zinc-300">Portal Access</Label>
            <Select value={filters.portalAccess} onValueChange={(value) => setFilters(prev => ({ ...prev, portalAccess: value }))}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
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
            <Label className="text-zinc-300">Soccer Club</Label>
            <Input
              placeholder="Filter by club..."
              value={filters.soccerClub}
              onChange={(e) => setFilters(prev => ({ ...prev, soccerClub: e.target.value }))}
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>
        </div>
      </div>

      {/* Top Pagination */}
      {filteredPlayers.length > 0 && (
        <Pagination
          totalItems={filteredPlayers.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          className="bg-zinc-900 p-4 rounded-lg border border-zinc-800"
        />
      )}

      <div className="bg-zinc-900 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800">
              <TableHead className="text-zinc-300">Player Name</TableHead>
              <TableHead className="text-zinc-300">Age</TableHead>
              <TableHead className="text-zinc-300">Gender</TableHead>
              <TableHead className="text-zinc-300">Soccer Club</TableHead>
              <TableHead className="text-zinc-300">Parent 1</TableHead>
              <TableHead className="text-zinc-300">Parent 2</TableHead>
              <TableHead className="text-zinc-300">Portal Access</TableHead>
              <TableHead className="text-zinc-300">Sessions</TableHead>
              <TableHead className="text-zinc-300">Last Activity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedPlayers.map((player: any) => (
              <TableRow key={player.id} className="border-zinc-800">
                <TableCell className="text-white">
                  <button
                    onClick={() => handleEditPlayer(player)}
                    className="text-blue-400 hover:text-blue-300 cursor-pointer underline bg-transparent border-none p-0 font-inherit"
                  >
                    {player.firstName} {player.lastName}
                  </button>
                </TableCell>
                <TableCell className="text-zinc-300">
                  {new Date().getFullYear() - player.birthYear}
                </TableCell>
                <TableCell className="text-zinc-300">{player.gender}</TableCell>
                <TableCell className="text-zinc-300">
                  {player.soccerClub || <span className="text-zinc-500 italic">No club</span>}
                </TableCell>
                <TableCell className="text-zinc-300">
                  {player.parentName ? (
                    <Link href={`/admin/parents?filter=${encodeURIComponent(player.parentName)}&parentId=${player.parentId}`}>
                      <span className="text-blue-400 hover:text-blue-300 cursor-pointer underline">
                        {player.parentName}
                      </span>
                    </Link>
                  ) : (
                    <span className="text-zinc-500">—</span>
                  )}
                </TableCell>
                <TableCell className="text-zinc-300">
                  {player.parent2Name ? (
                    <Link href={`/admin/parents?filter=${encodeURIComponent(player.parent2Name)}&parentId=${player.parent2Id}`}>
                      <span className="text-blue-400 hover:text-blue-300 cursor-pointer underline">
                        {player.parent2Name}
                      </span>
                    </Link>
                  ) : (
                    <span className="text-zinc-500">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={player.canAccessPortal ? "default" : "secondary"}
                    className={player.canAccessPortal ? "bg-green-900 text-green-300" : "bg-zinc-700 text-zinc-400"}
                  >
                    {player.canAccessPortal ? 'Enabled' : 'Disabled'}
                  </Badge>
                </TableCell>
                <TableCell className="text-zinc-300">
                  {player.signupsCount || 0}
                </TableCell>
                <TableCell className="text-zinc-300">
                  {player.lastActivity ? format(new Date(player.lastActivity), 'MMM d, yyyy') : 'Never'}
                </TableCell>
              </TableRow>
            ))}
            {paginatedPlayers.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-zinc-400 py-8">
                  {filteredPlayers.length === 0 ? 'No players found' : 'No players on this page'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Bottom Pagination */}
      {filteredPlayers.length > 0 && (
        <Pagination
          totalItems={filteredPlayers.length}
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
            <DialogTitle className="text-white">Import Players from CSV</DialogTitle>
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
              <div className="flex items-center space-x-2 text-zinc-300">
                <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                <span>Importing players...</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Player Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">
              Edit Player: {editingPlayer?.firstName} {editingPlayer?.lastName}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="birthYear" className="text-zinc-300">Birth Year</Label>
                <Input
                  id="birthYear"
                  type="number"
                  min="2005"
                  max="2018"
                  value={editForm.birthYear}
                  onChange={(e) => setEditForm(prev => ({ ...prev, birthYear: parseInt(e.target.value) || new Date().getFullYear() }))}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="gender" className="text-zinc-300">Gender</Label>
                <Select value={editForm.gender} onValueChange={(value: 'boys' | 'girls') => setEditForm(prev => ({ ...prev, gender: value }))}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
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
              <Label htmlFor="soccerClub" className="text-zinc-300">Soccer Club</Label>
              <Input
                id="soccerClub"
                value={editForm.soccerClub}
                onChange={(e) => setEditForm(prev => ({ ...prev, soccerClub: e.target.value }))}
                placeholder="Enter soccer club name"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email" className="text-zinc-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="player@example.com"
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="phoneNumber" className="text-zinc-300">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  value={editForm.phoneNumber}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  placeholder="555-123-4567"
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
                <div>
                  <Label className="text-zinc-300">Portal Access</Label>
                  <p className="text-sm text-zinc-400">Allow player to access their own portal (age 13+)</p>
                </div>
                <Switch
                  checked={editForm.canAccessPortal}
                  onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, canAccessPortal: checked }))}
                  disabled={new Date().getFullYear() - editForm.birthYear < 13}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
                <div>
                  <Label className="text-zinc-300">Booking & Payment</Label>
                  <p className="text-sm text-zinc-400">Allow player to book sessions and make payments</p>
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
                className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
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