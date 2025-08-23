import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Analytics() {
  const from = useMemo(() => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), []);
  const to = useMemo(() => new Date().toISOString(), []);
  const q = useQuery({
    queryKey: ['analytics', 'series', from, to, 'day'],
    queryFn: () => get<{ series: { date: string, revenue: number, signups: number }[] }>(`/api/super-admin/analytics/series?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&interval=day`)
  });
  const data = q.data?.series ?? [];
  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Analytics</h1>
      <div className="h-72 w-full">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <Tooltip />
            <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} dot={false} />
            <Line yAxisId="left" type="monotone" dataKey="signups" stroke="#82ca9d" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}