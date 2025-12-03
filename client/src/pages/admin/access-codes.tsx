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
import { Pagination } from '../../components/pagination';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [formData, setFormData] = useState<AccessCodeFormData>({
    hasAccessCode: false,
    accessCode: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all sessions
  const { data: sessions = [], isLoading } = useQuery<Session[]>({
    queryKey: ['/api/admin/sessions-with-access-codes'],
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

  // Calculate pagination
  const totalPages = Math.ceil(sessions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSessions = sessions.slice(startIndex, endIndex);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-muted-foreground">Loading access codes...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Session Access Codes</h1>
            <p className="text-muted-foreground mt-1">
              Manage access codes for restricted session booking
            </p>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Key className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Protected Sessions</p>
                  <p className="text-2xl font-bold text-foreground">
                    {sessions.filter((s: Session) => s.hasAccessCode).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-500/10 dark:bg-green-500/20 rounded-lg">
                  <Unlock className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Open Sessions</p>
                  <p className="text-2xl font-bold text-foreground">
                    {sessions.filter((s: Session) => !s.hasAccessCode).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-500/10 dark:bg-purple-500/20 rounded-lg">
                  <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Total Sessions</p>
                  <p className="text-2xl font-bold text-foreground">{sessions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sessions Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground flex items-center">
              <Lock className="w-5 h-5 mr-2" />
              Session Access Control
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">Session</TableHead>
                  <TableHead className="text-muted-foreground">Date & Time</TableHead>
                  <TableHead className="text-muted-foreground">Location</TableHead>
                  <TableHead className="text-muted-foreground">Participants</TableHead>
                  <TableHead className="text-muted-foreground">Access Status</TableHead>
                  <TableHead className="text-muted-foreground">Access Code</TableHead>
                  <TableHead className="text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSessions.length === 0 ? (
                  <TableRow className="border-border">
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      {sessions.length === 0 ? 'No sessions found' : 'No sessions on this page'}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedSessions.map((session: Session) => (
                  <TableRow key={session.id} className="border-border">
                    <TableCell>
                      <div>
                        <div className="text-foreground font-medium">{session.title}</div>
                        <div className="text-muted-foreground text-sm">
                          {session.ageGroups.join(', ')} • {session.genders.join(', ')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-foreground">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {format(new Date(session.startTime), 'MMM dd, yyyy')}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="w-4 h-4 mr-1" />
                          {format(new Date(session.startTime), 'h:mm a')} - {format(new Date(session.endTime), 'h:mm a')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-foreground">
                        <MapPin className="w-4 h-4 mr-1" />
                        {session.location}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-foreground">
                        <Users className="w-4 h-4 mr-1" />
                        {session.signupCount || 0}/{session.capacity}
                      </div>
                    </TableCell>
                    <TableCell>
                      {session.hasAccessCode ? (
                        <Badge className="bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400">
                          <Lock className="w-3 h-3 mr-1" />
                          Protected
                        </Badge>
                      ) : (
                        <Badge className="bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400">
                          <Unlock className="w-3 h-3 mr-1" />
                          Open
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {session.hasAccessCode ? (
                        <code className="bg-muted px-2 py-1 rounded text-foreground font-mono">
                          {session.accessCode}
                        </code>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(session)}
                        className="text-primary hover:text-primary/80"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination
                  totalItems={sessions.length}
                  itemsPerPage={itemsPerPage}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={(newItemsPerPage) => {
                    setItemsPerPage(newItemsPerPage);
                    setCurrentPage(1);
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={!!editingSession} onOpenChange={() => setEditingSession(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Key className="w-5 h-5 mr-2" />
                Configure Access Code
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {editingSession && (
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-foreground font-medium">{editingSession.title}</p>
                  <p className="text-muted-foreground text-sm">
                    {format(new Date(editingSession.startTime), 'MMM dd, yyyy h:mm a')} • {editingSession.location}
                  </p>
                </div>
              )}

              <div className="flex items-center space-x-3">
                <Switch
                  checked={formData.hasAccessCode}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasAccessCode: checked }))}
                />
                <Label className="text-foreground">Require access code for booking</Label>
              </div>

              {formData.hasAccessCode && (
                <div className="space-y-3">
                  <Label htmlFor="accessCode" className="text-foreground">Access Code</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="accessCode"
                      value={formData.accessCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, accessCode: e.target.value.toUpperCase() }))}
                      className="font-mono"
                      placeholder="Enter access code"
                      maxLength={8}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateRandomCode}
                    >
                      Generate
                    </Button>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Parents will need this code to book spots in this session
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setEditingSession(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={updateAccessCodeMutation.isPending}
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