import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import DataTable from '@/components/super-admin/DataTable';
import { ColumnDef } from '@tanstack/react-table';

type Row = { id: string, tenant: string, player: string, parent: string, session: string, amount: number, method: string, status: string, created: string };

export default function Payments() {
  const [page, setPage] = useState(1);
  const { data } = useQuery({ 
    queryKey: ['payments', page], 
    queryFn: () => get<{ rows: Row[], page: number, pageSize: number, totalRows: number }>(`/api/super-admin/payments?page=${page}&pageSize=25`) 
  });
  const rows = data?.rows ?? [];
  const pageSize = data?.pageSize ?? 25;
  const totalRows = data?.totalRows ?? rows.length;
  const columns: ColumnDef<Row>[] = [
    { header: 'Tenant', accessorKey: 'tenant' },
    { header: 'Player', accessorKey: 'player' },
    { header: 'Parent', accessorKey: 'parent' },
    { header: 'Session', accessorKey: 'session' },
    { header: 'Amount', accessorKey: 'amount', cell: ({ row }) => `$${row.original.amount}` },
    { header: 'Method', accessorKey: 'method' },
    { header: 'Status', accessorKey: 'status' },
    { header: 'Date', accessorKey: 'created', cell: ({ row }) => new Date(row.original.created).toLocaleString() },
  ];
  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Payments</h1>
      <DataTable columns={columns} data={rows} page={page} pageSize={pageSize} totalRows={totalRows} onPageChange={setPage} />
    </div>
  );
}