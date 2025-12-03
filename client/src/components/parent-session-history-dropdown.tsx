import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import { ChevronDown, Calendar, Clock, MapPin, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient, authFetch } from '@/lib/queryClient';

interface ParentSessionHistoryDropdownProps {
  playerId: string;
  sessionCount: number;
  playerName: string;
}

interface SessionHistoryData {
  sessions: Array<{
    id: string;
    sessionId: string;
    sessionName: string;
    date: string;
    time: string;
    location: string;
    paid: boolean;
    refunded?: boolean;
    paymentId?: string;
    paymentProvider?: string;
    refundReason?: string;
    refundedAt?: string;
    createdAt: string;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function ParentSessionHistoryDropdown({ 
  playerId, 
  sessionCount, 
  playerName 
}: ParentSessionHistoryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [refundReason, setRefundReason] = useState('');
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);
  
  const { toast } = useToast();

  const { data: historyData, isLoading, error } = useQuery<SessionHistoryData>({
    queryKey: [`/api/players/${playerId}/session-history`, currentPage],
    queryFn: async () => {
      const response = await authFetch(`/api/players/${playerId}/session-history?page=${currentPage}&limit=10`);
      if (!response.ok) {
        throw new Error('Failed to fetch session history');
      }
      return response.json();
    },
    enabled: isOpen && sessionCount > 0, // Only fetch when dropdown is open and there are sessions
  });

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleRefund = (session: any) => {
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
      queryClient.invalidateQueries({ queryKey: [`/api/players/${playerId}/session-history`, currentPage] });
      
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

  if (sessionCount === 0) {
    return (
      <span className="text-muted-foreground text-sm">
        0 sessions
      </span>
    );
  }

  return (
    <>
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-1 text-sm hover:bg-transparent text-blue-400 hover:text-blue-300 underline cursor-pointer font-inherit"
          data-testid={`button-session-history-${playerId}`}
        >
          {sessionCount} session{sessionCount !== 1 ? 's' : ''}
          <ChevronDown className="w-3 h-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-96 max-h-[500px] overflow-y-auto bg-card border-border"
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-foreground">
              {playerName}'s Session History
            </h4>
            <Badge variant="secondary" className="text-xs">
              {sessionCount} total
            </Badge>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : error ? (
            <div className="text-center py-4 text-muted-foreground">
              <p>Failed to load session history</p>
            </div>
          ) : !historyData?.sessions?.length ? (
            <div className="text-center py-4 text-muted-foreground">
              <p>No paid sessions found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {historyData.sessions.map((session) => (
                <div 
                  key={session.id} 
                  className="border border-border rounded-lg p-3 bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-foreground text-sm truncate">
                        {session.sessionName}
                      </h5>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Calendar className="w-3 h-3 shrink-0" />
                        <span>{format(new Date(session.date), 'MMM d, yyyy')}</span>
                        <Clock className="w-3 h-3 shrink-0 ml-1" />
                        <span>{session.time}</span>
                      </div>
                    </div>
                    <Badge 
                      variant={session.refunded ? "secondary" : "success"} 
                      className="text-xs shrink-0"
                    >
                      {session.refunded ? 'Refunded' : 'Paid'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span>{session.location}</span>
                    </div>
                    
                    {(session.paid || session.refunded) && session.paymentProvider && (
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CreditCard className="w-3 h-3" />
                          <span className="capitalize">{session.paymentProvider}</span>
                          {session.paymentId && (
                            <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
                              {session.paymentId}
                            </span>
                          )}
                        </div>
                        
                        {session.paid && !session.refunded && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-6 text-xs ml-2"
                            onClick={() => handleRefund(session)}
                          >
                            Refund
                          </Button>
                        )}
                        
                        {session.refunded && session.refundReason && (
                          <div className="text-xs text-muted-foreground">
                            Reason: {session.refundReason}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {historyData.totalPages > 1 && (
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="text-xs text-muted-foreground">
                    Page {historyData.page} of {historyData.totalPages}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= historyData.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
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