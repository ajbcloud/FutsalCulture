import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { themeClasses, formatters } from '@/lib/ui/theme';
import { Download, Search, ChevronUp, ChevronDown } from 'lucide-react';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  format?: 'currency' | 'number' | 'percent' | 'text';
}

interface RankingTableProps {
  title: string;
  rows: Array<Record<string, any>>;
  columns: Column[];
  onExportCSV?: () => void;
  searchable?: boolean;
  className?: string;
  'data-testid'?: string;
  loading?: boolean;
  emptyMessage?: string;
}

export default function RankingTable({
  title,
  rows,
  columns,
  onExportCSV,
  searchable = false,
  className = '',
  'data-testid': testId,
  loading = false,
  emptyMessage = 'No data available'
}: RankingTableProps) {
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('desc');
    }
  };

  const formatValue = (value: any, format?: string) => {
    if (value == null) return '–';
    
    switch (format) {
      case 'currency':
        return formatters.currency(Number(value));
      case 'number':
        return Number(value).toLocaleString();
      case 'percent':
        return formatters.percent(Number(value));
      default:
        return String(value);
    }
  };

  const filteredAndSortedRows = (() => {
    let filtered = rows;
    
    // Search filter
    if (searchable && searchTerm) {
      filtered = rows.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    
    // Sort
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        
        if (sortDirection === 'asc') {
          return aStr.localeCompare(bStr);
        } else {
          return bStr.localeCompare(aStr);
        }
      });
    }
    
    return filtered;
  })();

  if (loading) {
    return (
      <Card className={`${themeClasses.card} ${className}`} data-testid={`${testId}-loading`}>
        <CardHeader>
          <div className="h-6 bg-gray-300 rounded animate-pulse w-48" />
        </CardHeader>
        <CardContent>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex justify-between py-3 border-b border-gray-200 last:border-0">
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${themeClasses.card} ${className}`} data-testid={testId}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className={themeClasses.textPrimary}>{title}</CardTitle>
          <div className="flex items-center gap-2">
            {searchable && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-48 bg-[#0f1319] border-[#1f2733]"
                />
              </div>
            )}
            {onExportCSV && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExportCSV}
                className="bg-[#0f1319] border-[#1f2733] hover:bg-[#1f2733]"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {filteredAndSortedRows.length === 0 ? (
          <div className="p-8 text-center">
            <p className={themeClasses.textSecondary}>{emptyMessage}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${themeClasses.surfaceMuted} sticky top-0 z-10`}>
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={`p-4 font-semibold ${themeClasses.textSecondary} text-${column.align || 'left'} ${
                        column.sortable ? 'cursor-pointer hover:text-[#e6edf3] transition-colors' : ''
                      }`}
                      onClick={column.sortable ? () => handleSort(column.key) : undefined}
                    >
                      <div className={`flex items-center gap-1 ${column.align === 'right' ? 'justify-end' : column.align === 'center' ? 'justify-center' : 'justify-start'}`}>
                        <span>{column.label}</span>
                        {column.sortable && sortColumn === column.key && (
                          sortDirection === 'asc' ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedRows.map((row, index) => (
                  <tr
                    key={row.id || index}
                    className="border-b border-[#1f2733] last:border-b-0 hover:bg-[#0f1319] transition-colors"
                    data-testid={`${testId}-row-${index}`}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`p-4 text-${column.align || 'left'} ${
                          column.format === 'currency' ? themeClasses.accentPrimary : themeClasses.textPrimary
                        }`}
                      >
                        {formatValue(row[column.key], column.format)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}