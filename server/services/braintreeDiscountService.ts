import braintree, { Environment, BraintreeGateway } from 'braintree';
import { db } from '../db';
import { integrations, inviteCodes, discountCodes, tenants } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';

export interface BraintreeDiscount {
  id: string;
  name: string;
  description?: string;
  amount: string;
  kind: 'percentage' | 'amount';
  currentBillingCycle?: number;
  numberOfBillingCycles?: number;
  neverExpires?: boolean;
}

export interface BraintreeIntegrationConfig {
  merchantId: string;
  publicKey: string;
  privateKey: string;
  environment: 'sandbox' | 'production';
}

async function getTenantBraintreeConfig(tenantId: string): Promise<BraintreeIntegrationConfig | null> {
  const [integration] = await db
    .select()
    .from(integrations)
    .where(
      and(
        eq(integrations.tenantId, tenantId),
        eq(integrations.provider, 'braintree'),
        eq(integrations.enabled, true)
      )
    )
    .limit(1);

  if (!integration?.credentials) {
    return null;
  }

  const creds = integration.credentials as Record<string, string>;
  
  if (!creds.merchantId || !creds.publicKey || !creds.privateKey) {
    return null;
  }

  return {
    merchantId: creds.merchantId,
    publicKey: creds.publicKey,
    privateKey: creds.privateKey,
    environment: (creds.environment || 'sandbox') as 'sandbox' | 'production',
  };
}

function createTenantGateway(config: BraintreeIntegrationConfig): BraintreeGateway {
  const environment = config.environment === 'production' 
    ? Environment.Production 
    : Environment.Sandbox;

  return new braintree.BraintreeGateway({
    environment,
    merchantId: config.merchantId,
    publicKey: config.publicKey,
    privateKey: config.privateKey,
  });
}

export async function fetchBraintreeDiscounts(tenantId: string): Promise<BraintreeDiscount[]> {
  const config = await getTenantBraintreeConfig(tenantId);
  
  if (!config) {
    throw new Error('Braintree not configured for this tenant');
  }

  const gateway = createTenantGateway(config);
  
  try {
    const discounts = await gateway.discount.all();
    
    return discounts.map((d: any) => ({
      id: d.id,
      name: d.name || d.id,
      description: d.description,
      amount: d.amount,
      kind: d.kind || 'amount',
      currentBillingCycle: d.currentBillingCycle,
      numberOfBillingCycles: d.numberOfBillingCycles,
      neverExpires: d.neverExpires,
    }));
  } catch (error) {
    console.error('Error fetching Braintree discounts:', error);
    throw new Error(`Failed to fetch discounts from Braintree: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function validateBraintreeDiscountId(
  tenantId: string,
  discountId: string
): Promise<{ valid: boolean; discount?: BraintreeDiscount; error?: string }> {
  const config = await getTenantBraintreeConfig(tenantId);
  
  if (!config) {
    return { valid: false, error: 'Braintree not configured for this tenant' };
  }

  try {
    const discounts = await fetchBraintreeDiscounts(tenantId);
    const discount = discounts.find(d => d.id === discountId);
    
    if (!discount) {
      return { valid: false, error: `Discount ID "${discountId}" not found in Braintree` };
    }
    
    return { valid: true, discount };
  } catch (error) {
    return { 
      valid: false, 
      error: `Failed to validate discount: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

export async function linkInviteCodeToBraintreeDiscount(
  inviteCodeId: string,
  braintreeDiscountId: string,
  tenantId: string
): Promise<{ success: boolean; error?: string }> {
  const validation = await validateBraintreeDiscountId(tenantId, braintreeDiscountId);
  
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    await db
      .update(inviteCodes)
      .set({ 
        braintreeDiscountId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(inviteCodes.id, inviteCodeId),
          eq(inviteCodes.tenantId, tenantId)
        )
      );

    return { success: true };
  } catch (error) {
    console.error('Error linking invite code to Braintree discount:', error);
    return { 
      success: false, 
      error: `Failed to link discount: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

export async function linkDiscountCodeToBraintree(
  discountCodeId: string,
  braintreeDiscountId: string,
  tenantId: string
): Promise<{ success: boolean; error?: string }> {
  const validation = await validateBraintreeDiscountId(tenantId, braintreeDiscountId);
  
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    await db
      .update(discountCodes)
      .set({ 
        braintreeDiscountId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(discountCodes.id, discountCodeId),
          eq(discountCodes.tenantId, tenantId)
        )
      );

    return { success: true };
  } catch (error) {
    console.error('Error linking discount code to Braintree:', error);
    return { 
      success: false, 
      error: `Failed to link discount: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

export async function unlinkFromBraintree(
  codeId: string,
  codeType: 'invite' | 'discount',
  tenantId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (codeType === 'invite') {
      await db
        .update(inviteCodes)
        .set({ 
          braintreeDiscountId: null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(inviteCodes.id, codeId),
            eq(inviteCodes.tenantId, tenantId)
          )
        );
    } else {
      await db
        .update(discountCodes)
        .set({ 
          braintreeDiscountId: null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(discountCodes.id, codeId),
            eq(discountCodes.tenantId, tenantId)
          )
        );
    }

    return { success: true };
  } catch (error) {
    console.error('Error unlinking from Braintree:', error);
    return { 
      success: false, 
      error: `Failed to unlink discount: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

export async function isTenantBraintreeConfigured(tenantId: string): Promise<boolean> {
  const config = await getTenantBraintreeConfig(tenantId);
  return config !== null;
}

export async function testBraintreeConnection(tenantId: string): Promise<{ 
  success: boolean; 
  discountCount?: number;
  error?: string 
}> {
  const config = await getTenantBraintreeConfig(tenantId);
  
  if (!config) {
    return { success: false, error: 'Braintree not configured for this tenant' };
  }

  try {
    const discounts = await fetchBraintreeDiscounts(tenantId);
    return { success: true, discountCount: discounts.length };
  } catch (error) {
    return { 
      success: false, 
      error: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

export async function getBraintreeDiscountId(
  code: string,
  tenantId: string
): Promise<string | null> {
  const [inviteCode] = await db
    .select()
    .from(inviteCodes)
    .where(
      and(
        eq(inviteCodes.tenantId, tenantId),
        eq(inviteCodes.code, code.toUpperCase()),
        eq(inviteCodes.isActive, true)
      )
    )
    .limit(1);

  if (inviteCode?.braintreeDiscountId) {
    return inviteCode.braintreeDiscountId;
  }

  const [discountCode] = await db
    .select()
    .from(discountCodes)
    .where(
      and(
        eq(discountCodes.tenantId, tenantId),
        eq(discountCodes.code, code.toUpperCase()),
        eq(discountCodes.isActive, true)
      )
    )
    .limit(1);

  if (discountCode?.braintreeDiscountId) {
    return discountCode.braintreeDiscountId;
  }

  return null;
}
