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

  // Get all sessions
  const { data: allSessions = [] } = useQuery<FutsalSession[]>({
    queryKey: ["/api/sessions"],
  });

  // Filter sessions based on provided criteria
  const sessions = allSessions.filter(session => {
    // Filter by date: only show current day or future sessions up to 2 weeks out
    const sessionDate = new Date(session.startTime);
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const twoWeeksFromToday = new Date(todayStart.getTime() + (14 * 24 * 60 * 60 * 1000));
    
    if (sessionDate < todayStart || sessionDate > twoWeeksFromToday) {
      return false;
    }
    
    // Check multi-player filters first (if coming from dashboard with multiple players)
    if (multiPlayerAges.length > 0 || multiPlayerGenders.length > 0) {
      const ageMatch = multiPlayerAges.length === 0 || session.ageGroups?.some(age => multiPlayerAges.includes(age));
      const genderMatch = multiPlayerGenders.length === 0 || session.genders?.some(gender => multiPlayerGenders.includes(gender));
      if (!ageMatch || !genderMatch) return false;
    } else {
      // Apply manual filters if provided (for public sessions page)
      if (ageGroupFilter && !session.ageGroups?.includes(ageGroupFilter)) return false;
      if (genderFilter && !session.genders?.includes(genderFilter)) return false;
    }
    
    // Always apply location filter
    if (locationFilter && session.location !== locationFilter) return false;
    return true;
  });

  // Filter sessions for the current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthSessions = sessions.filter(session => {
    const sessionDate = new Date(session.startTime);
    return sessionDate >= monthStart && sessionDate <= monthEnd;
  });

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

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  return (
    <div className="w-full">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevMonth}
            className="bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextMonth}
            className="bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid - Responsive Layout */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {/* Day Headers - Responsive */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-1 sm:p-2 text-center text-xs sm:text-sm font-medium text-zinc-400">
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.charAt(0)}</span>
          </div>
        ))}

        {/* Empty cells for alignment */}
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="min-h-[80px] sm:min-h-[120px]" />
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
              className={`min-h-[80px] sm:min-h-[120px] p-1 sm:p-2 border border-zinc-800 rounded cursor-pointer transition-colors ${
                isToday ? 'bg-blue-900/20 border-blue-500 hover:bg-blue-900/30' : 
                isPast ? 'bg-zinc-900/50 hover:bg-zinc-900/70' : 'bg-zinc-900 hover:bg-zinc-800'
              }`}
              onClick={() => {
                setSelectedDate(day);
                setIsDialogOpen(true);
              }}
            >
              <div className={`text-xs sm:text-sm font-medium mb-1 sm:mb-2 ${
                isToday ? 'text-blue-400' : 
                isPast ? 'text-zinc-500' : 'text-white'
              }`}>
                {format(day, 'd')}
              </div>

              {/* Sessions for this day - Mobile Optimized */}
              <div className="space-y-0.5 sm:space-y-1">
                {daySessions.slice(0, 2).map(session => {
                  const sessionDate = new Date(session.startTime);
                  const today = new Date();
                  const isSessionToday = sessionDate.toDateString() === today.toDateString();
                  const sessionStarted = new Date() >= new Date(session.startTime);
                  const isSessionFuture = sessionDate > today;
                  
                  // Use the proper booking time from session or default to 8 AM
                  const bookingHour = session.bookingOpenHour ?? 8;
                  const bookingMinute = session.bookingOpenMinute ?? 0;
                  const bookingOpenTime = new Date(sessionDate);
                  bookingOpenTime.setHours(bookingHour, bookingMinute, 0, 0);
                  
                  const bookingOpen = isSessionToday && today >= bookingOpenTime;
                  
                  let statusColor = 'bg-blue-700/20';
                  let statusText = session.status;
                  
                  // Override status based on real-time conditions
                  if (sessionStarted) {
                    statusColor = 'bg-zinc-700/20';
                    statusText = 'closed';
                  } else if (isSessionToday && session.status === 'full') {
                    statusColor = 'bg-red-700/20';
                    statusText = 'full';
                  } else if (isSessionToday && bookingOpen && session.status !== 'full') {
                    statusColor = 'bg-green-700/20 hover:bg-green-700/30';
                    statusText = 'open';
                  } else if (isSessionToday && !bookingOpen) {
                    statusColor = 'bg-yellow-700/20';
                    statusText = 'upcoming';
                  } else if (isSessionFuture) {
                    statusColor = 'bg-yellow-700/20';
                    statusText = 'upcoming';
                  }
                  
                  return (
                    <div 
                      key={session.id} 
                      className={`p-0.5 sm:p-1 cursor-pointer border-none transition-colors rounded text-white ${statusColor}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSessionClick) {
                          onSessionClick(session);
                        }
                      }}
                    >
                      {/* Mobile Format - Compact */}
                      <div className="sm:hidden">
                        <div className="text-[10px] font-medium truncate mb-0.5">
                          {format12Hour(format(new Date(session.startTime), 'HH:mm'))}
                        </div>
                        <div className="text-[9px] text-zinc-300 truncate mb-0.5">
                          {session.ageGroups?.slice(0, 2).join(', ') || 'N/A'}
                        </div>
                        <div className="text-[8px] text-zinc-400 capitalize truncate">
                          {statusText}
                        </div>
                      </div>

                      {/* Desktop Format - Full Details */}
                      <div className="hidden sm:block">
                        <div className="text-xs text-white font-medium truncate mb-1">
                          {session.title}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-zinc-300 mb-1">
                          <Clock className="w-3 h-3" />
                          {format12Hour(format(new Date(session.startTime), 'HH:mm'))}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-zinc-300 mb-1">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{session.location}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge 
                            variant="secondary" 
                            className="text-xs px-1 py-0"
                          >
                            {session.ageGroups?.join(', ') || 'N/A'}
                          </Badge>
                          <Badge 
                            variant={statusText === 'open' ? 'default' : 'secondary'}
                            className="text-xs px-1 py-0 capitalize"
                          >
                            {statusText}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {daySessions.length > 2 && (
                  <div className="text-[9px] sm:text-xs text-zinc-400 text-center">
                    +{daySessions.length - 2} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend - Mobile Responsive */}
      <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-center gap-2 sm:gap-4 mt-6 text-xs sm:text-sm">
        <div className="flex items-center space-x-1 sm:space-x-2">
          <div className="w-3 h-3 bg-green-700/20 border border-green-700 rounded"></div>
          <span className="text-zinc-300">Open</span>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2">
          <div className="w-3 h-3 bg-yellow-700/20 border border-yellow-700 rounded"></div>
          <span className="text-zinc-300">Upcoming</span>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2">
          <div className="w-3 h-3 bg-red-700/20 border border-red-700 rounded"></div>
          <span className="text-zinc-300">Full</span>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2">
          <div className="w-3 h-3 bg-zinc-700/20 border border-zinc-700 rounded"></div>
          <span className="text-zinc-300">Closed</span>
        </div>
      </div>

      {/* Day Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-700 max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
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
                      <p className="text-zinc-400">No sessions scheduled for this day.</p>
                    </div>
                  );
                }

                return daySessions.map(session => (
                  <Card 
                    key={session.id} 
                    className={`border-none cursor-pointer transition-colors ${
                      session.status === 'open' ? 'bg-green-700/20 hover:bg-green-700/30' :
                      session.status === 'full' ? 'bg-red-700/20 hover:bg-red-700/30' :
                      session.status === 'closed' ? 'bg-zinc-700/20 hover:bg-zinc-700/30' :
                      'bg-blue-700/20 hover:bg-blue-700/30'
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
                        <CardTitle className="text-white text-lg">{session.title}</CardTitle>
                        <Badge 
                          variant={session.status === 'open' ? 'default' : 'secondary'}
                          className="capitalize"
                        >
                          {session.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-4 text-zinc-300">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{format(new Date(session.startTime), 'h:mm a')} - {format(new Date(session.endTime), 'h:mm a')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{session.location}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-zinc-300 border-zinc-600">
                            {session.ageGroups?.join(', ') || 'N/A'}
                          </Badge>
                          <Badge variant="outline" className="text-zinc-300 border-zinc-600 capitalize">
                            {session.genders?.join(', ') || 'N/A'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-400">
                          <Users className="w-4 h-4" />
                          <span>{session.capacity} spots</span>
                        </div>
                      </div>
                      
                      <div className="text-sm text-zinc-400">
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
                                <p className="text-yellow-400 text-sm">
                                  Booking opens at {format12Hour(session.bookingOpenHour ?? 8, session.bookingOpenMinute ?? 0)} on {format(sessionDate, 'MMM d')}
                                </p>
                              </div>
                            );
                          } else if (!bookingOpen) {
                            return (
                              <div className="mt-3 p-2 bg-yellow-900/20 border border-yellow-600 rounded text-center">
                                <p className="text-yellow-400 text-sm">
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