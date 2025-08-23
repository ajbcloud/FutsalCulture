import { Request, Response } from 'express';
export async function series(req: Request, res: Response) {
  res.json({
    series: [
      { date: '2025-07-25', revenue: 100, signups: 4 },
      { date: '2025-07-26', revenue: 200, signups: 12 },
      { date: '2025-07-27', revenue: 150, signups: 8 },
    ]
  });
}
export async function byTenant(req: Request, res: Response) {
  res.json({
    rows: [
      { tenant: 'Elite Footwork Academy', revenue: 320, signups: 12 },
      { tenant: 'Futsal Culture', revenue: 130, signups: 9 }
    ]
  });
}