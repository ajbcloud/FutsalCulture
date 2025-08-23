import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import DataTable from '@/components/super-admin/DataTable';
import { ColumnDef } from '@tanstack/react-table';

type Row = { id: string, organization: string, subdomain: string, contactEmail: string, status: string, admins: number, players: number, sessions: number, revenue: number, created: string };

export default function Tenants() {
  const [page, setPage] = useState(1);
  const { data } = useQuery({ 
    queryKey: ['tenants', page], 
    queryFn: () => get<{ rows: Row[], page: number, pageSize: number, totalRows: number }>(`/api/super-admin/tenants?page=${page}&pageSize=25`) 
  });
  const rows = data?.rows ?? [];
  const pageSize = data?.pageSize ?? 25;
  const totalRows = data?.totalRows ?? rows.length;
  
  // Calculate totals with proper number handling
  const totals = rows.reduce((acc, row) => ({
    admins: acc.admins + (Number(row.admins) || 0),
    players: acc.players + (Number(row.players) || 0),
    sessions: acc.sessions + (Number(row.sessions) || 0),
    revenue: acc.revenue + (Number(row.revenue) || 0)
  }), { admins: 0, players: 0, sessions: 0, revenue: 0 });
  
  const columns: ColumnDef<Row>[] = [
    { header: 'Organization', accessorKey: 'organization' },
    { header: 'Subdomain', accessorKey: 'subdomain' },
    { header: 'Contact Email', accessorKey: 'contactEmail' },
    { header: 'Status', accessorKey: 'status' },
    { header: 'Admins', accessorKey: 'admins' },
    { header: 'Players', accessorKey: 'players' },
    { header: 'Sessions', accessorKey: 'sessions' },
    { header: 'Revenue', accessorKey: 'revenue', cell: ({ row }) => `$${Number(row.original.revenue || 0).toFixed(2)}` },
    { header: 'Created', accessorKey: 'created' },
  ];
  
  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Tenants</h1>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-900 rounded p-4">
          <div className="text-sm opacity-70">Total Admins</div>
          <div className="text-2xl font-semibold">{totals.admins}</div>
        </div>
        <div className="bg-gray-900 rounded p-4">
          <div className="text-sm opacity-70">Total Players</div>
          <div className="text-2xl font-semibold">{totals.players}</div>
        </div>
        <div className="bg-gray-900 rounded p-4">
          <div className="text-sm opacity-70">Total Sessions</div>
          <div className="text-2xl font-semibold">{totals.sessions}</div>
        </div>
        <div className="bg-gray-900 rounded p-4">
          <div className="text-sm opacity-70">Total Revenue</div>
          <div className="text-2xl font-semibold">${totals.revenue.toFixed(2)}</div>
        </div>
      </div>
      <DataTable columns={columns} data={rows} page={page} pageSize={pageSize} totalRows={totalRows} onPageChange={setPage} />
    </div>
  );
}