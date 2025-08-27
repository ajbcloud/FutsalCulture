
import { db } from '../server/db';
import { tenants } from '../src/db/schema/tenants';
import { eq, or, ilike } from 'drizzle-orm';

async function upgradeTenantPlan(identifier: string, newPlan: 'free' | 'core' | 'growth' | 'elite') {
  try {
    // Find the tenant
    const tenant = await db.select()
      .from(tenants)
      .where(
        or(
          eq(tenants.slug, identifier),
          ilike(tenants.name, `%${identifier}%`),
          ilike(tenants.contact_email, `%${identifier}%`)
        )
      )
      .limit(1);

    if (!tenant.length) {
      console.error(`Tenant not found with identifier: ${identifier}`);
      return;
    }

    const currentTenant = tenant[0];
    console.log(`Found tenant: ${currentTenant.name} (${currentTenant.slug})`);
    console.log(`Current plan: ${currentTenant.plan_level || 'free'}`);

    // Update the tenant plan
    await db.update(tenants)
      .set({
        plan_level: newPlan as any,
        last_plan_level: currentTenant.plan_level as any,
        plan_change_reason: 'admin_upgrade',
        pending_plan_change_at: new Date(),
      })
      .where(eq(tenants.id, currentTenant.id));

    console.log(`Successfully upgraded ${currentTenant.name} to ${newPlan} plan`);

    // Verify the change
    const updatedTenant = await db.select()
      .from(tenants)
      .where(eq(tenants.id, currentTenant.id))
      .limit(1);

    console.log(`Verified - New plan: ${updatedTenant[0].plan_level}`);
    
  } catch (error) {
    console.error('Error upgrading tenant plan:', error);
  }
}

// Usage: upgrade PlayHQ to Elite plan
upgradeTenantPlan('playhq', 'elite')
  .then(() => console.log('Upgrade complete'))
  .catch(console.error)
  .finally(() => process.exit(0));
