import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  DollarSign, 
  Users, 
  Calendar, 
  Building2, 
  TrendingUp, 
  TrendingDown, 
  Info,
  Download,
  Filter,
  ChevronDown,
  Check,
  Search
} from "lucide-react";
import { get, apiRequest } from "@/lib/queryClient";
import { addDays, subDays, format } from "date-fns";
import { DateRange } from "react-day-picker";

interface AnalyticsData {
  totalRevenue: number;
  monthlyRevenue: number;
  totalPlayers: number;
  monthlyPlayers: number;
  totalSessions: number;
  weeklySessions: number;
  activeTenants: number;
  revenueGrowth: number;
  playersGrowth: number;
  sessionsGrowth: number;
  tenantGrowth: number;
  revenueByTenant: Array<{
    tenantId: string;
    tenantName: string;
    revenue: number;
    growth: number;
  }>;
  playersByTenant: Array<{
    tenantId: string;
    tenantName: string;
    players: number;
    growth: number;
  }>;
  sessionsByTenant: Array<{
    tenantId: string;
    tenantName: string;
    sessions: number;
    occupancy: number;
  }>;
}

interface Tenant {
  id: string;
  name: string;
}

export default function SuperAdminAnalytics() {
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [ageGroupFilter, setAgeGroupFilter] = useState<string>("all");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [tenantSearchTerm, setTenantSearchTerm] = useState<string>("");
  const [tenantDropdownOpen, setTenantDropdownOpen] = useState<boolean>(false);

  const { data: tenants = [] } = useQuery({
    queryKey: ['/api/super-admin/tenants'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/super-admin/tenants');
      return await response.json();
    }
  });

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['/api/super-admin/analytics', selectedTenants, dateRange, ageGroupFilter, genderFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedTenants.length > 0) {
        params.append('tenants', selectedTenants.join(','));
      }
      if (dateRange?.from) {
        params.append('from', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        params.append('to', dateRange.to.toISOString());
      }
      if (ageGroupFilter !== 'all') {
        params.append('ageGroup', ageGroupFilter);
      }
      if (genderFilter !== 'all') {
        params.append('gender', genderFilter);
      }
      const response = await apiRequest('GET', `/api/super-admin/analytics?${params.toString()}`);
      return await response.json();
    }
  });

  const handleTenantToggle = (tenantId: string) => {
    setSelectedTenants(prev => {
      if (prev.includes(tenantId)) {
        return prev.filter(id => id !== tenantId);
      } else {
        return [...prev, tenantId];
      }
    });
  };

  const clearFilters = () => {
    setSelectedTenants([]);
    setDateRange({ from: subDays(new Date(), 30), to: new Date() });
    setAgeGroupFilter("all");
    setGenderFilter("all");
    setTenantSearchTerm("");
  };

  // Filter tenants based on search term
  const filteredTenants = tenants.filter((tenant: Tenant) =>
    tenant.name.toLowerCase().includes(tenantSearchTerm.toLowerCase())
  );

  // Get display text for tenant dropdown
  const getTenantDisplayText = () => {
    if (selectedTenants.length === 0) {
      return "All Tenants";
    } else if (selectedTenants.length === 1) {
      const tenant = tenants.find((t: Tenant) => t.id === selectedTenants[0]);
      return tenant?.name || "1 tenant selected";
    } else {
      return `${selectedTenants.length} tenants selected`;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Platform Analytics</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const formatGrowth = (growth: number) => {
    const formatted = Math.abs(growth).toFixed(1);
    return growth >= 0 ? `+${formatted}%` : `-${formatted}%`;
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold">Platform Analytics</h1>
            <p className="text-muted-foreground">
              {selectedTenants.length === 0 
                ? "Global analytics across all tenants" 
                : `Analytics for ${selectedTenants.length} selected tenant(s)`
              }
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Tenant Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Tenants</label>
                <Popover open={tenantDropdownOpen} onOpenChange={setTenantDropdownOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={tenantDropdownOpen}
                      className="w-full justify-between text-left font-normal h-10"
                    >
                      <span className="truncate">{getTenantDisplayText()}</span>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <div className="p-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search tenants..."
                          className="pl-8"
                          value={tenantSearchTerm}
                          onChange={(e) => setTenantSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredTenants.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          No tenants found
                        </div>
                      ) : (
                        <div className="p-1">
                          {filteredTenants.map((tenant: Tenant) => (
                            <div
                              key={tenant.id}
                              className="flex items-center space-x-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
                              onClick={() => handleTenantToggle(tenant.id)}
                            >
                              <div className="flex h-4 w-4 items-center justify-center border rounded">
                                {selectedTenants.includes(tenant.id) && (
                                  <Check className="h-3 w-3" />
                                )}
                              </div>
                              <span className="flex-1">{tenant.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {selectedTenants.length > 0 && (
                      <div className="border-t p-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            setSelectedTenants([]);
                            setTenantSearchTerm("");
                          }}
                        >
                          Clear Selection
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <div className="flex space-x-2">
                  <Input
                    type="date"
                    className="h-10"
                    value={dateRange?.from?.toISOString().split('T')[0] || ''}
                    onChange={(e) => setDateRange(prev => ({ 
                      from: new Date(e.target.value), 
                      to: prev?.to || new Date() 
                    }))}
                  />
                  <Input
                    type="date"
                    className="h-10"
                    value={dateRange?.to?.toISOString().split('T')[0] || ''}
                    onChange={(e) => setDateRange(prev => ({ 
                      from: prev?.from || subDays(new Date(), 30), 
                      to: new Date(e.target.value) 
                    }))}
                  />
                </div>
              </div>

              {/* Age Group Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Age Group</label>
                <Select value={ageGroupFilter} onValueChange={setAgeGroupFilter}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ages</SelectItem>
                    <SelectItem value="U8">U8</SelectItem>
                    <SelectItem value="U10">U10</SelectItem>
                    <SelectItem value="U12">U12</SelectItem>
                    <SelectItem value="U14">U14</SelectItem>
                    <SelectItem value="U16">U16</SelectItem>
                    <SelectItem value="U18">U18</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Gender Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Gender</label>
                <Select value={genderFilter} onValueChange={setGenderFilter}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genders</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Global KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="flex items-center space-x-1">
                      <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3 h-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Sum of all payments received across all tenants</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-2xl font-bold">{formatCurrency(analytics?.totalRevenue || 0)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {(analytics?.revenueGrowth || 0) >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${
                    (analytics?.revenueGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatGrowth(analytics?.revenueGrowth || 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="flex items-center space-x-1">
                      <p className="text-sm font-medium text-muted-foreground">Total Players</p>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3 h-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Number of registered players across all tenants</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-2xl font-bold">{analytics?.totalPlayers || 0}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {(analytics?.playersGrowth || 0) >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${
                    (analytics?.playersGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatGrowth(analytics?.playersGrowth || 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <div>
                    <div className="flex items-center space-x-1">
                      <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3 h-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Number of training sessions across all tenants</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-2xl font-bold">{analytics?.totalSessions || 0}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {(analytics?.sessionsGrowth || 0) >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${
                    (analytics?.sessionsGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatGrowth(analytics?.sessionsGrowth || 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-5 h-5 text-orange-600" />
                  <div>
                    <div className="flex items-center space-x-1">
                      <p className="text-sm font-medium text-muted-foreground">Active Tenants</p>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3 h-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Number of active tenant organizations</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-2xl font-bold">{analytics?.activeTenants || 0}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {(analytics?.tenantGrowth || 0) >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${
                    (analytics?.tenantGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatGrowth(analytics?.tenantGrowth || 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue by Tenant */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Tenant</CardTitle>
            <CardDescription>Compare revenue performance across tenant organizations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.revenueByTenant?.map((tenant: any) => (
                <div key={tenant.tenantId} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline">{tenant.tenantName}</Badge>
                    <span className="font-medium">{formatCurrency(tenant.revenue)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {tenant.growth >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${
                      tenant.growth >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatGrowth(tenant.growth)}
                    </span>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8 text-muted-foreground">
                  No revenue data available for the selected filters.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Players by Tenant */}
        <Card>
          <CardHeader>
            <CardTitle>Players by Tenant</CardTitle>
            <CardDescription>Track player registration across tenant organizations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.playersByTenant?.map((tenant: any) => (
                <div key={tenant.tenantId} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline">{tenant.tenantName}</Badge>
                    <span className="font-medium">{tenant.players} players</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {tenant.growth >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${
                      tenant.growth >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatGrowth(tenant.growth)}
                    </span>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8 text-muted-foreground">
                  No player data available for the selected filters.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Session Occupancy by Tenant */}
        <Card>
          <CardHeader>
            <CardTitle>Session Occupancy by Tenant</CardTitle>
            <CardDescription>Monitor session utilization across tenant organizations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.sessionsByTenant?.map((tenant: any) => (
                <div key={tenant.tenantId} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline">{tenant.tenantName}</Badge>
                    <span className="font-medium">{tenant.sessions} sessions</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-muted rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${Math.min(tenant.occupancy, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{tenant.occupancy.toFixed(1)}%</span>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8 text-muted-foreground">
                  No session data available for the selected filters.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}