import { useQuery } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building2, Users, Activity, CreditCard, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { get } from '@/lib/api';

interface TenantProfile {
  plan: {
    code: string;
    name: string;
    price_cents: number;
    limits: {
      players: number;
      sessions: number;
      emails: number;
      sms: number;
      api_calls: number;
    };
  } | null;
  usage: {
    players: number;
    sessions: number;
    emails: number;
    sms: number;
    api_calls: number;
  };
  lastPaidAt: string | null;
  healthScore: number;
  healthDrivers: {
    usagePct: number;
    failedDunning: number;
    noPayDays: number;
  };
  invoices: Array<{
    id: string;
    total: number;
    status: string;
    due_at: string;
    paid_at: string | null;
  }>;
}

interface TenantProfileDrawerProps {
  tenantId: string | null;
  tenantName?: string;
  onClose: () => void;
}

export default function TenantProfileDrawer({ tenantId, tenantName, onClose }: TenantProfileDrawerProps) {
  const { data: profile, isLoading } = useQuery<TenantProfile>({
    queryKey: ['/api/super-admin/tenants', tenantId, 'profile'],
    queryFn: () => get(`/api/super-admin/tenants/${tenantId}/profile`),
    enabled: !!tenantId,
  });

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBadgeColor = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const getUsageColor = (current: number, limit: number) => {
    const pct = (current / limit) * 100;
    if (pct >= 90) return 'text-red-600';
    if (pct >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getInvoiceStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <Badge variant="default" className="bg-green-600">Paid</Badge>;
      case 'open': return <Badge variant="secondary">Open</Badge>;
      case 'draft': return <Badge variant="outline">Draft</Badge>;
      case 'uncollectible': return <Badge variant="destructive">Uncollectible</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Sheet open={!!tenantId} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center">
            <Building2 className="w-5 h-5 mr-2" />
            {tenantName || 'Tenant Profile'}
          </SheetTitle>
          <SheetDescription>
            Health score, usage metrics, and billing information
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="space-y-6 mt-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : profile ? (
          <div className="space-y-6 mt-6">
            {/* Health Score */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Health Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className={`text-3xl font-bold ${getHealthColor(profile.healthScore)}`}>
                      {profile.healthScore}
                    </div>
                    <div className="ml-2 text-muted-foreground">/100</div>
                  </div>
                  <Badge variant={getHealthBadgeColor(profile.healthScore)}>
                    {profile.healthScore >= 80 ? 'Healthy' : 
                     profile.healthScore >= 60 ? 'At Risk' : 'Critical'}
                  </Badge>
                </div>
                <Progress value={profile.healthScore} className="mb-4" />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Usage Level:</span>
                    <span className={profile.healthDrivers.usagePct > 0.5 ? 'text-green-600' : 'text-yellow-600'}>
                      {(profile.healthDrivers.usagePct * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Failed Payments:</span>
                    <span className={profile.healthDrivers.failedDunning > 0 ? 'text-red-600' : 'text-green-600'}>
                      {profile.healthDrivers.failedDunning}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Days Since Payment:</span>
                    <span className={profile.healthDrivers.noPayDays > 30 ? 'text-red-600' : 'text-green-600'}>
                      {profile.healthDrivers.noPayDays}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Plan & Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Plan & Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profile.plan ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold">{profile.plan.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(profile.plan.price_cents)}/month
                        </p>
                      </div>
                      <Badge variant="outline">{profile.plan.code.toUpperCase()}</Badge>
                    </div>
                    
                    <div className="space-y-3">
                      {Object.entries(profile.plan.limits).map(([key, limit]) => {
                        const current = profile.usage[key as keyof typeof profile.usage] || 0;
                        const percentage = (current / limit) * 100;
                        return (
                          <div key={key} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="capitalize">{key.replace('_', ' ')}</span>
                              <span className={getUsageColor(current, limit)}>
                                {current.toLocaleString()} / {limit.toLocaleString()}
                              </span>
                            </div>
                            <Progress value={Math.min(percentage, 100)} className="h-2" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No plan assigned</p>
                )}
              </CardContent>
            </Card>

            {/* Recent Invoices */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Recent Invoices
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profile.invoices.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Paid Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {profile.invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">
                            {formatCurrency(invoice.total * 100)}
                          </TableCell>
                          <TableCell>
                            {getInvoiceStatusBadge(invoice.status)}
                          </TableCell>
                          <TableCell>
                            {new Date(invoice.due_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {invoice.paid_at ? new Date(invoice.paid_at).toLocaleDateString() : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground">No invoices found</p>
                )}
              </CardContent>
            </Card>

            {/* Last Payment */}
            {profile.lastPaidAt && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-sm">
                      Last payment: {new Date(profile.lastPaidAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Failed to load tenant profile</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}