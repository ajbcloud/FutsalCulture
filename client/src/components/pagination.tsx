import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  className?: string;
}

export function Pagination({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
  onItemsPerPageChange,
  className = ""
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className={`${className}`}>
      {/* Mobile Layout */}
      <div className="md:hidden space-y-4">
        {/* Results info and items per page */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm text-zinc-400">
            Showing {startItem}-{endItem} of {totalItems} results
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-zinc-400">Show:</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => onItemsPerPageChange(parseInt(value))}
            >
              <SelectTrigger className="w-16 bg-zinc-800 border-zinc-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="20" className="text-white hover:bg-zinc-700">20</SelectItem>
                <SelectItem value="50" className="text-white hover:bg-zinc-700">50</SelectItem>
                <SelectItem value="100" className="text-white hover:bg-zinc-700">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Mobile Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 disabled:opacity-50 px-2 h-9"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            {/* Show fewer page numbers on mobile */}
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => {
                let pageNum;
                if (totalPages <= 3) {
                  pageNum = i + 1;
                } else if (currentPage === 1) {
                  pageNum = i + 1;
                } else if (currentPage === totalPages) {
                  pageNum = totalPages - 2 + i;
                } else {
                  pageNum = currentPage - 1 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                    className={`min-w-[36px] h-9 px-2 ${
                      currentPage === pageNum
                        ? "bg-blue-600 text-white"
                        : "bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                    }`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 disabled:opacity-50 px-2 h-9"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-sm text-zinc-400">
            Showing {startItem}-{endItem} of {totalItems} results
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-zinc-400">Show:</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => onItemsPerPageChange(parseInt(value))}
            >
              <SelectTrigger className="w-20 bg-zinc-800 border-zinc-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="20" className="text-white hover:bg-zinc-700">20</SelectItem>
                <SelectItem value="50" className="text-white hover:bg-zinc-700">50</SelectItem>
                <SelectItem value="100" className="text-white hover:bg-zinc-700">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                    className={
                      currentPage === pageNum
                        ? "bg-blue-600 text-white"
                        : "bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                    }
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 disabled:opacity-50"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}