import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AdminLayout from "@/components/admin-layout";
import RequireAdmin from "@/components/require-admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, User, Users } from "lucide-react";

type Parent = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

export default function AdminCredits() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [applyToHousehold, setApplyToHousehold] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");

  // Fetch all parents
  const { data: parents = [], isLoading: parentsLoading } = useQuery<Parent[]>({
    queryKey: ["/api/admin/parents"],
    enabled: !!user?.isAdmin,
  });

  // Apply credit mutation
  const applyCreditMutation = useMutation({
    mutationFn: async (data: {
      targetUserId: string;
      amountCents: number;
      reason: string;
      applyToHousehold: boolean;
      expiresAt?: string;
    }) => {
      const res = await apiRequest("POST", "/api/credits/apply", data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/credits"] });
      const creditType = applyToHousehold ? "household" : "personal";
      toast({
        title: "Success",
        description: `${creditType.charAt(0).toUpperCase() + creditType.slice(1)} credit of $${data.credit.amountDollars} applied successfully`,
      });
      // Reset form
      setSelectedUserId("");
      setAmount("");
      setReason("");
      setApplyToHousehold(false);
      setExpiresAt("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to apply credit",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUserId || !amount || !reason) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const amountInDollars = parseFloat(amount);
    if (isNaN(amountInDollars) || amountInDollars <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    applyCreditMutation.mutate({
      targetUserId: selectedUserId,
      amountCents: Math.round(amountInDollars * 100),
      reason,
      applyToHousehold,
      expiresAt: expiresAt || undefined,
    });
  };

  if (parentsLoading) {
    return (
      <RequireAdmin>
        <AdminLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
          </div>
        </AdminLayout>
      </RequireAdmin>
    );
  }

  return (
    <RequireAdmin>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold theme-page-title flex items-center gap-3">
              <DollarSign className="w-8 h-8" />
              Apply Credits
            </h1>
            <p className="theme-description mt-2">
              Apply credits to users or households
            </p>
          </div>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Credit Application Form</CardTitle>
              <CardDescription>
                Apply personal or household credits to users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="user-select">Select User *</Label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger id="user-select" data-testid="select-user">
                      <SelectValue placeholder="Choose a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {parents.map((parent) => (
                        <SelectItem key={parent.id} value={parent.id} data-testid={`option-user-${parent.id}`}>
                          {parent.firstName} {parent.lastName} ({parent.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (in dollars) *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pl-10"
                      data-testid="input-amount"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason *</Label>
                  <Textarea
                    id="reason"
                    placeholder="Enter reason for credit (e.g., Session cancellation, Goodwill gesture)"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    data-testid="input-reason"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expires">Expiration Date (Optional)</Label>
                  <Input
                    id="expires"
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    data-testid="input-expires"
                  />
                </div>

                <div className="flex items-start space-x-3 rounded-lg border border-border p-4 bg-muted/30">
                  <Checkbox
                    id="applyToHousehold"
                    checked={applyToHousehold}
                    onCheckedChange={(checked) => setApplyToHousehold(checked as boolean)}
                    data-testid="checkbox-household"
                  />
                  <div className="space-y-1">
                    <Label htmlFor="applyToHousehold" className="text-sm font-medium flex items-center gap-2 cursor-pointer">
                      <Users className="w-4 h-4" />
                      Apply to Household
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      If checked, credit will be shared with all household members. User must belong to a household.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={applyCreditMutation.isPending}
                    data-testid="button-apply-credit"
                    className="flex items-center gap-2"
                  >
                    {applyToHousehold ? (
                      <Users className="w-4 h-4" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                    {applyCreditMutation.isPending
                      ? "Applying..."
                      : `Apply ${applyToHousehold ? "Household" : "Personal"} Credit`}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </RequireAdmin>
  );
}
