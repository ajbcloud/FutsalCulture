import React from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '../../components/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Users, Clock, UserMinus, ArrowUp, Mail, MessageSquare } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { FutsalSession, Waitlist, Player, User } from '@shared/schema';

export default function AdminSessionWaitlist() {
  const { sessionId } = useParams();
  const { toast } = useToast();

  // Fetch session details
  const { data: session, isLoading: sessionLoading } = useQuery<FutsalSession & { signupsCount?: number }>({
    queryKey: ['/api/sessions', sessionId],
  });

  // Fetch waitlist entries
  const { data: waitlistEntries, isLoading: waitlistLoading } = useQuery<Array<Waitlist & { player: Player; parent: User }>>({
    queryKey: ['/api/admin/sessions', sessionId, 'waitlist'],
  });

  if (sessionLoading || waitlistLoading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="text-center">Loading waitlist details...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!session) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="text-center text-destructive">Session not found</div>
        </div>
      </AdminLayout>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-600 text-green-950">Active</Badge>;
      case 'offered':
        return <Badge className="bg-blue-600 text-blue-950">Offered Spot</Badge>;
      case 'accepted':
        return <Badge className="bg-purple-600 text-purple-950">Accepted</Badge>;
      case 'expired':
        return <Badge variant="secondary">Expired</Badge>;
      case 'removed':
        return <Badge variant="destructive">Removed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Session Waitlist</h1>
            <p className="text-muted-foreground">
              {session?.title} - {session?.startTime ? formatDateTime(session.startTime) : 'Loading...'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-sm">
              <Users className="w-4 h-4 mr-1" />
              {waitlistEntries?.length || 0} on waitlist
            </Badge>
          </div>
        </div>

        {/* Session Details */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Session Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-sm font-medium text-muted-foreground">Time</span>
                <p className="text-foreground">
                  {session?.startTime ? new Date(session.startTime).toLocaleTimeString([], { 
                    hour: 'numeric', 
                    minute: '2-digit' 
                  }) : 'Loading...'} - {session?.endTime ? new Date(session.endTime).toLocaleTimeString([], { 
                    hour: 'numeric', 
                    minute: '2-digit' 
                  }) : 'Loading...'}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">Capacity</span>
                <p className="text-foreground">{session?.signupsCount || 0} / {session?.capacity || 0}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">Waitlist Enabled</span>
                <p className="text-foreground">
                  {session?.waitlistEnabled ? (
                    <Badge className="bg-green-600 text-green-950">Yes</Badge>
                  ) : (
                    <Badge variant="secondary">No</Badge>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Waitlist Entries */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center justify-between">
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Waitlist Entries ({waitlistEntries?.length || 0})
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Mail className="w-4 h-4 mr-2" />
                  Notify All
                </Button>
                <Button variant="outline" size="sm">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!waitlistEntries || waitlistEntries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No one is currently on the waitlist for this session.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {waitlistEntries?.map((entry, index: number) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                    data-testid={`waitlist-entry-${entry.id}`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-sm font-medium text-muted-foreground">
                        #{entry.position}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">
                          {entry.player?.firstName} {entry.player?.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Parent: {entry.parent?.firstName} {entry.parent?.lastName} ({entry.parent?.email})
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Joined: {new Date(entry.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {getStatusBadge(entry.status)}
                      <div className="flex space-x-1">
                        <Button variant="outline" size="sm" title="Promote to spot">
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" title="Remove from waitlist">
                          <UserMinus className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" title="Send message">
                          <Mail className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}