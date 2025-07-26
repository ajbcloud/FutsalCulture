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
import { format } from 'date-fns';

export default function AdminPlayers() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

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
      <h1 className="text-2xl font-bold text-white mb-6">Player Management</h1>

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
    </AdminLayout>
  );
}