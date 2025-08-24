import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { UserCheck, Search, Filter, Building2, Mail, Phone, Users, Calendar, ChevronDown, ChevronRight, X } from "lucide-react";

interface Parent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  registrationDate: string;
  status: string;
  playerCount: number;
  totalBookings: number;
  totalSpent: number;
  lastActivity: string;
  tenantName: string;
  tenantId: string;
}

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  totalBookings: number;
}

export default function SuperAdminParents() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTenant, setSelectedTenant] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [dateRange, setDateRange] = useState<any>(null);
  const [expandedParentIds, setExpandedParentIds] = useState<Set<string>>(new Set());
  const [parentPlayers, setParentPlayers] = useState<Record<string, Player[]>>({});
  const [loadingPlayers, setLoadingPlayers] = useState<Set<string>>(new Set());
  const [highlightedParentId, setHighlightedParentId] = useState<string | null>(null);
  const [showSearchBanner, setShowSearchBanner] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [location, navigate] = useLocation();

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

  // Fetch parents with filters
  const { data: parents = [], isLoading } = useQuery<Parent[]>({
    queryKey: ["/api/super-admin/parents", selectedTenant, selectedStatus, dateRange, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedTenant !== "all") params.set("tenantId", selectedTenant);
      if (selectedStatus !== "all") params.set("status", selectedStatus);
      if (dateRange?.from) params.set("dateFrom", dateRange.from.toISOString());
      if (dateRange?.to) params.set("dateTo", dateRange.to.toISOString());
      if (searchQuery) params.set("search", searchQuery);

      const response = await fetch(`/api/super-admin/parents?${params}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch parents');
      return response.json();
    },
  });

  // Load players for a specific parent (similar to admin panel)
  const loadPlayersForParent = async (parentId: string) => {
    if (parentPlayers[parentId]) {
      return; // Already loaded
    }

    setLoadingPlayers(prev => new Set(prev).add(parentId));

    try {
      // Fetch players for this parent
      const response = await fetch(`/api/super-admin/players?parentId=${parentId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch players');
      const playersList = await response.json();
      
      setParentPlayers(prev => ({
        ...prev,
        [parentId]: playersList
      }));
    } catch (error) {
      console.error('Error loading players for parent:', error);
      setParentPlayers(prev => ({
        ...prev,
        [parentId]: []
      }));
    } finally {
      setLoadingPlayers(prev => {
        const next = new Set(prev);
        next.delete(parentId);
        return next;
      });
    }
  };

  // Handle URL parameters for deep-linking
  useEffect(() => {
    const urlParams = new URLSearchParams(location.split('?')[1] || '');
    const q = urlParams.get('q')?.trim() ?? '';
    const tenantId = urlParams.get('tenantId');
    const focus = urlParams.get('focus');
    const searchParam = urlParams.get('search'); // Legacy support
    const filterParam = urlParams.get('filter'); // Legacy support
    const parentIdParam = urlParams.get('parentId');
    
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
    
    if (searchParam || filterParam) {
      // Legacy parameter handling
      setSearchQuery(searchParam || filterParam || '');
    }
    if (parentIdParam) {
      // Auto-expand the specific parent and load their players
      setExpandedParentIds(prev => new Set(prev).add(parentIdParam));
      loadPlayersForParent(parentIdParam);
    }
  }, [location]);

  // Clear search and reset filters
  const clearSearch = () => {
    setSearchQuery('');
    setShowSearchBanner(false);
    setHighlightedParentId(null);
    
    // Update URL to remove search parameters
    const urlParams = new URLSearchParams(location.split('?')[1] || '');
    urlParams.delete('q');
    urlParams.delete('focus');
    urlParams.delete('search');
    urlParams.delete('filter');
    
    const newUrl = urlParams.toString() ? 
      `/super-admin/parents?${urlParams.toString()}` : 
      '/super-admin/parents';
    navigate(newUrl);
  };

  // Build player link for navigation to players page
  const buildPlayerLink = (playerName: string) => {
    const params = new URLSearchParams();
    params.set('q', playerName);
    if (selectedTenant !== 'all') {
      params.set('tenantId', selectedTenant);
    }
    params.set('focus', 'search');
    return `/super-admin/players?${params.toString()}`;
  };

  // Highlight matching parents and scroll to view
  useEffect(() => {
    if (searchQuery && parents.length > 0) {
      const normalizedQuery = searchQuery.toLowerCase();
      const matchingParents = parents.filter(parent => 
        `${parent.firstName} ${parent.lastName}`.toLowerCase().includes(normalizedQuery) ||
        parent.email.toLowerCase().includes(normalizedQuery)
      );
      
      if (matchingParents.length === 1) {
        setHighlightedParentId(matchingParents[0].id);
        
        // Scroll to the highlighted parent
        setTimeout(() => {
          const element = document.getElementById(`parent-row-${matchingParents[0].id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      } else {
        setHighlightedParentId(null);
      }
    }
  }, [searchQuery, parents]);

  // Update URL when search query changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        const urlParams = new URLSearchParams(location.split('?')[1] || '');
        urlParams.set('q', searchQuery);
        if (selectedTenant !== 'all') {
          urlParams.set('tenantId', selectedTenant);
        }
        
        const newUrl = `/super-admin/parents?${urlParams.toString()}`;
        if (location !== newUrl) {
          navigate(newUrl, { replace: true });
        }
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedTenant, location, navigate]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-500">Active</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-500">Pending</Badge>;
      case "suspended":
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
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

  const totalParents = parents.length;
  const activeParents = parents.filter(p => p.status === "active").length;
  const pendingParents = parents.filter(p => p.status === "pending").length;
  const totalRevenue = parents.reduce((sum, p) => sum + p.totalSpent, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Parents Management</h1>
          <p className="text-muted-foreground">Global parent accounts across all tenants ({totalParents} parents)</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Parents</p>
                <p className="text-2xl font-bold">{totalParents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Parents</p>
                <p className="text-2xl font-bold">{activeParents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
                <p className="text-2xl font-bold">{pendingParents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">${(totalRevenue / 100).toFixed(2)}</p>
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
            Parent Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Input
                ref={searchInputRef}
                placeholder="Search parents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-8"
                data-testid="input-search-parents"
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

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>

            <DatePickerWithRange
              date={dateRange}
              setDate={setDateRange}
              placeholder="Registration date"
            />

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery("");
                setSelectedTenant("all");
                setSelectedStatus("all");
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
                  {parents.length > 1 && ` — ${parents.length} matches found`}
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

      {/* Parents Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserCheck className="w-5 h-5 mr-2" />
            Global Parents Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border max-h-[600px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Players</TableHead>
                  <TableHead>Total Bookings</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Status</TableHead>
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
                ) : parents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No parents found
                    </TableCell>
                  </TableRow>
                ) : (
                  parents.map((parent) => (
                    <React.Fragment key={parent.id}>
                      <TableRow 
                        id={`parent-row-${parent.id}`}
                        className={highlightedParentId === parent.id ? "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800" : ""}
                      >
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{parent.tenantName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{parent.firstName} {parent.lastName}</p>
                            <p className="text-sm text-muted-foreground">ID: {parent.id}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="flex items-center space-x-1 mb-1">
                              <Mail className="w-3 h-3 text-muted-foreground" />
                              <p className="text-sm">{parent.email}</p>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Phone className="w-3 h-3 text-muted-foreground" />
                              <p className="text-sm">{parent.phone}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{new Date(parent.registrationDate).toLocaleDateString()}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(parent.registrationDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => {
                              const nextExpanded = new Set(expandedParentIds);
                              const isExpanded = expandedParentIds.has(parent.id);
                              if (isExpanded) {
                                nextExpanded.delete(parent.id);
                              } else {
                                nextExpanded.add(parent.id);
                                loadPlayersForParent(parent.id);
                              }
                              setExpandedParentIds(nextExpanded);
                            }}
                            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 cursor-pointer"
                          >
                            {expandedParentIds.has(parent.id) ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                            <Users className="w-4 h-4" />
                            <span className="font-medium">{parent.playerCount}</span>
                          </button>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{parent.totalBookings}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-green-600">${(parent.totalSpent / 100).toFixed(2)}</span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{new Date(parent.lastActivity).toLocaleDateString()}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(parent.lastActivity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(parent.status)}
                        </TableCell>
                      </TableRow>
                      {/* Expanded Player Details Row */}
                      {expandedParentIds.has(parent.id) && (
                        <TableRow className="bg-muted/20">
                          <TableCell colSpan={9} className="p-0">
                            <div className="px-4 py-3 border-l-4 border-blue-500">
                              {loadingPlayers.has(parent.id) ? (
                                <p className="text-muted-foreground text-sm">Loading player details...</p>
                              ) : parentPlayers[parent.id] && parentPlayers[parent.id].length > 0 ? (
                                <div className="space-y-2">
                                  <p className="font-medium text-foreground text-sm">Players:</p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {parentPlayers[parent.id].map((player) => (
                                      <div key={player.id} className="bg-background p-3 rounded border">
                                        <div className="flex justify-between items-start">
                                          <div className="flex-1">
                                            {/* Clickable player name linking to players page */}
                                            <Link 
                                              to={buildPlayerLink(`${player.firstName} ${player.lastName}`)}
                                              className="text-blue-600 hover:text-blue-800 cursor-pointer underline font-medium"
                                              data-testid={`link-player-${player.id}`}
                                            >
                                              {player.firstName} {player.lastName}
                                            </Link>
                                            <p className="text-muted-foreground text-sm">
                                              Age {player.age} • {player.gender}
                                            </p>
                                          </div>
                                          <div className="text-right text-sm text-muted-foreground">
                                            {player.totalBookings || 0} bookings
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <p className="text-muted-foreground text-sm">No players registered</p>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
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