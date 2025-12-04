import AdminLayout from '../../components/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { CreditCard, ArrowLeft, AlertCircle } from 'lucide-react';
import { Link } from 'wouter';

export default function Payment() {
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

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Payment Processing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900 dark:text-blue-100">Braintree Payment Processing</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Payment processing is now handled through Braintree. Session payments are processed automatically when parents complete bookings.
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <p className="text-muted-foreground">
                To configure payment processing, go to <strong>Settings → Integrations</strong> and set up your Braintree credentials.
              </p>
              <p className="text-sm text-muted-foreground">
                Braintree supports credit cards, debit cards, Venmo, and Google Pay for convenient payment options.
              </p>
            </div>

            <Link href="/admin/settings">
              <Button className="w-full" data-testid="button-go-settings">
                Go to Settings
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
