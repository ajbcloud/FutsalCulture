import { useState, useEffect } from 'react';
import { useRoute, useLocation, useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, MapPin, Users, DollarSign, Key, Building2, ArrowLeft } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface PublicSession {
  id: string;
  title: string;
  location: string;
  locationName: string | null;
  city: string | null;
  state: string | null;
  ageGroups: string[];
  genders: string[];
  startTime: string;
  endTime: string;
  capacity: number;
  priceCents: number;
  status: string;
  visibility: string;
  hasAccessCode: boolean;
  signupsCount: number;
  spotsRemaining: number;
}

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
}

export default function PublicSessions() {
  const [, params] = useRoute('/browse/:tenantSlug');
  const tenantSlug = params?.tenantSlug || '';
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedSession, setSelectedSession] = useState<PublicSession | null>(null);
  const [accessCodeDialogOpen, setAccessCodeDialogOpen] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [accessCodeError, setAccessCodeError] = useState('');

  const { data, isLoading, error } = useQuery<{ tenant: TenantInfo; sessions: PublicSession[] }>({
    queryKey: ['/api/public', tenantSlug, 'sessions'],
    queryFn: () => fetch(`/api/public/${tenantSlug}/sessions`).then(res => {
      if (!res.ok) throw new Error('Failed to load sessions');
      return res.json();
    }),
    enabled: !!tenantSlug,
  });

  const tenant = data?.tenant;
  const sessions = data?.sessions || [];

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = monthStart.getDay();
  const emptyDays = Array(startDayOfWeek).fill(null);

  const sessionsByDate: Record<string, PublicSession[]> = {};
  sessions.forEach(session => {
    const dateKey = format(new Date(session.startTime), 'yyyy-MM-dd');
    if (!sessionsByDate[dateKey]) sessionsByDate[dateKey] = [];
    sessionsByDate[dateKey].push(session);
  });

  const handleSessionClick = (session: PublicSession) => {
    if (session.visibility === 'access_code_required' || session.hasAccessCode) {
      setSelectedSession(session);
      setAccessCodeDialogOpen(true);
      setAccessCode('');
      setAccessCodeError('');
    } else {
      window.location.href = `/browse/${tenantSlug}/session/${session.id}`;
    }
  };

  const handleAccessCodeSubmit = () => {
    if (!accessCode.trim()) {
      setAccessCodeError('Please enter an access code');
      return;
    }
    window.location.href = `/browse/${tenantSlug}/session/${selectedSession?.id}?code=${accessCode.trim().toUpperCase()}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Organization Not Found</h2>
            <p className="text-muted-foreground">
              The organization you're looking for doesn't exist or isn't accepting public bookings.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">{tenant.name}</h1>
          <p className="text-muted-foreground">Browse available training sessions</p>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              Next
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.charAt(0)}</span>
            </div>
          ))}

          {emptyDays.map((_, index) => (
            <div key={`empty-${index}`} className="min-h-[100px]" />
          ))}

          {calendarDays.map(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const daySessions = sessionsByDate[dateKey] || [];
            const isToday = isSameDay(day, new Date());
            const isPast = day < new Date();

            return (
              <div
                key={dateKey}
                className={`min-h-[100px] border border-border rounded p-1 ${
                  isToday ? 'bg-primary/10 border-primary' :
                  isPast ? 'bg-muted/50' : 'bg-card'
                }`}
              >
                <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary' : 'text-foreground'}`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {daySessions.slice(0, 2).map(session => {
                    const isFull = session.spotsRemaining <= 0;
                    return (
                      <div
                        key={session.id}
                        onClick={() => !isPast && handleSessionClick(session)}
                        className={`text-xs p-1 rounded cursor-pointer transition-colors ${
                          isPast ? 'bg-muted text-muted-foreground cursor-not-allowed' :
                          isFull ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200' :
                          'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-900/40'
                        }`}
                        data-testid={`session-card-${session.id}`}
                      >
                        <div className="font-medium truncate">{session.title}</div>
                        <div className="hidden sm:block">
                          {format(new Date(session.startTime), 'h:mm a')}
                        </div>
                        {(session.visibility === 'access_code_required' || session.hasAccessCode) && (
                          <Key className="w-3 h-3 inline-block ml-1" />
                        )}
                      </div>
                    );
                  })}
                  {daySessions.length > 2 && (
                    <div className="text-xs text-muted-foreground text-center">
                      +{daySessions.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {sessions.length === 0 && (
          <div className="mt-8 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Public Sessions Available</h3>
            <p className="text-muted-foreground">
              This organization doesn't have any public sessions available at the moment.
            </p>
          </div>
        )}

        <div className="mt-8 p-4 bg-muted rounded-lg text-center">
          <p className="text-sm text-muted-foreground">
            To book a session, you'll need to create an account or sign in.
            <br />
            <a href={`/join/${tenantSlug}`} className="text-primary hover:underline">
              Join {tenant.name}
            </a>
          </p>
        </div>
      </div>

      <Dialog open={accessCodeDialogOpen} onOpenChange={setAccessCodeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Access Code</DialogTitle>
            <DialogDescription>
              This session requires an access code to view details and book.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="accessCode">Access Code</Label>
              <Input
                id="accessCode"
                value={accessCode}
                onChange={(e) => {
                  setAccessCode(e.target.value.toUpperCase());
                  setAccessCodeError('');
                }}
                placeholder="Enter access code"
                className="font-mono"
                data-testid="input-access-code"
              />
              {accessCodeError && (
                <p className="text-sm text-destructive">{accessCodeError}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAccessCodeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAccessCodeSubmit} data-testid="button-submit-access-code">
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
