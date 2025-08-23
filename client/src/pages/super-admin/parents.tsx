import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  UserX, 
  RotateCcw,
  Mail,
  Building,
  Calendar,
  Download,
  Users,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Parent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: 'active' | 'disabled' | 'pending';
  tenantId: string;
  tenantName: string;
  lastLogin: string;
  createdAt: string;
  playerCount: number;
  totalBookings: number;
  totalSpent: number;
  lastActivity: string;
}

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  ageGroup: string;
  gender: string;
  soccerClub?: string;
  signupCount: number;
}

export default function SuperAdminParents() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tenantFilter, setTenantFilter] = useState<string>('all');
  const [expandedParentIds, setExpandedParentIds] = useState<Set<string>>(new Set());
  const [parentPlayers, setParentPlayers] = useState<Record<string, Player[]>>({});
  const [loadingPlayers, setLoadingPlayers] = useState<Set<string>>(new Set());

  const { toast } = useToast();

  // Fetch all parents across tenants
  const { data: parents = [], isLoading, error } = useQuery<Parent[]>({
    queryKey: ['/api/super-admin/parents', { search: searchTerm, status: statusFilter, tenant: tenantFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (tenantFilter !== 'all') params.append('tenant', tenantFilter);
      
      const response = await fetch(`/api/super-admin/parents?${params}`);
      if (!response.ok) throw new Error('Failed to fetch parents');
      return response.json();
    }
  });

  // Fetch tenants for filter dropdown
  const { data: tenants = [] } = useQuery({
    queryKey: ['/api/super-admin/tenants-list'],
    queryFn: async () => {
      const response = await fetch('/api/super-admin/tenants');
      if (!response.ok) throw new Error('Failed to fetch tenants');
      return response.json();
    }
  });

  // Load players for a specific parent (similar to admin panel)
  const loadPlayersForParent = async (parentId: string) => {
    if (parentPlayers[parentId]) {
      return; // Already loaded
    }

    setLoadingPlayers(prev => new Set(prev).add(parentId));

    try {
      // Fetch players for this parent
      const response = await fetch(`/api/super-admin/players?parentId=${parentId}`);
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Parent Management</h1>
        </div>
        <div className="space-y-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Parent Management</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">Failed to load parents. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeParents = parents.filter(p => p.status === 'active').length;
  const totalBookings = parents.reduce((sum, p) => sum + (p.totalBookings || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Parent Management</h1>
          <p className="text-muted-foreground">Manage parents across all organizations</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{parents.length}</div>
            <p className="text-xs text-muted-foreground">Total Parents</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{activeParents}</div>
            <p className="text-xs text-muted-foreground">Active Parents</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalBookings}</div>
            <p className="text-xs text-muted-foreground">Total Bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{tenants.length}</div>
            <p className="text-xs text-muted-foreground">Organizations</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search parents by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tenantFilter} onValueChange={setTenantFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Organization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Organizations</SelectItem>
                {tenants.map((tenant: any) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Parents List */}
      <Card>
        <CardHeader>
          <CardTitle>Parents ({parents.length})</CardTitle>
          <CardDescription>
            Manage parent accounts across all organizations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-12 gap-4 p-4 font-medium border-b bg-muted/50">
              <div className="col-span-3">Parent</div>
              <div className="col-span-2">Organization</div>
              <div className="col-span-1">Players</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-2">Last Login</div>
              <div className="col-span-2">Bookings/Spent</div>
              <div className="col-span-1">Actions</div>
            </div>
            {parents.map((parent) => {
              const isExpanded = expandedParentIds.has(parent.id);
              return (
                <div key={parent.id} className="border-b last:border-b-0">
                  <div className="grid grid-cols-12 gap-4 p-4 hover:bg-muted/25">
                    <div className="col-span-3">
                      <div className="font-medium">{parent.firstName} {parent.lastName}</div>
                      <div className="text-sm text-muted-foreground">{parent.email}</div>
                      {parent.phone && (
                        <div className="text-xs text-muted-foreground">{parent.phone}</div>
                      )}
                    </div>
                    <div className="col-span-2">
                      <div className="text-sm">{parent.tenantName}</div>
                    </div>
                    <div className="col-span-1">
                      <button
                        onClick={() => {
                          const nextExpanded = new Set(expandedParentIds);
                          if (isExpanded) {
                            nextExpanded.delete(parent.id);
                          } else {
                            nextExpanded.add(parent.id);
                            loadPlayersForParent(parent.id);
                          }
                          setExpandedParentIds(nextExpanded);
                        }}
                        className="flex items-center gap-1 text-blue-400 hover:text-blue-300 cursor-pointer"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                        <span className="font-medium">{parent.playerCount || 0}</span>
                      </button>
                    </div>
                    <div className="col-span-1">
                      <Badge variant={
                        parent.status === 'active' ? 'default' :
                        parent.status === 'disabled' ? 'destructive' : 'secondary'
                      }>
                        {parent.status}
                      </Badge>
                    </div>
                    <div className="col-span-2">
                      <div className="text-sm">
                        {parent.lastLogin ? new Date(parent.lastLogin).toLocaleDateString() : 'Never'}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-sm">
                        <div>{parent.totalBookings || 0} bookings</div>
                        <div className="text-muted-foreground">${(parent.totalSpent || 0).toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="col-span-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Building className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  
                  {/* Expanded Player Details */}
                  {isExpanded && (
                    <div className="bg-muted/10 px-4 pb-4">
                      <div className="border-l-2 border-blue-400 pl-4 ml-4">
                        {loadingPlayers.has(parent.id) ? (
                          <p className="text-muted-foreground text-sm">Loading player details...</p>
                        ) : parentPlayers[parent.id] && parentPlayers[parent.id].length > 0 ? (
                          <div className="space-y-2">
                            <p className="font-medium text-foreground text-sm">Players:</p>
                            {parentPlayers[parent.id].map((player) => (
                              <div key={player.id} className="bg-card p-3 rounded border">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    {/* Clickable player name linking to players page */}
                                    <Link 
                                      href={`/super-admin/players?playerId=${player.id}`}
                                      className="text-blue-400 hover:text-blue-300 cursor-pointer underline font-medium"
                                    >
                                      {player.firstName} {player.lastName}
                                    </Link>
                                    <p className="text-muted-foreground text-sm">
                                      {player.ageGroup} • {player.gender}
                                      {player.soccerClub && <span> • {player.soccerClub}</span>}
                                    </p>
                                  </div>
                                  <div className="text-right text-sm text-muted-foreground">
                                    {player.signupCount || 0} bookings
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-sm">No players registered</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}