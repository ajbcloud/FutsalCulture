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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Geographic Distribution
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Tenant distribution across US states (US-only for compliance)
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Geographic Distribution
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Tenant distribution across US states (US-only for compliance)
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="space-y-1">
              <p className="text-2xl font-bold text-foreground">{activeStates}</p>
              <p className="text-sm text-muted-foreground">Active States</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-foreground">{totalTenants}</p>
              <p className="text-sm text-muted-foreground">Total Tenants</p>
            </div>
          </div>

          {/* Working US Map Component */}
          <USMap 
            data={mapData} 
            title="Tenant Distribution by State"
            className="w-full"
          />
        </div>
      </CardContent>
    </Card>
  );
}