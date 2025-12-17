export interface InvitationEmailData {
  to: string;
  tenantName: string;
  recipientName: string;
  senderName: string;
  role: 'parent' | 'player' | 'admin' | 'assistant';
  inviteUrl: string;
  expiresAt: string; // Formatted date string
}

/**
 * Generate HTML template for invitation email
 */
export function getInvitationEmailTemplate(data: InvitationEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>You're invited to join ${data.tenantName}</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      background-color: #f5f5f5; 
      margin: 0; 
      padding: 20px; 
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: white; 
      border-radius: 8px; 
      overflow: hidden; 
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
    }
    .header { 
      background: linear-gradient(135deg, #22c55e, #16a34a); 
      color: white; 
      padding: 40px 20px; 
      text-align: center; 
    }
    .header h1 { 
      margin: 0; 
      font-size: 28px; 
      font-weight: 600; 
    }
    .header p { 
      margin: 10px 0 0 0; 
      opacity: 0.9; 
      font-size: 16px; 
    }
    .content { 
      padding: 40px 30px; 
    }
    .greeting { 
      font-size: 18px; 
      color: #1f2937; 
      margin-bottom: 20px; 
    }
    .invitation-details { 
      background: #f8fafc; 
      border-left: 4px solid #22c55e; 
      padding: 20px; 
      margin: 25px 0; 
    }
    .role-badge { 
      display: inline-block; 
      background: #22c55e; 
      color: white; 
      padding: 6px 12px; 
      border-radius: 20px; 
      font-size: 12px; 
      text-transform: uppercase; 
      font-weight: 600; 
      margin-bottom: 10px; 
    }
    .button { 
      display: inline-block; 
      background: linear-gradient(135deg, #22c55e, #16a34a); 
      color: white; 
      padding: 16px 32px; 
      text-decoration: none; 
      border-radius: 8px; 
      margin: 30px 0; 
      font-weight: 600; 
      font-size: 16px; 
      transition: transform 0.2s; 
    }
    .button:hover { 
      transform: translateY(-1px); 
    }
    .expiry-notice { 
      background: #fef3c7; 
      border: 1px solid #f59e0b; 
      color: #92400e; 
      padding: 15px; 
      border-radius: 6px; 
      margin: 20px 0; 
      font-size: 14px; 
    }
    .footer { 
      background: #f8fafc; 
      padding: 20px 30px; 
      text-align: center; 
      border-top: 1px solid #e5e7eb; 
    }
    .footer p { 
      margin: 5px 0; 
      color: #6b7280; 
      font-size: 14px; 
    }
    .small-text { 
      font-size: 12px; 
      color: #9ca3af; 
      line-height: 1.4; 
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 You're Invited!</h1>
      <p>Join ${data.tenantName} on SkoreHQ</p>
    </div>
    
    <div class="content">
      <div class="greeting">Hi ${data.recipientName}!</div>
      
      <p><strong>${data.senderName}</strong> has invited you to join <strong>${data.tenantName}</strong> on SkoreHQ.</p>
      
      <div class="invitation-details">
        <div class="role-badge">${data.role}</div>
        <p><strong>Organization:</strong> ${data.tenantName}</p>
        <p><strong>Your Role:</strong> ${getRoleDescription(data.role)}</p>
        <p><strong>Invited by:</strong> ${data.senderName}</p>
      </div>
      
      <p>${getRoleWelcomeMessage(data.role, data.tenantName)}</p>
      
      <div style="text-align: center;">
        <a href="${data.inviteUrl}" class="button">Accept Invitation</a>
      </div>
      
      <div class="expiry-notice">
        ⏰ <strong>This invitation expires on ${data.expiresAt}</strong><br>
        Make sure to accept it before then to join the team!
      </div>
      
      <p class="small-text">
        If you're unable to click the button above, copy and paste this link into your browser:<br>
        <a href="${data.inviteUrl}">${data.inviteUrl}</a>
      </p>
    </div>
    
    <div class="footer">
      <p><strong>SkoreHQ</strong> - Streamlining Sports Management</p>
      <p>© 2025 SkoreHQ. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate plain text version for invitation email
 */
export function getInvitationEmailText(data: InvitationEmailData): string {
  return `
🎯 You're invited to join ${data.tenantName} on SkoreHQ!

Hi ${data.recipientName}!

${data.senderName} has invited you to join ${data.tenantName} on SkoreHQ as a ${data.role}.

${getRoleWelcomeMessage(data.role, data.tenantName)}

Accept your invitation by clicking here: ${data.inviteUrl}

⏰ IMPORTANT: This invitation expires on ${data.expiresAt}

If you have any questions, feel free to reach out to your team administrator or our support team.

Welcome to SkoreHQ!
The SkoreHQ Team

---
© 2025 SkoreHQ. All rights reserved.
`;
}

/**
 * Get role description for display
 */
function getRoleDescription(role: string): string {
  const descriptions = {
    parent: 'Parent/Guardian - Manage your children\'s sports activities',
    player: 'Player - Book sessions and track your progress', 
    admin: 'Administrator - Full management access',
    assistant: 'Assistant - Help manage organization activities'
  };
  return descriptions[role as keyof typeof descriptions] || 'Team Member';
}

/**
 * Get role-specific welcome message
 */
function getRoleWelcomeMessage(role: string, tenantName: string): string {
  const messages = {
    parent: `As a parent/guardian with ${tenantName}, you'll be able to book training sessions for your children, manage payments, view schedules, and stay connected with coaches and other families in your sports community.`,
    player: `As a player with ${tenantName}, you'll be able to book your own training sessions, view your schedule, track your progress, and connect with your teammates and coaches.`,
    admin: `As an administrator for ${tenantName}, you'll have full access to manage sessions, players, payments, communications, and all other organizational functions.`,
    assistant: `As an assistant for ${tenantName}, you'll be able to help manage sessions, support players and families, and assist with day-to-day operations.`
  };
  return messages[role as keyof typeof messages] || `Welcome to ${tenantName}! You'll be able to access your sports management platform and connect with your team.`;
}