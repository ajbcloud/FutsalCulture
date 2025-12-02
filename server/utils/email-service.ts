import { sendEmail } from './email-provider';

interface InvitationEmailData {
  to: string;
  tenantName: string;
  recipientName: string;
  senderName: string;
  role: string;
  inviteUrl: string;
  expiresAt: string;
}

function getInvitationEmailTemplate(data: InvitationEmailData): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="background-color: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">🎯 You're Invited!</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">Join ${data.tenantName} on PlayHQ</p>
      </div>
      <div style="padding: 30px;">
        <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Hi ${data.recipientName},</p>
        <p style="font-size: 16px; color: #333; line-height: 1.5; margin-bottom: 20px;">
          You've been invited to join <strong>${data.tenantName}</strong> as a <strong>${data.role}</strong> on PlayHQ!
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.inviteUrl}" style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Accept Invitation</a>
        </div>
        <p style="font-size: 14px; color: #666; margin-top: 30px;">
          This invitation expires on ${data.expiresAt}. If you have any questions, please contact your administrator.
        </p>
      </div>
    </div>
  `;
}

function getInvitationEmailText(data: InvitationEmailData): string {
  return `
You're invited to join ${data.tenantName} on PlayHQ!

Hi ${data.recipientName},

You've been invited to join ${data.tenantName} as a ${data.role} on PlayHQ.

To accept your invitation, please visit: ${data.inviteUrl}

This invitation expires on ${data.expiresAt}.

If you have any questions, please contact your administrator.

Best regards,
The PlayHQ Team
  `.trim();
}

const FROM_EMAIL = 'noreply@playhq.app';

export interface SendInvitationEmailOptions {
  to: string;
  tenantName: string;
  recipientName: string;
  senderName: string;
  role: 'parent' | 'player' | 'admin' | 'assistant';
  inviteUrl: string;
  expiresAt: Date;
}

export async function sendInvitationEmail(options: SendInvitationEmailOptions): Promise<void> {
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

  const result = await sendEmail({
    to: options.to,
    from: FROM_EMAIL,
    fromName: 'PlayHQ Team',
    subject: `🎯 You're invited to join ${options.tenantName} on PlayHQ`,
    text: getInvitationEmailText(emailData),
    html: getInvitationEmailTemplate(emailData),
    categories: ['invitation', options.role, 'tenant-invite'],
  });

  if (result.success) {
    console.log(`✅ Invitation email sent to ${options.to} for ${options.tenantName}`);
  } else {
    console.error('❌ Failed to send invitation email:', result.error);
    throw new Error('Failed to send invitation email');
  }
}

export async function sendWelcomeEmail(options: {
  to: string;
  firstName: string;
  tenantName: string;
  role: 'parent' | 'player' | 'admin' | 'assistant';
}): Promise<void> {
  const appUrl = process.env.NODE_ENV === 'production' ? 'https://playhq.app' : (process.env.REPLIT_APP_URL || 'https://playhq.app');
  
  const text = `
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

Get started by logging into your account at: ${appUrl}

If you have any questions, our support team is here to help.

Welcome to the futsal family!
The PlayHQ Team
`;

  const html = `
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
        <a href="${appUrl}" class="button">Go to PlayHQ</a>
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
</html>`;

  const result = await sendEmail({
    to: options.to,
    from: FROM_EMAIL,
    fromName: 'PlayHQ Team',
    subject: `🎉 Welcome to ${options.tenantName} on PlayHQ!`,
    text,
    html,
    categories: ['welcome', options.role, 'onboarding'],
  });

  if (result.success) {
    console.log(`✅ Welcome email sent to ${options.to}`);
  } else {
    console.error('❌ Failed to send welcome email:', result.error);
  }
}
