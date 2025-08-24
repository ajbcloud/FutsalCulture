import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, Users, Calendar, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface Tenant {
  tenantId: string;
  tenantName: string;
  planLevel: string;
  state: string;
  createdAt: string;
  userCount?: number;
  lastActivity?: string;
}

interface StateTenantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stateAbbr: string;
  stateName: string;
  tenantCount: number;
}

export default function StateTenantsModal({ 
  isOpen, 
  onClose, 
  stateAbbr, 
  stateName, 
  tenantCount 
}: StateTenantsModalProps) {
  const { data: tenants, isLoading, error } = useQuery({
    queryKey: ['/api/super-admin/tenants-by-state', stateAbbr],
    queryFn: () => fetch(`/api/super-admin/tenants-by-state/${stateAbbr}`).then(res => res.json()),
    enabled: isOpen && !!stateAbbr,
  });

  const getPlanColor = (plan: string) => {
    switch (plan?.toLowerCase()) {
      case 'core': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'growth': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'elite': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            Tenants in {stateName} ({stateAbbr})
            <Badge variant="secondary" className="ml-2">
              {tenantCount} tenant{tenantCount !== 1 ? 's' : ''}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 dark:text-red-400 mb-2">Failed to load tenants</p>
              <p className="text-sm text-muted-foreground">Please try again later</p>
            </div>
          ) : !tenants || tenants.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No tenants found in {stateName}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tenants.map((tenant: Tenant) => (
                <div 
                  key={tenant.tenantId} 
                  className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                  data-testid={`tenant-${tenant.tenantId}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-lg">{tenant.tenantName}</h3>
                    <Badge className={getPlanColor(tenant.planLevel)}>
                      {tenant.planLevel?.charAt(0).toUpperCase() + tenant.planLevel?.slice(1)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{tenant.state}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Joined {formatDate(tenant.createdAt)}</span>
                    </div>
                    
                    {tenant.userCount && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{tenant.userCount} users</span>
                      </div>
                    )}
                    
                    {tenant.lastActivity && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Last active {formatDate(tenant.lastActivity)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // Open tenant details in new tab to avoid losing Super Admin context
                        const url = `/super-admin/tenant/${tenant.tenantId}`;
                        window.open(url, '_blank');
                      }}
                      data-testid={`view-tenant-${tenant.tenantId}`}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}