import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import DataTable from '@/components/super-admin/DataTable';
import { ColumnDef } from '@tanstack/react-table';

type Row = { id: string, tenant: string, title: string, dateTime: string, location: string, ageGroup: string, gender: string, capacity: number, price: number, status: string };

export default function Sessions() {
  const [page, setPage] = useState(1);
  const { data } = useQuery({ 
    queryKey: ['sessions', page], 
    queryFn: () => get<{ rows: Row[], page: number, pageSize: number, totalRows: number }>(`/api/super-admin/sessions?page=${page}&pageSize=25`) 
  });
  const rows = data?.rows ?? [];
  const pageSize = data?.pageSize ?? 25;
  const totalRows = data?.totalRows ?? rows.length;
  const columns: ColumnDef<Row>[] = [
    { header: 'Tenant', accessorKey: 'tenant' },
    { header: 'Title', accessorKey: 'title' },
    { header: 'Date/Time', accessorKey: 'dateTime', cell: ({ row }) => new Date(row.original.dateTime).toLocaleString() },
    { header: 'Location', accessorKey: 'location' },
    { header: 'Age Group', accessorKey: 'ageGroup' },
    { header: 'Gender', accessorKey: 'gender' },
    { header: 'Capacity', accessorKey: 'capacity' },
    { header: 'Price', accessorKey: 'price', cell: ({ row }) => `$${row.original.price}` },
    { header: 'Status', accessorKey: 'status' },
  ];
  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Sessions</h1>
      <DataTable columns={columns} data={rows} page={page} pageSize={pageSize} totalRows={totalRows} onPageChange={setPage} />
    </div>
  );
}