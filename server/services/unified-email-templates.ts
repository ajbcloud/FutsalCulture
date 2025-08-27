/**
 * CONSOLIDATED EMAIL TEMPLATE SERVICE
 * Unified template engine for all email types in the invitation system rebuild
 * 
 * Features:
 * - Centralized template management
 * - Role-based customization  
 * - Tenant branding support
 * - HTML and text variants
 * - Email delivery tracking
 */

import { sendInvitationEmail as legacySendInvitationEmail } from '../utils/email-service';
import { db } from '../db';
import { tenants, invitationAnalytics } from '@shared/schema';
import { eq } from 'drizzle-orm';
import sgMail from '@sendgrid/mail';

// Initialize SendGrid if API key is available
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@playhq.app';

export interface UnifiedEmailTemplate {
  type: 'invitation' | 'welcome' | 'reminder' | 'parent2' | 'announcement' | 'maintenance';
  variant: 'html' | 'text';
  data: {
    tenantId: string;
    tenantName: string;
    recipientName: string;
    recipientEmail: string;
    senderName: string;
    role: string;
    inviteUrl?: string;
    customMessage?: string;
    expiresAt?: Date;
    tenantBranding?: {
      logo?: string;
      primaryColor?: string;
      secondaryColor?: string;
      businessName?: string;
    };
    metadata?: Record<string, any>;
  };
}

export interface EmailDeliveryOptions {
  to: string;
  template: UnifiedEmailTemplate;
  trackingId?: string;
  customHeaders?: Record<string, string>;
}

/**
 * Unified Email Template Service Class
 * Handles all email template generation and delivery
 */
export class EmailTemplateService {
  
  /**
   * Generate email template content
   */
  generateTemplate(template: UnifiedEmailTemplate): string {
    switch (template.type) {
      case 'invitation':
        return this.generateInvitationTemplate(template);
      case 'welcome':
        return this.generateWelcomeTemplate(template);
      case 'reminder':
        return this.generateReminderTemplate(template);
      case 'parent2':
        return this.generateParent2Template(template);
      case 'announcement':
        return this.generateAnnouncementTemplate(template);
      case 'maintenance':
        return this.generateMaintenanceTemplate(template);
      default:
        throw new Error(`Unsupported template type: ${template.type}`);
    }
  }

  /**
   * Send email using unified template system
   */
  async sendEmail(options: EmailDeliveryOptions): Promise<{ messageId: string; success: boolean }> {
    try {
      if (!process.env.SENDGRID_API_KEY) {
        console.warn('SENDGRID_API_KEY not configured - email not sent');
        return { messageId: 'no-api-key', success: false };
      }

      const { template, to, trackingId, customHeaders = {} } = options;
      const htmlContent = this.generateTemplate({ ...template, variant: 'html' });
      const textContent = this.generateTemplate({ ...template, variant: 'text' });
      const subject = this.generateSubject(template);

      // Prepare SendGrid message
      const msg = {
        to,
        from: FROM_EMAIL,
        subject,
        html: htmlContent,
        text: textContent,
        headers: {
          ...customHeaders,
          'X-Tenant-ID': template.data.tenantId,
          'X-Template-Type': template.type,
          ...(trackingId && { 'X-Tracking-ID': trackingId }),
        },
        customArgs: {
          tenant_id: template.data.tenantId,
          template_type: template.type,
          template_key: `unified_${template.type}`,
          ...(trackingId && { tracking_id: trackingId }),
        },
      };

      const [response] = await sgMail.send(msg);
      const messageId = response.headers['x-message-id'] || 'unknown';

      console.log(`✅ Unified email sent: ${template.type} to ${to} (${messageId})`);
      return { messageId, success: true };

    } catch (error) {
      console.error('❌ Failed to send unified email:', error);
      return { messageId: 'error', success: false };
    }
  }

  /**
   * Track email delivery event
   */
  async trackDelivery(messageId: string, eventData: {
    eventType: 'processed' | 'delivered' | 'open' | 'click' | 'bounce' | 'dropped';
    invitationId?: string;
    tenantId: string;
    email: string;
    timestamp?: Date;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      // If we have an invitationId, track in invitation analytics
      if (eventData.invitationId) {
        await db.insert(invitationAnalytics)
          .values({
            invitationId: eventData.invitationId,
            tenantId: eventData.tenantId,
            eventType: eventData.eventType === 'delivered' ? 'sent' : 
                       eventData.eventType === 'open' ? 'viewed' :
                       eventData.eventType === 'click' ? 'clicked' : 'sent',
            eventData: {
              messageId,
              emailEvent: eventData.eventType,
              timestamp: eventData.timestamp || new Date(),
              ...eventData.metadata,
            },
          });
      }

      console.log(`📧 Email delivery tracked: ${eventData.eventType} for ${eventData.email}`);
    } catch (error) {
      console.error('Failed to track email delivery:', error);
    }
  }

  /**
   * Get tenant branding information
   */
  private async getTenantBranding(tenantId: string): Promise<UnifiedEmailTemplate['data']['tenantBranding']> {
    try {
      // This would integrate with your tenant branding system
      // For now, return default branding
      const tenant = await db.select()
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .limit(1);

      const defaultBranding = {
        primaryColor: '#3B82F6',
        secondaryColor: '#1E40AF',
        businessName: tenant[0]?.name || 'PlayHQ',
      };

      return defaultBranding;
    } catch (error) {
      console.error('Failed to get tenant branding:', error);
      return {
        primaryColor: '#3B82F6',
        secondaryColor: '#1E40AF',
        businessName: 'PlayHQ',
      };
    }
  }

  /**
   * Generate email subject based on template type
   */
  private generateSubject(template: UnifiedEmailTemplate): string {
    const { type, data } = template;
    const brandName = data.tenantBranding?.businessName || data.tenantName;

    switch (type) {
      case 'invitation':
        return `Join ${brandName} on PlayHQ - You're Invited!`;
      case 'welcome':
        return `Welcome to ${brandName}!`;
      case 'reminder':
        return `Reminder: Complete your ${brandName} invitation`;
      case 'parent2':
        return `${brandName}: Add Second Parent to Your Account`;
      case 'announcement':
        return `${brandName}: Important Update`;
      case 'maintenance':
        return `${brandName}: Scheduled Maintenance Notice`;
      default:
        return `${brandName} - PlayHQ Notification`;
    }
  }

  /**
   * Generate invitation template (unified)
   */
  private generateInvitationTemplate(template: UnifiedEmailTemplate): string {
    const { variant, data } = template;
    const branding = data.tenantBranding || {};
    const primaryColor = branding.primaryColor || '#3B82F6';
    const businessName = branding.businessName || data.tenantName;

    if (variant === 'text') {
      return `
Hello ${data.recipientName}!

You've been invited to join ${businessName} on PlayHQ as a ${data.role}.

${data.customMessage ? `Personal message from ${data.senderName}:\n"${data.customMessage}"\n\n` : ''}

To accept your invitation, please visit:
${data.inviteUrl}

This invitation expires on: ${data.expiresAt?.toLocaleDateString() || 'N/A'}

If you have any questions, please contact ${data.senderName} or reply to this email.

Best regards,
The ${businessName} Team

---
Powered by PlayHQ - Sports Club Management Made Simple
      `.trim();
    }

    // HTML variant
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Join ${businessName} on PlayHQ</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      line-height: 1.6;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, ${primaryColor} 0%, #1E40AF 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .content {
      padding: 40px 30px;
    }
    .welcome-message {
      font-size: 18px;
      color: #1e293b;
      margin-bottom: 30px;
    }
    .invitation-details {
      background: #f8fafc;
      border-radius: 8px;
      padding: 24px;
      margin: 24px 0;
      border-left: 4px solid ${primaryColor};
    }
    .cta-button {
      display: inline-block;
      background: ${primaryColor};
      color: white !important;
      padding: 16px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      margin: 24px 0;
      text-align: center;
    }
    .expiry-notice {
      color: #f59e0b;
      background: #fef3c7;
      padding: 12px 16px;
      border-radius: 6px;
      font-size: 14px;
      margin: 20px 0;
    }
    .custom-message {
      background: #e0f2fe;
      border-left: 4px solid #0891b2;
      padding: 16px;
      border-radius: 6px;
      margin: 20px 0;
      font-style: italic;
    }
    .footer {
      background: #f8fafc;
      padding: 30px;
      text-align: center;
      color: #64748b;
      font-size: 14px;
    }
    .branding {
      text-align: center;
      padding: 20px;
      color: #94a3b8;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>🏆 You're Invited!</h1>
      <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Join ${businessName} on PlayHQ</p>
    </div>
    
    <div class="content">
      <div class="welcome-message">
        Hello <strong>${data.recipientName}</strong>!
      </div>
      
      <p>You've been invited by <strong>${data.senderName}</strong> to join <strong>${businessName}</strong> as a <span style="color: ${primaryColor}; font-weight: 600;">${data.role}</span>.</p>
      
      ${data.customMessage ? `
      <div class="custom-message">
        <strong>Personal message from ${data.senderName}:</strong><br>
        "${data.customMessage}"
      </div>
      ` : ''}
      
      <div class="invitation-details">
        <h3 style="margin-top: 0; color: #1e293b;">What's Next?</h3>
        <p style="margin-bottom: 0;">Click the button below to accept your invitation and get started with ${businessName}!</p>
      </div>
      
      <div style="text-align: center;">
        <a href="${data.inviteUrl}" class="cta-button">Accept Invitation</a>
      </div>
      
      ${data.expiresAt ? `
      <div class="expiry-notice">
        ⏰ <strong>Important:</strong> This invitation expires on ${data.expiresAt.toLocaleDateString()}
      </div>
      ` : ''}
      
      <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
        If the button doesn't work, you can copy and paste this link into your browser:<br>
        <span style="word-break: break-all;">${data.inviteUrl}</span>
      </p>
    </div>
    
    <div class="footer">
      <p>If you have any questions, please contact ${data.senderName} or reply to this email.</p>
      <p style="margin-top: 20px;"><strong>The ${businessName} Team</strong></p>
    </div>
    
    <div class="branding">
      Powered by <strong>PlayHQ</strong> - Sports Club Management Made Simple
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Generate welcome template
   */
  private generateWelcomeTemplate(template: UnifiedEmailTemplate): string {
    const { variant, data } = template;
    
    if (variant === 'text') {
      return `
Welcome to ${data.tenantName}!

Hi ${data.recipientName},

Welcome to ${data.tenantName}! We're excited to have you as part of our community.

Your account has been successfully created and you can now access all the features available to ${data.role}s.

Next steps:
- Complete your profile
- Explore the available features
- Connect with other members

If you need any help getting started, don't hesitate to reach out.

Best regards,
The ${data.tenantName} Team

---
Powered by PlayHQ
      `.trim();
    }

    return this.generateStandardHTMLTemplate(template, 'Welcome!', '🎉');
  }

  /**
   * Generate reminder template
   */
  private generateReminderTemplate(template: UnifiedEmailTemplate): string {
    // Implementation similar to invitation but with reminder-specific content
    return this.generateStandardHTMLTemplate(template, 'Reminder', '⏰');
  }

  /**
   * Generate parent2 template
   */
  private generateParent2Template(template: UnifiedEmailTemplate): string {
    return this.generateStandardHTMLTemplate(template, 'Add Second Parent', '👨‍👩‍👧‍👦');
  }

  /**
   * Generate announcement template
   */
  private generateAnnouncementTemplate(template: UnifiedEmailTemplate): string {
    return this.generateStandardHTMLTemplate(template, 'Important Update', '📢');
  }

  /**
   * Generate maintenance template
   */
  private generateMaintenanceTemplate(template: UnifiedEmailTemplate): string {
    return this.generateStandardHTMLTemplate(template, 'Maintenance Notice', '🔧');
  }

  /**
   * Standard HTML template for non-invitation emails
   */
  private generateStandardHTMLTemplate(template: UnifiedEmailTemplate, title: string, emoji: string): string {
    const { data } = template;
    const branding = data.tenantBranding || {};
    const primaryColor = branding.primaryColor || '#3B82F6';
    const businessName = branding.businessName || data.tenantName;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${businessName} - ${title}</title>
  <style>
    /* Same styles as invitation template but adapted */
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', system-ui, sans-serif; }
    .email-container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, ${primaryColor} 0%, #1E40AF 100%); color: white; padding: 40px 30px; text-align: center; }
    .content { padding: 40px 30px; }
    .footer { background: #f8fafc; padding: 30px; text-align: center; color: #64748b; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>${emoji} ${title}</h1>
      <p style="margin: 8px 0 0 0; opacity: 0.9;">${businessName}</p>
    </div>
    <div class="content">
      <p>Hello <strong>${data.recipientName}</strong>!</p>
      ${data.customMessage ? `<div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">${data.customMessage}</div>` : ''}
      <p>Best regards,<br>The ${businessName} Team</p>
    </div>
    <div class="footer">
      <p>Powered by <strong>PlayHQ</strong></p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }
}

// Export singleton instance
export const emailTemplateService = new EmailTemplateService();

/**
 * Utility function for backward compatibility
 * Wraps the old email service with unified template system
 */
export async function sendUnifiedInvitationEmail(options: {
  to: string;
  tenantName: string;
  recipientName: string;
  senderName: string;
  role: 'parent' | 'player' | 'admin' | 'assistant';
  inviteUrl: string;
  expiresAt: Date;
  tenantId: string;
  customMessage?: string;
  trackingId?: string;
}): Promise<{ messageId: string; success: boolean }> {
  
  const template: UnifiedEmailTemplate = {
    type: 'invitation',
    variant: 'html',
    data: {
      tenantId: options.tenantId,
      tenantName: options.tenantName,
      recipientName: options.recipientName,
      recipientEmail: options.to,
      senderName: options.senderName,
      role: options.role,
      inviteUrl: options.inviteUrl,
      expiresAt: options.expiresAt,
      customMessage: options.customMessage,
    },
  };

  return emailTemplateService.sendEmail({
    to: options.to,
    template,
    trackingId: options.trackingId,
  });
}