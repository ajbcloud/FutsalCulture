import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Clock, MapPin, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FutsalSession, Player } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";
import { calculateAgeGroup, isSessionEligibleForPlayer } from "@shared/utils";
import { format12Hour } from "@shared/booking-config";
import LocationLink from "@/components/LocationLink";

interface SessionCalendarProps {
  ageGroupFilter?: string;
  genderFilter?: string;
  locationFilter?: string;
  multiPlayerAges?: string[];
  multiPlayerGenders?: string[];
  showBookingButtons?: boolean;
  onSessionClick?: (session: FutsalSession) => void;
}

export default function SessionCalendar({ 
  ageGroupFilter, 
  genderFilter, 
  locationFilter,
  multiPlayerAges = [],
  multiPlayerGenders = [],
  showBookingButtons = false, 
  onSessionClick 
}: SessionCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  // Fetch players to determine age groups for filtering
  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ["/api/players"],
    enabled: isAuthenticated,
  });

  // Fetch admin settings to get location address data
  const { data: adminSettings } = useQuery({
    queryKey: ['/api/admin/settings'],
    queryFn: () => fetch('/api/admin/settings').then(res => res.json())
  });

  // Get all sessions
  const { data: allSessions = [] } = useQuery<FutsalSession[]>({
    queryKey: ["/api/sessions"],
  });

  // Filter sessions based on provided criteria and booking availability
  const sessions = allSessions.filter(session => {
    const now = new Date();
    const sessionDate = new Date(session.startTime);
    const today = new Date();
    
    // Only show future sessions (not past ones)
    if (sessionDate < now) {
      return false;
    }
    
    // For calendar view, show all future sessions regardless of booking status
    // The booking availability will be handled in the rendering logic
    
    // Check multi-player filters first (if coming from dashboard with multiple players)
    if (multiPlayerAges.length > 0 || multiPlayerGenders.length > 0) {
      const ageMatch = multiPlayerAges.length === 0 || session.ageGroups?.some(age => multiPlayerAges.includes(age));
      const genderMatch = multiPlayerGenders.length === 0 || session.genders?.some(gender => multiPlayerGenders.includes(gender));
      if (!ageMatch || !genderMatch) return false;
    } else {
      // Apply manual filters if provided (for public sessions page)
      if (ageGroupFilter && session.ageGroups && !session.ageGroups.includes(ageGroupFilter)) return false;
      if (genderFilter && session.genders && !session.genders.includes(genderFilter)) return false;
    }
    
    // Always apply location filter
    if (locationFilter && session.location !== locationFilter) return false;
    
    // For calendar view, show all future sessions
    return true;
  });

  // Filter sessions for the current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthSessions = sessions.filter(session => {
    const sessionDate = new Date(session.startTime);
    return sessionDate >= monthStart && sessionDate <= monthEnd;
  });
  
  // Debug logging removed

  // Group sessions by date
  const sessionsByDate = monthSessions.reduce((acc, session) => {
    const dateKey = format(new Date(session.startTime), 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(session);
    return acc;
  }, {} as Record<string, FutsalSession[]>);

  // Generate calendar days - full week layout including weekends
  const calendarDays = eachDayOfInterval({
    start: monthStart,
    end: monthEnd,
  });
  
  // Add empty cells for days before the first day of the month
  const firstDayOfWeek = monthStart.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const emptyDays = Array(firstDayOfWeek).fill(null);

  // Find matching location from admin settings to get address data
  const getLocationData = (locationName: string) => {
    if (!adminSettings?.availableLocations) return { name: locationName };
    
    const matchedLocation = adminSettings.availableLocations.find((loc: any) => {
      const locName = typeof loc === 'object' ? loc.name : loc;
      return locName === locationName;
    });
    
    if (matchedLocation && typeof matchedLocation === 'object') {
      return {
        name: matchedLocation.name,
        address: [matchedLocation.addressLine1, matchedLocation.addressLine2, matchedLocation.city, matchedLocation.state, matchedLocation.postalCode]
          .filter(Boolean)
          .join(', ')
      };
    }
    
    return { name: locationName };
  };

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  return (
    <div className="w-full">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevMonth}
            className="bg-muted border-border text-foreground hover:bg-muted/80"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextMonth}
            className="bg-muted border-border text-foreground hover:bg-muted/80"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid - Responsive Layout */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {/* Day Headers - Responsive */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-1 sm:p-2 text-center text-xs sm:text-sm font-medium text-muted-foreground">
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.charAt(0)}</span>
          </div>
        ))}

        {/* Empty cells for alignment */}
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="min-h-[70px] sm:min-h-[120px]" />
        ))}
        
        {/* Calendar Days */}
        {calendarDays.map(day => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const daySessions = sessionsByDate[dateKey] || [];
          const isToday = isSameDay(day, new Date());
          const isPast = day < new Date();

          return (
            <div
              key={dateKey}
              className={`min-h-[70px] sm:min-h-[120px] border border-border rounded transition-colors flex flex-col ${
                isToday ? 'bg-primary/10 border-primary' : 
                isPast ? 'bg-card/50' : 'bg-card'
              }`}
            >
              {/* Day Header - Clickable to open dialog */}
              <div 
                className={`p-1 sm:p-2 pb-0 cursor-pointer hover:bg-muted/50 rounded-t ${
                  isToday ? 'hover:bg-primary/20' : 
                  isPast ? 'hover:bg-muted/70' : 'hover:bg-muted'
                }`}
                onClick={() => {
                  setSelectedDate(day);
                  setIsDialogOpen(true);
                }}
              >
                <div className={`text-xs sm:text-sm font-medium ${
                  isToday ? 'text-primary' : 
                  isPast ? 'text-muted-foreground/60' : 'text-foreground'
                }`}>
                  {format(day, 'd')}
                </div>
              </div>

              {/* Sessions Container */}
              <div className="p-1 sm:p-2 pt-0 flex-1 flex flex-col overflow-hidden">
                {/* Sessions for this day - Mobile Optimized with Larger Touch Areas */}
                <div className="space-y-0.5 sm:space-y-1 flex-1 overflow-hidden">
                {daySessions.slice(0, 2).map(session => {
                  const sessionDate = new Date(session.startTime);
                  const today = new Date();
                  const isSessionToday = sessionDate.toDateString() === today.toDateString();
                  const sessionStarted = new Date() >= new Date(session.startTime);
                  const isSessionFuture = sessionDate > today;
                  
                  // Determine if booking is open based on session constraints
                  let bookingOpen = false;
                  
                  if (session.noTimeConstraints) {
                    // Can book anytime before session starts
                    bookingOpen = !sessionStarted;
                  } else if (session.daysBeforeBooking) {
                    // Days before booking constraint
                    const daysBeforeMs = session.daysBeforeBooking * 24 * 60 * 60 * 1000;
                    const bookingOpenTime = new Date(sessionDate.getTime() - daysBeforeMs);
                    bookingOpen = today >= bookingOpenTime && !sessionStarted;
                  } else {
                    // Default 8 AM rule for today only
                    const bookingHour = session.bookingOpenHour ?? 8;
                    const bookingMinute = session.bookingOpenMinute ?? 0;
                    const bookingOpenTime = new Date(sessionDate);
                    bookingOpenTime.setHours(bookingHour, bookingMinute, 0, 0);
                    bookingOpen = isSessionToday && today >= bookingOpenTime;
                  }
                  
                  let statusColor = 'bg-primary/20';
                  let borderColor = 'border-transparent';
                  let statusText = session.status;
                  
                  // Handle cancelled status first
                  if (session.status === 'cancelled') {
                    statusColor = 'bg-gray-600/10';
                    borderColor = 'border-gray-500';
                    statusText = 'cancelled';
                  }
                  // Override status based on real-time conditions
                  else if (sessionStarted) {
                    statusColor = 'bg-muted/20';
                    borderColor = 'border-border';
                    statusText = 'closed';
                  } else if (session.status === 'full') {
                    statusColor = 'bg-destructive/20';
                    borderColor = 'border-destructive';
                    statusText = 'full';
                  } else if (bookingOpen && !['full', 'closed'].includes(session.status || '')) {
                    statusColor = 'bg-green-600/20 hover:bg-green-600/30';
                    borderColor = 'border-green-600';
                    statusText = 'open';
                  } else if (!bookingOpen && !sessionStarted) {
                    statusColor = 'bg-yellow-600/20';
                    borderColor = 'border-yellow-600';
                    statusText = 'upcoming';
                  }
                  
                  return (
                    <div 
                      key={session.id} 
                      className={`min-h-[22px] sm:min-h-[28px] p-0.5 sm:p-1 cursor-pointer border hover:border-border/80 active:border-border transition-all rounded text-foreground ${statusColor} ${borderColor} touch-manipulation flex-shrink-0`}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        if (onSessionClick) {
                          onSessionClick(session);
                        }
                      }}
                      onTouchEnd={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        if (onSessionClick) {
                          onSessionClick(session);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.stopPropagation();
                          e.preventDefault();
                          if (onSessionClick) {
                            onSessionClick(session);
                          }
                        }
                      }}
                    >
                      {/* Mobile Format - Compact */}
                      <div className="sm:hidden pointer-events-none">
                        <div className="text-[9px] font-medium truncate leading-tight">
                          {format12Hour(new Date(session.startTime).getHours(), new Date(session.startTime).getMinutes())}
                        </div>
                        <div className="text-[8px] text-muted-foreground truncate leading-tight">
                          {session.ageGroups?.slice(0, 1).join(', ') || 'N/A'}
                        </div>
                      </div>

                      {/* Desktop Format - Full Details */}
                      <div className="hidden sm:block pointer-events-none">
                        <div className="text-xs text-foreground font-medium truncate mb-1">
                          {session.title}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                          <Clock className="w-3 h-3" />
                          {format12Hour(new Date(session.startTime).getHours(), new Date(session.startTime).getMinutes())}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                          <MapPin className="w-3 h-3" />
                          <LocationLink 
                            name={getLocationData(session.locationName || session.location).name}
                            address={getLocationData(session.locationName || session.location).address}
                            className="truncate text-xs text-muted-foreground hover:text-foreground"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge 
                            variant="secondary" 
                            className="text-xs px-1 py-0 pointer-events-none"
                          >
                            {session.ageGroups?.join(', ') || 'N/A'}
                          </Badge>
                          <Badge 
                            variant={statusText === 'open' ? 'default' : 'secondary'}
                            className="text-xs px-1 py-0 capitalize pointer-events-none"
                          >
                            {statusText}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {daySessions.length > 2 && (
                  <div className="text-[8px] sm:text-xs text-muted-foreground text-center py-0.5 flex-shrink-0">
                    +{daySessions.length - 2} more
                  </div>
                )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend - Mobile Responsive */}
      <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-center gap-2 sm:gap-4 mt-6 text-xs sm:text-sm">
        <div className="flex items-center space-x-1 sm:space-x-2">
          <div className="w-3 h-3 bg-green-600/20 border border-green-600 rounded"></div>
          <span className="text-muted-foreground">Open</span>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2">
          <div className="w-3 h-3 bg-yellow-600/20 border border-yellow-600 rounded"></div>
          <span className="text-muted-foreground">Upcoming</span>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2">
          <div className="w-3 h-3 bg-destructive/20 border border-destructive rounded"></div>
          <span className="text-muted-foreground">Full</span>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2">
          <div className="w-3 h-3 bg-muted/20 border border-border rounded"></div>
          <span className="text-muted-foreground">Closed</span>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2">
          <div className="w-3 h-3 bg-gray-600/10 border border-gray-500 rounded"></div>
          <span className="text-muted-foreground">Cancelled</span>
        </div>
      </div>

      {/* Day Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </DialogTitle>
          </DialogHeader>
          
          {selectedDate && (
            <div className="space-y-4">
              {(() => {
                const dateKey = format(selectedDate, 'yyyy-MM-dd');
                const daySessions = sessionsByDate[dateKey] || [];
                
                if (daySessions.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No sessions scheduled for this day.</p>
                    </div>
                  );
                }

                return daySessions.map(session => (
                  <Card 
                    key={session.id} 
                    className={`cursor-pointer transition-colors ${
                      session.status === 'cancelled' ? 'bg-gray-600/10 hover:bg-gray-600/20 border border-gray-500' :
                      session.status === 'open' ? 'bg-green-600/20 hover:bg-green-600/30 border border-green-600' :
                      session.status === 'full' ? 'bg-destructive/20 hover:bg-destructive/30 border border-destructive' :
                      session.status === 'closed' ? 'bg-muted/20 hover:bg-muted/30 border border-border' :
                      session.status === 'upcoming' ? 'bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-600' :
                      'bg-primary/20 hover:bg-primary/30 border border-primary'
                    }`}
                    onClick={() => {
                      if (onSessionClick) {
                        onSessionClick(session);
                        setIsDialogOpen(false);
                      }
                    }}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-foreground text-lg">{session.title}</CardTitle>
                        <Badge 
                          variant={session.status === 'open' ? 'default' : 'secondary'}
                          className="capitalize"
                        >
                          {session.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{format(new Date(session.startTime), 'h:mm a')} - {format(new Date(session.endTime), 'h:mm a')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <LocationLink 
                            name={getLocationData(session.locationName || session.location).name}
                            address={getLocationData(session.locationName || session.location).address}
                            className="text-muted-foreground hover:text-foreground"
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-muted-foreground border-border">
                            {session.ageGroups?.join(', ') || 'N/A'}
                          </Badge>
                          <Badge variant="outline" className="text-muted-foreground border-border capitalize">
                            {session.genders?.join(', ') || 'N/A'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>{session.capacity} spots</span>
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        Price: ${(session.priceCents / 100).toFixed(2)}
                      </div>
                      
                      {(() => {
                        const sessionDate = new Date(session.startTime);
                        const today = new Date();
                        const isToday = sessionDate.toDateString() === today.toDateString();
                        const currentHour = today.getHours();
                        const bookingOpen = isToday && currentHour >= 8;
                        const sessionStarted = new Date() >= new Date(session.startTime);
                        const canBook = bookingOpen && !sessionStarted && session.status !== 'full';
                        
                        if (showBookingButtons) {
                          if (sessionStarted) {
                            return (
                              <Button 
                                className="w-full mt-3 bg-gray-600" 
                                disabled
                              >
                                Session Started
                              </Button>
                            );
                          } else if (!isToday) {
                            return (
                              <div className="mt-3 p-2 bg-yellow-900/20 border border-yellow-600 rounded text-center">
                                <p className="text-yellow-700 dark:text-yellow-400 text-sm">
                                  Booking opens at {format12Hour(session.bookingOpenHour ?? 8, session.bookingOpenMinute ?? 0)} on {format(sessionDate, 'MMM d')}
                                </p>
                              </div>
                            );
                          } else if (!bookingOpen) {
                            return (
                              <div className="mt-3 p-2 bg-yellow-900/20 border border-yellow-600 rounded text-center">
                                <p className="text-yellow-700 dark:text-yellow-400 text-sm">
                                  Booking opens at {format12Hour(session.bookingOpenHour ?? 8, session.bookingOpenMinute ?? 0)} today
                                </p>
                              </div>
                            );
                          } else if (session.status === 'full') {
                            return (
                              <Button 
                                className="w-full mt-3 bg-red-600" 
                                disabled
                              >
                                Session Full
                              </Button>
                            );
                          } else if (canBook) {
                            return (
                              <Button 
                                className="w-full mt-3 bg-blue-600 hover:bg-blue-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onSessionClick) {
                                    onSessionClick(session);
                                    setIsDialogOpen(false);
                                  }
                                }}
                              >
                                Book Session
                              </Button>
                            );
                          }
                        }
                        return null;
                      })()}
                    </CardContent>
                  </Card>
                ));
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}