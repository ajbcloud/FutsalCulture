import React, { useState, useEffect } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import AdminLayout from '../../components/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useToast } from '../../hooks/use-toast';
import { apiRequest } from '../../lib/queryClient';
import { CreditCard, ArrowLeft, CheckCircle } from 'lucide-react';
import { Link } from 'wouter';

// Only load Stripe if key is available
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSucceeded, setPaymentSucceeded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/admin/payment?success=true`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsProcessing(false);
    } else {
      setPaymentSucceeded(true);
      toast({
        title: "Payment Successful",
        description: "Thank you for your payment!",
      });
    }
  };

  if (paymentSucceeded) {
    return (
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-green-900 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-300" />
          </div>
        </div>
        <div>
          <h3 className="text-xl font-medium text-white mb-2">Payment Successful!</h3>
          <p className="text-zinc-400">Your subscription payment has been processed successfully.</p>
        </div>
        <Link href="/admin/settings">
          <Button className="bg-blue-600 hover:bg-blue-700">
            Return to Settings
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {isProcessing ? 'Processing...' : 'Pay $49.99'}
      </Button>
    </form>
  );
};

export default function Payment() {
  const [clientSecret, setClientSecret] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    // Check for success parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      toast({
        title: "Payment Successful",
        description: "Your subscription payment has been processed!",
      });
    }

    // Only create payment intent if Stripe is configured
    if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
      return; // Skip payment setup if Stripe not configured
    }

    // Create PaymentIntent for service billing
    apiRequest("POST", "/api/admin/create-service-payment", { 
      amount: 4999, // $49.99 in cents
      description: "Futsal Culture Platform Subscription"
    })
      .then((res) => res.json())
      .then((data) => {
        setClientSecret(data.clientSecret);
      })
      .catch((error) => {
        toast({
          title: "Error",
          description: "Failed to initialize payment. Please try again.",
          variant: "destructive",
        });
      });
  }, [toast]);

  // Show configuration message if Stripe is not set up
  if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
    return (
      <AdminLayout>
        <div className="p-6 space-y-6 max-w-2xl mx-auto">
          <div className="flex items-center space-x-3">
            <Link href="/admin/settings">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Settings
              </Button>
            </Link>
          </div>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Stripe Configuration Required
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-zinc-400">
                To accept service payments, you need to configure your Stripe API keys. Please add the following environment variables:
              </p>
              <div className="bg-zinc-800 p-4 rounded-lg">
                <ul className="text-zinc-300 space-y-2 text-sm">
                  <li><code>VITE_STRIPE_PUBLIC_KEY</code> - Your publishable key</li>
                  <li><code>STRIPE_SECRET_KEY</code> - Your secret key</li>
                </ul>
              </div>
              <p className="text-zinc-400 text-sm">
                Get these keys from your Stripe Dashboard at{' '}
                <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
                  dashboard.stripe.com/apikeys
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  if (!clientSecret) {
    return (
      <AdminLayout>
        <div className="p-6 space-y-6">
          <div className="flex items-center space-x-3">
            <Link href="/admin/settings">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Settings
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center space-x-3">
          <Link href="/admin/settings">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Settings
            </Button>
          </Link>
        </div>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Service Payment
            </CardTitle>
            <p className="text-zinc-400 text-sm">
              Complete your monthly subscription payment
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Payment Summary */}
            <div className="bg-zinc-800 p-4 rounded-lg border border-zinc-700">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-white font-medium">Payment Summary</h3>
                <Badge className="bg-blue-900 text-blue-300">Monthly</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Professional Platform</span>
                  <span className="text-white">$49.99</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Processing Fee</span>
                  <span className="text-white">$0.00</span>
                </div>
                <hr className="border-zinc-700" />
                <div className="flex justify-between font-medium">
                  <span className="text-white">Total</span>
                  <span className="text-white">$49.99</span>
                </div>
              </div>
            </div>

            {/* Stripe Payment Form */}
            {stripePromise ? (
              <Elements 
                stripe={stripePromise} 
                options={{ 
                  clientSecret,
                  appearance: {
                    theme: 'night',
                    variables: {
                      colorPrimary: '#2563eb',
                      colorBackground: '#27272a',
                      colorText: '#ffffff',
                      colorDanger: '#ef4444',
                      fontFamily: 'Inter, system-ui, sans-serif',
                      spacingUnit: '4px',
                      borderRadius: '6px',
                    }
                  }
                }}
              >
                <CheckoutForm />
              </Elements>
            ) : (
              <div className="text-center py-8">
                <p className="text-zinc-400">Stripe not configured</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}