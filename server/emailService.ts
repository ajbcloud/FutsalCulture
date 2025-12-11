import { sendEmail as sendEmailViaProvider, sendBulkEmail as sendBulkViaProvider, isEmailConfigured, EmailMessage } from './utils/email-provider';

const DEFAULT_FROM_EMAIL = 'playhq@playhq.app';

export async function initEmail() {
  const configured = await isEmailConfigured();
  if (configured) {
    console.log('✅ Email service initialized (Resend)');
  } else {
    console.warn('⚠️ Email service not configured - emails will not be sent');
  }
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const result = await sendEmailViaProvider({
    to: params.to,
    from: params.from || DEFAULT_FROM_EMAIL,
    subject: params.subject,
    text: params.text,
    html: params.html,
  });
  
  if (result.success) {
    console.log(`📧 Email sent successfully to ${params.to}`);
  }
  
  return result;
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
  const messages: EmailMessage[] = recipients.map(r => ({
    to: r.email,
    from: DEFAULT_FROM_EMAIL,
    subject: r.subject,
    html: r.html,
    text: r.text,
    metadata: {
      tenantId: r.tenantId,
      campaignId: r.campaignId
    }
  }));

  const result = await sendBulkViaProvider(messages);
  
  console.log(`📧 Bulk email completed: ${result.sent} sent, ${result.failed} failed`);
  
  return result;
}

export async function sendCampaignEmail(
  campaignId: string,
  recipients: Array<{ email: string; name?: string; tenantId?: string }>,
  subject: string,
  template: string,
  variables: Record<string, string> = {}
): Promise<{ sent: number; failed: number }> {
  const { replaceTemplateVariables } = await import('./utils/template-variables');
  
  const emailRecipients = recipients.map(recipient => {
    const templateVars = {
      name: recipient.name || 'there',
      firstName: recipient.name?.split(' ')[0] || 'there',
      recipientName: recipient.name || 'there',
      ...variables
    };
    
    const personalizedSubject = replaceTemplateVariables(subject, templateVars);
    const personalizedTemplate = replaceTemplateVariables(template, templateVars);

    return {
      email: recipient.email,
      subject: personalizedSubject,
      html: personalizedTemplate,
      text: personalizedTemplate.replace(/<[^>]*>/g, ''),
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
    from: supportEmail,
    subject,
    text,
    html,
  });
  
  return result.success;
}
