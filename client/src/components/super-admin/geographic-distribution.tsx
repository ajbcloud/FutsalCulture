import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// @ts-ignore - react-simple-maps types not available
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
// @ts-ignore - d3-scale types issue
import { scaleQuantile } from "d3-scale";
import { MapPin, Loader2 } from "lucide-react";

interface StateTenantData {
  state: string;
  stateCode: string;
  tenantCount: number;
}

interface GeographicDistributionProps {
  selectedTenant?: string;
}

const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-albers-10m.json";

export default function GeographicDistribution({ selectedTenant = "all" }: GeographicDistributionProps) {
  const [hoveredState, setHoveredState] = useState<string | null>(null);

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

  // Create color scale based on tenant counts
  const colorScale = useMemo(() => {
    const counts = geoData.map((d: StateTenantData) => d.tenantCount);
    const maxCount = Math.max(...counts, 1);
    
    return scaleQuantile<string>()
      .domain(counts)
      .range([
        "rgb(247, 251, 255)", // lightest blue
        "rgb(198, 219, 239)", 
        "rgb(158, 202, 225)", 
        "rgb(107, 174, 214)", 
        "rgb(49, 130, 189)",  // darkest blue
      ]);
  }, [geoData]);

  // Create lookup for state data
  const stateData = useMemo(() => {
    const lookup: Record<string, StateTenantData> = {};
    geoData.forEach((item: StateTenantData) => {
      lookup[item.stateCode] = item;
    });
    return lookup;
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
        <div className="space-y-4">
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

          {/* Map Title */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground">Tenant Distribution by State</h3>
          </div>

          {/* US Map */}
          <div className="bg-slate-900 dark:bg-slate-800 rounded-lg p-4" style={{ height: "400px" }}>
            <ComposableMap
              projection="geoAlbersUsa"
              projectionConfig={{
                scale: 1000,
                center: [-96, 38]
              }}
              style={{
                width: "100%",
                height: "100%"
              }}
            >
              <ZoomableGroup>
                <Geographies geography={geoUrl}>
                  {({ geographies }: { geographies: any[] }) =>
                    geographies.map((geo: any) => {
                      const stateCode = geo.properties?.NAME;
                      const stateInfo = stateData[stateCode];
                      const tenantCount = stateInfo?.tenantCount || 0;
                      const fillColor = tenantCount > 0 ? colorScale(tenantCount) : "rgb(229, 231, 235)";

                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={fillColor}
                          stroke="rgb(148, 163, 184)"
                          strokeWidth={0.5}
                          onMouseEnter={() => setHoveredState(stateCode)}
                          onMouseLeave={() => setHoveredState(null)}
                          style={{
                            default: { outline: "none" },
                            hover: { 
                              outline: "none",
                              fill: tenantCount > 0 ? "rgb(59, 130, 246)" : "rgb(156, 163, 175)",
                              strokeWidth: 1
                            },
                            pressed: { outline: "none" }
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
              </ZoomableGroup>
            </ComposableMap>
          </div>

          {/* Hover Tooltip */}
          {hoveredState && (
            <div className="text-center">
              <div className="inline-block bg-background border rounded-lg px-3 py-2 shadow-lg">
                <p className="font-medium text-foreground">{hoveredState}</p>
                <p className="text-sm text-muted-foreground">
                  {stateData[hoveredState]?.tenantCount || 0} tenant(s)
                </p>
              </div>
            </div>
          )}

          {/* Color Legend */}
          <div className="flex items-center justify-center space-x-4 text-xs">
            <span className="text-muted-foreground">Fewer</span>
            <div className="flex space-x-1">
              {["rgb(247, 251, 255)", "rgb(198, 219, 239)", "rgb(158, 202, 225)", "rgb(107, 174, 214)", "rgb(49, 130, 189)"].map((color, i) => (
                <div
                  key={i}
                  className="w-4 h-4 border border-gray-300"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <span className="text-muted-foreground">More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}