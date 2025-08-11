import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { format } from 'date-fns';
import { 
  CalendarDays, 
  Clock, 
  CreditCard, 
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Pagination } from './pagination';

interface SessionHistoryItem {
  id: string;
  sessionName: string;
  date: string;
  time: string;
  paid: boolean;
  paymentId?: string;
  paymentProvider?: 'stripe' | 'braintree';
  createdAt: string;
}

interface PlayerSessionHistoryDropdownProps {
  playerId: string;
  sessionCount: number;
  playerName: string;
}

export function PlayerSessionHistoryDropdown({ 
  playerId, 
  sessionCount, 
  playerName 
}: PlayerSessionHistoryDropdownProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const itemsPerPage = 20;

  const { data: sessionHistory, isLoading } = useQuery({
    queryKey: ['player-session-history', playerId, currentPage],
    queryFn: async () => {
      const response = await fetch(`/api/admin/players/${playerId}/session-history?page=${currentPage}&limit=${itemsPerPage}`);
      if (!response.ok) {
        throw new Error('Failed to fetch session history');
      }
      return response.json();
    },
    enabled: isOpen, // Only fetch when dropdown is opened
  });

  const totalPages = sessionHistory ? Math.ceil(sessionHistory.total / itemsPerPage) : 0;

  const handleRefund = async (signupId: string, paymentId: string, paymentProvider: string) => {
    // TODO: Implement refund functionality
    console.log('Refund requested:', { signupId, paymentId, paymentProvider });
  };

  const formatTransactionId = (paymentId: string, provider?: string) => {
    if (!paymentId) return 'N/A';
    if (provider === 'stripe') {
      return `pi_${paymentId.substring(3, 15)}...`;
    } else if (provider === 'braintree') {
      return `bt_${paymentId.substring(0, 12)}...`;
    }
    return paymentId.substring(0, 15) + '...';
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="h-auto p-1 text-blue-400 hover:text-blue-300 hover:bg-transparent underline cursor-pointer font-inherit"
          data-testid={`button-session-history-${playerId}`}
        >
          {sessionCount}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-[500px] max-h-[600px] overflow-hidden"
        data-testid={`dropdown-session-history-${playerId}`}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold">
              Session History - {playerName}
            </h4>
            <Badge variant="secondary">{sessionCount} Total</Badge>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              Loading session history...
            </div>
          ) : (
            <>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {sessionHistory?.sessions?.map((session: SessionHistoryItem) => (
                  <div 
                    key={session.id} 
                    className="border rounded-lg p-3 space-y-2"
                    data-testid={`session-history-item-${session.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-sm">{session.sessionName}</h5>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                          <div className="flex items-center">
                            <CalendarDays className="w-3 h-3 mr-1" />
                            {format(new Date(session.date), 'MMM d, yyyy')}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {session.time}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={session.paid ? "success" : "destructive"}
                          data-testid={`status-${session.id}`}
                        >
                          {session.paid ? 'Paid' : 'Unpaid'}
                        </Badge>
                      </div>
                    </div>

                    {session.paid && session.paymentId && (
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <CreditCard className="w-3 h-3" />
                          <span className="font-mono">
                            {formatTransactionId(session.paymentId, session.paymentProvider)}
                          </span>
                          {session.paymentProvider && (
                            <Badge variant="outline" className="text-xs">
                              {session.paymentProvider}
                            </Badge>
                          )}
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="h-6 text-xs"
                          onClick={() => handleRefund(session.id, session.paymentId!, session.paymentProvider!)}
                          data-testid={`button-refund-${session.id}`}
                        >
                          Refund
                        </Button>
                      </div>
                    )}
                  </div>
                ))}

                {sessionHistory?.sessions?.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No sessions found for this player
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-xs text-muted-foreground">
                    Page {currentPage} of {totalPages} 
                    ({sessionHistory?.total} total sessions)
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="h-6 w-6 p-0"
                      data-testid="button-prev-page"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="h-6 w-6 p-0"
                      data-testid="button-next-page"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}