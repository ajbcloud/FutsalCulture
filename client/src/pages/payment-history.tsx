import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { DollarSign, Receipt, AlertCircle, CheckCircle } from "lucide-react";
import { useUserTerminology } from "@/hooks/use-user-terminology";

interface Payment {
  id: string;
  paidAt: string;
  paymentAmount: number;
  paymentStatus: string;
  paymentProvider: string;
  paymentIntentId: string;
  discountCodeApplied?: string;
  discountAmountCents?: number;
  refundedAt?: string;
  refundReason?: string;
  player: {
    id: string;
    firstName: string;
    lastName: string;
    birthYear: number;
    gender: string;
  };
  session: {
    id: string;
    title: string;
    location: string;
    startTime: string;
    endTime: string;
    priceCents: number;
  };
  parent: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function PaymentHistory() {
  const { term } = useUserTerminology();

  const { data: payments = [], isLoading } = useQuery<Payment[]>({
    queryKey: ["/api/my/payments"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  const totalPaid = payments.reduce((sum, p) => sum + (p.paymentAmount || 0), 0) / 100;
  const totalRefunded = payments
    .filter(p => p.refundedAt)
    .reduce((sum, p) => sum + (p.paymentAmount || 0), 0) / 100;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3 mb-2">
            <Receipt className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Payment History</h1>
          </div>
          <p className="text-muted-foreground">
            View all your payment transactions and booking history
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Payments</CardDescription>
              <CardTitle className="text-3xl">{payments.length}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Paid</CardDescription>
              <CardTitle className="text-3xl text-green-600 dark:text-green-400">
                ${totalPaid.toFixed(2)}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Refunded</CardDescription>
              <CardTitle className="text-3xl text-orange-600 dark:text-orange-400">
                ${totalRefunded.toFixed(2)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Payment History Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              All payments associated with your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No payment history yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Player</TableHead>
                      <TableHead>Session</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Transaction ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id} data-testid={`payment-row-${payment.id}`}>
                        <TableCell data-testid={`payment-date-${payment.id}`}>
                          {payment.paidAt ? format(new Date(payment.paidAt), "MMM d, yyyy h:mm a") : "N/A"}
                        </TableCell>
                        <TableCell data-testid={`payment-player-${payment.id}`}>
                          <div>
                            <div className="font-medium">
                              {payment.player.firstName} {payment.player.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {payment.player.gender === "boys" ? "Male" : "Female"} • {new Date().getFullYear() - payment.player.birthYear} yrs
                            </div>
                          </div>
                        </TableCell>
                        <TableCell data-testid={`payment-session-${payment.id}`}>
                          <div>
                            <div className="font-medium">{payment.session.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {payment.session.location} • {format(new Date(payment.session.startTime), "MMM d, h:mm a")}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell data-testid={`payment-amount-${payment.id}`}>
                          <div className="font-medium">
                            ${((payment.paymentAmount || 0) / 100).toFixed(2)}
                          </div>
                          {payment.session.priceCents && payment.session.priceCents !== payment.paymentAmount && (
                            <div className="text-sm text-muted-foreground line-through">
                              ${(payment.session.priceCents / 100).toFixed(2)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell data-testid={`payment-discount-${payment.id}`}>
                          {payment.discountCodeApplied ? (
                            <div>
                              <Badge variant="secondary" className="mb-1">
                                {payment.discountCodeApplied}
                              </Badge>
                              <div className="text-sm text-green-600 dark:text-green-400">
                                -${((payment.discountAmountCents || 0) / 100).toFixed(2)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell data-testid={`payment-method-${payment.id}`}>
                          <Badge variant="outline" className="capitalize">
                            {payment.paymentProvider || "Unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell data-testid={`payment-status-${payment.id}`}>
                          {payment.refundedAt ? (
                            <div>
                              <Badge variant="destructive" className="mb-1">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Refunded
                              </Badge>
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(payment.refundedAt), "MMM d, yyyy")}
                              </div>
                              {payment.refundReason && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {payment.refundReason}
                                </div>
                              )}
                            </div>
                          ) : (
                            <Badge variant="default" className="bg-green-600 dark:bg-green-700">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Paid
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell data-testid={`payment-txn-${payment.id}`}>
                          <div className="text-xs font-mono text-muted-foreground">
                            {payment.paymentIntentId ? (
                              <span title={payment.paymentIntentId}>
                                {payment.paymentIntentId.substring(0, 20)}...
                              </span>
                            ) : (
                              "—"
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
