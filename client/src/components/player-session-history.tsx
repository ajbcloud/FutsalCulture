import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { RefreshCw, DollarSign, Calendar, MapPin, CreditCard, AlertTriangle, Undo2, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface PlayerSessionHistoryProps {
  playerId: string;
  playerName: string;
}

interface SessionWithPayment {
  session: {
    id: string;
    title: string;
    date: string;
    endTime: string;
    location: string;
    locationName: string;
    capacity: number;
    priceCents: number;
  };
  payment: {
    id: string;
    processor: 'stripe' | 'braintree';
    processorPaymentId: string;
    amountCents: number;
    currency: string;
    status: string;
    capturedAt: string | null;
    voidedAt: string | null;
    refundedAt: string | null;
    refundAmountCents: number;
    createdAt: string;
    meta: any;
    refunds: Array<{
      refundId: string;
      processorRefundId: string;
      amountCents: number;
      reason: string;
      status: string;
      createdAt: string;
      initiatedByUserId: string;
    }>;
  } | null;
}

export function PlayerSessionHistory({ playerId, playerName }: PlayerSessionHistoryProps) {
  const [isVoidDialogOpen, setIsVoidDialogOpen] = useState(false);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [voidReason, setVoidReason] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch player's session history with payments
  const { data: sessionHistory, isLoading, error } = useQuery({
    queryKey: ['/api/admin/players', playerId, 'sessions-with-payments'],
    queryFn: () => apiRequest('GET', `/api/admin/players/${playerId}/sessions-with-payments`).then(res => res.json()),
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
  });

  // Void payment mutation
  const voidPaymentMutation = useMutation({
    mutationFn: (data: { paymentId: string; reason?: string }) =>
      apiRequest('POST', `/api/admin/payments/${data.paymentId}/void`, {
        reason: data.reason
      }).then(res => res.json()),
    onSuccess: (data) => {
      toast({
        title: "Payment Voided Successfully",
        description: `Transaction ${data.transactionId} has been voided.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/players', playerId, 'sessions-with-payments'] });
      setIsVoidDialogOpen(false);
      setVoidReason('');
      setSelectedPayment(null);
    },
    onError: (error: any) => {
      toast({
        title: "Void Failed",
        description: error.response?.data?.message || 'Failed to void payment. Please try again.',
        variant: "destructive",
      });
    },
  });

  // Refund payment mutation
  const refundPaymentMutation = useMutation({
    mutationFn: (data: { paymentId: string; amountCents?: number; reason?: string }) =>
      apiRequest('POST', `/api/admin/payments/${data.paymentId}/refund`, {
        amountCents: data.amountCents,
        reason: data.reason
      }).then(res => res.json()),
    onSuccess: (data) => {
      toast({
        title: "Payment Refunded Successfully",
        description: `Refund of $${(data.amountCents / 100).toFixed(2)} has been processed.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/players', playerId, 'sessions-with-payments'] });
      setIsRefundDialogOpen(false);
      setRefundAmount('');
      setRefundReason('');
      setSelectedPayment(null);
    },
    onError: (error: any) => {
      toast({
        title: "Refund Failed",
        description: error.response?.data?.message || 'Failed to process refund. Please try again.',
        variant: "destructive",
      });
    },
  });

  const handleVoidPayment = () => {
    if (!selectedPayment) return;
    voidPaymentMutation.mutate({
      paymentId: selectedPayment.id,
      reason: voidReason
    });
  };

  const handleRefundPayment = () => {
    if (!selectedPayment) return;
    const amountCents = refundAmount ? Math.round(parseFloat(refundAmount) * 100) : undefined;
    refundPaymentMutation.mutate({
      paymentId: selectedPayment.id,
      amountCents,
      reason: refundReason
    });
  };

  const openVoidDialog = (payment: any) => {
    setSelectedPayment(payment);
    setIsVoidDialogOpen(true);
  };

  const openRefundDialog = (payment: any) => {
    setSelectedPayment(payment);
    setRefundAmount('');
    setRefundReason('');
    setIsRefundDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'settled':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
      case 'authorized':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'voided':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'refunded':
      case 'partial_refunded':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const canVoidPayment = (payment: any) => {
    const voidableStatuses = ['authorized', 'submitted_for_settlement'];
    return voidableStatuses.includes(payment.status);
  };

  const canRefundPayment = (payment: any) => {
    const refundableStatuses = ['settled', 'settling', 'paid'];
    return refundableStatuses.includes(payment.status) && payment.refundAmountCents < payment.amountCents;
  };

  const getMaxRefundAmount = (payment: any) => {
    return (payment.amountCents - payment.refundAmountCents) / 100;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8" data-testid="loading-spinner">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading session history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 dark:border-red-800" data-testid="error-message">
        <CardContent className="pt-6">
          <div className="flex items-center text-red-600 dark:text-red-400">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Failed to load session history. Please try again.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4" data-testid="player-session-history">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold" data-testid="history-title">
          {playerName}'s Session History
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/players', playerId, 'sessions-with-payments'] })}
          data-testid="refresh-button"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {!sessionHistory || sessionHistory.length === 0 ? (
        <Card data-testid="no-sessions-message">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No session history found for this player.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sessionHistory.map((item: SessionWithPayment, index: number) => (
            <Card key={`session-${item.session.id}-${index}`} className="relative" data-testid={`session-card-${index}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base" data-testid={`session-title-${index}`}>
                      {item.session.title}
                    </CardTitle>
                    <div className="flex items-center text-sm text-muted-foreground space-x-4">
                      <div className="flex items-center" data-testid={`session-date-${index}`}>
                        <Calendar className="h-3 w-3 mr-1" />
                        {format(new Date(item.session.date), 'MMM d, yyyy h:mm a')}
                      </div>
                      <div className="flex items-center" data-testid={`session-location-${index}`}>
                        <MapPin className="h-3 w-3 mr-1" />
                        {item.session.locationName || item.session.location}
                      </div>
                    </div>
                  </div>
                  <div className="text-right" data-testid={`session-price-${index}`}>
                    <div className="text-lg font-semibold">
                      ${(item.session.priceCents / 100).toFixed(2)}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {item.payment ? (
                  <div className="space-y-4">
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium flex items-center" data-testid={`payment-info-${index}`}>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Payment Information
                        </h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Payment ID:</span>
                            <span className="font-mono text-xs" data-testid={`payment-id-${index}`}>
                              {item.payment.processorPaymentId.slice(-8)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Processor:</span>
                            <span className="capitalize" data-testid={`payment-processor-${index}`}>
                              {item.payment.processor}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Amount:</span>
                            <span data-testid={`payment-amount-${index}`}>
                              ${(item.payment.amountCents / 100).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Status:</span>
                            <Badge className={getStatusColor(item.payment.status)} data-testid={`payment-status-${index}`}>
                              {item.payment.status}
                            </Badge>
                          </div>
                          {item.payment.refundAmountCents > 0 && (
                            <div className="flex justify-between">
                              <span>Refunded:</span>
                              <span className="text-blue-600 dark:text-blue-400" data-testid={`refund-amount-${index}`}>
                                ${(item.payment.refundAmountCents / 100).toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">Payment Actions</h4>
                        <div className="flex flex-wrap gap-2">
                          {canVoidPayment(item.payment) && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-orange-600 border-orange-200 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-800 dark:hover:bg-orange-950"
                                  data-testid={`void-button-${index}`}
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Void
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Void Payment</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to void this payment? This action cannot be undone.
                                    This will cancel the payment before it settles.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => openVoidDialog(item.payment)}
                                    className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700"
                                  >
                                    Void Payment
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}

                          {canRefundPayment(item.payment) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openRefundDialog(item.payment)}
                              className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-950"
                              data-testid={`refund-button-${index}`}
                            >
                              <Undo2 className="h-3 w-3 mr-1" />
                              Refund
                            </Button>
                          )}

                          {item.payment.status === 'voided' && (
                            <Badge variant="secondary" data-testid={`voided-badge-${index}`}>
                              Payment Voided
                            </Badge>
                          )}

                          {item.payment.status === 'refunded' && (
                            <Badge variant="secondary" data-testid={`refunded-badge-${index}`}>
                              Fully Refunded
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Refund History */}
                    {item.payment.refunds && item.payment.refunds.length > 0 && (
                      <div className="space-y-2">
                        <Separator />
                        <h4 className="font-medium">Refund History</h4>
                        <div className="space-y-2">
                          {item.payment.refunds.map((refund, refundIndex) => (
                            <div
                              key={refund.refundId}
                              className="flex justify-between items-center p-2 bg-blue-50 dark:bg-blue-950 rounded"
                              data-testid={`refund-history-${index}-${refundIndex}`}
                            >
                              <div className="text-sm">
                                <div className="font-medium">${(refund.amountCents / 100).toFixed(2)}</div>
                                <div className="text-muted-foreground">
                                  {format(new Date(refund.createdAt), 'MMM d, yyyy h:mm a')}
                                </div>
                                {refund.reason && (
                                  <div className="text-xs text-muted-foreground">Reason: {refund.reason}</div>
                                )}
                              </div>
                              <Badge className={getStatusColor(refund.status)}>
                                {refund.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="pt-2">
                    <div className="text-sm text-muted-foreground text-center py-4">
                      No payment information available for this session
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Void Dialog */}
      <Dialog open={isVoidDialogOpen} onOpenChange={setIsVoidDialogOpen}>
        <DialogContent data-testid="void-dialog">
          <DialogHeader>
            <DialogTitle>Void Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="void-reason">Reason for Void (Optional)</Label>
              <Textarea
                id="void-reason"
                placeholder="Enter the reason for voiding this payment..."
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                data-testid="void-reason-input"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsVoidDialogOpen(false)}
                data-testid="cancel-void-button"
              >
                Cancel
              </Button>
              <Button
                onClick={handleVoidPayment}
                disabled={voidPaymentMutation.isPending}
                className="bg-orange-600 hover:bg-orange-700"
                data-testid="confirm-void-button"
              >
                {voidPaymentMutation.isPending ? 'Processing...' : 'Void Payment'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
        <DialogContent data-testid="refund-dialog">
          <DialogHeader>
            <DialogTitle>Refund Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedPayment && (
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span>Original Amount:</span>
                    <span>${(selectedPayment.amountCents / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Already Refunded:</span>
                    <span>${(selectedPayment.refundAmountCents / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Max Refundable:</span>
                    <span>${getMaxRefundAmount(selectedPayment).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="refund-amount">Refund Amount (USD)</Label>
              <Input
                id="refund-amount"
                type="number"
                min="0"
                max={selectedPayment ? getMaxRefundAmount(selectedPayment) : 0}
                step="0.01"
                placeholder={selectedPayment ? `Max: $${getMaxRefundAmount(selectedPayment).toFixed(2)}` : '0.00'}
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                data-testid="refund-amount-input"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty for full refund of remaining amount
              </p>
            </div>
            <div>
              <Label htmlFor="refund-reason">Reason for Refund (Optional)</Label>
              <Textarea
                id="refund-reason"
                placeholder="Enter the reason for this refund..."
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                data-testid="refund-reason-input"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsRefundDialogOpen(false)}
                data-testid="cancel-refund-button"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRefundPayment}
                disabled={refundPaymentMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="confirm-refund-button"
              >
                {refundPaymentMutation.isPending ? 'Processing...' : 'Process Refund'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}