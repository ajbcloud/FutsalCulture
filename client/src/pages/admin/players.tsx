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

export default function AdminPlayers() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    adminPlayers.list().then(data => {
      console.log('admin players:', data);
      setPlayers(data);
      setLoading(false);
    }).catch(err => {
      console.error('Error fetching players:', err);
      setLoading(false);
    });
  }, []);

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

      <div className="bg-zinc-900 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800">
              <TableHead className="text-zinc-300">Player Name</TableHead>
              <TableHead className="text-zinc-300">Age</TableHead>
              <TableHead className="text-zinc-300">Gender</TableHead>
              <TableHead className="text-zinc-300">Parent</TableHead>
              <TableHead className="text-zinc-300">Portal Access</TableHead>
              <TableHead className="text-zinc-300">Sessions</TableHead>
              <TableHead className="text-zinc-300">Last Activity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.map((player: any) => (
              <TableRow key={player.id} className="border-zinc-800">
                <TableCell className="text-white">
                  {player.firstName} {player.lastName}
                </TableCell>
                <TableCell className="text-zinc-300">
                  {new Date().getFullYear() - player.birthYear}
                </TableCell>
                <TableCell className="text-zinc-300">{player.gender}</TableCell>
                <TableCell className="text-zinc-300">
                  {player.parentName || 'Unknown'}
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
            {players.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-zinc-400 py-8">
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