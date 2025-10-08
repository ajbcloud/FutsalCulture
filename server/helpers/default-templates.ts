import { db } from "../db";
import { notificationTemplates, type InsertNotificationTemplate } from "../../shared/schema";
import { eq } from "drizzle-orm";

export async function createDefaultTemplatesForTenant(tenantId: string): Promise<number> {
  // Check if templates already exist for this tenant
  const existingTemplates = await db
    .select()
    .from(notificationTemplates)
    .where(eq(notificationTemplates.tenantId, tenantId));

  if (existingTemplates.length > 0) {
    console.log(`Tenant ${tenantId} already has ${existingTemplates.length} templates`);
    return 0;
  }

  const templates: InsertNotificationTemplate[] = [
    // Booking Confirmation Email
    {
      tenantId,
      name: 'Booking Confirmation Email',
      type: 'email',
      method: 'booking_confirmation',
      subject: 'Session Booking Confirmed - {{sessionAgeGroup}} on {{sessionDate}}',
      template: `Hi {{parentName}},

Your booking for {{playerName}} has been confirmed!

Session Details:
- Date: {{sessionDate}}
- Time: {{sessionTime}}
- Location: {{sessionLocation}}
- Age Group: {{sessionAgeGroup}}

We look forward to seeing {{playerName}} at the session!

Best regards,
{{organizationName}}
{{organizationPhone}}`,
      active: true,
    },
    // Booking Confirmation SMS
    {
      tenantId,
      name: 'Booking Confirmation SMS',
      type: 'sms',
      method: 'booking_confirmation',
      subject: null,
      template: '{{organizationName}}: {{playerName}} is confirmed for {{sessionAgeGroup}} on {{sessionDate}} at {{sessionTime}}. Location: {{sessionLocation}}',
      active: true,
    },
    // 24-Hour Reminder Email
    {
      tenantId,
      name: '24-Hour Reminder Email',
      type: 'email',
      method: 'reminder_24h',
      subject: 'Reminder: {{playerName}}\'s Session Tomorrow',
      template: `Hi {{parentName}},

This is a friendly reminder that {{playerName}} has a session tomorrow!

Session Details:
- Date: {{sessionDate}}
- Time: {{sessionTime}}
- Location: {{sessionLocation}}
- Age Group: {{sessionAgeGroup}}

See you there!

Best regards,
{{organizationName}}
{{organizationPhone}}`,
      active: true,
    },
    // 24-Hour Reminder SMS
    {
      tenantId,
      name: '24-Hour Reminder SMS',
      type: 'sms',
      method: 'reminder_24h',
      subject: null,
      template: 'Reminder: {{playerName}} has {{sessionAgeGroup}} tomorrow at {{sessionTime}}. Location: {{sessionLocation}} - {{organizationName}}',
      active: true,
    },
    // Session Cancelled Email
    {
      tenantId,
      name: 'Session Cancelled Email',
      type: 'email',
      method: 'session_cancelled',
      subject: 'Session Cancelled - {{sessionAgeGroup}} on {{sessionDate}}',
      template: `Hi {{parentName}},

We regret to inform you that the {{sessionAgeGroup}} session scheduled for {{sessionDate}} at {{sessionTime}} has been cancelled.

We apologize for any inconvenience this may cause. If you have already paid, a credit has been applied to your account.

Please contact us if you have any questions.

Best regards,
{{organizationName}}
{{organizationPhone}}`,
      active: true,
    },
    // Session Cancelled SMS
    {
      tenantId,
      name: 'Session Cancelled SMS',
      type: 'sms',
      method: 'session_cancelled',
      subject: null,
      template: 'CANCELLED: {{sessionAgeGroup}} on {{sessionDate}} at {{sessionTime}} has been cancelled. Credit applied. - {{organizationName}}',
      active: true,
    },
    // Credit Applied Email
    {
      tenantId,
      name: 'Credit Applied Email',
      type: 'email',
      method: 'credit_applied',
      subject: 'Credit Applied to Your Account',
      template: `Hi {{parentName}},

A credit of {{creditAmount}} has been applied to your account for {{playerName}}.

You can use this credit for future session bookings.

Best regards,
{{organizationName}}
{{organizationPhone}}`,
      active: true,
    },
    // Credit Applied SMS
    {
      tenantId,
      name: 'Credit Applied SMS',
      type: 'sms',
      method: 'credit_applied',
      subject: null,
      template: '{{organizationName}}: {{creditAmount}} credit applied to your account for {{playerName}}. Use for future bookings.',
      active: true,
    },
    // Payment Received Email
    {
      tenantId,
      name: 'Payment Received Email',
      type: 'email',
      method: 'payment_received',
      subject: 'Payment Received - {{sessionAgeGroup}}',
      template: `Hi {{parentName}},

Thank you! We have received your payment for {{playerName}}'s session.

Session Details:
- Date: {{sessionDate}}
- Time: {{sessionTime}}
- Location: {{sessionLocation}}
- Age Group: {{sessionAgeGroup}}

See you there!

Best regards,
{{organizationName}}
{{organizationPhone}}`,
      active: true,
    },
    // Payment Received SMS
    {
      tenantId,
      name: 'Payment Received SMS',
      type: 'sms',
      method: 'payment_received',
      subject: null,
      template: '{{organizationName}}: Payment received for {{playerName}}. {{sessionAgeGroup}} on {{sessionDate}} at {{sessionTime}}.',
      active: true,
    },
  ];

  await db.insert(notificationTemplates).values(templates);
  console.log(`✅ Created ${templates.length} default templates for tenant ${tenantId}`);
  
  return templates.length;
}
