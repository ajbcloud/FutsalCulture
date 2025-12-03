import { sendEmail } from '../emailService';
import { sendSMS } from '../smsService';

const DEFAULT_FROM_EMAIL = 'billing@playhq.app';

export interface EmailNotificationParams {
  to: string;
  subject: string;
  templateKey: string;
  context: Record<string, any>;
}

export interface SmsNotificationParams {
  to: string;
  templateKey: string;
  context: Record<string, any>;
}

const EMAIL_TEMPLATES: Record<string, (ctx: Record<string, any>) => { text: string; html: string }> = {
  payment_failed: (ctx) => ({
    text: `
Hi ${ctx.contactName},

We were unable to process your payment for ${ctx.tenantName}.

This is attempt #${ctx.attemptNumber}. You have ${ctx.daysRemaining} days to update your payment method before your account access is restricted.

Please update your payment method here: ${ctx.updatePaymentUrl}

If you have any questions, please contact our support team.

Best regards,
The PlayHQ Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Failed</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>⚠️ Payment Failed</h1>
  </div>
  <div class="content">
    <p>Hi ${ctx.contactName},</p>
    <p>We were unable to process your payment for <strong>${ctx.tenantName}</strong>.</p>
    <div class="warning">
      <strong>Action Required:</strong> This is attempt #${ctx.attemptNumber}. You have <strong>${ctx.daysRemaining} days</strong> to update your payment method before your account access is restricted.
    </div>
    <p style="text-align: center;">
      <a href="${ctx.updatePaymentUrl}" class="button">Update Payment Method</a>
    </p>
    <p>If you have any questions, please contact our support team.</p>
  </div>
  <div class="footer">
    <p>Best regards,<br>The PlayHQ Team</p>
  </div>
</body>
</html>
    `.trim()
  }),

  payment_retry_failed: (ctx) => ({
    text: `
URGENT: Hi ${ctx.contactName},

Your payment retry for ${ctx.tenantName} has failed. This is attempt #${ctx.attemptNumber}.

⚠️ You only have ${ctx.daysRemaining} days remaining to update your payment method before your account is locked.

Update your payment method now: ${ctx.updatePaymentUrl}

Best regards,
The PlayHQ Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Retry Failed</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .urgent { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚨 Urgent: Payment Retry Failed</h1>
  </div>
  <div class="content">
    <p>Hi ${ctx.contactName},</p>
    <p>Your payment retry for <strong>${ctx.tenantName}</strong> has failed. This is attempt #${ctx.attemptNumber}.</p>
    <div class="urgent">
      <strong>⚠️ URGENT:</strong> You only have <strong>${ctx.daysRemaining} days remaining</strong> to update your payment method before your account is locked.
    </div>
    <p style="text-align: center;">
      <a href="${ctx.updatePaymentUrl}" class="button">Update Payment Method Now</a>
    </p>
  </div>
  <div class="footer">
    <p>Best regards,<br>The PlayHQ Team</p>
  </div>
</body>
</html>
    `.trim()
  }),

  account_locked: (ctx) => ({
    text: `
IMPORTANT: Hi ${ctx.contactName},

Your account for ${ctx.tenantName} has been locked due to payment failure.

Your admin access is now restricted. Parents and players can still access their bookings, but you cannot manage sessions, settings, or other admin functions until payment is resolved.

To restore access immediately, please update your payment method: ${ctx.updatePaymentUrl}

If you need assistance, please contact our support team.

Best regards,
The PlayHQ Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Account Locked</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #991b1b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #22c55e; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-size: 16px; }
    .locked-info { background: #fef2f2; border: 2px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔒 Account Locked</h1>
  </div>
  <div class="content">
    <p>Hi ${ctx.contactName},</p>
    <div class="locked-info">
      <p><strong>Your account for ${ctx.tenantName} has been locked due to payment failure.</strong></p>
      <p>Your admin access is now restricted. Parents and players can still access their bookings, but you cannot manage sessions, settings, or other admin functions until payment is resolved.</p>
    </div>
    <p style="text-align: center;">
      <a href="${ctx.updatePaymentUrl}" class="button">Restore Access Now</a>
    </p>
    <p>If you need assistance, please contact our support team.</p>
  </div>
  <div class="footer">
    <p>Best regards,<br>The PlayHQ Team</p>
  </div>
</body>
</html>
    `.trim()
  }),

  payment_recovered: (ctx) => ({
    text: `
Great news, ${ctx.contactName}!

Your payment for ${ctx.tenantName} has been processed successfully and your full admin access has been restored.

You can now access your dashboard: ${ctx.dashboardUrl}

Thank you for being a PlayHQ customer!

Best regards,
The PlayHQ Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Successful - Access Restored</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #22c55e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .success { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>✅ Payment Successful</h1>
  </div>
  <div class="content">
    <p>Great news, ${ctx.contactName}!</p>
    <div class="success">
      <strong>Your payment for ${ctx.tenantName} has been processed successfully and your full admin access has been restored.</strong>
    </div>
    <p style="text-align: center;">
      <a href="${ctx.dashboardUrl}" class="button">Go to Dashboard</a>
    </p>
    <p>Thank you for being a PlayHQ customer!</p>
  </div>
  <div class="footer">
    <p>Best regards,<br>The PlayHQ Team</p>
  </div>
</body>
</html>
    `.trim()
  })
};

const SMS_TEMPLATES: Record<string, (ctx: Record<string, any>) => string> = {
  payment_failed: (ctx) => 
    `PlayHQ: Payment failed for ${ctx.tenantName}. Update payment within ${ctx.daysRemaining} days to avoid account lock. ${ctx.updatePaymentUrl}`,
  
  payment_retry_failed: (ctx) => 
    `URGENT PlayHQ: Payment retry failed. Only ${ctx.daysRemaining} days left! Update now: ${ctx.updatePaymentUrl}`,
  
  account_locked: (ctx) => 
    `PlayHQ: Your admin access for ${ctx.tenantName} is locked. Update payment to restore: ${ctx.updatePaymentUrl}`,
  
  payment_recovered: (ctx) => 
    `PlayHQ: Payment successful! Your ${ctx.tenantName} admin access has been restored. Thank you!`
};

export async function sendEmailNotification(params: EmailNotificationParams): Promise<{ success: boolean; error?: string }> {
  const template = EMAIL_TEMPLATES[params.templateKey];
  
  if (!template) {
    console.error(`Unknown email template: ${params.templateKey}`);
    return { success: false, error: `Unknown template: ${params.templateKey}` };
  }

  const { text, html } = template(params.context);

  try {
    const result = await sendEmail({
      to: params.to,
      from: DEFAULT_FROM_EMAIL,
      subject: params.subject,
      text,
      html,
    });

    return result;
  } catch (error: any) {
    console.error(`Failed to send email notification:`, error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
}

export async function sendSmsNotification(params: SmsNotificationParams): Promise<{ success: boolean; error?: string }> {
  const template = SMS_TEMPLATES[params.templateKey];
  
  if (!template) {
    console.error(`Unknown SMS template: ${params.templateKey}`);
    return { success: false, error: `Unknown template: ${params.templateKey}` };
  }

  const message = template(params.context);

  try {
    const result = await sendSMS({
      to: params.to,
      body: message,
    });

    return { success: result.success, error: result.error };
  } catch (error: any) {
    console.error(`Failed to send SMS notification:`, error);
    return { success: false, error: error.message || 'Failed to send SMS' };
  }
}
