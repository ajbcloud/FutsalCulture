import { format } from "date-fns";
import { Clock, MapPin, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { FutsalSession } from "@shared/schema";
import { getSessionStatusColor, getSessionStatusText } from "@shared/utils";

interface CalendarDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  sessions: FutsalSession[];
}

export default function CalendarDayModal({ 
  isOpen, 
  onClose, 
  selectedDate, 
  sessions 
}: CalendarDayModalProps) {
  if (!selectedDate) return null;

  const sessionsOnDate = sessions.filter(session => {
    const sessionDate = new Date(session.startTime);
    return sessionDate.toDateString() === selectedDate.toDateString();
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-700 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {sessionsOnDate.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-zinc-400 italic">No sessions scheduled for this date.</p>
            </div>
          ) : (
            sessionsOnDate.map(session => (
              <Link key={session.id} href={`/sessions/${session.id}`}>
                <Card className="bg-zinc-800 border-zinc-700 hover:bg-zinc-750 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Session Title and Status */}
                      <div className="flex justify-between items-start">
                        <h3 className="text-white font-medium text-lg">{session.title}</h3>
                        <Badge 
                          variant="outline" 
                          className={`${getSessionStatusColor(session.status)} border-0`}
                        >
                          {getSessionStatusText(session.status)}
                        </Badge>
                      </div>

                      {/* Session Details */}
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <div className="flex items-center gap-2 text-zinc-300">
                          <Clock className="w-4 h-4" />
                          <span>
                            {format(new Date(session.startTime), 'h:mm a')} - {format(new Date(session.endTime), 'h:mm a')}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-zinc-300">
                          <MapPin className="w-4 h-4" />
                          <span>{session.location}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-zinc-300">
                          <Users className="w-4 h-4" />
                          <span>
                            {session.signupsCount || 0}/{session.capacity} spots filled
                          </span>
                        </div>
                      </div>

                      {/* Age Group and Gender */}
                      <div className="flex gap-2">
                        <Badge variant="secondary" className="bg-zinc-700 text-zinc-300">
                          {session.ageGroup}
                        </Badge>
                        <Badge variant="secondary" className="bg-zinc-700 text-zinc-300">
                          {session.gender}
                        </Badge>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <span className="text-white font-semibold">
                          ${(session.priceCents / 100).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}