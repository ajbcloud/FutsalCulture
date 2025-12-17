import { Router, Request, Response } from 'express';
import { db } from '../db';
import { 
  webhookEndpointConfigs, 
  webhookEventReceipts, 
  tenantTransactions 
} from '../../shared/schema';
import { eq, and } from 'drizzle-orm';
import { getTenantGateway } from '../services/tenantBraintreeService';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';

const router = Router();

type GatewayEnvironment = 'sandbox' | 'production';

const webhookRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'Too many webhook requests' },
  standardHeaders: true,
  legacyHeaders: false,
});

const WEBHOOK_KINDS = {
  SUBSCRIPTION_CHARGED_SUCCESSFULLY: 'subscription_charged_successfully',
  SUBSCRIPTION_CHARGED_UNSUCCESSFULLY: 'subscription_charged_unsuccessfully',
  SUBSCRIPTION_CANCELED: 'subscription_canceled',
  SUBSCRIPTION_EXPIRED: 'subscription_expired',
  SUBSCRIPTION_WENT_ACTIVE: 'subscription_went_active',
  SUBSCRIPTION_WENT_PAST_DUE: 'subscription_went_past_due',
  DISPUTE_OPENED: 'dispute_opened',
  DISPUTE_WON: 'dispute_won',
  DISPUTE_LOST: 'dispute_lost',
  TRANSACTION_SETTLED: 'transaction_settled',
  TRANSACTION_SETTLEMENT_DECLINED: 'transaction_settlement_declined',
} as const;

function generateEventId(notification: any): string {
  const timestamp = notification.timestamp?.toISOString?.() || notification.timestamp || Date.now().toString();
  const kind = notification.kind || 'unknown';
  const subscriptionId = notification.subscription?.id || notification.dispute?.id || notification.transaction?.id || '';
  const raw = `${timestamp}:${kind}:${subscriptionId}`;
  return crypto.createHash('sha256').update(raw).digest('hex').substring(0, 64);
}

function validateContentType(req: Request): boolean {
  const contentType = req.get('content-type') || '';
  return (
    contentType.includes('application/x-www-form-urlencoded') ||
    contentType.includes('application/json')
  );
}

async function resolveTenantFromWebhookKey(
  webhookKey: string, 
  environment: GatewayEnvironment
): Promise<{ tenantId: string } | null> {
  const [config] = await db.select({ tenantId: webhookEndpointConfigs.tenantId })
    .from(webhookEndpointConfigs)
    .where(
      and(
        eq(webhookEndpointConfigs.webhookKey, webhookKey),
        eq(webhookEndpointConfigs.environment, environment)
      )
    )
    .limit(1);
  
  return config || null;
}

async function checkIdempotency(
  tenantId: string, 
  environment: GatewayEnvironment, 
  eventId: string
): Promise<{ exists: boolean; status: string | null }> {
  const [receipt] = await db.select({ 
    processingStatus: webhookEventReceipts.processingStatus 
  })
    .from(webhookEventReceipts)
    .where(
      and(
        eq(webhookEventReceipts.tenantId, tenantId),
        eq(webhookEventReceipts.provider, 'braintree'),
        eq(webhookEventReceipts.environment, environment),
        eq(webhookEventReceipts.eventId, eventId)
      )
    )
    .limit(1);
  
  if (!receipt) {
    return { exists: false, status: null };
  }
  
  return { exists: true, status: receipt.processingStatus };
}

async function createOrUpdateReceipt(
  tenantId: string,
  environment: GatewayEnvironment,
  eventId: string,
  eventType: string,
  processingStatus: 'received' | 'processed' | 'failed',
  errorMessage?: string
): Promise<void> {
  const now = new Date();
  
  const { exists } = await checkIdempotency(tenantId, environment, eventId);
  
  if (exists) {
    await db.update(webhookEventReceipts)
      .set({
        processingStatus,
        processedAt: processingStatus === 'processed' ? now : undefined,
        lastProcessingErrorSafe: errorMessage || null,
      })
      .where(
        and(
          eq(webhookEventReceipts.tenantId, tenantId),
          eq(webhookEventReceipts.provider, 'braintree'),
          eq(webhookEventReceipts.environment, environment),
          eq(webhookEventReceipts.eventId, eventId)
        )
      );
  } else {
    await db.insert(webhookEventReceipts).values({
      tenantId,
      provider: 'braintree',
      environment,
      eventId,
      eventType,
      processingStatus,
      processedAt: processingStatus === 'processed' ? now : undefined,
      lastProcessingErrorSafe: errorMessage || null,
    });
  }
}

async function updateTransactionStatus(
  tenantId: string,
  externalTransactionId: string,
  newStatus: 'settled' | 'failed' | 'disputed'
): Promise<void> {
  const statusMap: Record<string, 'settled' | 'voided' | 'refunded' | 'failed' | 'disputed'> = {
    'settled': 'settled',
    'failed': 'failed',
    'disputed': 'disputed',
  };
  
  await db.update(tenantTransactions)
    .set({
      status: statusMap[newStatus],
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(tenantTransactions.tenantId, tenantId),
        eq(tenantTransactions.externalTransactionId, externalTransactionId)
      )
    );
}

async function processWebhookEvent(
  tenantId: string,
  environment: GatewayEnvironment,
  notification: any
): Promise<void> {
  const kind = notification.kind as string;
  
  switch (kind) {
    case WEBHOOK_KINDS.SUBSCRIPTION_CHARGED_SUCCESSFULLY:
    case WEBHOOK_KINDS.SUBSCRIPTION_CHARGED_UNSUCCESSFULLY:
    case WEBHOOK_KINDS.SUBSCRIPTION_CANCELED:
    case WEBHOOK_KINDS.SUBSCRIPTION_EXPIRED:
    case WEBHOOK_KINDS.SUBSCRIPTION_WENT_ACTIVE:
    case WEBHOOK_KINDS.SUBSCRIPTION_WENT_PAST_DUE:
      console.log(`📬 [Tenant ${tenantId}] Subscription event: ${kind}`);
      break;
      
    case WEBHOOK_KINDS.DISPUTE_OPENED:
    case WEBHOOK_KINDS.DISPUTE_WON:
    case WEBHOOK_KINDS.DISPUTE_LOST: {
      const dispute = notification.dispute;
      if (dispute?.transaction?.id) {
        const newStatus = kind === WEBHOOK_KINDS.DISPUTE_OPENED ? 'disputed' : 
                         kind === WEBHOOK_KINDS.DISPUTE_LOST ? 'disputed' : 'settled';
        await updateTransactionStatus(tenantId, dispute.transaction.id, newStatus);
      }
      console.log(`⚖️ [Tenant ${tenantId}] Dispute event: ${kind}`);
      break;
    }
    
    case WEBHOOK_KINDS.TRANSACTION_SETTLED: {
      const transaction = notification.transaction;
      if (transaction?.id) {
        await updateTransactionStatus(tenantId, transaction.id, 'settled');
      }
      console.log(`💰 [Tenant ${tenantId}] Transaction settled`);
      break;
    }
    
    case WEBHOOK_KINDS.TRANSACTION_SETTLEMENT_DECLINED: {
      const transaction = notification.transaction;
      if (transaction?.id) {
        await updateTransactionStatus(tenantId, transaction.id, 'failed');
      }
      console.log(`❌ [Tenant ${tenantId}] Transaction settlement declined`);
      break;
    }
    
    default:
      console.log(`📬 [Tenant ${tenantId}] Unhandled event: ${kind}`);
  }
}

async function handleWebhook(
  req: Request, 
  res: Response, 
  environment: GatewayEnvironment
): Promise<void> {
  const { webhookKey } = req.params;
  
  if (!validateContentType(req)) {
    res.status(415).json({ error: 'Unsupported content type' });
    return;
  }
  
  const config = await resolveTenantFromWebhookKey(webhookKey, environment);
  if (!config) {
    res.status(404).json({ error: 'Webhook endpoint not found' });
    return;
  }
  
  const tenantId = config.tenantId;
  
  const btSignature = req.body.bt_signature;
  const btPayload = req.body.bt_payload;
  
  if (!btSignature || !btPayload) {
    res.status(400).json({ error: 'Missing signature or payload' });
    return;
  }
  
  let gateway;
  try {
    gateway = await getTenantGateway(tenantId, environment);
  } catch (error) {
    console.error(`[Tenant ${tenantId}] Failed to get gateway:`, error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Gateway configuration error' });
    return;
  }
  
  let notification;
  try {
    notification = await gateway.webhookNotification.parse(btSignature, btPayload);
  } catch (error) {
    console.error(`[Tenant ${tenantId}] Webhook signature verification failed`);
    res.status(401).json({ error: 'Invalid webhook signature' });
    return;
  }
  
  const eventId = generateEventId(notification);
  const eventType = notification.kind || 'unknown';
  
  const idempotencyCheck = await checkIdempotency(tenantId, environment, eventId);
  
  if (idempotencyCheck.exists && idempotencyCheck.status === 'processed') {
    res.status(200).json({ received: true, status: 'already_processed' });
    return;
  }
  
  try {
    await createOrUpdateReceipt(tenantId, environment, eventId, eventType, 'received');
    
    await processWebhookEvent(tenantId, environment, notification);
    
    await createOrUpdateReceipt(tenantId, environment, eventId, eventType, 'processed');
    
    res.status(200).json({ received: true, status: 'processed' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown processing error';
    const safeErrorMessage = errorMessage.substring(0, 500);
    
    console.error(`[Tenant ${tenantId}] Webhook processing error for ${eventType}:`, safeErrorMessage);
    
    try {
      await createOrUpdateReceipt(tenantId, environment, eventId, eventType, 'failed', safeErrorMessage);
    } catch (receiptError) {
      console.error(`[Tenant ${tenantId}] Failed to update receipt:`, receiptError instanceof Error ? receiptError.message : 'Unknown error');
    }
    
    res.status(500).json({ error: 'Processing error' });
  }
}

router.post('/sandbox/:webhookKey', webhookRateLimiter, async (req: Request, res: Response) => {
  await handleWebhook(req, res, 'sandbox');
});

router.post('/production/:webhookKey', webhookRateLimiter, async (req: Request, res: Response) => {
  await handleWebhook(req, res, 'production');
});

router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'ok', 
    service: 'braintree-tenant-webhooks',
  });
});

export const braintreeTenantWebhookRouter = router;
