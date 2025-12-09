import React from "react";
// @ts-ignore - react-simple-maps types not available
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { scaleLinear } from "d3-scale";

const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

interface StateData {
  state: string;
  count: number;
}

interface USMapProps {
  data: StateData[];
  title?: string;
  className?: string;
  onStateClick?: (stateAbbr: string, stateName: string, tenantCount: number) => void;
}

export default function USMap({ data, title = "Tenant Distribution by State", className = "", onStateClick }: USMapProps) {
  // Create a color scale based on tenant count
  const maxValue = Math.max(...data.map(d => d.count), 1);
  const colorScale = scaleLinear<string>()
    .domain([0, maxValue])
    .range(["#e0f2fe", "#01579b"]);

  // Create a lookup map for state data
  const stateDataMap = new Map<string, number>();
  data.forEach(item => {
    stateDataMap.set(item.state, item.count);
  });

  // State name to abbreviation mapping
  const stateNameToAbbr: Record<string, string> = {
    "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR", "California": "CA",
    "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE", "Florida": "FL", "Georgia": "GA",
    "Hawaii": "HI", "Idaho": "ID", "Illinois": "IL", "Indiana": "IN", "Iowa": "IA",
    "Kansas": "KS", "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD",
    "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS", "Missouri": "MO",
    "Montana": "MT", "Nebraska": "NE", "Nevada": "NV", "New Hampshire": "NH", "New Jersey": "NJ",
    "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH",
    "Oklahoma": "OK", "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC",
    "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX", "Utah": "UT", "Vermont": "VT",
    "Virginia": "VA", "Washington": "WA", "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY",
    "District of Columbia": "DC"
  };

  return (
    <div className={`${className}`}>
      {title && <h3 className="text-sm font-semibold mb-2 text-center">{title}</h3>}
      <ComposableMap
        projection="geoAlbersUsa"
        width={400}
        height={240}
        className="w-full h-auto border rounded-lg bg-gray-50 dark:bg-gray-900"
      >
        <ZoomableGroup>
          <Geographies geography={geoUrl}>
            {({ geographies }: any) =>
              geographies.map((geo: any) => {
                const stateName = geo.properties.name;
                const stateAbbr = stateNameToAbbr[stateName] || "";
                const tenantCount = stateDataMap.get(stateAbbr) || 0;
                
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={tenantCount > 0 ? colorScale(tenantCount) : "#f5f5f5"}
                    stroke="#ffffff"
                    strokeWidth={0.5}
                    style={{
                      default: {
                        outline: "none",
                      },
                      hover: {
                        fill: tenantCount > 0 ? "#1565c0" : "#e0e0e0",
                        outline: "none",
                        cursor: tenantCount > 0 ? "pointer" : "default",
                      },
                      pressed: {
                        outline: "none",
                      },
                    }}
                    title={`${stateName}: ${tenantCount} tenant${tenantCount !== 1 ? 's' : ''}`}
                    onClick={() => {
                      if (tenantCount > 0 && onStateClick) {
                        onStateClick(stateAbbr, stateName, tenantCount);
                      }
                    }}
                    data-testid={`state-${stateAbbr}`}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
      
      {/* Legend */}
      <div className="mt-2 flex items-center justify-center space-x-3 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-gray-200 border rounded"></div>
          <span className="text-muted-foreground">None</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: colorScale(1) }}></div>
          <span className="text-muted-foreground">Low</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: colorScale(maxValue) }}></div>
          <span className="text-muted-foreground">High</span>
        </div>
      </div>
    </div>
  );
}