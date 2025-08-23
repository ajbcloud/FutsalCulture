import { Request, Response } from 'express';
import { sql } from 'drizzle-orm';

export async function series(req: Request, res: Response) {
  const { from, to, interval = 'day' } = req.query as any;
  const bucket = interval === 'month' ? 'month' : interval === 'week' ? 'week' : 'day';

  // Mock data for now since we don't have real DB connection yet
  const map = new Map<string, { date: string, revenue: number, signups: number }>();
  const mockData = [
    { date: '2025-07-25', revenue: 100, signups: 4 },
    { date: '2025-07-26', revenue: 200, signups: 12 },
    { date: '2025-07-27', revenue: 150, signups: 8 },
  ];
  
  mockData.forEach(item => {
    map.set(item.date, item);
  });

  console.log(`Super Admin: analytics series retrieved by ${(req as any).user?.id || 'unknown'}`);
  res.json({ series: Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date)) });
}

export async function byTenant(req: Request, res: Response) {
  const { from, to } = req.query as any;
  
  // Mock data for now
  const rows = [
    { tenant: 'Elite Footwork Academy', revenue: 320, signups: 12 },
    { tenant: 'Futsal Culture', revenue: 130, signups: 9 }
  ];
  
  console.log(`Super Admin: analytics by tenant retrieved by ${(req as any).user?.id || 'unknown'}`);
  res.json({ rows });
}

export async function overview(req: Request, res: Response) {
  const { from, to } = req.query as any;
  
  // Mock comprehensive analytics data
  const data = {
    mrr: {
      byTenant: [
        { tenant: 'Elite Footwork Academy', mrr: 1500 },
        { tenant: 'Futsal Culture', mrr: 800 }
      ],
      total: 2300
    },
    revenueSeries: [
      { date: '2025-07-25', revenue: 100 },
      { date: '2025-07-26', revenue: 200 },
      { date: '2025-07-27', revenue: 150 },
    ],
    registrationsSeries: [
      { date: '2025-07-25', registrations: 4 },
      { date: '2025-07-26', registrations: 12 },
      { date: '2025-07-27', registrations: 8 },
    ],
    failedPayments: {
      count: 3,
      list: [
        { id: 'fail1', tenant: 'Futsal Culture', amount: 25, reason: 'Card declined' },
      ]
    },
    topTenants: [
      { tenant: 'Elite Footwork Academy', revenue: 320 },
      { tenant: 'Futsal Culture', revenue: 130 }
    ],
    churnCandidates: [
      { tenant: 'Metro Futsal', lastPayment: '2025-06-01', daysSince: 57 }
    ]
  };
  
  console.log(`Super Admin: analytics overview retrieved by ${(req as any).user?.id || 'unknown'}`);
  res.json(data);
}