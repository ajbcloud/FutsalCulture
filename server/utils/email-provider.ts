import { getResendClient, isResendConfigured } from './resend-client';

export interface EmailMessage {
  to: string | string[];
  from?: string;
  fromName?: string;
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
  categories?: string[];
  attachments?: Array<{
    content: string;
    filename: string;
    type?: string;
  }>;
  metadata?: Record<string, any>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface BulkEmailResult {
  sent: number;
  failed: number;
  results: Array<{ email: string; success: boolean; messageId?: string; error?: string }>;
}

export interface IEmailProvider {
  sendEmail(message: EmailMessage): Promise<EmailResult>;
  sendBulkEmail(messages: EmailMessage[]): Promise<BulkEmailResult>;
  isConfigured(): Promise<boolean>;
}

class ResendEmailProvider implements IEmailProvider {
  async isConfigured(): Promise<boolean> {
    return isResendConfigured();
  }

  async sendEmail(message: EmailMessage): Promise<EmailResult> {
    try {
      const { client, fromEmail } = await getResendClient();
      
      const from = message.fromName 
        ? `${message.fromName} <${message.from || fromEmail}>`
        : message.from || fromEmail;

      const emailOptions: any = {
        from,
        to: Array.isArray(message.to) ? message.to : [message.to],
        subject: message.subject,
      };

      if (message.html) {
        emailOptions.html = message.html;
      }
      if (message.text) {
        emailOptions.text = message.text;
      }
      if (message.replyTo) {
        emailOptions.replyTo = message.replyTo;
      }
      if (message.categories?.length) {
        emailOptions.tags = message.categories.map(cat => ({ name: 'category', value: cat }));
      }
      if (message.attachments?.length) {
        emailOptions.attachments = message.attachments.map(att => ({
          filename: att.filename,
          content: Buffer.from(att.content, 'base64'),
          content_type: att.type
        }));
      }

      const result = await client.emails.send(emailOptions);

      if (result.error) {
        return {
          success: false,
          error: result.error.message
        };
      }

      return {
        success: true,
        messageId: result.data?.id
      };
    } catch (error: any) {
      console.error('Resend email error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email'
      };
    }
  }

  async sendBulkEmail(messages: EmailMessage[]): Promise<BulkEmailResult> {
    const results: Array<{ email: string; success: boolean; messageId?: string; error?: string }> = [];
    let sent = 0;
    let failed = 0;

    for (const message of messages) {
      const recipients = Array.isArray(message.to) ? message.to : [message.to];
      const result = await this.sendEmail(message);
      
      for (const email of recipients) {
        if (result.success) {
          sent++;
          results.push({ email, success: true, messageId: result.messageId });
        } else {
          failed++;
          results.push({ email, success: false, error: result.error });
        }
      }
    }

    return { sent, failed, results };
  }
}

class NoOpEmailProvider implements IEmailProvider {
  async isConfigured(): Promise<boolean> {
    return false;
  }

  async sendEmail(message: EmailMessage): Promise<EmailResult> {
    console.warn('No email provider configured - email not sent to:', message.to);
    return { success: false, error: 'No email provider configured' };
  }

  async sendBulkEmail(messages: EmailMessage[]): Promise<BulkEmailResult> {
    const allRecipients = messages.flatMap(m => Array.isArray(m.to) ? m.to : [m.to]);
    console.warn('No email provider configured - bulk email not sent to:', allRecipients.length, 'recipients');
    return {
      sent: 0,
      failed: allRecipients.length,
      results: allRecipients.map(email => ({ email, success: false, error: 'No email provider configured' }))
    };
  }
}

let emailProvider: IEmailProvider | null = null;

export async function getEmailProvider(): Promise<IEmailProvider> {
  if (emailProvider) {
    return emailProvider;
  }

  const resendProvider = new ResendEmailProvider();
  if (await resendProvider.isConfigured()) {
    emailProvider = resendProvider;
    console.log('✅ Email provider: Resend');
    return emailProvider;
  }

  console.warn('⚠️ No email provider configured - emails will not be sent');
  emailProvider = new NoOpEmailProvider();
  return emailProvider;
}

export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  const provider = await getEmailProvider();
  return provider.sendEmail(message);
}

export async function sendBulkEmail(messages: EmailMessage[]): Promise<BulkEmailResult> {
  const provider = await getEmailProvider();
  return provider.sendBulkEmail(messages);
}

export async function isEmailConfigured(): Promise<boolean> {
  const provider = await getEmailProvider();
  return provider.isConfigured();
}
