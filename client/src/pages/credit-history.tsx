import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useUserTerminology } from "@/hooks/use-user-terminology";
import Navbar from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, Users, DollarSign, Calendar, FileText } from "lucide-react";
import { format } from "date-fns";

type CreditHistoryItem = {
  id: string;
  userId: string | null;
  householdId: string | null;
  amountCents: number;
  amountDollars: string;
  reason: string;
  isUsed: boolean;
  createdAt: string;
  expiresAt: string | null;
  usedAt: string | null;
  sessionInfo?: {
    title: string;
    date: string;
  } | null;
  usedForSessionInfo?: {
    title: string;
    date: string;
  } | null;
};

export default function CreditHistory() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { term } = useUserTerminology();

  const { data: creditsData, isLoading: creditsLoading } = useQuery<{ credits: CreditHistoryItem[] }>({
    queryKey: ["/api/credits/history"],
    enabled: isAuthenticated,
  });

  if (authLoading || creditsLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" data-testid="loading-spinner" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="flex items-center justify-center py-16">
          <Card className="bg-card border-border p-8 text-center">
            <p className="text-muted-foreground" data-testid="text-login-required">Please log in to view your credit history.</p>
          </Card>
        </div>
      </div>
    );
  }

  const credits = creditsData?.credits || [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3" data-testid="text-page-title">
            <DollarSign className="w-8 h-8" />
            Credit History
          </h1>
          <p className="text-muted-foreground mt-2" data-testid="text-page-description">
            View all your {term.toLowerCase()} and household credits
          </p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>All Credits</CardTitle>
          </CardHeader>
          <CardContent>
            {credits.length === 0 ? (
              <p className="text-muted-foreground text-center py-8" data-testid="text-no-credits">
                No credits found
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Expires</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {credits.map((credit) => {
                      const isHousehold = !!credit.householdId;
                      
                      return (
                        <TableRow key={credit.id} data-testid={`row-credit-${credit.id}`}>
                          <TableCell data-testid={`text-credit-type-${credit.id}`}>
                            {isHousehold ? (
                              <Badge variant="secondary" className="flex items-center gap-1 w-fit" data-testid={`badge-household-${credit.id}`}>
                                <Users className="w-3 h-3" />
                                Household
                              </Badge>
                            ) : (
                              <Badge variant="default" className="flex items-center gap-1 w-fit" data-testid={`badge-personal-${credit.id}`}>
                                <User className="w-3 h-3" />
                                {term}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-medium" data-testid={`text-credit-amount-${credit.id}`}>
                            ${credit.amountDollars}
                          </TableCell>
                          <TableCell data-testid={`text-credit-reason-${credit.id}`}>
                            {credit.reason}
                          </TableCell>
                          <TableCell data-testid={`text-credit-status-${credit.id}`}>
                            {credit.isUsed ? (
                              <Badge variant="outline" data-testid={`badge-status-used-${credit.id}`}>
                                Used
                              </Badge>
                            ) : (
                              <Badge variant="success" data-testid={`badge-status-available-${credit.id}`}>
                                Available
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell data-testid={`text-credit-created-${credit.id}`}>
                            {format(new Date(credit.createdAt), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell data-testid={`text-credit-expires-${credit.id}`}>
                            {credit.expiresAt ? format(new Date(credit.expiresAt), 'MMM d, yyyy') : '—'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
