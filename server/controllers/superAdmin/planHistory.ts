import { Request, Response } from 'express';
import { db } from '../../db';
import { tenantPlanHistory, tenants } from '@shared/schema';
import { eq, desc, and, sql, gte } from 'drizzle-orm';

// Get plan history for a specific tenant
export async function getTenantPlanHistory(req: Request, res: Response) {
  try {
    const { tenantId } = req.params;
    const { limit = '50' } = req.query;

    const history = await db
      .select({
        id: tenantPlanHistory.id,
        fromPlan: tenantPlanHistory.fromPlan,
        toPlan: tenantPlanHistory.toPlan,
        changeType: tenantPlanHistory.changeType,
        reason: tenantPlanHistory.reason,
        changedBy: tenantPlanHistory.changedBy,
        automatedTrigger: tenantPlanHistory.automatedTrigger,
        mrr: tenantPlanHistory.mrr,
        annualValue: tenantPlanHistory.annualValue,
        metadata: tenantPlanHistory.metadata,
        createdAt: tenantPlanHistory.createdAt,
      })
      .from(tenantPlanHistory)
      .where(eq(tenantPlanHistory.tenantId, tenantId))
      .orderBy(desc(tenantPlanHistory.createdAt))
      .limit(parseInt(limit as string, 10));

    res.json(history);
  } catch (error) {
    console.error('Error fetching tenant plan history:', error);
    res.status(500).json({ message: 'Failed to fetch plan history' });
  }
}

// Get recent downgrades across all tenants
export async function getRecentDowngrades(req: Request, res: Response) {
  try {
    const { days = '30', limit = '20' } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days as string, 10));

    const downgrades = await db
      .select({
        id: tenantPlanHistory.id,
        tenantId: tenantPlanHistory.tenantId,
        tenantName: tenants.name,
        fromPlan: tenantPlanHistory.fromPlan,
        toPlan: tenantPlanHistory.toPlan,
        changeType: tenantPlanHistory.changeType,
        reason: tenantPlanHistory.reason,
        automatedTrigger: tenantPlanHistory.automatedTrigger,
        mrr: tenantPlanHistory.mrr,
        createdAt: tenantPlanHistory.createdAt,
      })
      .from(tenantPlanHistory)
      .innerJoin(tenants, eq(tenantPlanHistory.tenantId, tenants.id))
      .where(
        and(
          eq(tenantPlanHistory.changeType, 'downgrade'),
          gte(tenantPlanHistory.createdAt, daysAgo)
        )
      )
      .orderBy(desc(tenantPlanHistory.createdAt))
      .limit(parseInt(limit as string, 10));

    res.json(downgrades);
  } catch (error) {
    console.error('Error fetching recent downgrades:', error);
    res.status(500).json({ message: 'Failed to fetch downgrades' });
  }
}

// Get plan change statistics
export async function getPlanChangeStats(req: Request, res: Response) {
  try {
    const { days = '30' } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days as string, 10));

    // Count by change type
    const changeTypeCounts = await db
      .select({
        changeType: tenantPlanHistory.changeType,
        count: sql<number>`count(*)::int`,
      })
      .from(tenantPlanHistory)
      .where(gte(tenantPlanHistory.createdAt, daysAgo))
      .groupBy(tenantPlanHistory.changeType);

    // Count by plan transitions
    const planTransitions = await db
      .select({
        fromPlan: tenantPlanHistory.fromPlan,
        toPlan: tenantPlanHistory.toPlan,
        count: sql<number>`count(*)::int`,
      })
      .from(tenantPlanHistory)
      .where(gte(tenantPlanHistory.createdAt, daysAgo))
      .groupBy(tenantPlanHistory.fromPlan, tenantPlanHistory.toPlan);

    // Calculate MRR impact
    const mrrImpact = await db
      .select({
        changeType: tenantPlanHistory.changeType,
        totalMrrChange: sql<number>`sum(mrr)::int`,
      })
      .from(tenantPlanHistory)
      .where(
        and(
          gte(tenantPlanHistory.createdAt, daysAgo),
          sql`${tenantPlanHistory.mrr} IS NOT NULL`
        )
      )
      .groupBy(tenantPlanHistory.changeType);

    res.json({
      changeTypeCounts,
      planTransitions,
      mrrImpact,
      period: {
        days: parseInt(days as string, 10),
        from: daysAgo.toISOString(),
        to: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching plan change statistics:', error);
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
}

// Get all plan history with filtering
export async function getAllPlanHistory(req: Request, res: Response) {
  try {
    const { 
      changeType, 
      fromPlan, 
      toPlan, 
      tenantId, 
      limit = '100',
      offset = '0' 
    } = req.query;

    let query = db
      .select({
        id: tenantPlanHistory.id,
        tenantId: tenantPlanHistory.tenantId,
        tenantName: tenants.name,
        fromPlan: tenantPlanHistory.fromPlan,
        toPlan: tenantPlanHistory.toPlan,
        changeType: tenantPlanHistory.changeType,
        reason: tenantPlanHistory.reason,
        changedBy: tenantPlanHistory.changedBy,
        automatedTrigger: tenantPlanHistory.automatedTrigger,
        mrr: tenantPlanHistory.mrr,
        annualValue: tenantPlanHistory.annualValue,
        metadata: tenantPlanHistory.metadata,
        createdAt: tenantPlanHistory.createdAt,
      })
      .from(tenantPlanHistory)
      .innerJoin(tenants, eq(tenantPlanHistory.tenantId, tenants.id))
      .$dynamic();

    // Apply filters
    const conditions = [];
    if (changeType) {
      conditions.push(eq(tenantPlanHistory.changeType, changeType as string));
    }
    if (fromPlan) {
      conditions.push(eq(tenantPlanHistory.fromPlan, fromPlan as any));
    }
    if (toPlan) {
      conditions.push(eq(tenantPlanHistory.toPlan, toPlan as any));
    }
    if (tenantId) {
      conditions.push(eq(tenantPlanHistory.tenantId, tenantId as string));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const history = await query
      .orderBy(desc(tenantPlanHistory.createdAt))
      .limit(parseInt(limit as string, 10))
      .offset(parseInt(offset as string, 10));

    // Get total count for pagination
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(tenantPlanHistory)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    res.json({
      history,
      total: totalResult?.count || 0,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    });
  } catch (error) {
    console.error('Error fetching all plan history:', error);
    res.status(500).json({ message: 'Failed to fetch plan history' });
  }
}
