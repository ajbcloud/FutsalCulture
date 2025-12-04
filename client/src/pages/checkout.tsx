import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Checkout() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
  }, [user, navigate]);

  const handleBack = () => {
    navigate('/admin/settings');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Processing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Payment processing is handled through Braintree. Please use the payment options available in the session booking flow or contact your administrator for subscription management.
            </p>
          </div>
          <Button 
            onClick={handleBack}
            variant="default"
            className="w-full"
            data-testid="button-back-settings"
          >
            Back to Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
