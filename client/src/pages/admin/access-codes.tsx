import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '../../components/admin-layout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';
import { useToast } from '../../hooks/use-toast';
import { apiRequest } from '../../lib/queryClient';
import { Key, Lock, Unlock, Calendar, MapPin, Users, Clock, Edit2, Plus } from 'lucide-react';
import { format } from 'date-fns';

interface Session {
  id: string;
  title: string;
  location: string;
  ageGroups: string[];
  genders: string[];
  startTime: string;
  endTime: string;
  capacity: number;
  priceCents: number;
  hasAccessCode: boolean;
  accessCode: string | null;
  signupCount: number;
}

interface AccessCodeFormData {
  hasAccessCode: boolean;
  accessCode: string;
}

export default function AccessCodes() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [formData, setFormData] = useState<AccessCodeFormData>({
    hasAccessCode: false,
    accessCode: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all sessions
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['/api/admin/sessions-with-access-codes'],
    queryFn: async () => {
      const response = await fetch('/api/admin/sessions-with-access-codes');
      if (!response.ok) throw new Error('Failed to fetch sessions');
      return response.json();
    }
  });

  // Update session access code mutation
  const updateAccessCodeMutation = useMutation({
    mutationFn: async ({ sessionId, data }: { sessionId: string; data: AccessCodeFormData }) => {
      const response = await apiRequest('PUT', `/api/admin/sessions/${sessionId}/access-code`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sessions-with-access-codes'] });
      setEditingSession(null);
      toast({
        title: "Success",
        description: "Session access code updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update access code",
        variant: "destructive",
      });
    }
  });

  const handleEdit = (session: Session) => {
    setEditingSession(session);
    setFormData({
      hasAccessCode: session.hasAccessCode,
      accessCode: session.accessCode || ''
    });
  };

  const handleSave = () => {
    if (!editingSession) return;
    
    // If access code is enabled but no code provided, generate one
    if (formData.hasAccessCode && !formData.accessCode.trim()) {
      const generatedCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      setFormData(prev => ({ ...prev, accessCode: generatedCode }));
      updateAccessCodeMutation.mutate({
        sessionId: editingSession.id,
        data: { ...formData, accessCode: generatedCode }
      });
    } else {
      updateAccessCodeMutation.mutate({
        sessionId: editingSession.id,
        data: formData
      });
    }
  };

  const generateRandomCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setFormData(prev => ({ ...prev, accessCode: code }));
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-zinc-400">Loading access codes...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Session Access Codes</h1>
            <p className="text-zinc-400 mt-1">
              Manage access codes for restricted session booking
            </p>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-900 rounded-lg">
                  <Key className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-zinc-400 text-sm">Protected Sessions</p>
                  <p className="text-2xl font-bold text-white">
                    {sessions.filter((s: Session) => s.hasAccessCode).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-900 rounded-lg">
                  <Unlock className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-zinc-400 text-sm">Open Sessions</p>
                  <p className="text-2xl font-bold text-white">
                    {sessions.filter((s: Session) => !s.hasAccessCode).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-900 rounded-lg">
                  <Calendar className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-zinc-400 text-sm">Total Sessions</p>
                  <p className="text-2xl font-bold text-white">{sessions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sessions Table */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Lock className="w-5 h-5 mr-2" />
              Session Access Control
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800">
                  <TableHead className="text-zinc-300">Session</TableHead>
                  <TableHead className="text-zinc-300">Date & Time</TableHead>
                  <TableHead className="text-zinc-300">Location</TableHead>
                  <TableHead className="text-zinc-300">Participants</TableHead>
                  <TableHead className="text-zinc-300">Access Status</TableHead>
                  <TableHead className="text-zinc-300">Access Code</TableHead>
                  <TableHead className="text-zinc-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session: Session) => (
                  <TableRow key={session.id} className="border-zinc-800">
                    <TableCell>
                      <div>
                        <div className="text-white font-medium">{session.title}</div>
                        <div className="text-zinc-400 text-sm">
                          {session.ageGroups.join(', ')} • {session.genders.join(', ')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-zinc-300">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {format(new Date(session.startTime), 'MMM dd, yyyy')}
                        </div>
                        <div className="flex items-center text-sm text-zinc-400">
                          <Clock className="w-4 h-4 mr-1" />
                          {format(new Date(session.startTime), 'h:mm a')} - {format(new Date(session.endTime), 'h:mm a')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-zinc-300">
                        <MapPin className="w-4 h-4 mr-1" />
                        {session.location}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-zinc-300">
                        <Users className="w-4 h-4 mr-1" />
                        {session.signupCount || 0}/{session.capacity}
                      </div>
                    </TableCell>
                    <TableCell>
                      {session.hasAccessCode ? (
                        <Badge className="bg-red-900 text-red-300">
                          <Lock className="w-3 h-3 mr-1" />
                          Protected
                        </Badge>
                      ) : (
                        <Badge className="bg-green-900 text-green-300">
                          <Unlock className="w-3 h-3 mr-1" />
                          Open
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {session.hasAccessCode ? (
                        <code className="bg-zinc-800 px-2 py-1 rounded text-zinc-300 font-mono">
                          {session.accessCode}
                        </code>
                      ) : (
                        <span className="text-zinc-500">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(session)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={!!editingSession} onOpenChange={() => setEditingSession(null)}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Key className="w-5 h-5 mr-2" />
                Configure Access Code
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {editingSession && (
                <div className="bg-zinc-800 p-3 rounded-lg">
                  <p className="text-zinc-300 font-medium">{editingSession.title}</p>
                  <p className="text-zinc-400 text-sm">
                    {format(new Date(editingSession.startTime), 'MMM dd, yyyy h:mm a')} • {editingSession.location}
                  </p>
                </div>
              )}

              <div className="flex items-center space-x-3">
                <Switch
                  checked={formData.hasAccessCode}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasAccessCode: checked }))}
                />
                <Label className="text-zinc-300">Require access code for booking</Label>
              </div>

              {formData.hasAccessCode && (
                <div className="space-y-3">
                  <Label htmlFor="accessCode" className="text-zinc-300">Access Code</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="accessCode"
                      value={formData.accessCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, accessCode: e.target.value.toUpperCase() }))}
                      className="bg-zinc-800 border-zinc-700 text-white font-mono"
                      placeholder="Enter access code"
                      maxLength={8}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateRandomCode}
                      className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    >
                      Generate
                    </Button>
                  </div>
                  <p className="text-zinc-400 text-sm">
                    Parents will need this code to book spots in this session
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setEditingSession(null)}
                  className="border-zinc-700 text-zinc-300"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={updateAccessCodeMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {updateAccessCodeMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}