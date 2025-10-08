import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Calendar, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TrialExtensionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentExtensions: number;
  maxExtensions: number;
}

export function TrialExtensionModal({
  isOpen,
  onClose,
  currentExtensions,
  maxExtensions,
}: TrialExtensionModalProps) {
  const { toast } = useToast();
  const [reason, setReason] = useState('');
  const remainingExtensions = maxExtensions - currentExtensions;

  const extendTrialMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/trial/extend', 'POST', { reason });
    },
    onSuccess: (data: any) => {
      toast({
        title: 'Trial Extended Successfully',
        description: `Your trial has been extended. New expiry: ${new Date(data.newTrialEndsAt).toLocaleDateString()}`,
      });
      // Invalidate trial status query to refresh the indicator
      queryClient.invalidateQueries({ queryKey: ['/api/trial/status'] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Extension Failed',
        description: error.message || 'Unable to extend trial. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleExtend = () => {
    if (reason.trim().length < 10) {
      toast({
        title: 'Reason Required',
        description: 'Please provide a brief reason for extending your trial (at least 10 characters).',
        variant: 'destructive',
      });
      return;
    }
    extendTrialMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]" data-testid="trial-extension-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Extend Your Trial
          </DialogTitle>
          <DialogDescription>
            You have {remainingExtensions} trial extension{remainingExtensions !== 1 ? 's' : ''} remaining.
            Each extension adds 7 days to your trial period.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Trial extensions are limited. We recommend upgrading to a paid plan for uninterrupted service.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="reason">Why do you need more time?</Label>
            <Textarea
              id="reason"
              placeholder="Please tell us why you need to extend your trial..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              data-testid="input-extension-reason"
            />
            <p className="text-xs text-muted-foreground">
              This helps us understand how to better serve you.
            </p>
          </div>

          {currentExtensions > 0 && (
            <p className="text-sm text-muted-foreground">
              You've used {currentExtensions} of {maxExtensions} available extensions.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={extendTrialMutation.isPending}
            data-testid="button-cancel-extension"
          >
            Cancel
          </Button>
          <Button
            onClick={handleExtend}
            disabled={extendTrialMutation.isPending || reason.trim().length < 10}
            data-testid="button-confirm-extension"
          >
            {extendTrialMutation.isPending ? 'Extending...' : 'Extend Trial (+7 days)'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}