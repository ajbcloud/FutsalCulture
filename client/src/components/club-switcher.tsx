import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Building2, Check, Loader2 } from "lucide-react";

interface CoachTenant {
  id: string;
  tenantId: string;
  tenantName: string;
  permissions: {
    canViewPii: boolean;
    canManageSessions: boolean;
    canViewAnalytics: boolean;
    canViewAttendance: boolean;
    canTakeAttendance: boolean;
    canViewFinancials: boolean;
    canIssueRefunds: boolean;
    canIssueCredits: boolean;
    canManageDiscounts: boolean;
    canAccessAdminPortal: boolean;
  };
}

interface MyTenantsResponse {
  tenants: CoachTenant[];
}

export function ClubSwitcher() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data, isLoading } = useQuery<MyTenantsResponse>({
    queryKey: ["/api/coach/my-tenants"],
    enabled: !!user?.isAssistant,
  });

  const switchMutation = useMutation({
    mutationFn: async (tenantId: string) => {
      const response = await apiRequest("POST", "/api/coach/switch-tenant", { tenantId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Club switched",
        description: "Refreshing to load club data...",
      });
      setTimeout(() => {
        window.location.reload();
      }, 500);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to switch club",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!user?.isAssistant) {
    return null;
  }

  if (isLoading) {
    return null;
  }

  const tenants = data?.tenants || [];

  if (tenants.length <= 1) {
    return null;
  }

  const currentTenant = tenants.find((t) => t.tenantId === user.tenantId);
  const currentTenantName = currentTenant?.tenantName || "Select Club";

  const handleSwitchClub = (tenantId: string) => {
    if (tenantId === user.tenantId) {
      return;
    }
    switchMutation.mutate(tenantId);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between text-left font-normal"
          disabled={switchMutation.isPending}
          data-testid="button-club-switcher"
        >
          <div className="flex items-center gap-2 truncate">
            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate" data-testid="text-current-club">
              {currentTenantName}
            </span>
          </div>
          {switchMutation.isPending ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[220px]">
        <DropdownMenuLabel>Switch Club</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tenants.map((tenant) => (
          <DropdownMenuItem
            key={tenant.tenantId}
            onClick={() => handleSwitchClub(tenant.tenantId)}
            className="cursor-pointer"
            data-testid={`menu-item-club-${tenant.tenantId}`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="truncate">{tenant.tenantName}</span>
              {tenant.tenantId === user.tenantId && (
                <Check className="h-4 w-4 shrink-0 text-primary" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
