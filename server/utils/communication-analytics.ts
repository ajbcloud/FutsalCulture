
import { db } from '../db';
import { sql } from 'drizzle-orm';

export interface EmailEvent {
  messageId: string;
  email: string;
  event: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'dropped' | 'spam';
  tenantId?: string;
  campaignId?: string;
  templateKey?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface SMSEvent {
  messageId: string;
  phone: string;
  event: 'sent' | 'delivered' | 'failed' | 'clicked';
  tenantId?: string;
  campaignId?: string;
  timestamp: Date;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface CommunicationStats {
  email: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
  };
  sms: {
    sent: number;
    delivered: number;
    failed: number;
    deliveryRate: number;
  };
  templates: Array<{
    templateKey: string;
    sent: number;
    opened: number;
    clicked: number;
    openRate: number;
    clickRate: number;
  }>;
}

/**
 * Track email events from SendGrid webhooks
 */
export async function trackEmailEvent(event: EmailEvent): Promise<void> {
  try {
    // Store in database
    await db.execute(sql`
      INSERT INTO email_events (
        message_id, email, event, tenant_id, campaign_id, 
        template_key, created_at, metadata
      ) VALUES (
        ${event.messageId}, ${event.email}, ${event.event}, 
        ${event.tenantId}, ${event.campaignId}, ${event.templateKey},
        ${event.timestamp}, ${JSON.stringify(event.metadata || {})}
      )
      ON CONFLICT (message_id, event) DO NOTHING
    `);

    console.log(`📧 Email Event Tracked: ${event.event} for ${event.email}`, {
      messageId: event.messageId,
      tenantId: event.tenantId,
      campaignId: event.campaignId,
      templateKey: event.templateKey
    });
  } catch (error) {
    console.error('Failed to track email event:', error);
  }
}

/**
 * Track SMS events from Twilio webhooks
 */
export async function trackSMSEvent(event: SMSEvent): Promise<void> {
  try {
    // Store in database
    await db.execute(sql`
      INSERT INTO sms_events (
        message_id, phone, event, tenant_id, campaign_id,
        created_at, error_message, metadata
      ) VALUES (
        ${event.messageId}, ${event.phone}, ${event.event},
        ${event.tenantId}, ${event.campaignId}, ${event.timestamp},
        ${event.errorMessage}, ${JSON.stringify(event.metadata || {})}
      )
      ON CONFLICT (message_id, event) DO NOTHING
    `);

    console.log(`📱 SMS Event Tracked: ${event.event} for ${event.phone}`, {
      messageId: event.messageId,
      tenantId: event.tenantId,
      campaignId: event.campaignId,
      error: event.errorMessage
    });
  } catch (error) {
    console.error('Failed to track SMS event:', error);
  }
}

/**
 * Get communication statistics for a date range
 */
export async function getCommunicationStats(options: {
  tenantId?: string;
  startDate?: Date;
  endDate?: Date;
  templateKey?: string;
}): Promise<CommunicationStats> {
  const { tenantId, startDate, endDate, templateKey } = options;
  
  try {
    // Build date filter
    let dateFilter = '';
    if (startDate && endDate) {
      dateFilter = `AND created_at BETWEEN '${startDate.toISOString()}' AND '${endDate.toISOString()}'`;
    }
    
    // Build tenant filter
    let tenantFilter = '';
    if (tenantId) {
      tenantFilter = `AND tenant_id = '${tenantId}'`;
    }
    
    // Build template filter
    let templateFilter = '';
    if (templateKey) {
      templateFilter = `AND template_key = '${templateKey}'`;
    }

    // Get email stats
    const emailStats = await db.execute(sql`
      SELECT 
        SUM(CASE WHEN event = 'sent' THEN 1 ELSE 0 END)::int as sent,
        SUM(CASE WHEN event = 'delivered' THEN 1 ELSE 0 END)::int as delivered,
        SUM(CASE WHEN event = 'open' THEN 1 ELSE 0 END)::int as opened,
        SUM(CASE WHEN event = 'click' THEN 1 ELSE 0 END)::int as clicked,
        SUM(CASE WHEN event IN ('bounce', 'dropped', 'spamreport') THEN 1 ELSE 0 END)::int as bounced
      FROM email_events 
      WHERE 1=1 ${dateFilter} ${tenantFilter} ${templateFilter}
    `);

    // Get SMS stats
    const smsStats = await db.execute(sql`
      SELECT 
        SUM(CASE WHEN event = 'sent' THEN 1 ELSE 0 END)::int as sent,
        SUM(CASE WHEN event = 'delivered' THEN 1 ELSE 0 END)::int as delivered,
        SUM(CASE WHEN event = 'failed' THEN 1 ELSE 0 END)::int as failed
      FROM sms_events 
      WHERE 1=1 ${dateFilter} ${tenantFilter}
    `);

    // Get template performance
    const templateStats = await db.execute(sql`
      SELECT 
        template_key,
        SUM(CASE WHEN event = 'sent' THEN 1 ELSE 0 END)::int as sent,
        SUM(CASE WHEN event = 'open' THEN 1 ELSE 0 END)::int as opened,
        SUM(CASE WHEN event = 'click' THEN 1 ELSE 0 END)::int as clicked
      FROM email_events 
      WHERE template_key IS NOT NULL ${dateFilter} ${tenantFilter}
      GROUP BY template_key
      ORDER BY sent DESC
      LIMIT 10
    `);

    const email = (emailStats as any).rows[0] || { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0 };
    const sms = (smsStats as any).rows[0] || { sent: 0, delivered: 0, failed: 0 };
    const templates = (templateStats as any).rows || [];

    return {
      email: {
        sent: Number(email.sent),
        delivered: Number(email.delivered),
        opened: Number(email.opened),
        clicked: Number(email.clicked),
        bounced: Number(email.bounced),
        deliveryRate: email.sent > 0 ? Number(((email.delivered / email.sent) * 100).toFixed(1)) : 0,
        openRate: email.delivered > 0 ? Number(((email.opened / email.delivered) * 100).toFixed(1)) : 0,
        clickRate: email.opened > 0 ? Number(((email.clicked / email.opened) * 100).toFixed(1)) : 0,
      },
      sms: {
        sent: Number(sms.sent),
        delivered: Number(sms.delivered),
        failed: Number(sms.failed),
        deliveryRate: sms.sent > 0 ? Number(((sms.delivered / sms.sent) * 100).toFixed(1)) : 0,
      },
      templates: templates.map((template: any) => ({
        templateKey: template.template_key,
        sent: Number(template.sent),
        opened: Number(template.opened),
        clicked: Number(template.clicked),
        openRate: template.sent > 0 ? Number(((template.opened / template.sent) * 100).toFixed(1)) : 0,
        clickRate: template.opened > 0 ? Number(((template.clicked / template.opened) * 100).toFixed(1)) : 0,
      }))
    };
  } catch (error) {
    console.error('Failed to get communication stats:', error);
    throw error;
  }
}

/**
 * Get real-time communication health metrics
 */
export async function getCommunicationHealth(): Promise<{
  emailHealth: 'healthy' | 'warning' | 'critical';
  smsHealth: 'healthy' | 'warning' | 'critical';
  issues: string[];
}> {
  try {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const recentStats = await getCommunicationStats({
      startDate: last24Hours,
      endDate: new Date()
    });

    const issues: string[] = [];
    let emailHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
    let smsHealth: 'healthy' | 'warning' | 'critical' = 'healthy';

    // Check email health
    if (recentStats.email.deliveryRate < 95) {
      emailHealth = recentStats.email.deliveryRate < 90 ? 'critical' : 'warning';
      issues.push(`Email delivery rate is ${recentStats.email.deliveryRate}%`);
    }
    
    if (recentStats.email.openRate < 15) {
      emailHealth = 'warning';
      issues.push(`Email open rate is low: ${recentStats.email.openRate}%`);
    }

    // Check SMS health
    if (recentStats.sms.deliveryRate < 95) {
      smsHealth = recentStats.sms.deliveryRate < 90 ? 'critical' : 'warning';
      issues.push(`SMS delivery rate is ${recentStats.sms.deliveryRate}%`);
    }

    return { emailHealth, smsHealth, issues };
  } catch (error) {
    console.error('Failed to get communication health:', error);
    return {
      emailHealth: 'critical',
      smsHealth: 'critical',
      issues: ['Unable to fetch communication health metrics']
    };
  }
}
