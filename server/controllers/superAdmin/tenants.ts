import { Request, Response } from 'express';
import { pageParams, wrapRows } from '../../lib/pagination';
import { storage } from '../../storage';
import { db } from '../../db';
import { tenants, users, players, futsalSessions, payments, signups } from '../../../shared/schema';
import { eq, sql, desc, and, isNotNull, count } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function list(req: Request, res: Response) {
  try {
    const { page, pageSize } = pageParams(req.query);
    
    // Get all tenants with their statistics
    const tenantsData = await db
      .select({
        id: tenants.id,
        organization: tenants.name,
        subdomain: tenants.subdomain,
        contactEmail: tenants.contactEmail,
        planLevel: tenants.planLevel,
        billingStatus: tenants.billingStatus,
        trialEndsAt: tenants.trialEndsAt,
        created: tenants.createdAt,
        // Get admin count for each tenant
        adminCount: sql<number>`(
          SELECT COUNT(*)
          FROM ${users}
          WHERE ${users.tenantId} = ${tenants.id}
          AND ${users.isAdmin} = true
        )`,
        // Get player count for each tenant
        playerCount: sql<number>`(
          SELECT COUNT(*)
          FROM ${players}
          WHERE ${players.tenantId} = ${tenants.id}
        )`,
        // Get session count for each tenant
        sessionCount: sql<number>`(
          SELECT COUNT(*)
          FROM ${futsalSessions}
          WHERE ${futsalSessions.tenantId} = ${tenants.id}
        )`,
        // Get revenue for each tenant (in cents)
        revenue: sql<number>`(
          SELECT COALESCE(SUM(${payments.amountCents}), 0)
          FROM ${payments}
          WHERE ${payments.tenantId} = ${tenants.id}
          AND ${payments.status} = 'paid'
        )`
      })
      .from(tenants)
      .orderBy(desc(tenants.createdAt));

    // Transform data for response
    const rows = tenantsData.map(tenant => ({
      id: tenant.id,
      organization: tenant.organization,
      subdomain: tenant.subdomain,
      contactEmail: tenant.contactEmail || 'N/A',
      status: tenant.billingStatus || 'active',
      planLevel: tenant.planLevel || 'free',
      trialEndsAt: tenant.trialEndsAt?.toISOString() || null,
      admins: Number(tenant.adminCount) || 0,
      players: Number(tenant.playerCount) || 0,
      sessions: Number(tenant.sessionCount) || 0,
      revenue: Number(tenant.revenue) / 100 || 0, // Convert cents to dollars
      created: tenant.created?.toISOString().split('T')[0] || 'N/A'
    }));

    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedRows = rows.slice(startIndex, endIndex);

    console.log(`Super Admin: tenants list retrieved by ${(req as any).user?.id || 'unknown'}`);
    res.json(wrapRows(paginatedRows, page, pageSize, rows.length));
  } catch (error) {
    console.error('Error fetching tenants list:', error);
    res.status(500).json({ message: 'Failed to fetch tenants list' });
  }
}

export async function create(req: Request, res: Response) {
  try {
    const { name, subdomain, contactEmail, planLevel, tenantCode } = req.body;
    
    const newTenant = await storage.createTenant({
      name,
      subdomain,
      contactEmail,
      planLevel: planLevel || 'free',
      tenantCode,
      inviteCode: tenantCode || nanoid(8),
      slug: subdomain
    });

    console.log(`Super Admin: tenant created by ${(req as any).user?.id || 'unknown'}`);
    res.status(201).json({ id: newTenant.id, ...newTenant });
  } catch (error) {
    console.error('Error creating tenant:', error);
    res.status(500).json({ message: 'Failed to create tenant' });
  }
}

export async function update(req: Request, res: Response) {
  try {
    const tenantId = req.params.id;
    const updates = req.body;
    
    const updatedTenant = await storage.updateTenant(tenantId, updates);
    
    console.log(`Super Admin: tenant ${req.params.id} updated by ${(req as any).user?.id || 'unknown'}`);
    res.json({ ok: true, tenant: updatedTenant });
  } catch (error) {
    console.error('Error updating tenant:', error);
    res.status(500).json({ message: 'Failed to update tenant' });
  }
}