import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import USMap from '@/components/super-admin/us-map';

interface StateTenantData {
  state: string;
  stateCode: string;
  tenantCount: number;
}

interface GeographicDistributionProps {
  selectedTenant?: string;
}

export default function GeographicDistribution({ selectedTenant = "all" }: GeographicDistributionProps) {
  const { data: geoData = [], isLoading } = useQuery({
    queryKey: ["/api/super-admin/geographic-distribution", selectedTenant],
    queryFn: async () => {
      const tenantParam = selectedTenant !== 'all' ? `?tenantId=${selectedTenant}` : '';
      const response = await fetch(`/api/super-admin/geographic-distribution${tenantParam}`, {
        credentials: 'include'
      });
      if (!response.ok) return [];
      return response.json();
    },
  });

  const mapData = useMemo(() => {
    return geoData.map((item: StateTenantData) => ({
      state: item.stateCode,
      count: item.tenantCount
    }));
  }, [geoData]);

  const totalTenants = useMemo(() => {
    return geoData.reduce((sum: number, item: StateTenantData) => sum + item.tenantCount, 0);
  }, [geoData]);

  const activeStates = useMemo(() => {
    return geoData.filter((item: StateTenantData) => item.tenantCount > 0).length;
  }, [geoData]);

  const sortedStates = useMemo(() => {
    return [...geoData]
      .filter((item: StateTenantData) => item.tenantCount > 0)
      .sort((a: StateTenantData, b: StateTenantData) => b.tenantCount - a.tenantCount);
  }, [geoData]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4" />
            Geographic Distribution
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Tenant distribution across US states (US-only for compliance)
          </p>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="h-4 w-4" />
          Geographic Distribution
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Tenant distribution across US states (US-only for compliance)
        </p>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="flex gap-4">
          {/* Map Section - Left Side */}
          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-2 gap-2 text-center mb-2">
              <div className="space-y-0.5">
                <p className="text-lg font-bold text-foreground">{activeStates}</p>
                <p className="text-xs text-muted-foreground">Active States</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-lg font-bold text-foreground">{totalTenants}</p>
                <p className="text-xs text-muted-foreground">Total Tenants</p>
              </div>
            </div>
            <USMap 
              data={mapData} 
              title=""
              className="w-full max-w-xs mx-auto"
            />
          </div>

          {/* State List - Right Side */}
          <div className="w-40 shrink-0">
            <h4 className="text-sm font-medium mb-2">States by Tenants</h4>
            <ScrollArea className="h-52">
              <div className="space-y-1 pr-2">
                {sortedStates.length > 0 ? (
                  sortedStates.map((item: StateTenantData) => (
                    <div 
                      key={item.stateCode}
                      className="flex items-center justify-between py-1 px-2 rounded bg-muted/50 hover:bg-muted transition-colors"
                      data-testid={`state-list-${item.stateCode}`}
                    >
                      <span className="text-sm font-medium">{item.stateCode}</span>
                      <span className="text-sm text-muted-foreground">{item.tenantCount}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">No tenants yet</p>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}