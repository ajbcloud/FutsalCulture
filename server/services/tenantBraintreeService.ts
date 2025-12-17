import braintree, { BraintreeGateway, Environment } from 'braintree';
import { db } from '../db';
import { 
  tenantPaymentGateways, 
  tenantBillingSettings, 
  tenantTransactions,
  TenantPaymentGateway,
  TenantBillingSettings
} from '../../shared/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { decrypt } from '../lib/kms';

type GatewayEnvironment = 'sandbox' | 'production';

interface TransactionParams {
  amountCents: number;
  paymentMethodNonce: string;
  bookingId?: string;
  customerDetails?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

interface TransactionResult {
  id: string;
  status: string;
  amountCents: number;
}

interface GatewayStatusResult {
  activeEnvironment: GatewayEnvironment;
  sandbox: {
    configured: boolean;
    status: string | null;
    merchantId: string | null;
    publicKeyMasked: string | null;
    privateKeyLast4: string | null;
    lastTestAt: Date | null;
    lastSuccessAt: Date | null;
    lastErrorMessageSafe: string | null;
  } | null;
  production: {
    configured: boolean;
    status: string | null;
    merchantId: string | null;
    publicKeyMasked: string | null;
    privateKeyLast4: string | null;
    lastTestAt: Date | null;
    lastSuccessAt: Date | null;
    lastErrorMessageSafe: string | null;
  } | null;
}

function maskPublicKey(publicKey: string | null): string | null {
  if (!publicKey || publicKey.length < 8) return publicKey;
  return publicKey.substring(0, 4) + '****' + publicKey.substring(publicKey.length - 4);
}

export async function getTenantGateway(
  tenantId: string, 
  environment?: GatewayEnvironment
): Promise<BraintreeGateway> {
  let targetEnvironment = environment;
  
  if (!targetEnvironment) {
    const [billingSettings] = await db.select()
      .from(tenantBillingSettings)
      .where(eq(tenantBillingSettings.tenantId, tenantId))
      .limit(1);
    
    if (!billingSettings) {
      throw new Error(`Billing settings not found for tenant ${tenantId}`);
    }
    
    targetEnvironment = billingSettings.activeEnvironment as GatewayEnvironment;
  }
  
  const [gatewayCredentials] = await db.select()
    .from(tenantPaymentGateways)
    .where(
      and(
        eq(tenantPaymentGateways.tenantId, tenantId),
        eq(tenantPaymentGateways.environment, targetEnvironment),
        isNull(tenantPaymentGateways.deletedAt)
      )
    )
    .limit(1);
  
  if (!gatewayCredentials) {
    throw new Error(`Payment gateway credentials not found for tenant ${tenantId} in ${targetEnvironment} environment`);
  }
  
  if (!gatewayCredentials.merchantId || !gatewayCredentials.publicKey || !gatewayCredentials.privateKeyEncrypted) {
    throw new Error(`Incomplete payment gateway credentials for tenant ${tenantId} in ${targetEnvironment} environment`);
  }
  
  let privateKey: string;
  try {
    privateKey = decrypt(gatewayCredentials.privateKeyEncrypted);
  } catch (error) {
    throw new Error(`Failed to decrypt private key for tenant ${tenantId}: decryption error`);
  }
  
  const gateway = new braintree.BraintreeGateway({
    environment: targetEnvironment === 'production' ? Environment.Production : Environment.Sandbox,
    merchantId: gatewayCredentials.merchantId,
    publicKey: gatewayCredentials.publicKey,
    privateKey,
  });
  
  return gateway;
}

export async function testGatewayConnection(
  tenantId: string,
  environment: GatewayEnvironment
): Promise<{ success: true; timestamp: Date } | { success: false; error: string }> {
  const now = new Date();
  
  try {
    const gateway = await getTenantGateway(tenantId, environment);
    
    await gateway.clientToken.generate({});
    
    await db.update(tenantPaymentGateways)
      .set({
        lastTestAt: now,
        lastSuccessAt: now,
        lastErrorCode: null,
        lastErrorMessageSafe: null,
        status: 'connected',
        updatedAt: now,
      })
      .where(
        and(
          eq(tenantPaymentGateways.tenantId, tenantId),
          eq(tenantPaymentGateways.environment, environment),
          isNull(tenantPaymentGateways.deletedAt)
        )
      );
    
    return { success: true, timestamp: now };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const safeErrorMessage = errorMessage.length > 500 ? errorMessage.substring(0, 500) : errorMessage;
    
    const errorCode = error instanceof Error && 'code' in error 
      ? String((error as any).code) 
      : 'UNKNOWN';
    
    try {
      await db.update(tenantPaymentGateways)
        .set({
          lastTestAt: now,
          lastErrorCode: errorCode.substring(0, 50),
          lastErrorMessageSafe: safeErrorMessage,
          status: 'error',
          updatedAt: now,
        })
        .where(
          and(
            eq(tenantPaymentGateways.tenantId, tenantId),
            eq(tenantPaymentGateways.environment, environment),
            isNull(tenantPaymentGateways.deletedAt)
          )
        );
    } catch (dbError) {
      console.error(`Failed to update gateway status for tenant ${tenantId}:`, dbError);
    }
    
    return { success: false, error: safeErrorMessage };
  }
}

export async function testGatewayConnectionWithCredentials(
  environment: GatewayEnvironment,
  merchantId: string,
  publicKey: string,
  privateKey: string
): Promise<{ success: true; timestamp: Date } | { success: false; error: string }> {
  const now = new Date();
  
  try {
    const gateway = new braintree.BraintreeGateway({
      environment: environment === 'production' ? Environment.Production : Environment.Sandbox,
      merchantId,
      publicKey,
      privateKey,
    });
    
    await gateway.clientToken.generate({});
    
    return { success: true, timestamp: now };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const safeErrorMessage = errorMessage.length > 500 ? errorMessage.substring(0, 500) : errorMessage;
    
    return { success: false, error: safeErrorMessage };
  }
}

export async function generateClientToken(
  tenantId: string,
  customerId?: string
): Promise<string> {
  const gateway = await getTenantGateway(tenantId);
  
  const options: braintree.ClientTokenRequest = {};
  if (customerId) {
    options.customerId = customerId;
  }
  
  const result = await gateway.clientToken.generate(options);
  return result.clientToken;
}

export async function createTransaction(
  tenantId: string,
  params: TransactionParams
): Promise<TransactionResult> {
  const gateway = await getTenantGateway(tenantId);
  
  const amountDollars = (params.amountCents / 100).toFixed(2);
  
  const transactionRequest: braintree.TransactionRequest = {
    amount: amountDollars,
    paymentMethodNonce: params.paymentMethodNonce,
    options: {
      submitForSettlement: true,
    },
  };
  
  if (params.customerDetails) {
    transactionRequest.customer = {
      firstName: params.customerDetails.firstName,
      lastName: params.customerDetails.lastName,
      email: params.customerDetails.email,
    };
  }
  
  const result = await gateway.transaction.sale(transactionRequest);
  
  if (!result.success || !result.transaction) {
    throw new Error(`Transaction failed: ${result.message || 'Unknown error'}`);
  }
  
  const transaction = result.transaction;
  
  let paymentMethodType: string | null = null;
  let paymentMethodLast4: string | null = null;
  
  if (transaction.paymentInstrumentType === 'credit_card' && transaction.creditCard) {
    paymentMethodType = 'card';
    paymentMethodLast4 = transaction.creditCard.last4 || null;
  } else if (transaction.paymentInstrumentType === 'paypal_account') {
    paymentMethodType = 'paypal';
    paymentMethodLast4 = null;
  } else {
    paymentMethodType = transaction.paymentInstrumentType || 'unknown';
  }
  
  const transactionStatus = mapBraintreeStatus(transaction.status);
  
  await db.insert(tenantTransactions).values({
    tenantId,
    externalTransactionId: transaction.id,
    bookingId: params.bookingId || null,
    amountCents: params.amountCents,
    currency: 'USD',
    status: transactionStatus,
    paymentMethodTypeSafe: paymentMethodType,
    paymentMethodLast4Safe: paymentMethodLast4,
  });
  
  return {
    id: transaction.id,
    status: transaction.status,
    amountCents: params.amountCents,
  };
}

function mapBraintreeStatus(braintreeStatus: string): 'authorized' | 'submitted_for_settlement' | 'settled' | 'voided' | 'refunded' | 'failed' | 'disputed' {
  switch (braintreeStatus) {
    case 'authorized':
      return 'authorized';
    case 'submitted_for_settlement':
    case 'settlement_pending':
      return 'submitted_for_settlement';
    case 'settled':
    case 'settling':
      return 'settled';
    case 'voided':
      return 'voided';
    case 'gateway_rejected':
    case 'processor_declined':
    case 'failed':
    case 'authorization_expired':
      return 'failed';
    default:
      return 'submitted_for_settlement';
  }
}

export async function getGatewayStatus(tenantId: string): Promise<GatewayStatusResult> {
  const [billingSettings] = await db.select()
    .from(tenantBillingSettings)
    .where(eq(tenantBillingSettings.tenantId, tenantId))
    .limit(1);
  
  const activeEnvironment: GatewayEnvironment = (billingSettings?.activeEnvironment as GatewayEnvironment) || 'sandbox';
  
  const gateways = await db.select()
    .from(tenantPaymentGateways)
    .where(
      and(
        eq(tenantPaymentGateways.tenantId, tenantId),
        isNull(tenantPaymentGateways.deletedAt)
      )
    );
  
  const sandboxGateway = gateways.find(g => g.environment === 'sandbox');
  const productionGateway = gateways.find(g => g.environment === 'production');
  
  const formatGatewayStatus = (gateway: TenantPaymentGateway | undefined) => {
    if (!gateway) return null;
    
    const isConfigured = !!(gateway.merchantId && gateway.publicKey && gateway.privateKeyEncrypted);
    
    return {
      configured: isConfigured,
      status: gateway.status,
      merchantId: gateway.merchantId,
      publicKeyMasked: maskPublicKey(gateway.publicKey),
      privateKeyLast4: gateway.privateKeyLast4,
      lastTestAt: gateway.lastTestAt,
      lastSuccessAt: gateway.lastSuccessAt,
      lastErrorMessageSafe: gateway.lastErrorMessageSafe,
    };
  };
  
  return {
    activeEnvironment,
    sandbox: formatGatewayStatus(sandboxGateway),
    production: formatGatewayStatus(productionGateway),
  };
}
