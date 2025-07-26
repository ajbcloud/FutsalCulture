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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useToast } from '../../hooks/use-toast';
import { Upload, Download } from 'lucide-react';
import { format } from 'date-fns';
import { Link, useLocation } from 'wouter';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { AGE_GROUPS, calculateAgeGroupFromAge } from '@shared/constants';

export default function AdminPlayers() {
  const [players, setPlayers] = useState<any[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [filters, setFilters] = useState({
    ageGroup: '',
    gender: '',
    portalAccess: '',
    search: ''
  });
  const { toast } = useToast();
  const [location] = useLocation();

  // Check for URL parameters on load
  useEffect(() => {
    const urlParams = new URLSearchParams(location.split('?')[1] || '');
    const playerId = urlParams.get('playerId');
    
    console.log('URL location:', location);
    console.log('Player ID from URL:', playerId);
    console.log('Players loaded:', players.length);
    
    if (playerId && players.length > 0) {
      // Find the player and set filters to show only that player
      const targetPlayer = players.find(p => p.id === playerId);
      console.log('Target player found:', targetPlayer);
      
      if (targetPlayer) {
        const playerName = `${targetPlayer.firstName} ${targetPlayer.lastName}`;
        console.log('Setting search filter to:', playerName);
        
        setFilters(prev => ({
          ...prev,
          search: playerName
        }));
      }
    }
  }, [location, players]);

  useEffect(() => {
    adminPlayers.list().then(data => {
      console.log('admin players:', data);
      
      // Handle error response
      if (data.message && data.message.includes('Failed')) {
        console.error('Server error:', data.message);
        setPlayers([]);
        setFilteredPlayers([]);
        setLoading(false);
        return;
      }
      
      // Ensure data is an array
      const playersArray = Array.isArray(data) ? data : [];
      setPlayers(playersArray);
      setFilteredPlayers(playersArray);
      setLoading(false);
    }).catch(err => {
      console.error('Error fetching players:', err);
      setPlayers([]);
      setFilteredPlayers([]);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let filtered = players.filter((player: any) => {
      const age = new Date().getFullYear() - player.birthYear;
      const ageGroup = calculateAgeGroupFromAge(age);
      
      const matchesAgeGroup = !filters.ageGroup || filters.ageGroup === 'all' || ageGroup === filters.ageGroup;
      const matchesGender = !filters.gender || filters.gender === 'all' || player.gender === filters.gender;
      const matchesPortalAccess = !filters.portalAccess || filters.portalAccess === 'all' ||
        (filters.portalAccess === 'enabled' && player.canAccessPortal) ||
        (filters.portalAccess === 'disabled' && !player.canAccessPortal);
      const matchesSearch = !filters.search || 
        player.firstName.toLowerCase().includes(filters.search.toLowerCase()) ||
        player.lastName.toLowerCase().includes(filters.search.toLowerCase());
      
      return matchesAgeGroup && matchesGender && matchesPortalAccess && matchesSearch;
    });
    setFilteredPlayers(filtered);
  }, [players, filters]);

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
        </div>
      </div>

      <div className="bg-zinc-900 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800">
              <TableHead className="text-zinc-300">Player Name</TableHead>
              <TableHead className="text-zinc-300">Age</TableHead>
              <TableHead className="text-zinc-300">Gender</TableHead>
              <TableHead className="text-zinc-300">Parent 1</TableHead>
              <TableHead className="text-zinc-300">Parent 2</TableHead>
              <TableHead className="text-zinc-300">Portal Access</TableHead>
              <TableHead className="text-zinc-300">Sessions</TableHead>
              <TableHead className="text-zinc-300">Last Activity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPlayers.map((player: any) => (
              <TableRow key={player.id} className="border-zinc-800">
                <TableCell className="text-white">
                  <Link href={`/admin/players?playerId=${player.id}`}>
                    <span className="text-blue-400 hover:text-blue-300 cursor-pointer underline">
                      {player.firstName} {player.lastName}
                    </span>
                  </Link>
                </TableCell>
                <TableCell className="text-zinc-300">
                  {new Date().getFullYear() - player.birthYear}
                </TableCell>
                <TableCell className="text-zinc-300">{player.gender}</TableCell>
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
            {filteredPlayers.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-zinc-400 py-8">
                  No players found
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
    </AdminLayout>
  );
}