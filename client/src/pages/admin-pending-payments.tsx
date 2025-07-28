import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { Clock, Send, CheckCircle, User, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Navbar from "@/components/navbar";

interface PendingPayment {
  id: string;
  playerId: string;
  sessionId: string;
  paid: boolean;
  createdAt: string;
  player: {
    firstName: string;
    lastName: string;
  };
  session: {
    title: string;
    startTime: string;
    location: string;
  };
  parent: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
  };
}

export default function AdminPendingPayments() {
  const { toast } = useToast();
  
  const { data: pendingPayments = [], isLoading } = useQuery<PendingPayment[]>({
    queryKey: ["/api/admin/pending-payments"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const sendReminderMutation = useMutation({
    mutationFn: async (signupId: string) => {
      return apiRequest("POST", `/api/admin/send-reminder/${signupId}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Reminder Sent",
        description: "Payment reminder has been sent to the parent",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send reminder",
        variant: "destructive",
      });
    },
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: async (signupId: string) => {
      return apiRequest("PATCH", `/api/admin/confirm-payment/${signupId}`, {});
    },
    onSuccess: () => {
      // Invalidate all relevant queries to update dashboard
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/recent-activity"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Payment Confirmed",
        description: "Payment has been marked as confirmed",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to confirm payment",
        variant: "destructive",
      });
    },
  });

  const getTimeLeft = (createdAt: string) => {
    const created = new Date(createdAt);
    const expiry = new Date(created.getTime() + 60 * 60 * 1000); // 1 hour later
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return "Expired";

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m left`;
    }
    return `${remainingMinutes}m left`;
  };

  const isExpired = (createdAt: string) => {
    const created = new Date(createdAt);
    const expiry = new Date(created.getTime() + 60 * 60 * 1000);
    return new Date() > expiry;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Pending Payments</h1>
            <p className="text-gray-400 mt-2">
              Manage reservations awaiting Venmo payment confirmation
            </p>
          </div>
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {pendingPayments.length} pending
          </Badge>
        </div>

        {pendingPayments.length === 0 ? (
          <Card className="bg-zinc-900 border-zinc-700">
            <CardContent className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">All Caught Up!</h3>
              <p className="text-gray-400">No pending payments at the moment.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingPayments.map((payment) => (
              <Card key={payment.id} className={`bg-zinc-900 border-zinc-700 ${isExpired(payment.createdAt) ? 'border-red-500/50' : ''}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-white text-lg">
                        {payment.player.firstName} {payment.player.lastName}
                      </CardTitle>
                      <p className="text-gray-400">{payment.session.title}</p>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={isExpired(payment.createdAt) ? "destructive" : "secondary"}
                        className="mb-2"
                      >
                        {getTimeLeft(payment.createdAt)}
                      </Badge>
                      <p className="text-sm text-gray-400">
                        Reserved {format(new Date(payment.createdAt), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Session Details */}
                    <div>
                      <h4 className="font-medium text-white mb-2">Session Details</h4>
                      <div className="space-y-1 text-sm text-gray-300">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(payment.session.startTime), 'EEEE, MMMM d')}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {format(new Date(payment.session.startTime), 'h:mm a')}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-4 h-4 flex items-center justify-center">📍</span>
                          {payment.session.location}
                        </div>
                      </div>
                    </div>

                    {/* Parent Contact */}
                    <div>
                      <h4 className="font-medium text-white mb-2">Parent Contact</h4>
                      <div className="space-y-1 text-sm text-gray-300">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {payment.parent.firstName} {payment.parent.lastName}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-4 h-4 flex items-center justify-center">✉️</span>
                          {payment.parent.email}
                        </div>
                        {payment.parent.phoneNumber && (
                          <div className="flex items-center gap-2">
                            <span className="w-4 h-4 flex items-center justify-center">📱</span>
                            {payment.parent.phoneNumber}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => sendReminderMutation.mutate(payment.id)}
                      disabled={sendReminderMutation.isPending}
                      className="border-zinc-600"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Reminder
                    </Button>
                    <Button
                      onClick={() => confirmPaymentMutation.mutate(payment.id)}
                      disabled={confirmPaymentMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirm Payment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}