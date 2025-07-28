import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Badge } from "@/components/ui/badge";
import { KPICard } from "@/components/kpi-card";
import { 
  DollarSign, 
  Users, 
  Calendar, 
  CreditCard,
  Building2,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Minus,
  BarChart3
} from "lucide-react";

interface AnalyticsData {
  revenue: number;
  players: number;
  sessions: number;
  tenants: number;
  revenueGrowth: number;
  playersGrowth: number;
  sessionsGrowth: number;
}

export default function SuperAdminAnalytics() {
  const [selectedTenant, setSelectedTenant] = useState("all");
  const [dateRange, setDateRange] = useState<any>(null);
  const [ageGroup, setAgeGroup] = useState("all");
  const [gender, setGender] = useState("all");

  // Fetch tenants for filter
  const { data: tenants = [] } = useQuery({
    queryKey: ["/api/super-admin/tenants"],
    queryFn: async () => {
      const response = await fetch("/api/super-admin/tenants", {
        credentials: 'include'
      });
      return response.json();
    },
  });

  // Fetch analytics data with filters
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/super-admin/analytics", selectedTenant, dateRange, ageGroup, gender],
    queryFn: async () => {
      // Mock data for now - replace with actual API call
      return {
        revenue: selectedTenant === "all" ? 125000 : 45000,
        players: selectedTenant === "all" ? 850 : 320,
        sessions: selectedTenant === "all" ? 240 : 85,
        tenants: selectedTenant === "all" ? 8 : 1,
        revenueGrowth: 12,
        playersGrowth: 8,
        sessionsGrowth: 15,
      };
    },
  });

  const formatGrowth = (growth: number) => {
    if (!isFinite(growth) || isNaN(growth)) {
      return { text: "New", icon: ArrowUp, color: "text-green-500" };
    }
    
    if (growth === 0) return { text: "±0.0%", icon: Minus, color: "text-gray-500" };
    if (growth > 0) return { text: `+${growth}%`, icon: ArrowUp, color: "text-green-500" };
    return { text: `${growth}%`, icon: ArrowDown, color: "text-red-500" };
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  const kpis = [
    {
      title: "Revenue",
      subtitle: selectedTenant === "all" ? "(All Tenants)" : "(Selected Tenant)",
      value: `$${((analytics?.revenue || 0) / 100).toFixed(2)}`,
      icon: DollarSign,
      growth: analytics?.revenueGrowth || 0,
      comparison: "vs. previous period",
      definition: selectedTenant === "all" 
        ? "Total revenue across all tenants for the selected period" 
        : "Revenue for the selected tenant and period"
    },
    {
      title: "Players",
      subtitle: selectedTenant === "all" ? "(Platform Wide)" : "(Selected Tenant)",
      value: (analytics?.players || 0).toString(),
      icon: Users,
      growth: analytics?.playersGrowth || 0,
      comparison: "vs. previous period",
      definition: selectedTenant === "all"
        ? "Total registered players across all tenants"
        : "Total registered players for the selected tenant"
    },
    {
      title: "Sessions",
      subtitle: "(Selected Period)",
      value: (analytics?.sessions || 0).toString(),
      icon: Calendar,
      growth: analytics?.sessionsGrowth || 0,
      comparison: "vs. previous period",
      definition: "Number of training sessions scheduled for the selected period and filters"
    },
    {
      title: "Active Tenants",
      subtitle: "(Organizations)",
      value: selectedTenant === "all" ? (analytics?.tenants || 0).toString() : "1",
      icon: Building2,
      growth: 0,
      comparison: "",
      definition: selectedTenant === "all" 
        ? "Number of active tenant organizations on the platform"
        : "Currently viewing single tenant"
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Platform Analytics</h1>
          <p className="text-muted-foreground">
            {selectedTenant === "all" 
              ? "Global analytics across all tenants" 
              : `Analytics for ${tenants.find((t: any) => t.id === selectedTenant)?.name || 'selected tenant'}`
            }
          </p>
        </div>
        
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Analytics Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Tenant</label>
                <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tenants</SelectItem>
                    {tenants.map((tenant: any) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Date Range</label>
                <DatePickerWithRange
                  date={dateRange}
                  setDate={setDateRange}
                  placeholder="Select dates"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Age Group</label>
                <Select value={ageGroup} onValueChange={setAgeGroup}>
                  <SelectTrigger>
                    <SelectValue placeholder="All ages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ages</SelectItem>
                    <SelectItem value="U8">Under 8</SelectItem>
                    <SelectItem value="U10">Under 10</SelectItem>
                    <SelectItem value="U12">Under 12</SelectItem>
                    <SelectItem value="U14">Under 14</SelectItem>
                    <SelectItem value="U16">Under 16</SelectItem>
                    <SelectItem value="U18">Under 18</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Gender</label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger>
                    <SelectValue placeholder="All genders" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genders</SelectItem>
                    <SelectItem value="boys">Boys</SelectItem>
                    <SelectItem value="girls">Girls</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <div className="flex space-x-2">
                  <Badge variant="secondary" className="px-3 py-1">
                    {selectedTenant === "all" ? "Global View" : "Tenant View"}
                  </Badge>
                  {dateRange && (
                    <Badge variant="outline" className="px-3 py-1">
                      Custom Range
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => {
          const growthInfo = formatGrowth(kpi.growth);
          const GrowthIcon = growthInfo.icon;
          
          return (
            <KPICard
              key={kpi.title}
              title={kpi.title}
              subtitle={kpi.subtitle}
              value={kpi.value}
              icon={kpi.icon}
              definition={kpi.definition}
            >
              {kpi.growth !== 0 && (
                <div className={`flex items-center space-x-1 ${growthInfo.color}`}>
                  <GrowthIcon className="w-3 h-3" />
                  <span className="text-xs font-medium">{growthInfo.text}</span>
                  {kpi.comparison && (
                    <span className="text-xs text-muted-foreground">{kpi.comparison}</span>
                  )}
                </div>
              )}
            </KPICard>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Revenue chart will be implemented here</p>
                <p className="text-sm">Showing data for {selectedTenant === "all" ? "all tenants" : "selected tenant"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Player Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Player growth chart will be implemented here</p>
                <p className="text-sm">Filtered by: {ageGroup !== "all" ? ageGroup : "All ages"}, {gender !== "all" ? gender : "All genders"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session Occupancy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Session occupancy chart will be implemented here</p>
                <p className="text-sm">Average fill rate and trends</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Age Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Age distribution chart will be implemented here</p>
                <p className="text-sm">Player demographics across {selectedTenant === "all" ? "all tenants" : "selected tenant"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}