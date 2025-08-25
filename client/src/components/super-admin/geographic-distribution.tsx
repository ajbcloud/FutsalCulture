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

  // Create lookup for state data with multiple key formats
  const stateData = useMemo(() => {
    const lookup: Record<string, StateTenantData> = {};
    geoData.forEach((item: StateTenantData) => {
      // Create lookups for different possible state name formats
      lookup[item.stateCode] = item;
      lookup[item.state] = item;
      
      // Handle common state abbreviations mapping
      const stateAbbreviations: Record<string, string> = {
        'California': 'CA', 'Texas': 'TX', 'Florida': 'FL', 'New York': 'NY', 
        'Illinois': 'IL', 'Washington': 'WA', 'Arizona': 'AZ', 'Colorado': 'CO',
        'Georgia': 'GA', 'North Carolina': 'NC'
      };
      
      if (stateAbbreviations[item.state]) {
        lookup[stateAbbreviations[item.state]] = item;
      }
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
                      // Try multiple property names that might contain the state name
                      const stateName = geo.properties?.NAME || geo.properties?.name;
                      const stateAbbr = geo.properties?.STUSPS || geo.properties?.stusps;
                      
                      // Look up state info using multiple possible keys
                      const stateInfo = stateData[stateName] || stateData[stateAbbr] || null;
                      const tenantCount = stateInfo?.tenantCount || 0;
                      
                      // Use a more visible color scheme
                      let fillColor = "rgb(229, 231, 235)"; // Default gray for states with no tenants
                      if (tenantCount > 0) {
                        // Simple blue gradient based on tenant count
                        if (tenantCount >= 5) fillColor = "rgb(37, 99, 235)";      // blue-600
                        else if (tenantCount >= 3) fillColor = "rgb(59, 130, 246)"; // blue-500  
                        else if (tenantCount >= 2) fillColor = "rgb(96, 165, 250)"; // blue-400
                        else fillColor = "rgb(147, 197, 253)";                      // blue-300
                      }

                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={fillColor}
                          stroke="rgb(148, 163, 184)"
                          strokeWidth={0.5}
                          onMouseEnter={() => setHoveredState(stateName)}
                          onMouseLeave={() => setHoveredState(null)}
                          style={{
                            default: { outline: "none" },
                            hover: { 
                              outline: "none",
                              fill: tenantCount > 0 ? "rgb(29, 78, 216)" : "rgb(156, 163, 175)",
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
              <div className="w-4 h-4 border border-gray-300" style={{ backgroundColor: "rgb(147, 197, 253)" }} title="1 tenant" />
              <div className="w-4 h-4 border border-gray-300" style={{ backgroundColor: "rgb(96, 165, 250)" }} title="2 tenants" />
              <div className="w-4 h-4 border border-gray-300" style={{ backgroundColor: "rgb(59, 130, 246)" }} title="3-4 tenants" />
              <div className="w-4 h-4 border border-gray-300" style={{ backgroundColor: "rgb(37, 99, 235)" }} title="5+ tenants" />
            </div>
            <span className="text-muted-foreground">More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}