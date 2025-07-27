import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin-layout';
import { adminPayments } from '@/lib/adminApi';
import { queryClient } from '@/lib/queryClient';
import { usePageRefresh } from '@/hooks/use-page-refresh';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { AGE_GROUPS, calculateAgeGroupFromAge } from '@shared/constants';

export default function AdminPayments() {
  const [pendingPayments, setPendingPayments] = useState([]);
  const [paidPayments, setPaidPayments] = useState([]);
  const [filteredPendingPayments, setFilteredPendingPayments] = useState([]);
  const [filteredPaidPayments, setFilteredPaidPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    ageGroup: '',
    gender: '',
    search: '',
    dateRange: ''
  });
  const { toast } = useToast();
  
  // Refresh payments data when returning to page
  usePageRefresh(["/api/admin/payments"]);

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
      setFilteredPendingPayments(pending);
      setFilteredPaidPayments(paid);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
    
    // Check for URL search parameter
    const urlParams = new URLSearchParams(window.location.search);
    const searchTerm = urlParams.get('search');
    
    if (searchTerm) {
      setFilters(prev => ({
        ...prev,
        search: searchTerm
      }));
    }
  }, []);

  useEffect(() => {
    const filterPayments = (payments: any[]) => {
      return payments.filter((payment: any) => {
        const player = payment.player;
        const age = new Date().getFullYear() - player.birthYear;
        const ageGroup = calculateAgeGroupFromAge(age);
        
        const matchesAgeGroup = !filters.ageGroup || filters.ageGroup === 'all' || ageGroup === filters.ageGroup;
        const matchesGender = !filters.gender || filters.gender === 'all' || player.gender === filters.gender;
        const matchesSearch = !filters.search || 
          player.firstName.toLowerCase().includes(filters.search.toLowerCase()) ||
          player.lastName.toLowerCase().includes(filters.search.toLowerCase()) ||
          payment.parent.firstName.toLowerCase().includes(filters.search.toLowerCase()) ||
          payment.parent.lastName.toLowerCase().includes(filters.search.toLowerCase());
        
        return matchesAgeGroup && matchesGender && matchesSearch;
      });
    };

    setFilteredPendingPayments(filterPayments(pendingPayments));
    setFilteredPaidPayments(filterPayments(paidPayments));
  }, [pendingPayments, paidPayments, filters]);

  const handleConfirmPayment = async (signupId: string) => {
    try {
      await adminPayments.confirm(signupId);
      toast({ title: "Payment confirmed successfully" });
      loadPayments(); // Refresh data
      
      // Refresh recent activity on dashboard
      queryClient.invalidateQueries({ queryKey: ['/api/admin/recent-activity'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard-metrics'] });
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

      {/* Filter Controls */}
      <div className="bg-zinc-900 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label className="text-zinc-300">Search</Label>
            <Input
              placeholder="Search players or parents..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>
          
          <div>
            <Label className="text-zinc-300">Age Group</Label>
            <Select value={filters.ageGroup} onValueChange={(value) => setFilters(prev => ({ ...prev, ageGroup: value }))}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="All Ages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ages</SelectItem>
                {AGE_GROUPS.map(age => (
                  <SelectItem key={age} value={age}>{age}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-zinc-300">Gender</Label>
            <Select value={filters.gender} onValueChange={(value) => setFilters(prev => ({ ...prev, gender: value }))}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="All Genders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="boys">Boys</SelectItem>
                <SelectItem value="girls">Girls</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="bg-zinc-800 border-zinc-700">
          <TabsTrigger value="pending" className="data-[state=active]:bg-zinc-700">
            Pending ({filteredPendingPayments.length})
          </TabsTrigger>
          <TabsTrigger value="paid" className="data-[state=active]:bg-zinc-700">
            Paid ({filteredPaidPayments.length})
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
                {filteredPendingPayments.map((payment: any) => (
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
                {filteredPaidPayments.map((payment: any) => (
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