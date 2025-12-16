import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, isSameDay, startOfMonth, endOfMonth, isFuture, isPast } from "date-fns";
import { Calendar as CalendarIcon, List, MapPin, Clock, Users, Star, ChevronLeft, ChevronRight, ClipboardList, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "wouter";
import { CalendarExportButton } from "@/components/calendar-export-button";

interface CoachSession {
  id: string;
  sessionId: string;
  isLead: boolean;
  notes: string | null;
  assignedAt: string;
  session: {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    location: string;
    capacity: number;
    currentSignups: number;
    ageGroups: string[];
    genders: string[];
    status: string;
  };
}

interface CoachSessionsResponse {
  sessions: CoachSession[];
  coachAssignmentId: string;
}

interface RosterPlayer {
  playerName: string;
  ageGroup: string | null;
  paymentStatus: 'paid' | 'pending';
  parentName: string;
  parentEmail: string;
}

interface SessionRoster {
  sessionId: string;
  sessionTitle: string;
  sessionDate: string;
  sessionTime: string;
  location: string;
  ageGroups: string[];
  players: RosterPlayer[];
}

export default function CoachDashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<string>("upcoming");
  const [rosterModalOpen, setRosterModalOpen] = useState(false);
  const [selectedSessionForRoster, setSelectedSessionForRoster] = useState<string | null>(null);

  const { data: rosterData, isLoading: rosterLoading } = useQuery<SessionRoster>({
    queryKey: ['/api/coach/sessions', selectedSessionForRoster, 'roster'],
    queryFn: async () => {
      const res = await fetch(`/api/coach/sessions/${selectedSessionForRoster}/roster`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch roster');
      return res.json();
    },
    enabled: !!selectedSessionForRoster && rosterModalOpen,
  });

  const openRosterModal = (sessionId: string) => {
    setSelectedSessionForRoster(sessionId);
    setRosterModalOpen(true);
  };

  const closeRosterModal = () => {
    setRosterModalOpen(false);
    setSelectedSessionForRoster(null);
  };

  const { data, isLoading, error } = useQuery<CoachSessionsResponse>({
    queryKey: ["/api/coach/my-sessions"],
    enabled: isAuthenticated && !!user?.isAssistant,
  });

  if (authLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </>
    );
  }

  if (!isAuthenticated || !user?.isAssistant) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">
                This page is only available to coaches.
              </p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const sessions = data?.sessions || [];
  const upcomingSessions = sessions.filter(s => isFuture(new Date(s.session.startTime)));
  const pastSessions = sessions.filter(s => isPast(new Date(s.session.startTime)));

  const sessionsOnDate = selectedDate
    ? sessions.filter(s => isSameDay(new Date(s.session.startTime), selectedDate))
    : [];

  const sessionDates = sessions.map(s => new Date(s.session.startTime));

  const renderSessionCard = (coachSession: CoachSession) => {
    const { session, isLead } = coachSession;
    const sessionDate = new Date(session.startTime);
    const isPastSession = isPast(sessionDate);

    return (
      <Card 
        key={coachSession.id} 
        className={`hover:shadow-md transition-shadow ${isPastSession ? 'opacity-70' : ''}`}
        data-testid={`session-card-${session.id}`}
      >
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg" data-testid={`session-title-${session.id}`}>
                  {session.title}
                </h3>
                <Badge 
                  variant={isLead ? "default" : "secondary"}
                  data-testid={`session-role-${session.id}`}
                >
                  {isLead ? (
                    <><Star className="w-3 h-3 mr-1" /> Lead Coach</>
                  ) : (
                    "Assistant"
                  )}
                </Badge>
              </div>
              {session.ageGroups && session.ageGroups.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {session.ageGroups.map((age) => (
                    <Badge key={age} variant="outline" className="text-xs">
                      {age}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <Badge 
              variant={session.status === 'published' ? 'default' : 'secondary'}
              data-testid={`session-status-${session.id}`}
            >
              {session.status}
            </Badge>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2" data-testid={`session-datetime-${session.id}`}>
              <CalendarIcon className="w-4 h-4" />
              <span>
                {format(sessionDate, "EEEE, MMMM d, yyyy")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>
                {format(sessionDate, "h:mm a")} - {format(new Date(session.endTime), "h:mm a")}
              </span>
            </div>
            <div className="flex items-center gap-2" data-testid={`session-location-${session.id}`}>
              <MapPin className="w-4 h-4" />
              <span>{session.location}</span>
            </div>
            <div className="flex items-center gap-2" data-testid={`session-players-${session.id}`}>
              <Users className="w-4 h-4" />
              <span>
                {session.currentSignups || 0} / {session.capacity} players
              </span>
              {session.currentSignups >= session.capacity && (
                <Badge variant="destructive" className="text-xs">Full</Badge>
              )}
            </div>
          </div>

          {coachSession.notes && (
            <div className="mt-3 p-2 bg-muted rounded text-sm">
              <span className="font-medium">Notes:</span> {coachSession.notes}
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <Link href={`/sessions/${session.id}`}>
              <Button variant="outline" size="sm" data-testid={`view-session-${session.id}`}>
                View Details
              </Button>
            </Link>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => openRosterModal(session.id)}
              data-testid={`view-roster-${session.id}`}
            >
              <ClipboardList className="w-4 h-4 mr-1" />
              Roster
            </Button>
            {user?.isAdmin && (
              <Link href={`/admin/sessions/${session.id}`}>
                <Button variant="ghost" size="sm">
                  Admin View
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-6">
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="page-title">
                My Sessions
              </h1>
              <p className="text-muted-foreground">
                View and manage your assigned coaching sessions
              </p>
            </div>
            <CalendarExportButton />
          </div>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-3" />
                    <Skeleton className="h-4 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-2/3 mb-2" />
                    <Skeleton className="h-4 w-1/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-destructive">Failed to load sessions. Please try again.</p>
              </CardContent>
            </Card>
          ) : sessions.length === 0 ? (
            <Card data-testid="empty-state">
              <CardContent className="pt-6 text-center">
                <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Sessions Assigned</h3>
                <p className="text-muted-foreground">
                  You haven't been assigned to any sessions yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5" />
                      Calendar
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      month={calendarMonth}
                      onMonthChange={setCalendarMonth}
                      modifiers={{
                        hasSession: sessionDates,
                      }}
                      modifiersStyles={{
                        hasSession: {
                          backgroundColor: 'hsl(var(--primary))',
                          color: 'hsl(var(--primary-foreground))',
                          borderRadius: '50%',
                        },
                      }}
                      className="rounded-md border"
                      data-testid="session-calendar"
                    />
                    
                    {selectedDate && sessionsOnDate.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium text-sm mb-2">
                          Sessions on {format(selectedDate, "MMM d")}
                        </h4>
                        <div className="space-y-2">
                          {sessionsOnDate.map((s) => (
                            <Link key={s.id} href={`/sessions/${s.session.id}`}>
                              <div className="p-2 bg-muted rounded hover:bg-muted/80 cursor-pointer text-sm">
                                <div className="font-medium">{s.session.title}</div>
                                <div className="text-muted-foreground">
                                  {format(new Date(s.session.startTime), "h:mm a")}
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="mt-4">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-primary" data-testid="upcoming-count">
                          {upcomingSessions.length}
                        </div>
                        <div className="text-sm text-muted-foreground">Upcoming</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold" data-testid="total-count">
                          {sessions.length}
                        </div>
                        <div className="text-sm text-muted-foreground">Total</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <List className="w-5 h-5" />
                        Session List
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="mb-4">
                        <TabsTrigger value="upcoming" data-testid="tab-upcoming">
                          Upcoming ({upcomingSessions.length})
                        </TabsTrigger>
                        <TabsTrigger value="past" data-testid="tab-past">
                          Past ({pastSessions.length})
                        </TabsTrigger>
                        <TabsTrigger value="all" data-testid="tab-all">
                          All ({sessions.length})
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="upcoming" className="space-y-4">
                        {upcomingSessions.length === 0 ? (
                          <p className="text-muted-foreground text-center py-8">
                            No upcoming sessions
                          </p>
                        ) : (
                          upcomingSessions.map(renderSessionCard)
                        )}
                      </TabsContent>

                      <TabsContent value="past" className="space-y-4">
                        {pastSessions.length === 0 ? (
                          <p className="text-muted-foreground text-center py-8">
                            No past sessions
                          </p>
                        ) : (
                          pastSessions.map(renderSessionCard)
                        )}
                      </TabsContent>

                      <TabsContent value="all" className="space-y-4">
                        {sessions.map(renderSessionCard)}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={rosterModalOpen} onOpenChange={setRosterModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              Session Roster
            </DialogTitle>
          </DialogHeader>
          
          {rosterLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : rosterData ? (
            <div className="space-y-6">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">{rosterData.sessionTitle}</h3>
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div><strong>Date:</strong> {rosterData.sessionDate}</div>
                  <div><strong>Time:</strong> {rosterData.sessionTime}</div>
                  <div><strong>Location:</strong> {rosterData.location}</div>
                  <div><strong>Age Groups:</strong> {rosterData.ageGroups.join(', ') || 'All ages'}</div>
                </div>
              </div>

              <div className="flex gap-4 text-center">
                <div className="flex-1 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{rosterData.players.length}</div>
                  <div className="text-sm text-green-700 dark:text-green-400">Total Players</div>
                </div>
                <div className="flex-1 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {rosterData.players.filter(p => p.paymentStatus === 'paid').length}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-400">Paid</div>
                </div>
                <div className="flex-1 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-amber-600">
                    {rosterData.players.filter(p => p.paymentStatus === 'pending').length}
                  </div>
                  <div className="text-sm text-amber-700 dark:text-amber-400">Pending</div>
                </div>
              </div>

              {rosterData.players.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Player Name</TableHead>
                      <TableHead>Age Group</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Parent/Guardian</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rosterData.players.map((player, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{player.playerName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{player.ageGroup || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={player.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                            {player.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{player.parentName}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No players registered for this session yet.
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Unable to load roster data.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
