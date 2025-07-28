import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar, DollarSign, Users, Activity } from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  createdAt: string;
}

interface SuperAdminMetrics {
  totalRevenue: number;
  totalPlayers: number;
  activeTenants: number;
  totalSessions: number;
  monthlyGrowth: number;
}

export default function SuperAdminOverview() {
  const [selectedTenant, setSelectedTenant] = useState<string>('all');

  // Demo data showing multi-tenant architecture concept
  const mockTenants: Tenant[] = [
    { id: '1', name: 'Default Futsal Club', subdomain: 'default', createdAt: new Date().toISOString() },
    { id: '2', name: 'Elite Soccer Academy', subdomain: 'elite-soccer', createdAt: new Date().toISOString() },
    { id: '3', name: 'Youth Sports Center', subdomain: 'youth-sports', createdAt: new Date().toISOString() },
  ];

  const mockMetrics: SuperAdminMetrics = {
    totalRevenue: 12450,
    totalPlayers: 156,
    activeTenants: 3,
    totalSessions: 48,
    monthlyGrowth: 15.2,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Super-Admin Overview</h1>
          <p className="text-muted-foreground">Manage multiple futsal organizations from one platform</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select value={selectedTenant} onValueChange={setSelectedTenant}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select tenant" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tenants</SelectItem>
              {mockTenants.map((tenant) => (
                <SelectItem key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button>Add New Tenant</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${mockMetrics.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{mockMetrics.monthlyGrowth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Players</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockMetrics.totalPlayers}</div>
            <p className="text-xs text-muted-foreground">
              Across all organizations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockMetrics.activeTenants}</div>
            <p className="text-xs text-muted-foreground">
              Organizations using platform
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockMetrics.totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              This month across all tenants
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tenants Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Tenants</CardTitle>
          <CardDescription>Manage futsal organizations on your platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-4 gap-4 p-4 font-medium border-b">
              <div>Tenant Name</div>
              <div>Subdomain</div>
              <div>Players</div>
              <div>Actions</div>
            </div>
            {mockTenants.map((tenant) => (
              <div key={tenant.id} className="grid grid-cols-4 gap-4 p-4 border-b last:border-b-0">
                <div className="font-medium">{tenant.name}</div>
                <div className="text-muted-foreground">{tenant.subdomain}.futsalreserve.app</div>
                <div>23 players</div>
                <div className="space-x-2">
                  <Button variant="outline" size="sm">Edit</Button>
                  <Button variant="outline" size="sm">Login As Admin</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}