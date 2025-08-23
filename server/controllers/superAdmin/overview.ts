import { Request, Response } from 'express';

export async function getStats(req: Request, res: Response) {
  const { tenantId, from, to } = req.query as { tenantId?: string, from?: string, to?: string };

  // Mock data with filters applied (will be replaced with real DB queries later)
  let revenue = 450;
  let players = 1250;
  let activeTenants = 8;
  let sessionsThisMonth = 340;
  let pendingPayments = 12;
  
  // Apply filters to mock data
  if (tenantId === 't1') {
    revenue = 320;
    players = 33;
    activeTenants = 1;
    sessionsThisMonth = 45;
    pendingPayments = 2;
  } else if (tenantId === 't2') {
    revenue = 130;
    players = 37;
    activeTenants = 1;
    sessionsThisMonth = 28;
    pendingPayments = 1;
  }
  
  const topTenants = tenantId ? 
    [{ id: tenantId, name: tenantId === 't1' ? 'Elite Footwork Academy' : 'Futsal Culture', 
       subdomain: tenantId === 't1' ? 'elite-footwork' : 'futsal-culture', 
       revenue: tenantId === 't1' ? 320 : 130 }] :
    [
      { id: 't1', name: 'Elite Footwork Academy', subdomain: 'elite-footwork', revenue: 320 },
      { id: 't2', name: 'Futsal Culture', subdomain: 'futsal-culture', revenue: 130 }
    ];

  const recentActivity = [
    { id: 'evt-1', when: new Date().toISOString(), text: 'Activity feed coming from audit log soon' }
  ];

  console.log(`Super Admin: stats retrieved by ${(req as any).user?.id || 'unknown'}`);

  res.json({
    totals: {
      revenue: revenue || 0,
      players: players || 0,
      activeTenants: activeTenants || 0,
      sessionsThisMonth: sessionsThisMonth || 0,
      pendingPayments: pendingPayments || 0
    },
    topTenants,
    recentActivity
  });
}