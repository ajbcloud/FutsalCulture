import sgMail from '@sendgrid/mail';
import { getInvitationEmailTemplate, getInvitationEmailText, type InvitationEmailData } from './email-templates';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@playhq.app';

export interface SendInvitationEmailOptions {
  to: string;
  tenantName: string;
  recipientName: string;
  senderName: string;
  role: 'parent' | 'player' | 'admin' | 'assistant';
  inviteUrl: string;
  expiresAt: Date;
}

/**
 * Send invitation email using SendGrid
 */
export async function sendInvitationEmail(options: SendInvitationEmailOptions): Promise<void> {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('SENDGRID_API_KEY not configured - invitation email not sent');
    return;
  }

  const emailData: InvitationEmailData = {
    ...options,
    expiresAt: options.expiresAt.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric', 
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  };

  const msg = {
    to: options.to,
    from: {
      email: FROM_EMAIL,
      name: 'PlayHQ Team'
    },
    subject: `🎯 You're invited to join ${options.tenantName} on PlayHQ`,
    text: getInvitationEmailText(emailData),
    html: getInvitationEmailTemplate(emailData),
    // Track email engagement
    trackingSettings: {
      clickTracking: {
        enable: false,  // Disable click tracking to prevent URL wrapping
      },
      openTracking: {
        enable: true,
      },
    },
    // Categories for SendGrid analytics
    categories: ['invitation', options.role, 'tenant-invite'],
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Invitation email sent to ${options.to} for ${options.tenantName}`);
  } catch (error) {
    console.error('❌ Failed to send invitation email:', error);
    throw new Error('Failed to send invitation email');
  }
}

/**
 * Send welcome email after invitation acceptance
 */
export async function sendWelcomeEmail(options: {
  to: string;
  firstName: string;
  tenantName: string;
  role: 'parent' | 'player' | 'admin' | 'assistant';
}): Promise<void> {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('SENDGRID_API_KEY not configured - welcome email not sent');
    return;
  }

  const msg = {
    to: options.to,
    from: {
      email: FROM_EMAIL,
      name: 'PlayHQ Team'
    },
    subject: `🎉 Welcome to ${options.tenantName} on PlayHQ!`,
    text: `
Hi ${options.firstName},

Welcome to ${options.tenantName} on PlayHQ! Your account has been successfully created.

${options.role === 'parent' ? 
  'You can now book training sessions for your players, manage payments, and stay connected with your sports community.' :
  options.role === 'player' ? 
  'You can now book training sessions, track your progress, and connect with your teammates and coaches.' :
  options.role === 'admin' ?
  'You can now manage sessions, players, payments, and all administrative functions for your organization.' :
  'You can now assist with managing sessions, players, and help support your organization.'
}

Get started by logging into your account at: ${process.env.NODE_ENV === 'production' ? 'https://playhq.app' : (process.env.REPLIT_APP_URL || 'https://playhq.app')}

If you have any questions, our support team is here to help.

Welcome to the futsal family!
The PlayHQ Team
`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to ${options.tenantName}!</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #22c55e; color: white; padding: 30px 20px; text-align: center; border-radius: 8px; }
    .content { background: #f9f9f9; padding: 30px 20px; margin-top: 20px; border-radius: 8px; }
    .button { display: inline-block; background: #22c55e; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome to ${options.tenantName}!</h1>
      <p>Your PlayHQ account is ready to go</p>
    </div>
    
    <div class="content">
      <p>Hi ${options.firstName},</p>
      
      <p>Welcome to <strong>${options.tenantName}</strong> on PlayHQ! Your account has been successfully created and you're now part of our futsal community.</p>
      
      <p>${options.role === 'parent' ? 
        'As a parent, you can now book training sessions for your players, manage payments, and stay connected with your sports community.' :
        options.role === 'player' ? 
        'As a player, you can now book training sessions, track your progress, and connect with your teammates and coaches.' :
        options.role === 'admin' ?
        'As an administrator, you can now manage sessions, players, payments, and all administrative functions for your organization.' :
        'As an assistant, you can now help manage sessions, players, and support your organization.'
      }</p>
      
      <div style="text-align: center;">
        <a href="${process.env.NODE_ENV === 'production' ? 'https://playhq.app' : (process.env.REPLIT_APP_URL || 'https://playhq.app')}" class="button">Go to PlayHQ</a>
      </div>
      
      <p>If you have any questions, our support team is here to help.</p>
      
      <p>Welcome to the futsal family!</p>
      <p>The PlayHQ Team</p>
    </div>
    
    <div class="footer">
      <p>© 2025 PlayHQ. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
    categories: ['welcome', options.role, 'onboarding'],
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Welcome email sent to ${options.to}`);
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    // Don't throw error for welcome email - it's not critical
  }
}