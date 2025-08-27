
import { db } from '../server/db';
import { eq, or, ilike, and, sql } from 'drizzle-orm';

// Import the actual schema tables used in your system
const tenantPlanAssignments = await import('../shared/schema').then(m => m.tenantPlanAssignments);
const tenants = await import('../shared/schema').then(m => m.tenants);

async function upgradeTenantPlan(identifier: string, newPlan: 'free' | 'core' | 'growth' | 'elite') {
  try {
    // Find the tenant
    const tenant = await db.select({
      id: tenants.id,
      name: tenants.name,
      slug: tenants.slug,
      contactEmail: tenants.contactEmail
    })
      .from(tenants)
      .where(
        or(
          eq(tenants.slug, identifier),
          ilike(tenants.name, `%${identifier}%`),
          ilike(tenants.contactEmail, `%${identifier}%`)
        )
      )
      .limit(1);

    if (!tenant.length) {
      console.error(`Tenant not found with identifier: ${identifier}`);
      return;
    }

    const currentTenant = tenant[0];
    console.log(`Found tenant: ${currentTenant.name} (${currentTenant.slug})`);

    // Get current plan assignment
    const currentAssignment = await db.select()
      .from(tenantPlanAssignments)
      .where(and(
        eq(tenantPlanAssignments.tenantId, currentTenant.id),
        sql`${tenantPlanAssignments.until} IS NULL OR ${tenantPlanAssignments.until} > NOW()`
      ))
      .orderBy(sql`${tenantPlanAssignments.since} DESC`)
      .limit(1);

    const currentPlan = currentAssignment[0]?.planCode || 'free';
    console.log(`Current plan: ${currentPlan}`);

    if (currentPlan === newPlan) {
      console.log(`Tenant is already on ${newPlan} plan`);
      return;
    }

    // End current plan assignment
    if (currentAssignment.length > 0) {
      await db.update(tenantPlanAssignments)
        .set({ until: new Date() })
        .where(eq(tenantPlanAssignments.id, currentAssignment[0].id));
    }

    // Create new plan assignment
    await db.insert(tenantPlanAssignments).values({
      tenantId: currentTenant.id,
      planCode: newPlan,
      since: new Date(),
      until: null, // Open-ended assignment
      assignedBy: 'system-admin-upgrade',
      reason: 'Admin manual upgrade'
    });

    console.log(`Successfully upgraded ${currentTenant.name} from ${currentPlan} to ${newPlan} plan`);

    // Clear any cached capabilities for this tenant
    const { clearCapabilitiesCache } = await import('../server/middleware/featureAccess');
    clearCapabilitiesCache(currentTenant.id);

    console.log('Capabilities cache cleared for tenant');

    // Verify the change
    const updatedAssignment = await db.select()
      .from(tenantPlanAssignments)
      .where(and(
        eq(tenantPlanAssignments.tenantId, currentTenant.id),
        sql`${tenantPlanAssignments.until} IS NULL OR ${tenantPlanAssignments.until} > NOW()`
      ))
      .orderBy(sql`${tenantPlanAssignments.since} DESC`)
      .limit(1);

    console.log(`Verified - New plan: ${updatedAssignment[0]?.planCode || 'none'}`);
    
  } catch (error) {
    console.error('Error upgrading tenant plan:', error);
  }
}

// Usage: upgrade PlayHQ to Elite plan
upgradeTenantPlan('playhq', 'elite')
  .then(() => console.log('Upgrade complete'))
  .catch(console.error)
  .finally(() => process.exit(0));
