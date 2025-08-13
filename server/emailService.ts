import { MailService } from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

let mailService: MailService | null = null;

if (SENDGRID_API_KEY) {
  mailService = new MailService();
  mailService.setApiKey(SENDGRID_API_KEY);
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!mailService) {
    console.warn('SendGrid not configured - skipping email notification');
    return false;
  }

  try {
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
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

  return await sendEmail({
    to: supportEmail,
    from: supportEmail, // Use same email for from/to for now
    subject,
    text,
    html,
  });
}