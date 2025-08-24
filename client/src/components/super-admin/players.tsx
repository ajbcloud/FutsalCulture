import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Users, Search, Filter, Building2, Calendar, UserCheck, Shield, Mail, X, User } from "lucide-react";

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  birthYear: number;
  age: number;
  gender: string;
  parentName: string;
  parentEmail: string;
  registrationDate: string;
  totalBookings: number;
  portalAccess: boolean;
  bookingPermission: boolean;
  lastActivity: string;
  tenantName: string;
  tenantId: string;
  parents?: Parent[];
}

interface Parent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export default function SuperAdminPlayers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTenant, setSelectedTenant] = useState("all");
  const [selectedAgeGroup, setSelectedAgeGroup] = useState("all");
  const [selectedGender, setSelectedGender] = useState("all");
  const [portalAccessFilter, setPortalAccessFilter] = useState("all");
  const [dateRange, setDateRange] = useState<any>(null);
  const [highlightedPlayerId, setHighlightedPlayerId] = useState<string | null>(null);
  const [showSearchBanner, setShowSearchBanner] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [location, navigate] = useLocation();
  
  // Handle URL parameters for deep-linking
  useEffect(() => {
    const urlParams = new URLSearchParams(location.split('?')[1] || '');
    const q = urlParams.get('q')?.trim() ?? '';
    const tenantId = urlParams.get('tenantId');
    const focus = urlParams.get('focus');
    const searchParam = urlParams.get('search'); // Legacy support
    const filterParam = urlParams.get('filter'); // Legacy support
    
    // Set tenant filter first if provided
    if (tenantId && tenantId !== 'all') {
      setSelectedTenant(tenantId);
    }
    
    // Handle search query (prioritize 'q' parameter)
    const finalQuery = q || searchParam || filterParam || '';
    if (finalQuery) {
      setSearchQuery(finalQuery);
      setShowSearchBanner(true);
      
      // Auto-focus search input if requested
      if (focus === 'search') {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 100);
      }
    }
  }, [location]);

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

  // Fetch players with filters
  const { data: players = [], isLoading } = useQuery<Player[]>({
    queryKey: ["/api/super-admin/players", selectedTenant, selectedAgeGroup, selectedGender, portalAccessFilter, dateRange, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedTenant !== "all") params.set("tenantId", selectedTenant);
      if (selectedAgeGroup !== "all") params.set("ageGroup", selectedAgeGroup);
      if (selectedGender !== "all") params.set("gender", selectedGender);
      if (portalAccessFilter !== "all") params.set("portalAccess", portalAccessFilter);
      if (dateRange?.from) params.set("dateFrom", dateRange.from.toISOString());
      if (dateRange?.to) params.set("dateTo", dateRange.to.toISOString());
      if (searchQuery) {
        params.set("q", searchQuery); // Use 'q' parameter for search
        params.set("search", searchQuery); // Keep legacy support
      }
      params.set("include", "parents"); // Include parents data

      const response = await fetch(`/api/super-admin/players?${params}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch players');
      return response.json();
    },
  });

  // Clear search and reset filters
  const clearSearch = () => {
    setSearchQuery('');
    setShowSearchBanner(false);
    setHighlightedPlayerId(null);
    
    // Update URL to remove search parameters
    const urlParams = new URLSearchParams(location.split('?')[1] || '');
    urlParams.delete('q');
    urlParams.delete('focus');
    urlParams.delete('search');
    urlParams.delete('filter');
    
    const newUrl = urlParams.toString() ? 
      `/super-admin/players?${urlParams.toString()}` : 
      '/super-admin/players';
    navigate(newUrl);
  };

  // Build parent link for navigation to parents page
  const buildParentLink = (parentName: string) => {
    const params = new URLSearchParams();
    params.set('q', parentName);
    if (selectedTenant !== 'all') {
      params.set('tenantId', selectedTenant);
    }
    params.set('focus', 'search');
    return `/super-admin/parents?${params.toString()}`;
  };

  // Highlight matching players and scroll to view
  useEffect(() => {
    if (searchQuery && players.length > 0) {
      const normalizedQuery = searchQuery.toLowerCase();
      const matchingPlayers = players.filter(player => 
        `${player.firstName} ${player.lastName}`.toLowerCase().includes(normalizedQuery) ||
        player.parentEmail.toLowerCase().includes(normalizedQuery)
      );
      
      if (matchingPlayers.length === 1) {
        setHighlightedPlayerId(matchingPlayers[0].id);
        
        // Scroll to the highlighted player
        setTimeout(() => {
          const element = document.getElementById(`player-row-${matchingPlayers[0].id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      } else {
        setHighlightedPlayerId(null);
      }
    }
  }, [searchQuery, players]);

  // Update URL when search query changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        const urlParams = new URLSearchParams(location.split('?')[1] || '');
        urlParams.set('q', searchQuery);
        if (selectedTenant !== 'all') {
          urlParams.set('tenantId', selectedTenant);
        }
        
        const newUrl = `/super-admin/players?${urlParams.toString()}`;
        if (location !== newUrl) {
          navigate(newUrl, { replace: true });
        }
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedTenant, location, navigate]);

  const getAgeGroupBadge = (age: number) => {
    if (age <= 8) return <Badge variant="outline">U8</Badge>;
    if (age <= 10) return <Badge variant="outline">U10</Badge>;
    if (age <= 12) return <Badge variant="outline">U12</Badge>;
    if (age <= 14) return <Badge variant="outline">U14</Badge>;
    if (age <= 16) return <Badge variant="outline">U16</Badge>;
    return <Badge variant="outline">U18</Badge>;
  };

  const getGenderBadge = (gender: string) => {
    switch (gender) {
      case "boys":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Boys</Badge>;
      case "girls":
        return <Badge variant="secondary" className="bg-pink-100 text-pink-800">Girls</Badge>;
      default:
        return <Badge variant="secondary">{gender}</Badge>;
    }
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

  const totalPlayers = players.length;
  const playersWithPortalAccess = players.filter(p => p.portalAccess).length;
  const playersWithBookingPermission = players.filter(p => p.bookingPermission).length;
  const totalBookings = players.reduce((sum, p) => sum + p.totalBookings, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Players Management</h1>
          <p className="text-muted-foreground">Global player accounts across all tenants ({totalPlayers} players)</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Players</p>
                <p className="text-2xl font-bold">{totalPlayers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Portal Access</p>
                <p className="text-2xl font-bold">{playersWithPortalAccess}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Booking Permission</p>
                <p className="text-2xl font-bold">{playersWithBookingPermission}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Bookings</p>
                <p className="text-2xl font-bold">{totalBookings}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Player Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="relative">
              <Input
                ref={searchInputRef}
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-8"
                data-testid="input-search-players"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
                  data-testid="button-clear-search"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            <Select value={selectedTenant} onValueChange={setSelectedTenant}>
              <SelectTrigger>
                <SelectValue placeholder="All Tenants" />
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

            <Select value={selectedAgeGroup} onValueChange={setSelectedAgeGroup}>
              <SelectTrigger>
                <SelectValue placeholder="All Ages" />
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

            <Select value={selectedGender} onValueChange={setSelectedGender}>
              <SelectTrigger>
                <SelectValue placeholder="All Genders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="boys">Boys</SelectItem>
                <SelectItem value="girls">Girls</SelectItem>
              </SelectContent>
            </Select>

            <Select value={portalAccessFilter} onValueChange={setPortalAccessFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Portal Access" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Access Levels</SelectItem>
                <SelectItem value="yes">Has Portal Access</SelectItem>
                <SelectItem value="no">No Portal Access</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery("");
                setSelectedTenant("all");
                setSelectedAgeGroup("all");
                setSelectedGender("all");
                setPortalAccessFilter("all");
                setDateRange(null);
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Banner */}
      {showSearchBanner && searchQuery && (
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-blue-600" />
                <span className="text-sm">
                  Showing results for <strong>"{searchQuery}"</strong>
                  {players.length > 1 && ` — ${players.length} matches found`}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearSearch}
                className="text-blue-600 hover:text-blue-700"
                data-testid="button-clear-search-banner"
              >
                Clear
                <X className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Players Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Global Players Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <div className="rounded-md border max-h-[600px] overflow-y-auto min-w-[1200px]">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="min-w-[140px]">Tenant</TableHead>
                    <TableHead className="min-w-[150px]">Player</TableHead>
                    <TableHead className="min-w-[120px]">Age & Gender</TableHead>
                    <TableHead className="min-w-[180px]">Parent</TableHead>
                    <TableHead className="min-w-[110px]">Registered</TableHead>
                    <TableHead className="min-w-[100px] text-center">Bookings</TableHead>
                    <TableHead className="min-w-[120px] text-center">Portal</TableHead>
                    <TableHead className="min-w-[120px] text-center">Permission</TableHead>
                    <TableHead className="min-w-[110px]">Last Activity</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>
                    </TableRow>
                  ))
                ) : players.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No players found
                    </TableCell>
                  </TableRow>
                ) : (
                  players.map((player) => (
                <TableRow 
                  key={player.id}
                  id={`player-row-${player.id}`}
                  className={highlightedPlayerId === player.id ? "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800" : ""}
                >
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{player.tenantName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{player.firstName} {player.lastName}</p>
                      <p className="text-sm text-muted-foreground">Born {player.birthYear}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getAgeGroupBadge(player.age)}
                      {getGenderBadge(player.gender)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      {/* Clickable parent name linking to parents page */}
                      <Link 
                        to={buildParentLink(player.parentName)}
                        className="text-blue-600 hover:text-blue-800 cursor-pointer underline font-medium"
                        data-testid={`link-parent-${player.id}`}
                      >
                        {player.parentName}
                      </Link>
                      <div className="flex items-center space-x-1">
                        <Mail className="w-3 h-3 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">{player.parentEmail}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="whitespace-nowrap">
                      <p className="text-sm">{new Date(player.registrationDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(player.registrationDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-medium">{player.totalBookings}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <Shield className={`w-4 h-4 ${player.portalAccess ? 'text-green-500' : 'text-gray-400'}`} />
                      <Badge variant={player.portalAccess ? "default" : "secondary"} className={player.portalAccess ? "bg-green-500" : ""}>
                        {player.portalAccess ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <UserCheck className={`w-4 h-4 ${player.bookingPermission ? 'text-blue-500' : 'text-gray-400'}`} />
                      <Badge variant={player.bookingPermission ? "default" : "secondary"} className={player.bookingPermission ? "bg-blue-500" : ""}>
                        {player.bookingPermission ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="whitespace-nowrap">
                      <p className="text-sm">{new Date(player.lastActivity).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(player.lastActivity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}