import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, DollarSign, Users, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MassRefundDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  sessionTitle: string;
  sessionDate: string;
  totalBookings?: number;
  totalRevenue?: number;
}

interface RefundSummary {
  totalRefunds: number;
  totalAmount: number;
  successfulRefunds: number;
  failedRefunds: number;
  refundDetails: Array<{
    playerId: string;
    playerName: string;
    amount: number;
    status: 'success' | 'failed';
    error?: string;
  }>;
}

export function MassRefundDialog({ 
  isOpen, 
  onClose, 
  sessionId, 
  sessionTitle, 
  sessionDate,
  totalBookings = 0,
  totalRevenue = 0 
}: MassRefundDialogProps) {
  const [refundReason, setRefundReason] = useState('');
  const [refundSummary, setRefundSummary] = useState<RefundSummary | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const massRefundMutation = useMutation({
    mutationFn: (data: { sessionId: string; reason: string }) =>
      apiRequest('POST', `/api/admin/sessions/${data.sessionId}/mass-refund`, {
        reason: data.reason
      }).then(res => res.json()),
    onSuccess: (data: RefundSummary) => {
      setRefundSummary(data);
      
      toast({
        title: "Mass Refund Completed",
        description: `Processed ${data.successfulRefunds} refunds totaling $${(data.totalAmount / 100).toFixed(2)}`,
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sessions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/analytics'] });
    },
    onError: (error: any) => {
      toast({
        title: "Mass Refund Failed",
        description: error.response?.data?.message || 'Failed to process mass refunds. Please try again.',
        variant: "destructive",
      });
    },
  });

  const handleMassRefund = () => {
    if (!refundReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for the mass refund.",
        variant: "destructive",
      });
      return;
    }

    massRefundMutation.mutate({
      sessionId,
      reason: refundReason
    });
  };

  const handleClose = () => {
    setRefundSummary(null);
    setRefundReason('');
    onClose();
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="mass-refund-dialog">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center">
            <DollarSign className="h-5 w-5 text-blue-500 mr-2" />
            Mass Refund - Session Cancellation
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Session Information */}
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium text-foreground mb-3">Session Details</h4>
            <div className="space-y-2 text-sm">
              <div><strong>Session:</strong> {sessionTitle}</div>
              <div><strong>Date:</strong> {formatDate(sessionDate)}</div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span><strong>Bookings:</strong> {totalBookings}</span>
                </div>
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span><strong>Total Revenue:</strong> ${(totalRevenue / 100).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {!refundSummary ? (
            <>
              {/* Warning */}
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                      ⚠️ Mass Refund Warning
                    </p>
                    <ul className="text-yellow-700 dark:text-yellow-300 space-y-1 list-disc list-inside">
                      <li>This will cancel ALL bookings for this session</li>
                      <li>Refunds will be processed automatically for all paid bookings</li>
                      <li>Refunds typically appear within 2-5 business days</li>
                      <li>This action cannot be undone</li>
                      <li>All affected customers will receive email notifications</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Reason Input */}
              <div>
                <Label htmlFor="refund-reason" className="text-muted-foreground">
                  Reason for Session Cancellation *
                </Label>
                <Textarea
                  id="refund-reason"
                  placeholder="e.g., Weather conditions, facility unavailable, instructor illness..."
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="bg-input border-border text-foreground mt-1"
                  rows={3}
                  data-testid="refund-reason-input"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This reason will be included in customer notifications
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={massRefundMutation.isPending}
                  data-testid="cancel-mass-refund-button"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleMassRefund}
                  disabled={massRefundMutation.isPending || !refundReason.trim()}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  data-testid="confirm-mass-refund-button"
                >
                  {massRefundMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Processing Refunds...
                    </>
                  ) : (
                    'Cancel Session & Refund All'
                  )}
                </Button>
              </div>
            </>
          ) : (
            /* Refund Summary */
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                  ✅ Mass Refund Completed
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total Refunds:</span>
                    <div className="font-medium">{refundSummary.totalRefunds}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Amount:</span>
                    <div className="font-medium">${(refundSummary.totalAmount / 100).toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Successful:</span>
                    <div className="font-medium text-green-600">{refundSummary.successfulRefunds}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Failed:</span>
                    <div className="font-medium text-red-600">{refundSummary.failedRefunds}</div>
                  </div>
                </div>
              </div>

              {/* Detailed Results */}
              {refundSummary.refundDetails.length > 0 && (
                <div>
                  <h4 className="font-medium text-foreground mb-3">Refund Details</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {refundSummary.refundDetails.map((detail, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted rounded border"
                        data-testid={`refund-detail-${index}`}
                      >
                        <div className="flex-1">
                          <div className="font-medium">{detail.playerName}</div>
                          <div className="text-sm text-muted-foreground">
                            ${(detail.amount / 100).toFixed(2)}
                            {detail.error && (
                              <span className="text-red-600 ml-2">- {detail.error}</span>
                            )}
                          </div>
                        </div>
                        <Badge 
                          variant={detail.status === 'success' ? 'default' : 'destructive'}
                          className={detail.status === 'success' ? 'bg-green-100 text-green-800' : ''}
                        >
                          {detail.status === 'success' ? 'Refunded' : 'Failed'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleClose}
                  data-testid="close-summary-button"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}