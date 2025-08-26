/**
 * Email templates for the tenant invitation system
 */

export interface InvitationEmailData {
  tenantName: string;
  recipientName: string;
  senderName: string;
  role: 'parent' | 'player' | 'admin' | 'assistant';
  inviteUrl: string;
  expiresAt: string;
}

/**
 * HTML template for invitation emails
 */
export function getInvitationEmailTemplate(data: InvitationEmailData): string {
  const { tenantName, recipientName, senderName, role, inviteUrl, expiresAt } = data;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Join ${tenantName} on PlayHQ</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1a73e8; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #1a73e8; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .button:hover { background: #1557b0; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
    .highlight { background: #e3f2fd; padding: 15px; border-left: 4px solid #1a73e8; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 Join ${tenantName}</h1>
      <p>You're invited to join our futsal community!</p>
    </div>
    
    <div class="content">
      <p>Hi ${recipientName},</p>
      
      <p>${senderName} has invited you to join <strong>${tenantName}</strong> as a ${role} on PlayHQ.</p>
      
      <div class="highlight">
        <p><strong>What's PlayHQ?</strong></p>
        <p>PlayHQ is the all-in-one platform for futsal training session bookings, player management, and community engagement. Join thousands of players and parents making futsal training easier!</p>
      </div>
      
      <p>As a ${role}, you'll be able to:</p>
      <ul>
        ${role === 'parent' ? `
        <li>🗓️ Book training sessions for your players</li>
        <li>📊 View training history and progress</li>
        <li>💳 Manage payments and billing</li>
        <li>📱 Receive notifications and updates</li>
        ` : role === 'player' ? `
        <li>🏃 Book your own training sessions</li>
        <li>📈 Track your development progress</li>
        <li>🎯 Set and achieve training goals</li>
        <li>🤝 Connect with teammates and coaches</li>
        ` : role === 'admin' ? `
        <li>⚙️ Manage sessions and schedules</li>
        <li>👥 Oversee player and parent accounts</li>
        <li>💰 Handle payments and financial reports</li>
        <li>📊 Access comprehensive analytics</li>
        ` : `
        <li>📅 Help manage sessions and bookings</li>
        <li>👤 Support player and parent inquiries</li>
        <li>📝 Assist with administrative tasks</li>
        <li>🔔 Monitor notifications and communications</li>
        `}
      </ul>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${inviteUrl}" class="button">Accept Invitation & Join ${tenantName}</a>
      </div>
      
      <p><strong>Important:</strong> This invitation expires on ${expiresAt}. Don't wait too long!</p>
      
      <p>If you have any questions, feel free to reach out to ${senderName} or contact our support team.</p>
      
      <p>Welcome to the futsal community!</p>
      <p>The PlayHQ Team</p>
    </div>
    
    <div class="footer">
      <p>© 2025 PlayHQ. All rights reserved.</p>
      <p>If you can't click the button above, copy and paste this link: ${inviteUrl}</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Plain text version for email clients that don't support HTML
 */
export function getInvitationEmailText(data: InvitationEmailData): string {
  const { tenantName, recipientName, senderName, role, inviteUrl, expiresAt } = data;
  
  return `
Hi ${recipientName},

${senderName} has invited you to join ${tenantName} as a ${role} on PlayHQ.

What's PlayHQ?
PlayHQ is the all-in-one platform for futsal training session bookings, player management, and community engagement. Join thousands of players and parents making futsal training easier!

As a ${role}, you'll be able to:
${role === 'parent' ? `
• Book training sessions for your players
• View training history and progress  
• Manage payments and billing
• Receive notifications and updates
` : role === 'player' ? `
• Book your own training sessions
• Track your development progress
• Set and achieve training goals
• Connect with teammates and coaches
` : role === 'admin' ? `
• Manage sessions and schedules
• Oversee player and parent accounts
• Handle payments and financial reports
• Access comprehensive analytics
` : `
• Help manage sessions and bookings
• Support player and parent inquiries
• Assist with administrative tasks
• Monitor notifications and communications
`}

To accept this invitation and join ${tenantName}, visit:
${inviteUrl}

IMPORTANT: This invitation expires on ${expiresAt}. Don't wait too long!

If you have any questions, feel free to reach out to ${senderName} or contact our support team.

Welcome to the futsal community!
The PlayHQ Team

---
© 2025 PlayHQ. All rights reserved.
If the link above doesn't work, copy and paste it into your browser.
`;
}