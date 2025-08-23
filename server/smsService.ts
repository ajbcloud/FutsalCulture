import twilio from 'twilio';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER;

let twilioClient: twilio.Twilio | null = null;

if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

interface SMSParams {
  to: string;
  body: string;
  from?: string;
  tenantId?: string;
  campaignId?: string;
}

export async function sendSMS(params: SMSParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!twilioClient || !TWILIO_FROM_NUMBER) {
    console.warn('Twilio not configured - skipping SMS notification');
    return { success: false, error: 'Twilio not configured' };
  }

  try {
    const message = await twilioClient.messages.create({
      to: params.to,
      from: params.from || TWILIO_FROM_NUMBER,
      body: params.body,
      // Add custom parameters for tracking
      statusCallback: process.env.TWILIO_WEBHOOK_URL ? `${process.env.TWILIO_WEBHOOK_URL}/api/webhooks/twilio` : undefined
    });

    console.log(`📱 SMS sent successfully to ${params.to}, Message SID: ${message.sid}`);
    
    return { 
      success: true, 
      messageId: message.sid 
    };
  } catch (error: any) {
    console.error('❌ Twilio SMS error:', error);
    return { 
      success: false, 
      error: error.message || 'SMS sending failed' 
    };
  }
}

export async function sendBulkSMS(recipients: Array<{ phone: string; body: string; tenantId?: string; campaignId?: string }>): Promise<{
  sent: number;
  failed: number;
  results: Array<{ phone: string; success: boolean; messageId?: string; error?: string }>;
}> {
  if (!twilioClient || !TWILIO_FROM_NUMBER) {
    console.warn('Twilio not configured - skipping bulk SMS');
    return { sent: 0, failed: recipients.length, results: recipients.map(r => ({ phone: r.phone, success: false, error: 'Twilio not configured' })) };
  }

  const results = [];
  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const result = await sendSMS({
      to: recipient.phone,
      body: recipient.body,
      tenantId: recipient.tenantId,
      campaignId: recipient.campaignId
    });

    results.push({
      phone: recipient.phone,
      ...result
    });

    if (result.success) {
      sent++;
    } else {
      failed++;
    }

    // Add small delay between messages to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`📱 Bulk SMS completed: ${sent} sent, ${failed} failed`);
  
  return { sent, failed, results };
}

export async function sendCampaignSMS(
  campaignId: string,
  recipients: Array<{ phone: string; name?: string; tenantId?: string }>,
  template: string,
  variables: Record<string, string> = {}
): Promise<{ sent: number; failed: number }> {
  const smsRecipients = recipients.map(recipient => {
    // Replace template variables with actual values
    let personalizedBody = template;
    
    // Replace common variables
    personalizedBody = personalizedBody.replace(/\{\{name\}\}/g, recipient.name || 'there');
    personalizedBody = personalizedBody.replace(/\{\{firstName\}\}/g, recipient.name?.split(' ')[0] || 'there');
    
    // Replace any custom variables
    Object.entries(variables).forEach(([key, value]) => {
      personalizedBody = personalizedBody.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    });

    return {
      phone: recipient.phone,
      body: personalizedBody,
      tenantId: recipient.tenantId,
      campaignId
    };
  });

  const result = await sendBulkSMS(smsRecipients);
  return { sent: result.sent, failed: result.failed };
}