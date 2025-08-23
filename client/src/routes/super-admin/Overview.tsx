import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';

export default function Overview() {
  const [tenantId, setTenantId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  
  const queryKey = ['stats', tenantId, from, to];
  const queryUrl = `/api/super-admin/stats?tenantId=${tenantId || ''}&from=${from ? encodeURIComponent(from) : ''}&to=${to ? encodeURIComponent(to) : ''}`;
  
  const { data } = useQuery({ 
    queryKey, 
    queryFn: () => get<any>(queryUrl) 
  });
  
  const t = data?.totals ?? { revenue: 0, players: 0, activeTenants: 0, sessionsThisMonth: 0, pendingPayments: 0 };
  const top = data?.topTenants ?? [];
  const activity = data?.recentActivity ?? [];
  
  return (
    <div className="p-4 space-y-6">
      <div className="flex gap-4 mb-4">
        <select 
          value={tenantId} 
          onChange={(e) => setTenantId(e.target.value)}
          className="px-3 py-2 rounded bg-gray-800 text-white"
        >
          <option value="">All Tenants</option>
          <option value="t1">Elite Footwork Academy</option>
          <option value="t2">Futsal Culture</option>
        </select>
        <input 
          type="date" 
          value={from} 
          onChange={(e) => setFrom(e.target.value)}
          className="px-3 py-2 rounded bg-gray-800 text-white"
          placeholder="From"
        />
        <input 
          type="date" 
          value={to} 
          onChange={(e) => setTo(e.target.value)}
          className="px-3 py-2 rounded bg-gray-800 text-white"
          placeholder="To"
        />
      </div>
      
      <div className="grid grid-cols-5 gap-4">
        <Card title="Total Revenue" value={`$${t.revenue.toFixed(2)}`} />
        <Card title="Total Players" value={t.players} />
        <Card title="Active Tenants" value={t.activeTenants} />
        <Card title="Total Sessions" value={t.sessionsThisMonth} />
        <Card title="Pending Payments" value={t.pendingPayments} intent="warning" />
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg mb-2">Top Performing Tenants</h2>
          <ul className="space-y-2">
            {top.map((x: any) => (
              <li key={x.id} className="flex items-center justify-between bg-gray-900 rounded px-3 py-2">
                <div className="truncate">{x.name}</div>
                <div>${x.revenue.toFixed(2)}</div>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-lg mb-2">Recent Platform Activity</h2>
          <ul className="space-y-2">
            {activity.map((a: any) => (
              <li key={a.id} className="bg-gray-900 rounded px-3 py-2">
                <div className="text-sm">{new Date(a.when).toLocaleString()}</div>
                <div>{a.text}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Card({ title, value, intent }: { title: string, value: React.ReactNode, intent?: 'warning' | 'default' }) {
  return (
    <div className={`rounded-xl p-4 bg-gray-900 ${intent === 'warning' ? 'ring-2 ring-yellow-500' : ''}`}>
      <div className="text-sm opacity-70">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}