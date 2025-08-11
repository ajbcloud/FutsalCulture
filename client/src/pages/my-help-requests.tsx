import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Navbar from "@/components/navbar";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ArrowLeft, Mail, Phone, Calendar, MessageSquare, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Link } from "wouter";

interface HelpRequest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  subject: string;
  category: string;
  priority: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  resolved: boolean;
  resolvedAt?: string;
  resolutionNote?: string;
  createdAt: string;
  source?: string;
}

const statusConfig = {
  open: { 
    label: 'Open', 
    icon: Clock, 
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
  },
  in_progress: { 
    label: 'In Progress', 
    icon: AlertCircle, 
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' 
  },
  resolved: { 
    label: 'Resolved', 
    icon: CheckCircle, 
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
  },
  closed: { 
    label: 'Closed', 
    icon: CheckCircle, 
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' 
  }
};

const priorityConfig = {
  low: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
  medium: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  high: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
  urgent: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' }
};

const categoryConfig = {
  general: 'General',
  booking: 'Booking',
  payment: 'Payment',
  technical: 'Technical',
  account: 'Account',
  feature_request: 'Feature Request'
};

export default function MyHelpRequests() {
  const { user } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<HelpRequest | null>(null);

  const { data: helpRequests, isLoading } = useQuery<HelpRequest[]>({
    queryKey: ['/api/help/my-requests'],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your help requests...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedRequest) {
    const statusInfo = statusConfig[selectedRequest.status];
    const StatusIcon = statusInfo.icon;

    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <Button 
                variant="ghost" 
                onClick={() => setSelectedRequest(null)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Requests
              </Button>
            </div>

            <Card className="bg-card border border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-foreground text-xl">
                    Help Request Details
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={statusInfo.color}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusInfo.label}
                    </Badge>
                    <Badge className={priorityConfig[selectedRequest.priority as keyof typeof priorityConfig].color}>
                      {selectedRequest.priority.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <span>Contact Information</span>
                    </div>
                    <div className="pl-6">
                      <p className="text-foreground font-medium">
                        {selectedRequest.firstName} {selectedRequest.lastName}
                      </p>
                      <p className="text-muted-foreground">{selectedRequest.email}</p>
                      {selectedRequest.phone && (
                        <p className="text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {selectedRequest.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Request Details</span>
                    </div>
                    <div className="pl-6">
                      <p className="text-foreground">
                        <span className="font-medium">Category:</span> {categoryConfig[selectedRequest.category as keyof typeof categoryConfig]}
                      </p>
                      <p className="text-foreground">
                        <span className="font-medium">Submitted:</span> {format(new Date(selectedRequest.createdAt), 'PPp')}
                      </p>
                      {selectedRequest.resolvedAt && (
                        <p className="text-foreground">
                          <span className="font-medium">Resolved:</span> {format(new Date(selectedRequest.resolvedAt), 'PPp')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div>
                    <h3 className="text-foreground font-semibold text-lg mb-2">Subject</h3>
                    <p className="text-foreground">{selectedRequest.subject}</p>
                  </div>

                  <div>
                    <h3 className="text-foreground font-semibold text-lg mb-2">Message</h3>
                    <div className="bg-muted/50 p-4 rounded-lg border border-border">
                      <p className="text-foreground whitespace-pre-wrap">{selectedRequest.message}</p>
                    </div>
                  </div>

                  {selectedRequest.resolutionNote && (
                    <div>
                      <h3 className="text-foreground font-semibold text-lg mb-2 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        Resolution
                      </h3>
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
                        <p className="text-foreground whitespace-pre-wrap">{selectedRequest.resolutionNote}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-foreground text-2xl font-bold">My Help Requests</h1>
              <p className="text-muted-foreground">View and track your submitted help requests</p>
            </div>
            <Link href="/help">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <MessageSquare className="w-4 h-4 mr-2" />
                Submit New Request
              </Button>
            </Link>
          </div>

          {!helpRequests || helpRequests.length === 0 ? (
            <Card className="bg-card border border-border">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-foreground text-lg font-semibold mb-2">No help requests found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  You haven't submitted any help requests yet.
                </p>
                <Link href="/help">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Submit Your First Request
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {helpRequests.map((request: HelpRequest) => {
                const statusInfo = statusConfig[request.status];
                const StatusIcon = statusInfo.icon;

                return (
                  <Card 
                    key={request.id} 
                    className="bg-card border border-border hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedRequest(request)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-foreground font-semibold truncate">
                              {request.subject}
                            </h3>
                            <Badge className={statusInfo.color}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusInfo.label}
                            </Badge>
                            <Badge className={priorityConfig[request.priority as keyof typeof priorityConfig].color}>
                              {request.priority.toUpperCase()}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                            <span>{categoryConfig[request.category as keyof typeof categoryConfig]}</span>
                            <span>•</span>
                            <span>{format(new Date(request.createdAt), 'MMM d, yyyy')}</span>
                            {request.resolvedAt && (
                              <>
                                <span>•</span>
                                <span className="text-green-600">
                                  Resolved {format(new Date(request.resolvedAt), 'MMM d, yyyy')}
                                </span>
                              </>
                            )}
                          </div>
                          
                          <p className="text-muted-foreground text-sm line-clamp-2">
                            {request.message}
                          </p>
                        </div>
                        
                        <Button variant="ghost" size="sm" className="ml-4">
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}