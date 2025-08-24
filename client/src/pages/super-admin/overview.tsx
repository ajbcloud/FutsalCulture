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
    <div className="space-y-8 max-w-none">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Super-Admin Overview</h1>
          <p className="text-muted-foreground">Manage multiple futsal organizations from one platform</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Select value={selectedTenant} onValueChange={setSelectedTenant}>
            <SelectTrigger className="w-full sm:w-64">
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
          
          <Button className="w-full sm:w-auto">Add New Tenant</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 lg:gap-6">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">${mockMetrics.totalRevenue.toLocaleString()}</div>
            <p className="text-sm text-green-600 font-medium">
              +{mockMetrics.monthlyGrowth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Total Players</CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{mockMetrics.totalPlayers}</div>
            <p className="text-sm text-muted-foreground">
              Across all organizations
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
            <Activity className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{mockMetrics.activeTenants}</div>
            <p className="text-sm text-muted-foreground">
              Organizations using platform
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Calendar className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{mockMetrics.totalSessions}</div>
            <p className="text-sm text-muted-foreground">
              This month across all tenants
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tenants Table */}
      <Card className="w-full">
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle className="text-xl">Active Tenants</CardTitle>
              <CardDescription className="text-base">Manage futsal organizations on your platform</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" size="sm">Export Data</Button>
              <Button size="sm">Add New Tenant</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-semibold">Tenant Name</th>
                  <th className="text-left p-4 font-semibold">Subdomain</th>
                  <th className="text-center p-4 font-semibold">Players</th>
                  <th className="text-left p-4 font-semibold">Status</th>
                  <th className="text-left p-4 font-semibold">Created</th>
                  <th className="text-center p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockTenants.map((tenant) => (
                  <tr key={tenant.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-semibold">{tenant.name}</td>
                    <td className="p-4">
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {tenant.subdomain}.futsalreserve.app
                      </code>
                    </td>
                    <td className="p-4 text-center font-medium">23</td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Active
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="outline" size="sm">Login As Admin</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}