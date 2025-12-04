
import { Router } from 'express';
import { trackEmailEvent } from '../utils/communication-analytics';

const router = Router();

/**
 * SendGrid webhook endpoint for email event tracking
 * Configure in SendGrid: https://app.sendgrid.com/settings/mail_settings
 * Webhook URL: https://yourdomain.com/api/webhooks/sendgrid
 */
router.post('/sendgrid', async (req, res) => {
  try {
    const events = req.body;
    
    if (!Array.isArray(events)) {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    console.log(`📧 Received ${events.length} SendGrid webhook events`);

    for (const event of events) {
      try {
        // Extract custom data from event
        const customArgs = event.sg_event_id ? event : {};
        const tenantId = customArgs.tenant_id || event.tenant_id;
        const campaignId = customArgs.campaign_id || event.campaign_id;
        const templateKey = customArgs.template_key || event.template_id;

        await trackEmailEvent({
          messageId: event.sg_message_id || event.smtp_id || `unknown-${Date.now()}`,
          email: event.email,
          event: mapSendGridEvent(event.event),
          tenantId,
          campaignId,
          templateKey,
          timestamp: new Date(event.timestamp * 1000),
          metadata: {
            ip: event.ip,
            userAgent: event.useragent,
            url: event.url,
            reason: event.reason,
            status: event.status,
            response: event.response,
            attempt: event.attempt
          }
        });
      } catch (eventError) {
        console.error('Failed to process SendGrid event:', eventError, event);
      }
    }

    res.status(200).json({ processed: events.length });
  } catch (error) {
    console.error('SendGrid webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Map SendGrid event types to our standard event types
 */
function mapSendGridEvent(sgEvent: string): 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'dropped' | 'spam' {
  const eventMap: Record<string, 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'dropped' | 'spam'> = {
    'processed': 'sent',
    'delivered': 'delivered',
    'open': 'opened',
    'click': 'clicked',
    'bounce': 'bounced',
    'dropped': 'dropped',
    'spamreport': 'spam',
    'unsubscribe': 'spam',
    'group_unsubscribe': 'spam'
  };

  return eventMap[sgEvent] || 'sent';
}

export { router as sendgridWebhookRouter };
