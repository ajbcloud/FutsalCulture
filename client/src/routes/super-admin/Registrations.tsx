import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import DataTable from '@/components/super-admin/DataTable';
import { ColumnDef } from '@tanstack/react-table';

type Row = { id: string, tenant: string, player: string, parent: string, contact: string, session: string, sessionDate: string, registeredAt: string, status: string, paymentStatus: string, amount: number };

export default function Registrations() {
  const [page, setPage] = useState(1);
  const { data } = useQuery({ 
    queryKey: ['registrations', page], 
    queryFn: () => get<{ rows: Row[], page: number, pageSize: number, totalRows: number }>(`/api/super-admin/registrations?page=${page}&pageSize=25`) 
  });
  const rows = data?.rows ?? [];
  const pageSize = data?.pageSize ?? 25;
  const totalRows = data?.totalRows ?? rows.length;
  const columns: ColumnDef<Row>[] = [
    { header: 'Tenant', accessorKey: 'tenant' },
    { header: 'Player', accessorKey: 'player' },
    { header: 'Parent', accessorKey: 'parent' },
    { header: 'Contact', accessorKey: 'contact' },
    { header: 'Session', accessorKey: 'session' },
    { header: 'Session Date', accessorKey: 'sessionDate', cell: ({ row }) => new Date(row.original.sessionDate).toLocaleString() },
    { header: 'Registered', accessorKey: 'registeredAt', cell: ({ row }) => new Date(row.original.registeredAt).toLocaleString() },
    { header: 'Status', accessorKey: 'status' },
    { header: 'Payment', accessorKey: 'paymentStatus' },
    { header: 'Amount', accessorKey: 'amount', cell: ({ row }) => `$${row.original.amount}` },
  ];
  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Registrations</h1>
      <DataTable columns={columns} data={rows} page={page} pageSize={pageSize} totalRows={totalRows} onPageChange={setPage} />
    </div>
  );
}