import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Calendar, Search, Filter, Building2, MapPin, Users, Clock } from "lucide-react";

interface Session {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  ageGroup: string;
  gender: string;
  capacity: number;
  signedUp: number;
  price: number;
  status: string;
  tenantName: string;
  tenantId: string;
}

export default function SuperAdminSessions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTenant, setSelectedTenant] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedAgeGroup, setSelectedAgeGroup] = useState("all");
  const [dateRange, setDateRange] = useState<any>(null);

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

  // Fetch sessions with filters
  const { data: sessions = [], isLoading } = useQuery<Session[]>({
    queryKey: ["/api/super-admin/sessions", selectedTenant, selectedStatus, selectedAgeGroup, dateRange, searchQuery],
    queryFn: async () => {
      // Mock data for now - replace with actual API call
      return [
        {
          id: "1",
          title: "Morning Training Session",
          date: "2025-07-29",
          time: "09:00 AM",
          location: "Court A",
          ageGroup: "U12",
          gender: "Mixed",
          capacity: 16,
          signedUp: 14,
          price: 2500,
          status: "open",
          tenantName: "Futsal Culture",
          tenantId: "tenant1"
        },
        {
          id: "2",
          title: "Elite Training",
          date: "2025-07-29",
          time: "06:00 PM",
          location: "Main Court",
          ageGroup: "U16",
          gender: "Boys",
          capacity: 12,
          signedUp: 12,
          price: 3000,
          status: "full",
          tenantName: "Elite Footwork Academy",
          tenantId: "tenant2"
        },
        {
          id: "3", 
          title: "Weekend Skills",
          date: "2025-07-30",
          time: "10:00 AM",
          location: "Court B",
          ageGroup: "U14",
          gender: "Girls",
          capacity: 14,
          signedUp: 8,
          price: 2500,
          status: "open",
          tenantName: "Futsal Culture",
          tenantId: "tenant1"
        }
      ].filter(session => {
        if (selectedTenant !== "all" && session.tenantId !== selectedTenant) return false;
        if (selectedStatus !== "all" && session.status !== selectedStatus) return false;
        if (selectedAgeGroup !== "all" && session.ageGroup !== selectedAgeGroup) return false;
        if (searchQuery && !session.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
            !session.tenantName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Open</Badge>;
      case "full":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Full</Badge>;
      case "closed":
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Closed</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">{status}</Badge>;
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sessions Management</h1>
          <p className="text-muted-foreground">Global sessions across all tenants ({sessions.length} sessions)</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Session Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div>
              <Input
                placeholder="Search sessions or tenants..."
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

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="full">Full</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
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

            <DatePickerWithRange
              date={dateRange}
              setDate={setDateRange}
              placeholder="Select dates"
            />

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery("");
                setSelectedTenant("all");
                setSelectedStatus("all");
                setSelectedAgeGroup("all");
                setDateRange(null);
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Global Sessions Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Age Group</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{session.tenantName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{session.title}</p>
                        <p className="text-sm text-muted-foreground">ID: {session.id}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p>{new Date(session.date).toLocaleDateString()}</p>
                          <p className="text-sm text-muted-foreground">{session.time}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{session.location}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{session.ageGroup}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{session.gender}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className={session.signedUp >= session.capacity ? "text-red-600 font-medium" : ""}>
                          {session.signedUp}/{session.capacity}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">${(session.price / 100).toFixed(2)}</span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(session.status)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-4">
            {sessions.map((session) => (
              <Card key={session.id} className="p-4">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-base">{session.title}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{session.tenantName}</span>
                      </div>
                    </div>
                    {getStatusBadge(session.status)}
                  </div>

                  {/* Date and Location */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{new Date(session.date).toLocaleDateString()}</p>
                          <p className="text-xs text-muted-foreground">{session.time}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{session.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline">{session.ageGroup}</Badge>
                      <Badge variant="secondary">{session.gender}</Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">${(session.price / 100).toFixed(2)}</p>
                      <div className="flex items-center space-x-1 text-sm">
                        <Users className="w-3 h-3 text-muted-foreground" />
                        <span className={session.signedUp >= session.capacity ? "text-red-600 font-medium" : "text-muted-foreground"}>
                          {session.signedUp}/{session.capacity}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {sessions.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No sessions found</h3>
              <p className="text-muted-foreground">Try adjusting your filters to see more sessions.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
                <p className="text-2xl font-bold">{sessions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Capacity</p>
                <p className="text-2xl font-bold">{sessions.reduce((sum, s) => sum + s.capacity, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Signups</p>
                <p className="text-2xl font-bold">{sessions.reduce((sum, s) => sum + s.signedUp, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Tenants</p>
                <p className="text-2xl font-bold">{[...new Set(sessions.map(s => s.tenantId))].length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}