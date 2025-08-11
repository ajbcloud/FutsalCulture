import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, X } from 'lucide-react';

interface CancelBookingButtonProps {
  sessionId: string;
  playerId: string;
  sessionTitle: string;
  sessionDate: string;
  paymentAmount?: number;
  hasPayment?: boolean;
  onCancelled?: () => void;
}

export function CancelBookingButton({ 
  sessionId, 
  playerId, 
  sessionTitle, 
  sessionDate, 
  paymentAmount,
  hasPayment = false,
  onCancelled 
}: CancelBookingButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const cancelBookingMutation = useMutation({
    mutationFn: (data: { sessionId: string; playerId: string; reason?: string }) =>
      apiRequest('POST', '/api/cancel-booking', {
        sessionId: data.sessionId,
        playerId: data.playerId,
        reason: data.reason
      }).then(res => res.json()),
    onSuccess: (data) => {
      toast({
        title: "Booking Cancelled Successfully",
        description: hasPayment 
          ? "Your refund will be processed within 2-5 business days to your original payment method."
          : "Your booking has been cancelled.",
      });
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      
      setIsDialogOpen(false);
      setCancellationReason('');
      
      if (onCancelled) {
        onCancelled();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Cancellation Failed",
        description: error.response?.data?.message || 'Failed to cancel booking. Please try again or contact support.',
        variant: "destructive",
      });
    },
  });

  const handleCancel = () => {
    cancelBookingMutation.mutate({
      sessionId,
      playerId,
      reason: cancellationReason
    });
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
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950"
          data-testid="cancel-booking-button"
        >
          <X className="h-3 w-3 mr-1" />
          Cancel
        </Button>
      </DialogTrigger>
      
      <DialogContent className="bg-card border-border max-w-md" data-testid="cancel-booking-dialog">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
            Cancel Booking
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium text-foreground mb-2">Session Details</h4>
            <div className="space-y-1 text-sm">
              <div><strong>Session:</strong> {sessionTitle}</div>
              <div><strong>Date:</strong> {formatDate(sessionDate)}</div>
              {hasPayment && paymentAmount && (
                <div><strong>Paid Amount:</strong> ${(paymentAmount / 100).toFixed(2)}</div>
              )}
            </div>
          </div>

          {hasPayment && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                    Refund Information
                  </p>
                  <p className="text-blue-700 dark:text-blue-300">
                    Your refund will be processed automatically and should appear on your original payment method within 2-5 business days.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="reason" className="text-muted-foreground">
              Reason for Cancellation (Optional)
            </Label>
            <Textarea
              id="reason"
              placeholder="Let us know why you're cancelling..."
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              className="bg-input border-border text-foreground mt-1"
              data-testid="cancellation-reason-input"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={cancelBookingMutation.isPending}
              data-testid="cancel-dialog-button"
            >
              Keep Booking
            </Button>
            <Button
              onClick={handleCancel}
              disabled={cancelBookingMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
              data-testid="confirm-cancel-button"
            >
              {cancelBookingMutation.isPending ? 'Cancelling...' : 'Cancel Booking'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}