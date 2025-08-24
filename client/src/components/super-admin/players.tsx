import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Users, Search, Filter, Building2, Calendar, UserCheck, Shield, Mail } from "lucide-react";

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
}

export default function SuperAdminPlayers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTenant, setSelectedTenant] = useState("all");
  const [selectedAgeGroup, setSelectedAgeGroup] = useState("all");
  const [selectedGender, setSelectedGender] = useState("all");
  const [portalAccessFilter, setPortalAccessFilter] = useState("all");
  const [dateRange, setDateRange] = useState<any>(null);
  const [location] = useLocation();
  
  // Read URL parameters for filtering
  useEffect(() => {
    const urlParams = new URLSearchParams(location.split('?')[1] || '');
    const searchParam = urlParams.get('search');
    const filterParam = urlParams.get('filter');
    
    if (searchParam) {
      setSearchQuery(searchParam);
    }
    if (filterParam) {
      setSearchQuery(filterParam);
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
      if (searchQuery) params.set("search", searchQuery);

      const response = await fetch(`/api/super-admin/players?${params}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch players');
      return response.json();
    },
  });

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
            <div>
              <Input
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
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

      {/* Players Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Global Players Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border max-h-[600px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead>Age & Gender</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Total Bookings</TableHead>
                  <TableHead>Portal Access</TableHead>
                  <TableHead>Booking Permission</TableHead>
                  <TableHead>Last Activity</TableHead>
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
                <TableRow key={player.id}>
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
                        to={`/super-admin/parents?filter=${encodeURIComponent(player.parentName)}`}
                        className="text-blue-600 hover:text-blue-800 cursor-pointer underline font-medium"
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
                    <div>
                      <p className="text-sm">{new Date(player.registrationDate).toLocaleDateString()}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(player.registrationDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{player.totalBookings}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Shield className={`w-4 h-4 ${player.portalAccess ? 'text-green-500' : 'text-gray-400'}`} />
                      <Badge variant={player.portalAccess ? "default" : "secondary"} className={player.portalAccess ? "bg-green-500" : ""}>
                        {player.portalAccess ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <UserCheck className={`w-4 h-4 ${player.bookingPermission ? 'text-blue-500' : 'text-gray-400'}`} />
                      <Badge variant={player.bookingPermission ? "default" : "secondary"} className={player.bookingPermission ? "bg-blue-500" : ""}>
                        {player.bookingPermission ? "Allowed" : "Restricted"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{new Date(player.lastActivity).toLocaleDateString()}</p>
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
        </CardContent>
      </Card>
    </div>
  );
}