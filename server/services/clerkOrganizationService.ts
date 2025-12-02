import { db } from '../db';
import { tenants } from '../../shared/schema';
import { eq, isNull } from 'drizzle-orm';

const CLERK_API_BASE = 'https://api.clerk.com/v1';

const PLAN_MEMBER_LIMITS: Record<string, number | null> = {
  free: 10,
  core: 100,
  growth: 250,
  elite: null,
};

interface ClerkOrganization {
  id: string;
  name: string;
  slug: string;
  max_allowed_memberships: number | null;
  created_at: number;
  updated_at: number;
  members_count: number;
  public_metadata?: Record<string, unknown>;
  private_metadata?: Record<string, unknown>;
}

interface CreateOrganizationOptions {
  name: string;
  slug?: string;
  maxAllowedMemberships?: number | null;
  publicMetadata?: Record<string, unknown>;
  privateMetadata?: Record<string, unknown>;
}

interface UpdateOrganizationOptions {
  name?: string;
  slug?: string;
  maxAllowedMemberships?: number | null;
  publicMetadata?: Record<string, unknown>;
  privateMetadata?: Record<string, unknown>;
}

function getClerkSecretKey(): string {
  const key = process.env.CLERK_SECRET_KEY;
  if (!key) {
    throw new Error('CLERK_SECRET_KEY environment variable is not set');
  }
  return key;
}

function isClerkEnabled(): boolean {
  return !!process.env.CLERK_SECRET_KEY;
}

async function clerkRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
  body?: Record<string, unknown>
): Promise<T> {
  const url = `${CLERK_API_BASE}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${getClerkSecretKey()}`,
    'Content-Type': 'application/json',
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (body && (method === 'POST' || method === 'PATCH')) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Clerk API error: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export function getMemberLimitForPlan(planLevel: string): number | null {
  return PLAN_MEMBER_LIMITS[planLevel] ?? PLAN_MEMBER_LIMITS.free;
}

export async function createOrganization(options: CreateOrganizationOptions): Promise<ClerkOrganization> {
  if (!isClerkEnabled()) {
    throw new Error('Clerk is not configured');
  }

  const body: Record<string, unknown> = {
    name: options.name,
  };

  if (options.slug) {
    body.slug = options.slug;
  }

  if (options.maxAllowedMemberships !== undefined) {
    body.max_allowed_memberships = options.maxAllowedMemberships;
  }

  if (options.publicMetadata) {
    body.public_metadata = options.publicMetadata;
  }

  if (options.privateMetadata) {
    body.private_metadata = options.privateMetadata;
  }

  const org = await clerkRequest<ClerkOrganization>('/organizations', 'POST', body);
  console.log(`✅ Created Clerk organization: ${org.id} (${org.name})`);
  return org;
}

export async function updateOrganization(
  organizationId: string,
  options: UpdateOrganizationOptions
): Promise<ClerkOrganization> {
  if (!isClerkEnabled()) {
    throw new Error('Clerk is not configured');
  }

  const body: Record<string, unknown> = {};

  if (options.name !== undefined) {
    body.name = options.name;
  }

  if (options.slug !== undefined) {
    body.slug = options.slug;
  }

  if (options.maxAllowedMemberships !== undefined) {
    body.max_allowed_memberships = options.maxAllowedMemberships;
  }

  if (options.publicMetadata !== undefined) {
    body.public_metadata = options.publicMetadata;
  }

  if (options.privateMetadata !== undefined) {
    body.private_metadata = options.privateMetadata;
  }

  const org = await clerkRequest<ClerkOrganization>(
    `/organizations/${organizationId}`,
    'PATCH',
    body
  );
  console.log(`✅ Updated Clerk organization: ${org.id} (max_allowed_memberships: ${org.max_allowed_memberships})`);
  return org;
}

export async function getOrganization(organizationId: string): Promise<ClerkOrganization | null> {
  if (!isClerkEnabled()) {
    return null;
  }

  try {
    return await clerkRequest<ClerkOrganization>(`/organizations/${organizationId}`);
  } catch (error) {
    console.warn(`Failed to get Clerk organization ${organizationId}:`, error);
    return null;
  }
}

export async function deleteOrganization(organizationId: string): Promise<void> {
  if (!isClerkEnabled()) {
    throw new Error('Clerk is not configured');
  }

  await clerkRequest(`/organizations/${organizationId}`, 'DELETE');
  console.log(`✅ Deleted Clerk organization: ${organizationId}`);
}

export async function createOrganizationForTenant(tenantId: string): Promise<ClerkOrganization | null> {
  if (!isClerkEnabled()) {
    console.log('⚠️ Clerk not enabled, skipping organization creation');
    return null;
  }

  const [tenant] = await db.select({
    id: tenants.id,
    name: tenants.name,
    subdomain: tenants.subdomain,
    planLevel: tenants.planLevel,
    clerkOrganizationId: tenants.clerkOrganizationId,
  })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!tenant) {
    throw new Error(`Tenant ${tenantId} not found`);
  }

  if (tenant.clerkOrganizationId) {
    console.log(`⚠️ Tenant ${tenantId} already has Clerk organization ${tenant.clerkOrganizationId}`);
    return await getOrganization(tenant.clerkOrganizationId);
  }

  const planLevel = tenant.planLevel || 'free';
  const memberLimit = getMemberLimitForPlan(planLevel);

  const org = await createOrganization({
    name: tenant.name,
    slug: tenant.subdomain,
    maxAllowedMemberships: memberLimit,
    privateMetadata: {
      tenantId: tenant.id,
      planLevel,
    },
  });

  await db.update(tenants)
    .set({
      clerkOrganizationId: org.id,
      clerkOrganizationSyncedAt: new Date(),
    })
    .where(eq(tenants.id, tenantId));

  console.log(`✅ Linked Clerk organization ${org.id} to tenant ${tenantId}`);
  return org;
}

export async function syncOrganizationMemberLimit(
  tenantId: string,
  newPlanLevel: string
): Promise<ClerkOrganization | null> {
  if (!isClerkEnabled()) {
    console.log('⚠️ Clerk not enabled, skipping organization sync');
    return null;
  }

  const [tenant] = await db.select({
    id: tenants.id,
    name: tenants.name,
    clerkOrganizationId: tenants.clerkOrganizationId,
  })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!tenant) {
    throw new Error(`Tenant ${tenantId} not found`);
  }

  if (!tenant.clerkOrganizationId) {
    console.log(`⚠️ Tenant ${tenantId} has no Clerk organization, creating one`);
    return await createOrganizationForTenant(tenantId);
  }

  const memberLimit = getMemberLimitForPlan(newPlanLevel);

  const org = await updateOrganization(tenant.clerkOrganizationId, {
    maxAllowedMemberships: memberLimit,
    privateMetadata: {
      tenantId: tenant.id,
      planLevel: newPlanLevel,
    },
  });

  await db.update(tenants)
    .set({
      clerkOrganizationSyncedAt: new Date(),
    })
    .where(eq(tenants.id, tenantId));

  console.log(`✅ Synced Clerk organization ${org.id} member limit to ${memberLimit} for plan ${newPlanLevel}`);
  return org;
}

export async function addMemberToOrganization(
  organizationId: string,
  userId: string,
  role: 'admin' | 'basic_member' = 'basic_member'
): Promise<void> {
  if (!isClerkEnabled()) {
    throw new Error('Clerk is not configured');
  }

  await clerkRequest(`/organizations/${organizationId}/memberships`, 'POST', {
    user_id: userId,
    role,
  });
  console.log(`✅ Added user ${userId} to Clerk organization ${organizationId} with role ${role}`);
}

export async function removeMemberFromOrganization(
  organizationId: string,
  userId: string
): Promise<void> {
  if (!isClerkEnabled()) {
    throw new Error('Clerk is not configured');
  }

  await clerkRequest(`/organizations/${organizationId}/memberships/${userId}`, 'DELETE');
  console.log(`✅ Removed user ${userId} from Clerk organization ${organizationId}`);
}

export async function getOrganizationMemberCount(organizationId: string): Promise<number> {
  if (!isClerkEnabled()) {
    return 0;
  }

  const org = await getOrganization(organizationId);
  return org?.members_count ?? 0;
}

export async function backfillClerkOrganizations(resyncExisting = false): Promise<{
  total: number;
  created: number;
  synced: number;
  errors: number;
}> {
  if (!isClerkEnabled()) {
    console.log('⚠️ Clerk not enabled, skipping organization backfill');
    return { total: 0, created: 0, synced: 0, errors: 0 };
  }

  let created = 0;
  let synced = 0;
  let errors = 0;

  // Create Clerk organizations for tenants without one
  const tenantsWithoutOrg = await db.select({
    id: tenants.id,
    name: tenants.name,
    subdomain: tenants.subdomain,
    planLevel: tenants.planLevel,
  })
    .from(tenants)
    .where(isNull(tenants.clerkOrganizationId));

  console.log(`Found ${tenantsWithoutOrg.length} tenants without Clerk organizations`);

  for (const tenant of tenantsWithoutOrg) {
    try {
      await createOrganizationForTenant(tenant.id);
      created++;
    } catch (error) {
      console.error(`Failed to create Clerk organization for tenant ${tenant.id}:`, error);
      errors++;
    }
  }

  // Optionally resync member limits for tenants with existing orgs
  if (resyncExisting) {
    const { not } = await import('drizzle-orm');
    const tenantsWithOrg = await db.select({
      id: tenants.id,
      planLevel: tenants.planLevel,
      clerkOrganizationId: tenants.clerkOrganizationId,
    })
      .from(tenants)
      .where(not(isNull(tenants.clerkOrganizationId)));

    console.log(`Resyncing limits for ${tenantsWithOrg.length} tenants with existing Clerk organizations`);

    for (const tenant of tenantsWithOrg) {
      try {
        const planLevel = tenant.planLevel || 'free';
        await syncOrganizationMemberLimit(tenant.id, planLevel);
        synced++;
      } catch (error) {
        console.error(`Failed to resync Clerk organization for tenant ${tenant.id}:`, error);
        errors++;
      }
    }
  }

  console.log(`✅ Clerk organization backfill complete: ${created} created, ${synced} synced, ${errors} errors`);
  return { total: tenantsWithoutOrg.length + (resyncExisting ? synced : 0), created, synced, errors };
}

export { isClerkEnabled, PLAN_MEMBER_LIMITS };
