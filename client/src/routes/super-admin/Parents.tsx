import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import DataTable from '@/components/super-admin/DataTable';
import { ColumnDef } from '@tanstack/react-table';

type Row = { id: string, tenant: string, name: string, email: string, phone: string, players: number, totalBookings: number, totalSpent: number, lastActivity: string, status: string };

export default function Parents() {
  const [page, setPage] = useState(1);
  const { data } = useQuery({ 
    queryKey: ['parents', page], 
    queryFn: () => get<{ rows: Row[], page: number, pageSize: number, totalRows: number }>(`/api/super-admin/parents?page=${page}&pageSize=25`) 
  });
  const rows = data?.rows ?? [];
  const pageSize = data?.pageSize ?? 25;
  const totalRows = data?.totalRows ?? rows.length;
  const columns: ColumnDef<Row>[] = [
    { header: 'Tenant', accessorKey: 'tenant' },
    { header: 'Name', accessorKey: 'name' },
    { header: 'Email', accessorKey: 'email' },
    { header: 'Phone', accessorKey: 'phone' },
    { header: 'Players', accessorKey: 'players' },
    { header: 'Bookings', accessorKey: 'totalBookings' },
    { header: 'Total Spent', accessorKey: 'totalSpent', cell: ({ row }) => `$${row.original.totalSpent}` },
    { header: 'Last Activity', accessorKey: 'lastActivity', cell: ({ row }) => new Date(row.original.lastActivity).toLocaleString() },
    { header: 'Status', accessorKey: 'status' },
  ];
  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Parents</h1>
      <DataTable columns={columns} data={rows} page={page} pageSize={pageSize} totalRows={totalRows} onPageChange={setPage} />
    </div>
  );
}