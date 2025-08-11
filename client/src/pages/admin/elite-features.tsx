import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Sparkles, Users, Phone, Mail } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import AdminLayout from '@/components/admin-layout';
import { useHasFeature, FeatureGuard, UpgradePrompt } from '@/hooks/use-feature-flags';
import { FEATURE_KEYS } from '@shared/schema';

interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  status: 'received' | 'under_review' | 'approved' | 'in_development' | 'released';
  statusNotes?: string;
  createdAt: string;
  updatedAt: string;
  submittedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function EliteFeatures() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { hasFeature: hasPlayerDevelopment } = useHasFeature(FEATURE_KEYS.PLAYER_DEVELOPMENT);
  
  // Feature Request State
  const [newRequest, setNewRequest] = useState({
    title: '',
    description: ''
  });

  // Fetch feature requests
  const { data: featureRequests, isLoading: requestsLoading } = useQuery<FeatureRequest[]>({
    queryKey: ['/api/feature-requests']
  });

  // Feature request mutation
  const featureRequestMutation = useMutation({
    mutationFn: async (request: { title: string; description: string }) => {
      return apiRequest('/api/feature-requests', {
        method: 'POST',
        body: JSON.stringify(request)
      });
    },
    onSuccess: () => {
      toast({
        title: "Feature request submitted",
        description: "Your request has been submitted to our development team."
      });
      setNewRequest({ title: '', description: '' });
      queryClient.invalidateQueries({ queryKey: ['/api/feature-requests'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error submitting request",
        description: error.message || "Failed to submit feature request.",
        variant: "destructive"
      });
    }
  });

  const handleFeatureRequest = () => {
    if (!newRequest.title.trim() || !newRequest.description.trim()) {
      toast({
        title: "Validation error",
        description: "Please fill in both title and description.",
        variant: "destructive"
      });
      return;
    }
    featureRequestMutation.mutate(newRequest);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received': return 'bg-blue-100 text-blue-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'in_development': return 'bg-purple-100 text-purple-800';
      case 'released': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'received': return 'Received';
      case 'under_review': return 'Under Review';
      case 'approved': return 'Approved';
      case 'in_development': return 'In Development';
      case 'released': return 'Released';
      default: return status;
    }
  };

  // Show upgrade prompt if user doesn't have Elite features access
  if (!hasPlayerDevelopment) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-purple-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Elite Features
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Upgrade to Elite plan to access these exclusive features
              </p>
            </div>
          </div>
          
          <UpgradePrompt
            feature={FEATURE_KEYS.PLAYER_DEVELOPMENT}
          />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-purple-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Elite Features
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Exclusive features and priority support for Elite plan users
            </p>
          </div>
        </div>

        {/* Elite Features Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Elite Plan Benefits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <MessageSquare className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Feature Request Queue
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Submit feature requests directly to our development team
                </p>
              </div>
              <div className="text-center">
                <Phone className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Priority Support
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Direct access to phone and email priority support
                </p>
              </div>
              <div className="text-center">
                <Sparkles className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Player Development
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Advanced player tracking with assessments and goals
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="features" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="features">Feature Requests</TabsTrigger>
            <TabsTrigger value="support">Priority Support</TabsTrigger>
          </TabsList>

          {/* Feature Requests Tab */}
          <TabsContent value="features" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Submit Feature Request
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="request-title">Title</Label>
                  <Input
                    id="request-title"
                    value={newRequest.title}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Brief description of the feature..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="request-description">Description</Label>
                  <Textarea
                    id="request-description"
                    value={newRequest.description}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Detailed description of what you'd like to see..."
                    className="mt-1 min-h-[100px]"
                  />
                </div>
                <Button 
                  onClick={handleFeatureRequest}
                  disabled={featureRequestMutation.isPending}
                  className="w-full"
                >
                  {featureRequestMutation.isPending ? 'Submitting...' : 'Submit Request'}
                </Button>
              </CardContent>
            </Card>

            {/* Previous Requests */}
            <Card>
              <CardHeader>
                <CardTitle>Your Feature Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {requestsLoading ? (
                  <div className="text-center py-4 text-gray-500">Loading requests...</div>
                ) : !featureRequests || featureRequests.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    No feature requests yet. Submit your first request above!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {featureRequests.map((request) => (
                      <div key={request.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900 dark:text-white">{request.title}</h4>
                          <Badge className={getStatusColor(request.status)}>
                            {getStatusText(request.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{request.description}</p>
                        {request.statusNotes && (
                          <>
                            <Separator />
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded text-sm">
                              <strong>Status Update:</strong> {request.statusNotes}
                            </div>
                          </>
                        )}
                        <div className="text-xs text-gray-500">
                          Submitted {new Date(request.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Priority Support Tab */}
          <TabsContent value="support" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Priority Support Access
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-center p-6 border rounded-lg">
                    <Phone className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Phone Support</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Direct phone line for urgent issues
                    </p>
                    <p className="font-mono text-lg text-purple-600">+1 (555) 123-4567</p>
                    <p className="text-xs text-gray-500 mt-1">Available 24/7</p>
                  </div>
                  
                  <div className="text-center p-6 border rounded-lg">
                    <Mail className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Email Support</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Priority email queue with faster response times
                    </p>
                    <p className="font-mono text-lg text-purple-600">elite@futsalculture.com</p>
                    <p className="text-xs text-gray-500 mt-1">2-hour response guarantee</p>
                  </div>
                </div>
                
                <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg">
                  <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                    What's Included:
                  </h4>
                  <ul className="space-y-1 text-sm text-purple-800 dark:text-purple-200">
                    <li>• Dedicated account manager</li>
                    <li>• Priority issue resolution</li>
                    <li>• Implementation consultation</li>
                    <li>• Custom training sessions</li>
                    <li>• Direct development team access</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}