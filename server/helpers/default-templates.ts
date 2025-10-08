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

We apologize for any inconvenience this may cause. If you have already paid, a credit of {{creditAmount}} has been applied to your account.

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
      template: 'CANCELLED: {{sessionAgeGroup}} on {{sessionDate}} at {{sessionTime}}. Credit {{creditAmount}} applied. - {{organizationName}}',
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
    // Waitlist Joined Email
    {
      tenantId,
      name: 'Waitlist Joined Email',
      type: 'email',
      method: 'waitlist_joined',
      subject: 'Added to Waitlist - {{sessionAgeGroup}} on {{sessionDate}}',
      template: `Hi {{parentName}},

{{playerName}} has been added to the waitlist for the {{sessionAgeGroup}} session on {{sessionDate}} at {{sessionTime}}.

Current Position: {{waitlistPosition}}

We'll notify you immediately if a spot becomes available. You'll have {{paymentWindowHours}} hours to complete payment if promoted.

Session Details:
- Date: {{sessionDate}}
- Time: {{sessionTime}}
- Location: {{sessionLocation}}
- Age Group: {{sessionAgeGroup}}

Best regards,
{{organizationName}}
{{organizationPhone}}`,
      active: true,
    },
    // Waitlist Joined SMS
    {
      tenantId,
      name: 'Waitlist Joined SMS',
      type: 'sms',
      method: 'waitlist_joined',
      subject: null,
      template: '{{organizationName}}: {{playerName}} added to waitlist for {{sessionAgeGroup}} on {{sessionDate}}. Position: {{waitlistPosition}}',
      active: true,
    },
    // Waitlist Spot Available Email
    {
      tenantId,
      name: 'Waitlist Spot Available Email',
      type: 'email',
      method: 'waitlist_spot_available',
      subject: 'Spot Available! {{sessionAgeGroup}} on {{sessionDate}}',
      template: `Hi {{parentName}},

Great news! A spot has opened up for {{playerName}} in the {{sessionAgeGroup}} session!

IMPORTANT: You have {{paymentWindowHours}} hours to complete payment or your spot will be offered to the next person on the waitlist.

Payment deadline: {{paymentDeadline}}

Session Details:
- Date: {{sessionDate}}
- Time: {{sessionTime}}
- Location: {{sessionLocation}}
- Age Group: {{sessionAgeGroup}}

Please log in to complete your booking now.

Best regards,
{{organizationName}}
{{organizationPhone}}`,
      active: true,
    },
    // Waitlist Spot Available SMS
    {
      tenantId,
      name: 'Waitlist Spot Available SMS',
      type: 'sms',
      method: 'waitlist_spot_available',
      subject: null,
      template: 'URGENT: Spot available for {{playerName}} - {{sessionAgeGroup}} on {{sessionDate}}! Pay within {{paymentWindowHours}}hrs or lose spot. - {{organizationName}}',
      active: true,
    },
    // Waitlist Payment Reminder Email
    {
      tenantId,
      name: 'Waitlist Payment Reminder Email',
      type: 'email',
      method: 'waitlist_payment_reminder',
      subject: 'Payment Reminder - Spot Expires Soon',
      template: `Hi {{parentName}},

This is a reminder that {{playerName}}'s spot for {{sessionAgeGroup}} on {{sessionDate}} will expire soon!

Payment deadline: {{paymentDeadline}}

Please complete your payment as soon as possible to secure the spot.

Session Details:
- Date: {{sessionDate}}
- Time: {{sessionTime}}
- Location: {{sessionLocation}}

Best regards,
{{organizationName}}
{{organizationPhone}}`,
      active: true,
    },
    // Waitlist Payment Reminder SMS
    {
      tenantId,
      name: 'Waitlist Payment Reminder SMS',
      type: 'sms',
      method: 'waitlist_payment_reminder',
      subject: null,
      template: 'REMINDER: Payment for {{playerName}} {{sessionAgeGroup}} expires at {{paymentDeadline}}. Complete payment now! - {{organizationName}}',
      active: true,
    },
    // Waitlist Payment Expired Email
    {
      tenantId,
      name: 'Waitlist Payment Expired Email',
      type: 'email',
      method: 'waitlist_payment_expired',
      subject: 'Spot Expired - {{sessionAgeGroup}} on {{sessionDate}}',
      template: `Hi {{parentName}},

Unfortunately, the payment window for {{playerName}}'s spot in {{sessionAgeGroup}} on {{sessionDate}} has expired.

The spot has been offered to the next person on the waitlist. You can rejoin the waitlist if you'd like.

We hope to see {{playerName}} at a future session!

Best regards,
{{organizationName}}
{{organizationPhone}}`,
      active: true,
    },
    // Waitlist Payment Expired SMS
    {
      tenantId,
      name: 'Waitlist Payment Expired SMS',
      type: 'sms',
      method: 'waitlist_payment_expired',
      subject: null,
      template: '{{organizationName}}: Payment window expired for {{playerName}} {{sessionAgeGroup}} on {{sessionDate}}. Spot released to next on waitlist.',
      active: true,
    },
    // Email Verification Email
    {
      tenantId,
      name: 'Email Verification Email',
      type: 'email',
      method: 'email_verification',
      subject: 'Verify Your Email - {{organizationName}}',
      template: `Hi {{parentName}},

Welcome to {{organizationName}}! Please verify your email address to complete your account setup.

Click the link below to verify your email (expires in 48 hours):
{{verificationLink}}

Once verified, you can set your password and start booking sessions for your player.

If you didn't create this account, please ignore this email.

Best regards,
{{organizationName}}
{{organizationPhone}}`,
      active: true,
    },
    // Welcome Email
    {
      tenantId,
      name: 'Welcome Email',
      type: 'email',
      method: 'welcome',
      subject: 'Welcome to {{organizationName}}!',
      template: `Hi {{parentName}},

Welcome to {{organizationName}}! We're excited to have you join our futsal community.

Your account is now active. Here's what you can do:
- Add your player's information
- Book training sessions
- View upcoming sessions
- Track your booking history

Sessions open for booking at 8 AM on the day of the session and remain bookable until the start time (if space is available).

If you have any questions, please don't hesitate to contact us.

Best regards,
{{organizationName}}
{{organizationPhone}}`,
      active: true,
    },
    // Password Reset Email
    {
      tenantId,
      name: 'Password Reset Email',
      type: 'email',
      method: 'password_reset',
      subject: 'Password Reset Request - {{organizationName}}',
      template: `Hi {{parentName}},

We received a request to reset your password for your {{organizationName}} account.

Click the link below to reset your password (expires in 1 hour):
{{resetLink}}

If you didn't request this password reset, please ignore this email and your password will remain unchanged.

Best regards,
{{organizationName}}
{{organizationPhone}}`,
      active: true,
    },
    // Help Request Received Email
    {
      tenantId,
      name: 'Help Request Received Email',
      type: 'email',
      method: 'help_request_received',
      subject: 'Help Request Received - Ticket #{{ticketNumber}}',
      template: `Hi {{parentName}},

We've received your help request and our team will respond as soon as possible.

Request Details:
- Ticket Number: {{ticketNumber}}
- Subject: {{subject}}
- Category: {{category}}
- Priority: {{priority}}

You'll receive an email when we have an update.

Best regards,
{{organizationName}}
{{organizationPhone}}`,
      active: true,
    },
    // Help Request Resolved Email
    {
      tenantId,
      name: 'Help Request Resolved Email',
      type: 'email',
      method: 'help_request_resolved',
      subject: 'Help Request Resolved - Ticket #{{ticketNumber}}',
      template: `Hi {{parentName}},

Your help request has been resolved!

Request Details:
- Ticket Number: {{ticketNumber}}
- Subject: {{subject}}

Resolution:
{{resolutionNotes}}

If you have any additional questions, please don't hesitate to submit another help request.

Best regards,
{{organizationName}}
{{organizationPhone}}`,
      active: true,
    },
    // Player Portal Access Email
    {
      tenantId,
      name: 'Player Portal Access Email',
      type: 'email',
      method: 'player_portal_access',
      subject: 'Player Portal Access Granted - {{organizationName}}',
      template: `Hi {{playerName}},

Your parent has granted you access to the {{organizationName}} Player Portal!

As a player aged 13 or older, you can now:
- View your upcoming sessions
- Book your own training sessions
- Manage your schedule
- View your training history

Your account is now active and ready to use.

Best regards,
{{organizationName}}
{{organizationPhone}}`,
      active: true,
    },
  ];

  await db.insert(notificationTemplates).values(templates);
  console.log(`✅ Created ${templates.length} default templates for tenant ${tenantId}`);
  
  return templates.length;
}
