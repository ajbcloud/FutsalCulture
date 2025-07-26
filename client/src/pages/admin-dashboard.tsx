import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navbar from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Users, DollarSign, BarChart3, Clock } from "lucide-react";
import { format } from "date-fns";
import { FutsalSession, HelpRequest } from "@shared/schema";

interface Analytics {
  totalPlayers: number;
  monthlyRevenue: number;
  avgFillRate: number;
  activeSessions: number;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user?.isAdmin)) {
      toast({
        title: "Unauthorized",
        description: "Admin access required",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  const { data: analytics, isLoading: analyticsLoading } = useQuery<Analytics>({
    queryKey: ["/api/admin/analytics"],
    enabled: isAuthenticated && user?.isAdmin,
  });

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<FutsalSession[]>({
    queryKey: ["/api/sessions"],
    enabled: isAuthenticated && user?.isAdmin,
  });

  const { data: helpRequests = [], isLoading: helpLoading } = useQuery<HelpRequest[]>({
    queryKey: ["/api/admin/help-requests"],
    enabled: isAuthenticated && user?.isAdmin,
  });

  if (isLoading || analyticsLoading || sessionsLoading || helpLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated || !user?.isAdmin) {
    return null;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-green-500">Open</Badge>;
      case "full":
        return <Badge variant="destructive">Full</Badge>;
      case "closed":
        return <Badge variant="secondary">Closed</Badge>;
      default:
        return <Badge variant="outline">Upcoming</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <Button>Create Session</Button>
        </div>

        {/* Analytics Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-futsal-100 p-3 rounded-lg">
                  <Users className="w-6 h-6 text-futsal-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Players</p>
                  <p className="text-2xl font-semibold">{analytics?.totalPlayers || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Monthly Revenue</p>
                  <p className="text-2xl font-semibold">${analytics?.monthlyRevenue || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-brand-100 p-3 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-brand-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Avg Fill Rate</p>
                  <p className="text-2xl font-semibold">{analytics?.avgFillRate || 0}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Active Sessions</p>
                  <p className="text-2xl font-semibold">{analytics?.activeSessions || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Sessions Management */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Session Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sessions.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No sessions found.</p>
                  ) : (
                    sessions.slice(0, 10).map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div>
                              <h4 className="font-medium">{session.title}</h4>
                              <p className="text-sm text-gray-500">{session.location}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">
                                {format(new Date(session.startTime), 'MMM d, yyyy h:mm a')}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Capacity</p>
                            <div className="flex items-center space-x-2">
                              <Progress value={0} className="w-16" />
                              <span className="text-sm">0/{session.capacity}</span>
                            </div>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Revenue</p>
                            <p className="font-medium">$0</p>
                          </div>
                          {getStatusBadge(session.status)}
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">Edit</Button>
                            <Button variant="outline" size="sm">Refunds</Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Help Requests */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Help Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {helpRequests.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No help requests.</p>
                ) : (
                  helpRequests.slice(0, 5).map((request) => (
                    <div key={request.id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium">{request.name}</h5>
                        <Badge variant={request.resolved ? "default" : "secondary"}>
                          {request.resolved ? "Resolved" : "Open"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{request.email}</p>
                      <p className="text-sm">{request.note.substring(0, 100)}...</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
