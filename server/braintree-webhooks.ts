import { Router } from 'express';
import { db } from './db';
import { payments } from '../shared/schema';
import { eq } from 'drizzle-orm';
import braintree from 'braintree';

const router = Router();

// Braintree webhook handler for payment status updates
router.post('/webhooks/braintree', async (req, res) => {
  try {
    // Note: In production, you should verify the webhook signature
    const { bt_signature, bt_payload } = req.body;
    
    // For now, we'll trust the payload (in production, verify signature)
    let webhookNotification;
    
    try {
      // Parse webhook payload
      if (typeof req.body === 'string') {
        webhookNotification = JSON.parse(req.body);
      } else {
        webhookNotification = req.body;
      }
    } catch (error) {
      console.error('Error parsing Braintree webhook payload:', error);
      return res.status(400).json({ message: 'Invalid webhook payload' });
    }

    console.log('Braintree webhook received:', {
      kind: webhookNotification.kind,
      id: webhookNotification.id,
      timestamp: webhookNotification.timestamp
    });

    // Handle different webhook types
    switch (webhookNotification.kind) {
      case 'transaction_settled':
      case 'transaction_settlement_declined':
      case 'transaction_voided':
      case 'transaction_refunded':
        await handleTransactionUpdate(webhookNotification);
        break;
        
      default:
        console.log(`Unhandled Braintree webhook type: ${webhookNotification.kind}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error processing Braintree webhook:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
});

async function handleTransactionUpdate(notification: any) {
  try {
    const transaction = notification.transaction || notification.subject?.transaction;
    
    if (!transaction || !transaction.id) {
      console.error('Invalid transaction data in webhook:', notification);
      return;
    }

    console.log('Processing Braintree transaction update:', {
      id: transaction.id,
      status: transaction.status,
      kind: notification.kind
    });

    // Find payment record by processor payment ID
    const payment = await db.select()
      .from(payments)
      .where(eq(payments.processorPaymentId, transaction.id))
      .limit(1);

    if (!payment.length) {
      console.log(`No payment record found for Braintree transaction: ${transaction.id}`);
      return;
    }

    const paymentRecord = payment[0];
    let newStatus = paymentRecord.status;
    let updateData: any = {
      updatedAt: new Date(),
      meta: {
        ...paymentRecord.meta,
        webhookUpdate: {
          kind: notification.kind,
          timestamp: notification.timestamp,
          transaction: transaction
        }
      }
    };

    // Update status based on webhook type
    switch (notification.kind) {
      case 'transaction_settled':
        newStatus = 'settled';
        updateData.capturedAt = new Date();
        break;
        
      case 'transaction_settlement_declined':
        newStatus = 'failed';
        break;
        
      case 'transaction_voided':
        newStatus = 'voided';
        updateData.voided_at = new Date();
        break;
        
      case 'transaction_refunded':
        const refundAmount = parseFloat(transaction.refund_amount || '0') * 100; // Convert to cents
        newStatus = refundAmount >= paymentRecord.amountCents ? 'refunded' : 'partial_refunded';
        updateData.refundAmountCents = refundAmount;
        updateData.refundedAt = new Date();
        break;
    }

    updateData.status = newStatus;

    // Update payment record
    await db.update(payments)
      .set(updateData)
      .where(eq(payments.id, paymentRecord.id));

    console.log(`Updated payment ${paymentRecord.id} status to ${newStatus}`);
  } catch (error) {
    console.error('Error handling Braintree transaction update:', error);
  }
}

export { router as braintreeWebhookRouter };