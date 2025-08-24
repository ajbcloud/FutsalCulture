import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { themeClasses } from '@/lib/ui/theme';
import { Calendar, Filter, X, RotateCcw, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';

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

const dateRangeOptions = [
  { label: 'Last 7 days', value: '7days', days: 7 },
  { label: 'Last 30 days', value: '30days', days: 30 },
  { label: 'Last 90 days', value: '90days', days: 90 },
  { label: 'Custom range', value: 'custom', days: null },
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
  const [selectedDateRange, setSelectedDateRange] = useState<string>('30days');
  const [isCustomCalendarOpen, setIsCustomCalendarOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState<Date | undefined>(dateFrom ? new Date(dateFrom) : undefined);
  const [customTo, setCustomTo] = useState<Date | undefined>(dateTo ? new Date(dateTo) : undefined);

  // Sync with external changes
  useEffect(() => {
    setCustomFrom(dateFrom ? new Date(dateFrom) : undefined);
    setCustomTo(dateTo ? new Date(dateTo) : undefined);
    
    // Auto-detect which range is selected based on dates
    if (dateFrom && dateTo) {
      const from = new Date(dateFrom);
      const to = new Date(dateTo);
      const diffTime = Math.abs(to.getTime() - from.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 7) {
        setSelectedDateRange('7days');
      } else if (diffDays <= 30) {
        setSelectedDateRange('30days');
      } else if (diffDays <= 90) {
        setSelectedDateRange('90days');
      } else {
        setSelectedDateRange('custom');
      }
    }
  }, [dateFrom, dateTo]);

  const handleDateRangeChange = (value: string) => {
    setSelectedDateRange(value);
    
    if (value === 'custom') {
      setIsCustomCalendarOpen(true);
      return;
    }
    
    const option = dateRangeOptions.find(opt => opt.value === value);
    if (option && option.days) {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - option.days);
      
      const fromStr = from.toISOString().split('T')[0];
      const toStr = to.toISOString().split('T')[0];
      
      setCustomFrom(from);
      setCustomTo(to);
      onDateRangeChange(fromStr, toStr);
    }
  };

  const handleCustomDateApply = () => {
    if (customFrom && customTo) {
      const fromStr = customFrom.toISOString().split('T')[0];
      const toStr = customTo.toISOString().split('T')[0];
      onDateRangeChange(fromStr, toStr);
    }
    setIsCustomCalendarOpen(false);
  };

  const getDateRangeLabel = () => {
    if (selectedDateRange === 'custom' && customFrom && customTo) {
      return `${format(customFrom, 'MMM d')} - ${format(customTo, 'MMM d, yyyy')}`;
    }
    return dateRangeOptions.find(opt => opt.value === selectedDateRange)?.label || 'Select range';
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

          {/* Filter controls - Consolidated layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            {/* Consolidated Date Range selector */}
            <div className="space-y-1">
              <label className={`${themeClasses.textLabel} block`}>
                Date Range
              </label>
              <div className="flex gap-2">
                <Select value={selectedDateRange} onValueChange={handleDateRangeChange}>
                  <SelectTrigger className="bg-[#0f1319] border-[#1f2733] flex-1">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4" />
                        <span className="truncate">{getDateRangeLabel()}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-[#11161d] border-[#1f2733]">
                    {dateRangeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Custom Calendar Popover */}
                {selectedDateRange === 'custom' && (
                  <Popover open={isCustomCalendarOpen} onOpenChange={setIsCustomCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="bg-[#0f1319] border-[#1f2733] hover:bg-[#1f2733] px-3"
                      >
                        <Calendar className="w-4 h-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-[#11161d] border-[#1f2733]" align="start">
                      <div className="p-4 space-y-4">
                        <div className="space-y-2">
                          <label className={`${themeClasses.textLabel} text-sm`}>From Date</label>
                          <CalendarComponent
                            mode="single"
                            selected={customFrom}
                            onSelect={setCustomFrom}
                            className="rounded-md border border-[#1f2733]"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className={`${themeClasses.textLabel} text-sm`}>To Date</label>
                          <CalendarComponent
                            mode="single"
                            selected={customTo}
                            onSelect={setCustomTo}
                            className="rounded-md border border-[#1f2733]"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleCustomDateApply}
                            className="flex-1 bg-[#10b981] hover:bg-[#059669] text-white"
                            disabled={!customFrom || !customTo}
                          >
                            Apply Range
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setIsCustomCalendarOpen(false)}
                            className="bg-[#0f1319] border-[#1f2733] hover:bg-[#1f2733]"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}