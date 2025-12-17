import { db } from '../db';
import { tenants } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

const STAGING_TENANT_ID = 'platform-staging';
const STAGING_TENANT_NAME = 'SkoreHQ Platform';
const STAGING_TENANT_SUBDOMAIN = 'platform-staging';

export async function getOrCreateStagingTenant() {
  // First try to get existing tenant
  const existingTenant = await db.select()
    .from(tenants)
    .where(eq(tenants.id, STAGING_TENANT_ID))
    .limit(1);

  if (existingTenant.length > 0) {
    return existingTenant[0];
  }

  // Try to create, but handle race condition where another request created it first
  try {
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
  } catch (error: any) {
    // Handle duplicate key error - another request created it first
    if (error?.code === '23505' && error?.constraint === 'tenants_pkey') {
      const [tenant] = await db.select()
        .from(tenants)
        .where(eq(tenants.id, STAGING_TENANT_ID))
        .limit(1);
      return tenant;
    }
    throw error;
  }
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
