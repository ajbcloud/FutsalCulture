import { MailService } from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

let mailService: MailService | null = null;

export function initEmail() {
  const key = process.env.SENDGRID_API_KEY;
  if (!key) {
    console.warn('SENDGRID_API_KEY not configured - emails will not be sent');
    return;
  }
  mailService = new MailService();
  mailService.setApiKey(key);
  console.log('✅ SendGrid initialized');
}

// Initialize on import if API key is available
if (SENDGRID_API_KEY) {
  initEmail();
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!mailService) {
    console.warn('SendGrid not configured - skipping email notification');
    return { success: false, error: 'SendGrid not configured' };
  }

  try {
    const result = await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    
    console.log(`📧 Email sent successfully to ${params.to}`);
    
    return { 
      success: true, 
      messageId: result[0]?.headers?.['x-message-id'] || 'unknown'
    };
  } catch (error: any) {
    console.error('❌ SendGrid email error:', error);
    return { 
      success: false, 
      error: error.message || 'Email sending failed'
    };
  }
}

export async function sendBulkEmail(recipients: Array<{ 
  email: string; 
  subject: string; 
  html?: string; 
  text?: string;
  tenantId?: string;
  campaignId?: string;
}>): Promise<{
  sent: number;
  failed: number;
  results: Array<{ email: string; success: boolean; messageId?: string; error?: string }>;
}> {
  if (!mailService) {
    console.warn('SendGrid not configured - skipping bulk email');
    return { 
      sent: 0, 
      failed: recipients.length, 
      results: recipients.map(r => ({ email: r.email, success: false, error: 'SendGrid not configured' }))
    };
  }

  const results = [];
  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const result = await sendEmail({
      to: recipient.email,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@playhq.app',
      subject: recipient.subject,
      text: recipient.text || '',
      html: recipient.html || ''
    });

    results.push({
      email: recipient.email,
      ...result
    });

    if (result.success) {
      sent++;
    } else {
      failed++;
    }

    // Add small delay between emails to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`📧 Bulk email completed: ${sent} sent, ${failed} failed`);
  
  return { sent, failed, results };
}

export async function sendCampaignEmail(
  campaignId: string,
  recipients: Array<{ email: string; name?: string; tenantId?: string }>,
  subject: string,
  template: string,
  variables: Record<string, string> = {}
): Promise<{ sent: number; failed: number }> {
  const emailRecipients = recipients.map(recipient => {
    // Replace template variables with actual values
    let personalizedSubject = subject;
    let personalizedTemplate = template;
    
    // Replace common variables
    personalizedSubject = personalizedSubject.replace(/\{\{name\}\}/g, recipient.name || 'there');
    personalizedSubject = personalizedSubject.replace(/\{\{firstName\}\}/g, recipient.name?.split(' ')[0] || 'there');
    
    personalizedTemplate = personalizedTemplate.replace(/\{\{name\}\}/g, recipient.name || 'there');
    personalizedTemplate = personalizedTemplate.replace(/\{\{firstName\}\}/g, recipient.name?.split(' ')[0] || 'there');
    
    // Replace any custom variables
    Object.entries(variables).forEach(([key, value]) => {
      personalizedSubject = personalizedSubject.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
      personalizedTemplate = personalizedTemplate.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    });

    return {
      email: recipient.email,
      subject: personalizedSubject,
      html: personalizedTemplate,
      text: personalizedTemplate.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      tenantId: recipient.tenantId,
      campaignId
    };
  });

  const result = await sendBulkEmail(emailRecipients);
  return { sent: result.sent, failed: result.failed };
}

export async function sendHelpRequestNotification(
  supportEmail: string,
  helpRequest: { name: string; email: string; phone?: string | undefined; note: string }
): Promise<boolean> {
  const subject = `New Help Request from ${helpRequest.name}`;
  
  const text = `
New help request received:

Name: ${helpRequest.name}
Email: ${helpRequest.email}
Phone: ${helpRequest.phone || 'Not provided'}

Message:
${helpRequest.note}

Please respond to this request as soon as possible.
  `;

  const html = `
    <h2>New Help Request</h2>
    <p><strong>From:</strong> ${helpRequest.name}</p>
    <p><strong>Email:</strong> ${helpRequest.email}</p>
    <p><strong>Phone:</strong> ${helpRequest.phone || 'Not provided'}</p>
    
    <h3>Message:</h3>
    <p>${helpRequest.note.replace(/\n/g, '<br>')}</p>
    
    <p><em>Please respond to this request as soon as possible.</em></p>
  `;

  const result = await sendEmail({
    to: supportEmail,
    from: supportEmail, // Use same email for from/to for now
    subject,
    text,
    html,
  });
  
  return result.success;
}