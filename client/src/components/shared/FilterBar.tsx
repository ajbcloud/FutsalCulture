import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { X, Filter } from 'lucide-react';

interface FilterBarProps {
  showTenantFilter?: boolean;
  onTenantChange?: (tenantId: string) => void;
  onStatusChange?: (status: string) => void;
  onDateRangeChange?: (from: string, to: string) => void;
  onClearFilters?: () => void;
  onApply?: () => void;
  tenantId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  statusOptions?: Array<{ value: string; label: string }>;
}

export default function FilterBar({
  showTenantFilter = true,
  onTenantChange,
  onStatusChange,
  onDateRangeChange,
  onClearFilters,
  onApply,
  tenantId = 'all',
  status = 'all',
  dateFrom = '',
  dateTo = '',
  statusOptions = [
    { value: 'all', label: 'All Data' },
    { value: 'paid', label: 'Paid' },
    { value: 'pending', label: 'Pending' },
    { value: 'refunded', label: 'Refunded' }
  ]
}: FilterBarProps) {
  const [localFrom, setLocalFrom] = useState(dateFrom);
  const [localTo, setLocalTo] = useState(dateTo);

  const handleApply = () => {
    if (onDateRangeChange && (localFrom !== dateFrom || localTo !== dateTo)) {
      onDateRangeChange(localFrom, localTo);
    }
    onApply?.();
  };

  const handleClearFilters = () => {
    setLocalFrom('');
    setLocalTo('');
    onTenantChange?.('all');
    onStatusChange?.('all');
    onDateRangeChange?.('', '');
    onClearFilters?.();
  };

  const hasActiveFilters = tenantId !== 'all' || status !== 'all' || dateFrom || dateTo;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          {showTenantFilter && (
            <div className="flex-1 min-w-[180px]">
              <Label htmlFor="tenant-filter" className="text-sm font-medium mb-1 block">
                Tenant
              </Label>
              <Select value={tenantId} onValueChange={onTenantChange}>
                <SelectTrigger id="tenant-filter">
                  <SelectValue placeholder="Select tenant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tenants</SelectItem>
                  <SelectItem value="elite-footwork">Elite Footwork Academy</SelectItem>
                  <SelectItem value="futsal-culture">Futsal Culture</SelectItem>
                  <SelectItem value="metro-futsal">Metro Futsal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="flex-1 min-w-[150px]">
            <Label htmlFor="status-filter" className="text-sm font-medium mb-1 block">
              Status
            </Label>
            <Select value={status} onValueChange={onStatusChange}>
              <SelectTrigger id="status-filter">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[140px]">
            <Label htmlFor="date-from" className="text-sm font-medium mb-1 block">
              From Date
            </Label>
            <Input
              id="date-from"
              type="date"
              value={localFrom}
              onChange={(e) => setLocalFrom(e.target.value)}
            />
          </div>

          <div className="flex-1 min-w-[140px]">
            <Label htmlFor="date-to" className="text-sm font-medium mb-1 block">
              To Date
            </Label>
            <Input
              id="date-to"
              type="date"
              value={localTo}
              onChange={(e) => setLocalTo(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleApply}
              className="whitespace-nowrap"
            >
              <Filter className="w-4 h-4 mr-2" />
              Apply
            </Button>
            
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="whitespace-nowrap"
              >
                <X className="w-4 h-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}