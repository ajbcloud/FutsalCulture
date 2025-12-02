import { Router, Request, Response } from 'express';
import { db } from '../db';
import { smsCreditTransactions } from '@shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

interface TelnyxWebhookEvent {
  data: {
    event_type: string;
    id: string;
    occurred_at: string;
    payload: {
      id: string;
      to: Array<{ phone_number: string; status: string }>;
      from: { phone_number: string };
      text: string;
      direction: string;
      completed_at?: string;
      cost?: { amount: string; currency: string };
      errors?: Array<{ code: string; title: string; detail: string }>;
      parts?: number;
    };
    record_type: string;
  };
  meta?: {
    attempt: number;
    delivered_to: string;
  };
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const event = req.body as TelnyxWebhookEvent;
    
    if (!event?.data?.event_type) {
      console.log('⚠️ Telnyx webhook: Invalid event format');
      return res.status(200).json({ received: true });
    }

    const { event_type, payload } = event.data;
    const messageId = payload?.id;

    console.log(`📱 Telnyx webhook received: ${event_type} for message ${messageId}`);

    switch (event_type) {
      case 'message.sent':
        console.log(`📤 SMS sent: ${messageId}`);
        break;

      case 'message.finalized':
        const status = payload?.to?.[0]?.status;
        console.log(`✅ SMS finalized: ${messageId} - Status: ${status}`);
        
        if (messageId) {
          await db
            .update(smsCreditTransactions)
            .set({
              metadata: {
                deliveryStatus: status,
                finalizedAt: event.data.occurred_at,
                cost: payload?.cost,
              },
            })
            .where(eq(smsCreditTransactions.referenceId, messageId));
        }
        break;

      case 'message.failed':
        const errorDetails = payload?.errors?.[0];
        console.log(`❌ SMS failed: ${messageId} - Error: ${errorDetails?.title || 'Unknown'}`);
        
        if (messageId) {
          await db
            .update(smsCreditTransactions)
            .set({
              metadata: {
                deliveryStatus: 'failed',
                failedAt: event.data.occurred_at,
                errorCode: errorDetails?.code,
                errorTitle: errorDetails?.title,
                errorDetail: errorDetails?.detail,
              },
            })
            .where(eq(smsCreditTransactions.referenceId, messageId));
        }
        break;

      case 'message.received':
        console.log(`📥 Inbound SMS received from ${payload?.from?.phone_number}: ${payload?.text?.substring(0, 50)}...`);
        break;

      default:
        console.log(`📱 Unhandled Telnyx event type: ${event_type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('❌ Telnyx webhook error:', error);
    res.status(200).json({ received: true, error: 'Processing error' });
  }
});

router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'telnyx-webhooks' });
});

export const telnyxWebhookRouter = router;
