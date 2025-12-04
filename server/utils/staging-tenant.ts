import { db } from '../db';
import { tenants } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

const STAGING_TENANT_ID = 'platform-staging';
const STAGING_TENANT_NAME = 'PlayHQ Platform';
const STAGING_TENANT_SUBDOMAIN = 'platform-staging';

export async function getOrCreateStagingTenant() {
  const existingTenant = await db.select()
    .from(tenants)
    .where(eq(tenants.id, STAGING_TENANT_ID))
    .limit(1);

  if (existingTenant.length > 0) {
    return existingTenant[0];
  }

  const inviteCode = `PLAT${nanoid(8).toUpperCase()}`;

  const [newTenant] = await db.insert(tenants).values({
    id: STAGING_TENANT_ID,
    name: STAGING_TENANT_NAME,
    displayName: STAGING_TENANT_NAME,
    subdomain: STAGING_TENANT_SUBDOMAIN,
    inviteCode: inviteCode,
    isStaging: true,
    planLevel: 'free',
    billingStatus: 'none',
  }).returning();

  console.log('✅ Created platform staging tenant:', {
    id: newTenant.id,
    name: newTenant.name,
    inviteCode: inviteCode
  });

  return newTenant;
}

export function getStagingTenantId() {
  return STAGING_TENANT_ID;
}

export async function isStagingTenant(tenantId: string): Promise<boolean> {
  if (tenantId === STAGING_TENANT_ID) {
    return true;
  }
  
  const [tenant] = await db.select({ isStaging: tenants.isStaging })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);
  
  return tenant?.isStaging === true;
}
