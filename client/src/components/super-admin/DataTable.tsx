import React from 'react';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';

type TableProps<T> = {
  columns: ColumnDef<T, any>[];
  data: T[];
  page: number;
  pageSize: number;
  totalRows: number;
  onPageChange: (page: number) => void;
};

export default function DataTable<T>({ columns, data, page, pageSize, totalRows, onPageChange }: TableProps<T>) {
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  return (
    <div className="w-full">
      <table className="min-w-full text-sm">
        <thead>
          {table.getHeaderGroups().map(hg => (
            <tr key={hg.id}>
              {hg.headers.map(h => (
                <th key={h.id} className="text-left py-2 px-3">
                  {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(r => (
            <tr key={r.id} className="border-t border-gray-700">
              {r.getVisibleCells().map(c => (
                <td key={c.id} className="py-2 px-3">
                  {flexRender(c.column.columnDef.cell, c.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center gap-2 py-3">
        <button disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="px-2 py-1 rounded bg-gray-800 disabled:opacity-50">Prev</button>
        <div>Page {page} of {totalPages}</div>
        <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="px-2 py-1 rounded bg-gray-800 disabled:opacity-50">Next</button>
      </div>
    </div>
  );
}