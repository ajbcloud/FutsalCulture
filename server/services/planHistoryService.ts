import { db } from '../db';
import { tenants, tenantPlanHistory } from '@shared/schema';
import { eq } from 'drizzle-orm';

interface LogPlanChangeParams {
  tenantId: string;
  toPlan: 'free' | 'core' | 'growth' | 'elite';
  changeType: 'initial' | 'upgrade' | 'downgrade' | 'trial_conversion' | 'reactivation';
  reason?: string;
  changedBy?: string;
  automatedTrigger?: string;
  mrr?: number;
  annualValue?: number;
  metadata?: any;
}

/**
 * Logs a plan change to the tenant plan history table
 */
export async function logPlanChange(params: LogPlanChangeParams) {
  const {
    tenantId,
    toPlan,
    changeType,
    reason,
    changedBy,
    automatedTrigger,
    mrr,
    annualValue,
    metadata,
  } = params;

  try {
    // Get current tenant plan to determine "from" plan
    const [tenant] = await db
      .select({ planLevel: tenants.planLevel })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    const fromPlan = tenant?.planLevel || null;

    // Insert plan history record
    await db.insert(tenantPlanHistory).values({
      tenantId,
      fromPlan: fromPlan as any,
      toPlan,
      changeType,
      reason,
      changedBy,
      automatedTrigger,
      mrr,
      annualValue,
      metadata,
    });

    console.log(`📊 Plan change logged: ${tenantId} ${fromPlan} → ${toPlan} (${changeType})`);
  } catch (error) {
    console.error('Error logging plan change:', error);
    // Don't throw - we don't want to break the main flow if history logging fails
  }
}

/**
 * Determines if a plan change is an upgrade, downgrade, or lateral move
 */
export function determinePlanChangeType(
  fromPlan: 'free' | 'core' | 'growth' | 'elite' | null,
  toPlan: 'free' | 'core' | 'growth' | 'elite'
): 'initial' | 'upgrade' | 'downgrade' | 'reactivation' {
  if (!fromPlan) {
    return 'initial';
  }

  const planHierarchy = { free: 0, core: 1, growth: 2, elite: 3 };
  const fromLevel = planHierarchy[fromPlan];
  const toLevel = planHierarchy[toPlan];

  if (toLevel > fromLevel) {
    return 'upgrade';
  } else if (toLevel < fromLevel) {
    return 'downgrade';
  } else {
    return 'reactivation'; // Same plan level
  }
}

/**
 * Calculate MRR based on plan level
 */
export function calculateMRR(planLevel: 'free' | 'core' | 'growth' | 'elite'): number {
  const prices = {
    free: 0,
    core: 9900,      // $99/month in cents
    growth: 19900,   // $199/month in cents
    elite: 49900,    // $499/month in cents
  };
  return prices[planLevel] || 0;
}

/**
 * Calculate annual value based on plan level
 */
export function calculateAnnualValue(planLevel: 'free' | 'core' | 'growth' | 'elite'): number {
  return calculateMRR(planLevel) * 12;
}
