import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin-layout';
import { adminPayments } from '@/lib/adminApi';
import { Button } from '../../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { CheckCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function AdminPayments() {
  const [pendingPayments, setPendingPayments] = useState([]);
  const [paidPayments, setPaidPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadPayments = async () => {
    try {
      const [pending, paid] = await Promise.all([
        adminPayments.list('pending'),
        adminPayments.list('paid')
      ]);
      console.log('admin payments (pending):', pending);
      console.log('admin payments (paid):', paid);
      setPendingPayments(pending);
      setPaidPayments(paid);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const handleConfirmPayment = async (signupId: string) => {
    try {
      await adminPayments.confirm(signupId);
      toast({ title: "Payment confirmed successfully" });
      loadPayments(); // Refresh data
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast({ title: "Error confirming payment", variant: "destructive" });
    }
  };

  const handleRefund = async (paymentId: string) => {
    if (confirm('Are you sure you want to issue a refund?')) {
      try {
        await adminPayments.refund(paymentId);
        toast({ title: "Refund processed successfully" });
        loadPayments(); // Refresh data
      } catch (error) {
        console.error('Error processing refund:', error);
        toast({ title: "Error processing refund", variant: "destructive" });
      }
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-white mb-6">Payments & Refunds</h1>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="bg-zinc-800 border-zinc-700">
          <TabsTrigger value="pending" className="data-[state=active]:bg-zinc-700">
            Pending ({pendingPayments.length})
          </TabsTrigger>
          <TabsTrigger value="paid" className="data-[state=active]:bg-zinc-700">
            Paid ({paidPayments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <div className="bg-zinc-900 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800">
                  <TableHead className="text-zinc-300">Player</TableHead>
                  <TableHead className="text-zinc-300">Session</TableHead>
                  <TableHead className="text-zinc-300">Reserved At</TableHead>
                  <TableHead className="text-zinc-300">Amount</TableHead>
                  <TableHead className="text-zinc-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingPayments.map((payment: any) => (
                  <TableRow key={payment.id} className="border-zinc-800">
                    <TableCell className="text-white">
                      {payment.player?.firstName} {payment.player?.lastName}
                    </TableCell>
                    <TableCell className="text-zinc-300">
                      {payment.session?.title || 'Unknown Session'}
                    </TableCell>
                    <TableCell className="text-zinc-300">
                      {format(new Date(payment.createdAt), 'MMM d, yyyy h:mm a')}
                    </TableCell>
                    <TableCell className="text-zinc-300">$10.00</TableCell>
                    <TableCell>
                      <Button 
                        onClick={() => handleConfirmPayment(payment.id)}
                        className="bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Confirm Payment
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {pendingPayments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-zinc-400 py-8">
                      No pending payments
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="paid" className="mt-6">
          <div className="bg-zinc-900 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800">
                  <TableHead className="text-zinc-300">Player</TableHead>
                  <TableHead className="text-zinc-300">Session</TableHead>
                  <TableHead className="text-zinc-300">Paid At</TableHead>
                  <TableHead className="text-zinc-300">Amount</TableHead>
                  <TableHead className="text-zinc-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paidPayments.map((payment: any) => (
                  <TableRow key={payment.id} className="border-zinc-800">
                    <TableCell className="text-white">
                      {payment.player?.firstName} {payment.player?.lastName}
                    </TableCell>
                    <TableCell className="text-zinc-300">
                      {payment.session?.title || 'Unknown Session'}
                    </TableCell>
                    <TableCell className="text-zinc-300">
                      {payment.paidAt ? format(new Date(payment.paidAt), 'MMM d, yyyy h:mm a') : 'N/A'}
                    </TableCell>
                    <TableCell className="text-zinc-300">$10.00</TableCell>
                    <TableCell>
                      <Button 
                        onClick={() => handleRefund(payment.id)}
                        variant="outline"
                        className="text-red-400 hover:text-red-300"
                        size="sm"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refund
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {paidPayments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-zinc-400 py-8">
                      No paid transactions
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}