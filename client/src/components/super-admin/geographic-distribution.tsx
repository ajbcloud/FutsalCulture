import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Loader2 } from "lucide-react";
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
  // Fetch tenant geographic distribution
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

  // Transform data to match USMap component format
  const mapData = useMemo(() => {
    return geoData.map((item: StateTenantData) => ({
      state: item.stateCode, // USMap expects state abbreviations
      count: item.tenantCount
    }));
  }, [geoData]);

  const totalTenants = useMemo(() => {
    return geoData.reduce((sum: number, item: StateTenantData) => sum + item.tenantCount, 0);
  }, [geoData]);

  const activeStates = useMemo(() => {
    return geoData.filter((item: StateTenantData) => item.tenantCount > 0).length;
  }, [geoData]);

  if (isLoading) {
    return (
      <Card className="max-w-2xl">
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
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl">
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
        <div className="space-y-3">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="space-y-0.5">
              <p className="text-xl font-bold text-foreground">{activeStates}</p>
              <p className="text-xs text-muted-foreground">Active States</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xl font-bold text-foreground">{totalTenants}</p>
              <p className="text-xs text-muted-foreground">Total Tenants</p>
            </div>
          </div>

          {/* Working US Map Component */}
          <USMap 
            data={mapData} 
            title="Tenant Distribution by State"
            className="max-w-lg mx-auto"
          />
        </div>
      </CardContent>
    </Card>
  );
}