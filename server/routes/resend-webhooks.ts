import { Router } from 'express';
import { trackEmailEvent } from '../utils/communication-analytics';

const router = Router();

/**
 * Resend webhook endpoint for email event tracking
 * Configure in Resend Dashboard: https://resend.com/webhooks
 * Webhook URL: https://yourdomain.com/api/webhooks/resend
 */
router.post('/resend', async (req, res) => {
  try {
    const event = req.body;
    
    if (!event || !event.type) {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    console.log(`📧 Received Resend webhook event: ${event.type}`);

    try {
      const data = event.data || {};
      
      await trackEmailEvent({
        messageId: data.email_id || `resend-${Date.now()}`,
        email: data.to?.[0] || data.email || 'unknown',
        event: mapResendEvent(event.type),
        tenantId: data.tags?.find((t: any) => t.name === 'tenant_id')?.value,
        campaignId: data.tags?.find((t: any) => t.name === 'campaign_id')?.value,
        templateKey: data.tags?.find((t: any) => t.name === 'template_key')?.value,
        timestamp: new Date(event.created_at || Date.now()),
        metadata: {
          subject: data.subject,
          from: data.from,
          to: data.to,
          bounceType: data.bounce?.type,
          reason: data.reason,
          click: data.click,
          provider: 'resend'
        }
      });
    } catch (eventError) {
      console.error('Failed to process Resend event:', eventError, event);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Resend webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Map Resend event types to our standard event types
 * Resend events: email.sent, email.delivered, email.opened, email.clicked, email.bounced, email.complained
 */
function mapResendEvent(resendEvent: string): 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'dropped' | 'spam' {
  const eventMap: Record<string, 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'dropped' | 'spam'> = {
    'email.sent': 'sent',
    'email.delivered': 'delivered',
    'email.delivery_delayed': 'sent',
    'email.opened': 'opened',
    'email.clicked': 'clicked',
    'email.bounced': 'bounced',
    'email.complained': 'spam'
  };

  return eventMap[resendEvent] || 'sent';
}

export { router as resendWebhookRouter };
