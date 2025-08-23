import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Link, useLocation } from 'wouter';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  UserX, 
  Users,
  Building,
  Calendar,
  Download,
  User
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  ageGroup: string;
  gender: string;
  soccerClub?: string;
  parentId: string;
  parentName: string;
  tenantId: string;
  tenantName: string;
  registeredAt: string;
  totalBookings: number;
  portalAccess: 'enabled' | 'disabled';
  bookingPermission: 'allowed' | 'restricted';
  lastActivity: string;
}

export default function SuperAdminPlayers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [ageGroupFilter, setAgeGroupFilter] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [tenantFilter, setTenantFilter] = useState<string>('all');
  const [portalFilter, setPortalFilter] = useState<string>('all');
  
  const { toast } = useToast();
  const [location] = useLocation();

  // Check for URL filters (similar to admin panel)
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const playerId = urlParams.get('playerId');

  // Fetch all players across tenants
  const { data: players = [], isLoading, error } = useQuery<Player[]>({
    queryKey: ['/api/super-admin/players', { 
      search: searchTerm, 
      ageGroup: ageGroupFilter, 
      gender: genderFilter, 
      tenant: tenantFilter,
      portal: portalFilter,
      playerId 
    }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (ageGroupFilter !== 'all') params.append('ageGroup', ageGroupFilter);
      if (genderFilter !== 'all') params.append('gender', genderFilter);
      if (tenantFilter !== 'all') params.append('tenant', tenantFilter);
      if (portalFilter !== 'all') params.append('portal', portalFilter);
      if (playerId) params.append('playerId', playerId);
      
      const response = await fetch(`/api/super-admin/players?${params}`);
      if (!response.ok) throw new Error('Failed to fetch players');
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Player Management</h1>
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
        <h1 className="text-3xl font-bold text-foreground">Player Management</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">Failed to load players. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activePlayers = players.filter(p => p.portalAccess === 'enabled').length;
  const totalBookings = players.reduce((sum, p) => sum + (p.totalBookings || 0), 0);
  const boysCount = players.filter(p => p.gender === 'boys').length;
  const girlsCount = players.filter(p => p.gender === 'girls').length;

  // Age groups for filter
  const AGE_GROUPS = ['U8', 'U9', 'U10', 'U11', 'U12', 'U13', 'U14', 'U15', 'U16', 'U17', 'U18', 'U19'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Player Management</h1>
          <p className="text-muted-foreground">Manage players across all organizations</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{players.length}</div>
            <p className="text-xs text-muted-foreground">Total Players</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{activePlayers}</div>
            <p className="text-xs text-muted-foreground">Portal Access Enabled</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{boysCount}/{girlsCount}</div>
            <p className="text-xs text-muted-foreground">Boys / Girls</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalBookings}</div>
            <p className="text-xs text-muted-foreground">Total Bookings</p>
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
                placeholder="Search players by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={ageGroupFilter} onValueChange={setAgeGroupFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Age" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ages</SelectItem>
                {AGE_GROUPS.map(age => (
                  <SelectItem key={age} value={age}>{age}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={genderFilter} onValueChange={setGenderFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="boys">Boys</SelectItem>
                <SelectItem value="girls">Girls</SelectItem>
              </SelectContent>
            </Select>
            <Select value={portalFilter} onValueChange={setPortalFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Portal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Portal</SelectItem>
                <SelectItem value="enabled">Portal Enabled</SelectItem>
                <SelectItem value="disabled">Portal Disabled</SelectItem>
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

      {/* Players List */}
      <Card>
        <CardHeader>
          <CardTitle>Players ({players.length})</CardTitle>
          <CardDescription>
            Manage player accounts across all organizations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-12 gap-4 p-4 font-medium border-b bg-muted/50">
              <div className="col-span-3">Player Name</div>
              <div className="col-span-2">Age/Gender</div>
              <div className="col-span-2">Parent</div>
              <div className="col-span-2">Organization</div>
              <div className="col-span-1">Portal</div>
              <div className="col-span-1">Bookings</div>
              <div className="col-span-1">Actions</div>
            </div>
            {players.map((player) => (
              <div key={player.id} className="grid grid-cols-12 gap-4 p-4 border-b last:border-b-0 hover:bg-muted/25">
                <div className="col-span-3">
                  <div className="font-medium">{player.firstName} {player.lastName}</div>
                  {player.soccerClub && (
                    <div className="text-sm text-muted-foreground">{player.soccerClub}</div>
                  )}
                </div>
                <div className="col-span-2">
                  <div className="text-sm">{player.ageGroup} • {player.gender}</div>
                </div>
                <div className="col-span-2">
                  {/* Clickable parent name linking to parents page */}
                  <Link 
                    href={`/super-admin/parents?parentId=${player.parentId}&filter=${encodeURIComponent(player.parentName)}`}
                    className="text-blue-400 hover:text-blue-300 cursor-pointer underline"
                  >
                    {player.parentName}
                  </Link>
                </div>
                <div className="col-span-2">
                  <div className="text-sm">{player.tenantName}</div>
                </div>
                <div className="col-span-1">
                  <Badge variant={
                    player.portalAccess === 'enabled' ? 'default' : 'secondary'
                  }>
                    {player.portalAccess === 'enabled' ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="col-span-1">
                  <div className="font-medium">{player.totalBookings || 0}</div>
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
                        <User className="w-4 h-4 mr-2" />
                        View Profile
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Building className="w-4 h-4 mr-2" />
                        View Organization
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}