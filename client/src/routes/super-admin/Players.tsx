import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import DataTable from '@/components/super-admin/DataTable';
import { ColumnDef } from '@tanstack/react-table';

type Row = { id: string, tenant: string, player: string, ageGroup: string, gender: string, parent: string, registeredAt: string, totalBookings: number, portalAccess: string, bookingPermission: string, lastActivity: string };

export default function Players() {
  const [page, setPage] = useState(1);
  const { data } = useQuery({ 
    queryKey: ['players', page], 
    queryFn: () => get<{ rows: Row[], page: number, pageSize: number, totalRows: number }>(`/api/super-admin/players?page=${page}&pageSize=25`) 
  });
  const rows = data?.rows ?? [];
  const pageSize = data?.pageSize ?? 25;
  const totalRows = data?.totalRows ?? rows.length;
  const columns: ColumnDef<Row>[] = [
    { header: 'Tenant', accessorKey: 'tenant' },
    { header: 'Player', accessorKey: 'player' },
    { header: 'Age Group', accessorKey: 'ageGroup' },
    { header: 'Gender', accessorKey: 'gender' },
    { header: 'Parent', accessorKey: 'parent' },
    { header: 'Registered', accessorKey: 'registeredAt', cell: ({ row }) => new Date(row.original.registeredAt).toLocaleString() },
    { header: 'Bookings', accessorKey: 'totalBookings' },
    { header: 'Portal Access', accessorKey: 'portalAccess' },
    { header: 'Booking Permission', accessorKey: 'bookingPermission' },
    { header: 'Last Activity', accessorKey: 'lastActivity', cell: ({ row }) => new Date(row.original.lastActivity).toLocaleString() },
  ];
  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Players</h1>
      <DataTable columns={columns} data={rows} page={page} pageSize={pageSize} totalRows={totalRows} onPageChange={setPage} />
    </div>
  );
}