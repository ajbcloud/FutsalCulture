import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import DataTable from '@/components/super-admin/DataTable';
import { ColumnDef } from '@tanstack/react-table';

type Row = { id: string, tenant: string, gateway: string, paymentId: string, admin: string, plan: string, method: string, status: string, date: string };

export default function PlatformBilling() {
  const [page, setPage] = useState(1);
  const { data } = useQuery({ 
    queryKey: ['platform-payments', page], 
    queryFn: () => get<{ rows: Row[], page: number, pageSize: number, totalRows: number }>(`/api/super-admin/platform-payments?page=${page}&pageSize=25`) 
  });
  const rows = data?.rows ?? [];
  const pageSize = data?.pageSize ?? 25;
  const totalRows = data?.totalRows ?? rows.length;
  const columns: ColumnDef<Row>[] = [
    { header: 'Tenant', accessorKey: 'tenant' },
    { header: 'Payment ID', accessorKey: 'paymentId' },
    { header: 'Admin', accessorKey: 'admin' },
    { header: 'Plan', accessorKey: 'plan' },
    { header: 'Method', accessorKey: 'method' },
    { header: 'Status', accessorKey: 'status' },
    { header: 'Date', accessorKey: 'date', cell: ({ row }) => new Date(row.original.date).toLocaleString() },
    { header: 'Gateway', accessorKey: 'gateway' },
  ];
  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Platform Billing</h1>
      <DataTable columns={columns} data={rows} page={page} pageSize={pageSize} totalRows={totalRows} onPageChange={setPage} />
    </div>
  );
}