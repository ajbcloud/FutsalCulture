import { Request, Response } from 'express';
export async function getStats(req: Request, res: Response) {
  res.json({
    totals: {
      revenue: 450,
      players: 1250,
      activeTenants: 8,
      sessionsThisMonth: 340,
      pendingPayments: 12,
    },
    topTenants: [
      { id: 't1', name: 'Elite Footwork Academy', subdomain: 'elite-footwork', revenue: 320 },
      { id: 't2', name: 'Futsal Culture', subdomain: 'futsal-culture', revenue: 130 }
    ],
    recentActivity: [
      { id: 'a1', when: new Date().toISOString(), text: 'New tenant created Metro Futsal' },
      { id: 'a2', when: new Date().toISOString(), text: 'Payment processed 450 for Elite Academy' }
    ]
  });
}