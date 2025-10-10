import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, Home, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function CheckoutSuccess() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [secondsRemaining, setSecondsRemaining] = useState(3);
  const queryClientInstance = useQueryClient();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Invalidate all relevant queries to refresh plan data
    const invalidateQueries = async () => {
      await queryClientInstance.invalidateQueries({ queryKey: ['/api/tenant/subscription'] });
      await queryClientInstance.invalidateQueries({ queryKey: ['/api/tenant/info'] });
      await queryClientInstance.invalidateQueries({ queryKey: ['/api/billing/check-subscription'] });
      await queryClientInstance.invalidateQueries({ queryKey: ['/api/admin'] });
    };
    
    invalidateQueries();

    // Show success toast
    toast({
      title: 'Payment Successful!',
      description: 'Your subscription has been updated successfully.',
    });

    // Auto-redirect countdown
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Redirect to settings if admin, otherwise to dashboard
          if (user?.isAdmin) {
            navigate('/admin/settings');
          } else {
            navigate('/dashboard');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [user, navigate, toast, queryClientInstance]);

  const handleGoToSettings = () => {
    if (user?.isAdmin) {
      navigate('/admin/settings');
    } else {
      navigate('/profile');
    }
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-100 p-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              Your subscription has been updated successfully. You now have access to all the features of your new plan.
            </p>
            <p className="text-sm text-muted-foreground">
              Redirecting to {user?.isAdmin ? 'settings' : 'dashboard'} in {secondsRemaining} seconds...
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Button 
              onClick={handleGoToSettings}
              className="w-full"
              data-testid="button-go-to-settings"
            >
              <Settings className="h-4 w-4 mr-2" />
              Go to {user?.isAdmin ? 'Settings' : 'Profile'}
            </Button>
            <Button 
              onClick={handleGoToDashboard}
              variant="outline"
              className="w-full"
              data-testid="button-go-to-dashboard"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
          </div>

          <div className="pt-4 border-t">
            <div className="text-sm text-muted-foreground space-y-2">
              <p className="font-medium">What's next?</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Your new plan features are now active</li>
                <li>You'll receive a confirmation email shortly</li>
                <li>You can manage your subscription anytime from settings</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}