
import { Router } from 'express';
import { sendInvitationEmail } from '../utils/email-service';
import { sendInvitationSMS } from '../smsService';
import { verifySendGridConfig } from '../utils/sendgrid-helper';
import { getCommunicationStats, getCommunicationHealth } from '../utils/communication-analytics';

const router = Router();

/**
 * Test SendGrid email integration
 */
router.post('/test/email', async (req, res) => {
  try {
    const { to, testType = 'invitation' } = req.body;
    
    if (!to) {
      return res.status(400).json({ error: 'Email address required' });
    }

    const config = await verifySendGridConfig();
    if (!config.configured) {
      return res.status(400).json({ error: config.error });
    }

    if (testType === 'invitation') {
      await sendInvitationEmail({
        to,
        tenantName: 'Test Organization',
        recipientName: 'Test User',
        senderName: 'PlayHQ Team',
        role: 'parent',
        inviteUrl: 'https://playhq.app/test-invite',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
    }

    res.json({ 
      success: true, 
      message: `Test ${testType} email sent to ${to}`,
      config: {
        fromEmail: config.fromEmail,
        configured: config.configured
      }
    });
  } catch (error: any) {
    console.error('Email test failed:', error);
    res.status(500).json({ 
      error: 'Email test failed', 
      details: error.message 
    });
  }
});

/**
 * Test SMS integration
 */
router.post('/test/sms', async (req, res) => {
  try {
    const { to, testType = 'invitation' } = req.body;
    
    if (!to) {
      return res.status(400).json({ error: 'Phone number required' });
    }

    if (testType === 'invitation') {
      const result = await sendInvitationSMS({
        to,
        tenantName: 'Test Organization',
        recipientName: 'Test User',
        senderName: 'PlayHQ Team',
        role: 'parent',
        inviteUrl: 'https://playhq.app/test-invite',
        expiresAt: 'December 31, 2024 at 11:59 PM'
      });

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json({ 
        success: true, 
        message: `Test ${testType} SMS sent to ${to}`,
        messageId: result.messageId
      });
    }
  } catch (error: any) {
    console.error('SMS test failed:', error);
    res.status(500).json({ 
      error: 'SMS test failed', 
      details: error.message 
    });
  }
});

/**
 * Get communication analytics
 */
router.get('/analytics', async (req, res) => {
  try {
    const { 
      tenantId, 
      startDate, 
      endDate, 
      templateKey 
    } = req.query;

    const options: any = {};
    if (tenantId) options.tenantId = tenantId as string;
    if (startDate) options.startDate = new Date(startDate as string);
    if (endDate) options.endDate = new Date(endDate as string);
    if (templateKey) options.templateKey = templateKey as string;

    const stats = await getCommunicationStats(options);
    res.json(stats);
  } catch (error: any) {
    console.error('Analytics fetch failed:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

/**
 * Get communication health status
 */
router.get('/health', async (req, res) => {
  try {
    const health = await getCommunicationHealth();
    res.json(health);
  } catch (error: any) {
    console.error('Health check failed:', error);
    res.status(500).json({ error: 'Health check failed' });
  }
});

export { router as communicationTestRouter };
