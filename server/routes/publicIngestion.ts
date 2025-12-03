import express, { Request, Response } from 'express';
import { sql } from 'drizzle-orm';
import { db } from '../db';
import bodyParser from 'body-parser';

const router = express.Router();

// Resend webhook endpoint - public
router.post('/resend/webhook', bodyParser.json(), async (req: Request, res: Response) => {
  try {
    console.log('📧 Received Resend webhook:', req.body.length || 1, 'events');
    
    const events = Array.isArray(req.body) ? req.body : [req.body];
    
    for (const event of events) {
      // Extract relevant fields from Resend event
      const { 
        email, 
        event: eventType, 
        timestamp,
        sg_message_id,
        reason,
        smtp_id,
        tenant_id, // if available in custom args
        template_key // if available in custom args
      } = event;
      
      if (email && eventType && ['processed', 'delivered', 'open', 'click', 'bounce', 'dropped', 'spamreport', 'deferred'].includes(eventType)) {
        await db.execute(sql`
          INSERT INTO email_events (provider, message_id, tenant_id, template_key, to_addr, event, reason, created_at)
          VALUES (
            'resend',
            ${sg_message_id || smtp_id || 'unknown'},
            ${tenant_id || null},
            ${template_key || null},
            ${email},
            ${eventType},
            ${reason || null},
            ${timestamp ? new Date(timestamp * 1000) : new Date()}
          )
          ON CONFLICT DO NOTHING
        `);
      }
    }
    
    res.status(200).json({ received: events.length });
  } catch (error) {
    console.error('❌ Resend webhook error:', error);
    res.status(500).json({ error: 'Processing failed' });
  }
});

// Telnyx webhook endpoint - public
router.post('/telnyx/webhook', bodyParser.urlencoded({ extended: true }), async (req: Request, res: Response) => {
  try {
    console.log('📱 Received Telnyx webhook:', req.body);
    
    const {
      MessageSid,
      MessageStatus,
      To,
      ErrorCode,
      tenant_id // if available in custom fields
    } = req.body;
    
    if (MessageSid && MessageStatus && ['queued', 'sent', 'delivered', 'undelivered', 'failed'].includes(MessageStatus)) {
      await db.execute(sql`
        INSERT INTO sms_events (provider, message_sid, tenant_id, to_number, event, error_code, created_at)
        VALUES (
          'telnyx',
          ${MessageSid},
          ${tenant_id || null},
          ${To || 'unknown'},
          ${MessageStatus},
          ${ErrorCode || null},
          NOW()
        )
        ON CONFLICT DO NOTHING
      `);
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Telnyx webhook error:', error);
    res.status(500).send('Error');
  }
});

export default router;