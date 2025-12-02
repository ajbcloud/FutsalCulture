import Telnyx from 'telnyx';
import { checkSmsCredits, deductSmsCredits, checkAndTriggerLowBalanceWarning } from './utils/sms-credits';

const TELNYX_API_KEY = process.env.TELNYX_API_KEY;
const TELNYX_FROM_NUMBER = process.env.TELNYX_FROM_NUMBER;
const TELNYX_MESSAGING_PROFILE_ID = process.env.TELNYX_MESSAGING_PROFILE_ID;

let telnyxClient: Telnyx | null = null;

if (TELNYX_API_KEY) {
  telnyxClient = new Telnyx({ apiKey: TELNYX_API_KEY });
}

interface SMSParams {
  to: string;
  body: string;
  from?: string;
  tenantId?: string;
  campaignId?: string;
  skipCreditCheck?: boolean;
}

interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
  creditDeducted?: boolean;
}

export async function sendSMS(params: SMSParams): Promise<SMSResult> {
  if (!telnyxClient || !TELNYX_FROM_NUMBER) {
    console.warn('Telnyx not configured - skipping SMS notification');
    return { success: false, error: 'Telnyx not configured' };
  }

  if (params.tenantId && !params.skipCreditCheck) {
    const creditCheck = await checkSmsCredits(params.tenantId, 1);
    if (!creditCheck.hasCredits) {
      console.warn(`❌ SMS blocked - insufficient credits for tenant ${params.tenantId}`);
      return { 
        success: false, 
        error: `Insufficient SMS credits. Available: ${creditCheck.currentBalance}, Required: 1`,
        creditDeducted: false
      };
    }
  }

  try {
    const messageData: Telnyx.Messages.MessageSendParams = {
      to: params.to,
      from: params.from || TELNYX_FROM_NUMBER,
      text: params.body,
    };

    if (TELNYX_MESSAGING_PROFILE_ID) {
      messageData.messaging_profile_id = TELNYX_MESSAGING_PROFILE_ID;
    }

    const message = await telnyxClient.messages.send(messageData);
    const messageId = message.data?.id || 'unknown';

    console.log(`📱 SMS sent successfully to ${params.to}, Message ID: ${messageId}`);

    if (params.tenantId && !params.skipCreditCheck) {
      const deductResult = await deductSmsCredits(params.tenantId, 1, {
        description: `SMS to ${params.to.substring(0, 6)}...`,
        referenceId: messageId,
        referenceType: 'sms_message',
        metadata: {
          to: params.to,
          campaignId: params.campaignId,
        },
      });

      if (deductResult.success) {
        await checkAndTriggerLowBalanceWarning(params.tenantId);
      }

      return { 
        success: true, 
        messageId,
        creditDeducted: deductResult.success
      };
    }
    
    return { 
      success: true, 
      messageId 
    };
  } catch (error: any) {
    console.error('❌ Telnyx SMS error:', error);
    return { 
      success: false, 
      error: error.message || 'SMS sending failed',
      creditDeducted: false
    };
  }
}

export async function sendBulkSMS(recipients: Array<{ phone: string; body: string; tenantId?: string; campaignId?: string }>): Promise<{
  sent: number;
  failed: number;
  results: Array<{ phone: string; success: boolean; messageId?: string; error?: string }>;
  creditsDeducted: number;
}> {
  if (!telnyxClient || !TELNYX_FROM_NUMBER) {
    console.warn('Telnyx not configured - skipping bulk SMS');
    return { 
      sent: 0, 
      failed: recipients.length, 
      results: recipients.map(r => ({ phone: r.phone, success: false, error: 'Telnyx not configured' })),
      creditsDeducted: 0
    };
  }

  const tenantId = recipients[0]?.tenantId;
  if (tenantId) {
    const creditCheck = await checkSmsCredits(tenantId, recipients.length);
    if (!creditCheck.hasCredits) {
      console.warn(`❌ Bulk SMS blocked - insufficient credits for tenant ${tenantId}. Need ${recipients.length}, have ${creditCheck.currentBalance}`);
      return { 
        sent: 0, 
        failed: recipients.length, 
        results: recipients.map(r => ({ 
          phone: r.phone, 
          success: false, 
          error: `Insufficient SMS credits. Available: ${creditCheck.currentBalance}, Required: ${recipients.length}` 
        })),
        creditsDeducted: 0
      };
    }
  }

  const results = [];
  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const result = await sendSMS({
      to: recipient.phone,
      body: recipient.body,
      tenantId: recipient.tenantId,
      campaignId: recipient.campaignId,
      skipCreditCheck: true
    });

    results.push({
      phone: recipient.phone,
      success: result.success,
      messageId: result.messageId,
      error: result.error
    });

    if (result.success) {
      sent++;
    } else {
      failed++;
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  if (tenantId && sent > 0) {
    await deductSmsCredits(tenantId, sent, {
      description: `Bulk SMS campaign (${sent} messages)`,
      referenceType: 'bulk_sms',
      metadata: {
        totalRecipients: recipients.length,
        successfulSends: sent,
        failedSends: failed,
        campaignId: recipients[0]?.campaignId,
      },
    });
    await checkAndTriggerLowBalanceWarning(tenantId);
  }

  console.log(`📱 Bulk SMS completed: ${sent} sent, ${failed} failed`);
  
  return { sent, failed, results, creditsDeducted: sent };
}

export const SMS_TEMPLATES = {
  invitation: {
    parent: "Hi {{name}}! {{senderName}} invited you to join {{tenantName}} on PlayHQ. Book training sessions & manage payments easily. Accept: {{inviteUrl}} Expires: {{expiresAt}}",
    player: "Hey {{name}}! You're invited to join {{tenantName}} on PlayHQ by {{senderName}}. Book sessions & track progress! Join: {{inviteUrl}} Expires: {{expiresAt}}",
    admin: "Hi {{name}}, {{senderName}} invited you as admin for {{tenantName}} on PlayHQ. Manage your organization: {{inviteUrl}} Expires: {{expiresAt}}",
    assistant: "Hi {{name}}, you're invited to assist {{tenantName}} on PlayHQ by {{senderName}}. Help manage operations: {{inviteUrl}} Expires: {{expiresAt}}"
  },
  reminder: {
    sessionReminder: "🏃 Reminder: Your session at {{location}} starts in {{timeUntil}}. Need to cancel? Visit PlayHQ or call {{contactNumber}}",
    paymentDue: "💳 Payment reminder: Your {{amount}} payment for {{sessionDate}} is due. Pay now: {{paymentUrl}} Questions? Reply HELP",
    waitlistPromotion: "🎉 Great news! A spot opened in {{sessionDate}} at {{location}}. Claim it within 2 hours: {{claimUrl}}"
  },
  confirmation: {
    bookingConfirmed: "✅ Booking confirmed! {{playerName}} is registered for {{sessionDate}} at {{location}}. Total: {{amount}}. See you there!",
    paymentReceived: "💰 Payment received! {{amount}} for {{sessionDate}}. Receipt: {{receiptUrl}} Thank you for choosing PlayHQ!",
    cancellation: "❌ Booking cancelled: {{sessionDate}} at {{location}}. {{refundInfo}} Questions? Contact {{supportContact}}"
  }
};

export async function sendInvitationSMS(options: {
  to: string;
  tenantName: string;
  recipientName: string;
  senderName: string;
  role: 'parent' | 'player' | 'admin' | 'assistant';
  inviteUrl: string;
  expiresAt: string;
  tenantId?: string;
}): Promise<SMSResult> {
  const template = SMS_TEMPLATES.invitation[options.role];
  
  const personalizedMessage = template
    .replace(/\{\{name\}\}/g, options.recipientName)
    .replace(/\{\{senderName\}\}/g, options.senderName)
    .replace(/\{\{tenantName\}\}/g, options.tenantName)
    .replace(/\{\{inviteUrl\}\}/g, options.inviteUrl)
    .replace(/\{\{expiresAt\}\}/g, options.expiresAt);

  return sendSMS({
    to: options.to,
    body: personalizedMessage,
    tenantId: options.tenantId,
    campaignId: `invitation-${options.role}`
  });
}

export async function sendCampaignSMS(
  campaignId: string,
  recipients: Array<{ phone: string; name?: string; tenantId?: string }>,
  template: string,
  variables: Record<string, string> = {}
): Promise<{ sent: number; failed: number; creditsDeducted: number }> {
  const { replaceTemplateVariables } = await import('./utils/template-variables');
  
  const smsRecipients = recipients.map(recipient => {
    const templateVars = {
      name: recipient.name || 'there',
      firstName: recipient.name?.split(' ')[0] || 'there',
      recipientName: recipient.name || 'there',
      ...variables
    };
    
    const personalizedBody = replaceTemplateVariables(template, templateVars);

    return {
      phone: recipient.phone,
      body: personalizedBody,
      tenantId: recipient.tenantId,
      campaignId
    };
  });

  const result = await sendBulkSMS(smsRecipients);
  return { sent: result.sent, failed: result.failed, creditsDeducted: result.creditsDeducted };
}

export async function trackSMSEvent(eventData: {
  messageId: string;
  phone: string;
  event: 'sent' | 'delivered' | 'failed' | 'clicked';
  tenantId?: string;
  campaignId?: string;
  errorMessage?: string;
}): Promise<void> {
  try {
    console.log(`📱 SMS Event: ${eventData.event} for ${eventData.phone}`, {
      messageId: eventData.messageId,
      tenantId: eventData.tenantId,
      campaignId: eventData.campaignId,
      error: eventData.errorMessage
    });
  } catch (error) {
    console.error('Failed to track SMS event:', error);
  }
}

export function isSmsConfigured(): boolean {
  return !!(telnyxClient && TELNYX_FROM_NUMBER);
}

export async function getSmsBalance(tenantId: string): Promise<{
  balance: number;
  isLow: boolean;
  lowThreshold: number;
}> {
  const { getSmsCreditsBalance } = await import('./utils/sms-credits');
  const balanceInfo = await getSmsCreditsBalance(tenantId);
  return {
    balance: balanceInfo.balance,
    isLow: balanceInfo.isLow,
    lowThreshold: balanceInfo.lowThreshold
  };
}
