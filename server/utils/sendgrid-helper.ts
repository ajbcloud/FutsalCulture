import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
export function initializeSendGrid(): boolean {
  const apiKey = process.env.SENDGRID_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️ SENDGRID_API_KEY not configured - email sending disabled');
    return false;
  }
  
  try {
    sgMail.setApiKey(apiKey);
    console.log('✅ SendGrid initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize SendGrid:', error);
    return false;
  }
}

// Send email using SendGrid
export async function sendEmailViaSendGrid(options: {
  to: string | string[];
  from: string;
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
  categories?: string[];
  attachments?: Array<{
    content: string;
    filename: string;
    type?: string;
    disposition?: string;
  }>;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const msg: any = {
      to: options.to,
      from: options.from || process.env.SENDGRID_FROM_EMAIL || 'playhq@playhq.app',
      subject: options.subject,
    };
    
    // Add content based on whether using template or not
    if (options.templateId) {
      msg.templateId = options.templateId;
      if (options.dynamicTemplateData) {
        msg.dynamicTemplateData = options.dynamicTemplateData;
      }
    } else {
      if (options.text) msg.text = options.text;
      if (options.html) msg.html = options.html;
    }
    
    // Add optional fields
    if (options.categories?.length) {
      msg.categories = options.categories;
    }
    
    if (options.attachments?.length) {
      msg.attachments = options.attachments;
    }
    
    // Enable tracking
    msg.trackingSettings = {
      clickTracking: { enable: true },
      openTracking: { enable: true },
    };
    
    const [response] = await sgMail.send(msg);
    
    return {
      success: true,
      messageId: response.headers?.['x-message-id'] || 'sent',
    };
  } catch (error: any) {
    console.error('SendGrid error:', error?.response?.body || error);
    return {
      success: false,
      error: error?.response?.body?.errors?.[0]?.message || error.message || 'Failed to send email',
    };
  }
}

// Send multiple emails in batch (more efficient for bulk sending)
export async function sendBatchEmails(messages: Array<{
  to: string | string[];
  from?: string;
  subject: string;
  text?: string;
  html?: string;
  categories?: string[];
}>): Promise<{
  sent: number;
  failed: number;
  results: Array<{ to: string | string[]; success: boolean; error?: string }>;
}> {
  const results = [];
  let sent = 0;
  let failed = 0;
  
  // SendGrid allows up to 1000 recipients per request
  const batchSize = 100; // Use smaller batches to avoid rate limits
  
  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);
    
    try {
      // Convert to SendGrid format
      const sgMessages = batch.map(msg => ({
        ...msg,
        from: msg.from || process.env.SENDGRID_FROM_EMAIL || 'noreply@playhq.app',
        trackingSettings: {
          clickTracking: { enable: true },
          openTracking: { enable: true },
        },
      }));
      
      await sgMail.send(sgMessages);
      
      batch.forEach(msg => {
        results.push({ to: msg.to, success: true });
        sent++;
      });
    } catch (error: any) {
      console.error('Batch send error:', error);
      batch.forEach(msg => {
        results.push({ 
          to: msg.to, 
          success: false, 
          error: error.message || 'Failed to send' 
        });
        failed++;
      });
    }
    
    // Add delay between batches to respect rate limits
    if (i + batchSize < messages.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return { sent, failed, results };
}

// Verify SendGrid configuration
export async function verifySendGridConfig(): Promise<{
  configured: boolean;
  fromEmail: string;
  error?: string;
}> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@playhq.app';
  
  if (!apiKey) {
    return {
      configured: false,
      fromEmail,
      error: 'SENDGRID_API_KEY environment variable not set',
    };
  }
  
  try {
    // Test the API key by setting it
    sgMail.setApiKey(apiKey);
    
    return {
      configured: true,
      fromEmail,
    };
  } catch (error: any) {
    return {
      configured: false,
      fromEmail,
      error: error.message || 'Failed to configure SendGrid',
    };
  }
}