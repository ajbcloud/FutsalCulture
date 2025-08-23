import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import DataTable from '@/components/super-admin/DataTable';
import { ColumnDef } from '@tanstack/react-table';

type Row = { id: string, tenant: string, subject: string, submitter: string, category: string, priority: string, status: string, replies: number, submitted: string, resolved: string | null };

export default function Help() {
  const [page, setPage] = useState(1);
  const { data } = useQuery({ 
    queryKey: ['help', page], 
    queryFn: () => get<{ rows: Row[], page: number, pageSize: number, totalRows: number }>(`/api/super-admin/help?page=${page}&pageSize=25`) 
  });
  const rows = data?.rows ?? [];
  const pageSize = data?.pageSize ?? 25;
  const totalRows = data?.totalRows ?? rows.length;
  const columns: ColumnDef<Row>[] = [
    { header: 'Tenant', accessorKey: 'tenant' },
    { header: 'Subject', accessorKey: 'subject' },
    { header: 'Submitter', accessorKey: 'submitter' },
    { header: 'Category', accessorKey: 'category' },
    { header: 'Priority', accessorKey: 'priority' },
    { header: 'Status', accessorKey: 'status' },
    { header: 'Replies', accessorKey: 'replies' },
    { header: 'Submitted', accessorKey: 'submitted', cell: ({ row }) => new Date(row.original.submitted).toLocaleString() },
    { header: 'Resolved', accessorKey: 'resolved', cell: ({ row }) => row.original.resolved ? new Date(row.original.resolved).toLocaleString() : '-' },
  ];
  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Help Requests</h1>
      <DataTable columns={columns} data={rows} page={page} pageSize={pageSize} totalRows={totalRows} onPageChange={setPage} />
    </div>
  );
}