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
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Join ${tenantName} on PlayHQ</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset styles */
    body, table, td, p, a, li, blockquote { 
      -webkit-text-size-adjust: 100%; 
      -ms-text-size-adjust: 100%; 
    }
    table, td { 
      mso-table-lspace: 0pt; 
      mso-table-rspace: 0pt; 
    }
    img { 
      -ms-interpolation-mode: bicubic; 
      border: 0; 
      outline: none; 
      text-decoration: none; 
    }

    /* Base styles */
    body {
      margin: 0 !important;
      padding: 0 !important;
      background-color: #f8fafc;
      font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
      line-height: 1.6;
      color: #1e293b;
    }
    
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    
    .header {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.025em;
    }
    
    .header p {
      margin: 0;
      font-size: 16px;
      opacity: 0.9;
    }
    
    .content {
      padding: 40px 30px;
    }
    
    .content p {
      margin: 0 0 16px 0;
      font-size: 16px;
      line-height: 1.7;
    }
    
    .highlight-box {
      background: linear-gradient(135deg, #dbeafe 0%, #e0f2fe 100%);
      border-left: 4px solid #3b82f6;
      padding: 24px;
      margin: 24px 0;
      border-radius: 0 8px 8px 0;
    }
    
    .highlight-box p {
      margin: 0 0 12px 0;
    }
    
    .highlight-box p:last-child {
      margin: 0;
    }
    
    .feature-list {
      margin: 20px 0;
      padding: 0;
    }
    
    .feature-list li {
      margin: 12px 0;
      font-size: 15px;
      line-height: 1.6;
    }
    
    .cta-container {
      text-align: center;
      margin: 40px 0;
    }
    
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      color: white !important;
      padding: 16px 32px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      letter-spacing: 0.025em;
      box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);
      transition: all 0.2s ease;
    }
    
    .cta-button:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 12px -2px rgba(59, 130, 246, 0.4);
    }
    
    .urgency-notice {
      background: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 8px;
      padding: 16px;
      margin: 24px 0;
    }
    
    .urgency-notice p {
      margin: 0;
      font-weight: 600;
      color: #92400e;
    }
    
    .footer {
      background: #f8fafc;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    
    .footer p {
      margin: 8px 0;
      font-size: 14px;
      color: #64748b;
    }
    
    .footer a {
      color: #3b82f6;
      text-decoration: none;
    }

    /* Mobile responsive */
    @media only screen and (max-width: 600px) {
      .email-container {
        margin: 0 10px;
        border-radius: 8px;
      }
      
      .header, .content, .footer {
        padding-left: 20px !important;
        padding-right: 20px !important;
      }
      
      .header h1 {
        font-size: 24px;
      }
      
      .cta-button {
        padding: 14px 24px;
        font-size: 15px;
      }
    }
  </style>
</head>
<body>
  <div style="padding: 20px 0;">
    <div class="email-container">
      <div class="header">
        <h1>🎯 Join ${tenantName}</h1>
        <p>You're invited to join our sports community on PlayHQ</p>
      </div>
      
      <div class="content">
        <p>Hi <strong>${recipientName}</strong>,</p>
        
        <p>${senderName} has invited you to join <strong>${tenantName}</strong> as a ${role} on PlayHQ.</p>
        
        <div class="highlight-box">
          <p><strong>🚀 What's PlayHQ?</strong></p>
          <p>PlayHQ is the all-in-one platform for sports training session bookings, player management, and community engagement. Join thousands of athletes and families making sports training easier and more organized!</p>
        </div>
        
        <p><strong>As a ${role}, you'll be able to:</strong></p>
        <ul class="feature-list">
          ${role === 'parent' ? `
          <li>🗓️ <strong>Book training sessions</strong> for your players with ease</li>
          <li>📊 <strong>View training history</strong> and track progress over time</li>
          <li>💳 <strong>Manage payments</strong> and billing in one place</li>
          <li>📱 <strong>Receive real-time notifications</strong> and important updates</li>
          <li>👨‍👩‍👧‍👦 <strong>Connect with other families</strong> in your sports community</li>
          ` : role === 'player' ? `
          <li>🏃 <strong>Book your own training sessions</strong> and take control</li>
          <li>📈 <strong>Track your development progress</strong> and achievements</li>
          <li>🎯 <strong>Set and achieve training goals</strong> with clear metrics</li>
          <li>🤝 <strong>Connect with teammates</strong> and coaches directly</li>
          <li>🏆 <strong>Access exclusive player features</strong> and resources</li>
          ` : role === 'admin' ? `
          <li>⚙️ <strong>Manage sessions and schedules</strong> efficiently</li>
          <li>👥 <strong>Oversee player and parent accounts</strong> seamlessly</li>
          <li>💰 <strong>Handle payments and financial reports</strong> with precision</li>
          <li>📊 <strong>Access comprehensive analytics</strong> and insights</li>
          <li>🔧 <strong>Configure organization settings</strong> and policies</li>
          ` : `
          <li>📅 <strong>Help manage sessions and bookings</strong> effectively</li>
          <li>👤 <strong>Support player and parent inquiries</strong> professionally</li>
          <li>📝 <strong>Assist with administrative tasks</strong> and operations</li>
          <li>🔔 <strong>Monitor notifications and communications</strong> efficiently</li>
          <li>📋 <strong>Support daily operations</strong> and special events</li>
          `}
        </ul>
        
        <div class="cta-container">
          <a href="${inviteUrl}" class="cta-button">Accept Invitation & Join ${tenantName}</a>
        </div>
        
        <div class="urgency-notice">
          <p>⏰ <strong>Important:</strong> This invitation expires on ${expiresAt}. Accept soon to secure your access!</p>
        </div>
        
        <p>If you have any questions, feel free to reach out to ${senderName} or contact our support team at <a href="mailto:support@playhq.app">support@playhq.app</a>.</p>
        
        <p style="margin-top: 32px;">Welcome to the sports community!</p>
        <p style="margin: 8px 0;"><strong>The PlayHQ Team</strong></p>
      </div>
      
      <div class="footer">
        <p>© 2025 PlayHQ. All rights reserved.</p>
        <p>Can't click the button? Copy and paste this link: <br><a href="${inviteUrl}">${inviteUrl}</a></p>
        <p><a href="https://playhq.app/privacy">Privacy Policy</a> | <a href="https://playhq.app/terms">Terms of Service</a></p>
      </div>
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