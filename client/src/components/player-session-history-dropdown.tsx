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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Pagination } from './pagination';

interface SessionHistoryItem {
  id: string;
  sessionName: string;
  date: string;
  time: string;
  paid: boolean;
  refunded?: boolean;
  paymentId?: string;
  paymentProvider?: 'stripe' | 'braintree';
  refundReason?: string;
  refundedAt?: string;
  createdAt: string;
  sessionDate?: string;
  sessionStartTime?: string;
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
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionHistoryItem | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);
  const itemsPerPage = 20;
  
  const { toast } = useToast();

  // Fetch system settings to get refund cutoff time
  const { data: systemSettings } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const response = await fetch('/api/admin/settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      return response.json();
    },
  });

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

  // Helper function to check if refund is allowed based on cutoff time
  const isRefundAllowed = (session: SessionHistoryItem): boolean => {
    // If session doesn't have proper date/time info, deny refund (be conservative)
    if (!session.sessionDate || !session.sessionStartTime) return false;
    
    // Parse session date and time as UTC
    const sessionDateTime = new Date(`${session.sessionDate}T${session.sessionStartTime}Z`);
    if (isNaN(sessionDateTime.getTime())) return false; // Invalid date, deny refund
    
    const now = new Date();
    
    // If session is in the past, deny refund
    if (sessionDateTime <= now) return false;
    
    // If no refund cutoff setting, allow refund for future sessions
    if (!systemSettings?.refundCutoffMinutes) return true;
    
    // Calculate cutoff time (session start time minus cutoff minutes)
    const cutoffTime = new Date(sessionDateTime.getTime() - (systemSettings.refundCutoffMinutes * 60 * 1000));
    
    // Allow refund if current time is before cutoff time
    return now < cutoffTime;
  };

  const handleRefund = (session: SessionHistoryItem) => {
    setSelectedSession(session);
    setRefundDialogOpen(true);
    setRefundReason('');
  };

  const processRefund = async () => {
    if (!selectedSession || !refundReason.trim()) {
      toast({
        title: "Refund Error",
        description: "Please provide a reason for the refund",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingRefund(true);
    try {
      const response = await apiRequest('POST', '/api/session-billing/refund', {
        signupId: selectedSession.id,
        reason: refundReason.trim(),
      });

      toast({
        title: "Refund Successful",
        description: "Payment has been refunded successfully",
      });

      // Refresh session history
      queryClient.invalidateQueries({ queryKey: ['player-session-history', playerId] });
      
      // Close dialog
      setRefundDialogOpen(false);
      setSelectedSession(null);
      setRefundReason('');

    } catch (error: any) {
      console.error('Refund error:', error);
      toast({
        title: "Refund Failed", 
        description: error.message || "Failed to process refund",
        variant: "destructive",
      });
    } finally {
      setIsProcessingRefund(false);
    }
  };

  const formatTransactionId = (paymentId: string, provider?: string) => {
    if (!paymentId) return 'N/A';
    // Return the exact transaction ID from the payment provider
    return paymentId;
  };

  return (
    <>
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
                          variant={session.refunded ? "secondary" : session.paid ? "success" : "destructive"}
                          data-testid={`status-${session.id}`}
                        >
                          {session.refunded ? 'Refunded' : session.paid ? 'Paid' : 'Unpaid'}
                        </Badge>
                      </div>
                    </div>

                    {(session.paid || session.refunded) && session.paymentId && (
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
                        {session.paid && !session.refunded && isRefundAllowed(session) && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-6 text-xs"
                            onClick={() => handleRefund(session)}
                            data-testid={`button-refund-${session.id}`}
                          >
                            Refund
                          </Button>
                        )}
                        {session.paid && !session.refunded && !isRefundAllowed(session) && (
                          <Badge variant="secondary" className="h-6 text-xs px-2">
                            Refund Expired
                          </Badge>
                        )}
                        {session.refunded && session.refundReason && (
                          <div className="text-xs text-muted-foreground">
                            Reason: {session.refundReason}
                          </div>
                        )}
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

    {/* Refund Confirmation Dialog */}
    <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Refund</DialogTitle>
          <DialogDescription>
            You are about to refund the payment for "{selectedSession?.sessionName}".
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="refund-reason">Refund Reason *</Label>
            <Textarea
              id="refund-reason"
              placeholder="Please provide a reason for this refund..."
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setRefundDialogOpen(false)}
            disabled={isProcessingRefund}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={processRefund}
            disabled={isProcessingRefund || !refundReason.trim()}
          >
            {isProcessingRefund ? 'Processing...' : 'Confirm Refund'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}