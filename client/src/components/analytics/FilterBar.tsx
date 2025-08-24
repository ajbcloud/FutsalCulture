import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { themeClasses } from '@/lib/ui/theme';
import { Calendar, Filter, X, RotateCcw } from 'lucide-react';

interface FilterBarProps {
  tenantId: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  onTenantChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onDateRangeChange: (from: string, to: string) => void;
  onClearFilters: () => void;
  sticky?: boolean;
  className?: string;
  'data-testid'?: string;
}

const quickRanges = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
];

const statusOptions = [
  { value: 'all', label: 'All Data' },
  { value: 'platform', label: 'Platform' },
  { value: 'commerce', label: 'Client Commerce' },
];

export default function FilterBar({
  tenantId,
  status,
  dateFrom,
  dateTo,
  onTenantChange,
  onStatusChange,
  onDateRangeChange,
  onClearFilters,
  sticky = true,
  className = '',
  'data-testid': testId
}: FilterBarProps) {
  const [customFrom, setCustomFrom] = useState(dateFrom);
  const [customTo, setCustomTo] = useState(dateTo);

  // Sync with external changes
  useEffect(() => {
    setCustomFrom(dateFrom);
    setCustomTo(dateTo);
  }, [dateFrom, dateTo]);

  const handleQuickRange = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    
    const fromStr = from.toISOString().split('T')[0];
    const toStr = to.toISOString().split('T')[0];
    
    setCustomFrom(fromStr);
    setCustomTo(toStr);
    onDateRangeChange(fromStr, toStr);
  };

  const handleCustomDateChange = () => {
    onDateRangeChange(customFrom, customTo);
  };

  const getSummaryText = () => {
    const parts: string[] = [];
    
    // Tenant
    if (tenantId === 'all') {
      parts.push('All Tenants');
    } else {
      parts.push(`Tenant: ${tenantId}`);
    }
    
    // Date range
    if (dateFrom && dateTo) {
      const from = new Date(dateFrom);
      const to = new Date(dateTo);
      const diffTime = Math.abs(to.getTime() - from.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 7) {
        parts.push('Last 7 days');
      } else if (diffDays <= 30) {
        parts.push('Last 30 days');
      } else if (diffDays <= 90) {
        parts.push('Last 90 days');
      } else {
        parts.push(`${from.toLocaleDateString()} - ${to.toLocaleDateString()}`);
      }
    } else {
      parts.push('All time');
    }
    
    // Status/Lane
    const statusLabel = statusOptions.find(opt => opt.value === status)?.label || status;
    if (status !== 'all') {
      parts.push(statusLabel);
    }
    
    return parts.join(' · ');
  };

  const hasActiveFilters = tenantId !== 'all' || status !== 'all' || dateFrom || dateTo;

  const stickyClasses = sticky 
    ? 'sticky top-0 z-20 backdrop-blur-lg bg-[#11161d]/80 border-[1.5px] border-[#1f2733]/50' 
    : themeClasses.card;

  return (
    <Card className={`${stickyClasses} ${className}`} data-testid={testId}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Summary pill */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className={`w-4 h-4 ${themeClasses.textSecondary}`} />
              <Badge 
                variant="outline" 
                className="bg-[#0f1319] border-[#1f2733] text-[#a9b4c2]"
              >
                {getSummaryText()}
              </Badge>
            </div>
            
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="h-8 px-2 text-[#a9b4c2] hover:text-[#e6edf3] hover:bg-[#1f2733]"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset
              </Button>
            )}
          </div>

          {/* Filter controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {/* Tenant selector */}
            <div className="space-y-1">
              <label className={`${themeClasses.textLabel} block`}>
                Tenant
              </label>
              <Select value={tenantId} onValueChange={onTenantChange}>
                <SelectTrigger className="bg-[#0f1319] border-[#1f2733]">
                  <SelectValue placeholder="All Tenants" />
                </SelectTrigger>
                <SelectContent className="bg-[#11161d] border-[#1f2733]">
                  <SelectItem value="all">All Tenants</SelectItem>
                  <SelectItem value="tenant-1">Elite Footwork Academy</SelectItem>
                  <SelectItem value="tenant-2">Metro Futsal</SelectItem>
                  <SelectItem value="tenant-3">Futsal Culture</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status selector */}
            <div className="space-y-1">
              <label className={`${themeClasses.textLabel} block`}>
                Data Source
              </label>
              <Select value={status} onValueChange={onStatusChange}>
                <SelectTrigger className="bg-[#0f1319] border-[#1f2733]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#11161d] border-[#1f2733]">
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quick date ranges */}
            <div className="space-y-1">
              <label className={`${themeClasses.textLabel} block`}>
                Quick Range
              </label>
              <div className="flex gap-1">
                {quickRanges.map((range) => (
                  <Button
                    key={range.days}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickRange(range.days)}
                    className="text-xs bg-[#0f1319] border-[#1f2733] hover:bg-[#1f2733]"
                  >
                    {range.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom from date */}
            <div className="space-y-1">
              <label className={`${themeClasses.textLabel} block`}>
                From Date
              </label>
              <div className="relative">
                <Input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  onBlur={handleCustomDateChange}
                  className="bg-[#0f1319] border-[#1f2733] pr-10"
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#a9b4c2] pointer-events-none" />
              </div>
            </div>

            {/* Custom to date */}
            <div className="space-y-1">
              <label className={`${themeClasses.textLabel} block`}>
                To Date
              </label>
              <div className="relative">
                <Input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  onBlur={handleCustomDateChange}
                  className="bg-[#0f1319] border-[#1f2733] pr-10"
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#a9b4c2] pointer-events-none" />
              </div>
            </div>

            {/* Apply button */}
            <div className="space-y-1">
              <label className={`${themeClasses.textLabel} block opacity-0`}>
                Action
              </label>
              <Button
                onClick={handleCustomDateChange}
                className="w-full bg-[#10b981] hover:bg-[#059669] text-white"
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}