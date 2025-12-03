import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { 
  integrationWebhooks, 
  webhookEvents, 
  webhookAttempts, 
  commTemplates, 
  emailEvents, 
  smsEvents, 
  impersonationEvents, 
  auditLogs,
  users,
  tenants
} from '../shared/schema';
import { sql } from 'drizzle-orm';

const connection = neon(process.env.DATABASE_URL!);
const db = drizzle(connection);

/**
 * Seed data for Super Admin Features
 * - Webhooks and Integration Health
 * - Communication Deliverability
 * - Security and Audit Logs
 */

async function seedSuperAdminFeatures() {
  console.log('🌱 Starting Super Admin features seeding...');

  try {
    // Get existing tenant IDs for FK references
    const existingTenants = await db.select({ id: tenants.id }).from(tenants);
    const tenantIds = existingTenants.map(t => t.id);
    
    // Clear existing data
    await db.delete(auditLogs);
    await db.delete(impersonationEvents);
    await db.delete(smsEvents);
    await db.delete(emailEvents);
    await db.delete(commTemplates);
    await db.delete(webhookAttempts);
    await db.delete(webhookEvents);
    await db.delete(integrationWebhooks);

    // 1. Seed Integration Webhooks
    console.log('📡 Seeding webhook configurations...');
    
    const webhooks = [
      {
        id: 'wh_stripe_payments',
        name: 'Stripe Payment Webhooks',
        url: 'https://api.example.com/webhooks/stripe',
        enabled: true
      },
      {
        id: 'wh_resend_email',
        name: 'Resend Email Events',
        url: 'https://api.example.com/webhooks/resend',
        enabled: true
      },
      {
        id: 'wh_telnyx_sms',
        name: 'Telnyx SMS Events',
        url: 'https://api.example.com/webhooks/telnyx',
        enabled: false
      },
      {
        id: 'wh_analytics',
        name: 'Analytics Events',
        url: 'https://analytics.example.com/webhook',
        enabled: true
      },
      {
        id: 'wh_mailchimp',
        name: 'Mailchimp Marketing',
        url: 'https://marketing.example.com/webhook',
        enabled: true
      }
    ];

    for (const webhook of webhooks) {
      await db.insert(integrationWebhooks).values(webhook);
    }

    // 2. Seed Webhook Events (last 30 days)
    console.log('📨 Seeding webhook events...');
    
    const eventTypes = [
      'payment.succeeded',
      'payment.failed', 
      'session.booked',
      'session.cancelled',
      'user.registered',
      'email.delivered',
      'email.bounce',
      'sms.delivered',
      'sms.failed',
      'analytics.track'
    ];

    const webhookEventsList = [];
    const now = new Date();

    for (let i = 0; i < 500; i++) {
      // Random date in last 30 days
      const createdAt = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      
      const event = {
        id: `evt_${Math.random().toString(36).substring(7)}`,
        webhookId: webhooks[Math.floor(Math.random() * webhooks.length)].id,
        source: 'seed_script',
        eventType: eventTypes[Math.floor(Math.random() * eventTypes.length)],
        payloadJson: {
          id: `obj_${Math.random().toString(36).substring(7)}`,
          type: 'test_event',
          data: { amount: Math.floor(Math.random() * 10000) }
        },
        createdAt: createdAt
      };
      
      webhookEventsList.push(event);
      await db.insert(webhookEvents).values(event);
    }

    // 3. Seed Webhook Attempts
    console.log('🔄 Seeding webhook delivery attempts...');
    
    for (const event of webhookEventsList.slice(0, 200)) {
      // Each event has 1-3 delivery attempts
      const attemptCount = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 1; i <= attemptCount; i++) {
        const attemptTime = new Date(event.createdAt.getTime() + (i - 1) * 60000); // 1 min intervals
        const success = Math.random() > (i === 1 ? 0.1 : 0.3); // Higher success rate on first attempt
        
        await db.insert(webhookAttempts).values({
          eventId: event.id,
          attemptNo: i,
          status: success ? 'success' : 'failed',
          httpStatus: success ? (Math.random() > 0.1 ? 200 : 201) : (Math.random() > 0.5 ? 500 : 404),
          latencyMs: Math.floor(Math.random() * 2000) + 100, // 100-2100ms
          error: success ? null : [
            'Connection timeout',
            'Internal server error', 
            'Bad gateway',
            'Service unavailable',
            'Invalid payload'
          ][Math.floor(Math.random() * 5)],
          createdAt: attemptTime
        });
      }
    }

    // 4. Seed Communication Templates
    console.log('📧 Seeding communication templates...');
    
    const templates = [
      { key: 'booking_confirmation', name: 'Booking Confirmation', type: 'email' as const },
      { key: 'booking_reminder_email', name: 'Session Reminder (Email)', type: 'email' as const },
      { key: 'booking_reminder_sms', name: 'Session Reminder (SMS)', type: 'sms' as const },
      { key: 'payment_receipt', name: 'Payment Receipt', type: 'email' as const },
      { key: 'cancellation_notice_email', name: 'Cancellation Notice (Email)', type: 'email' as const },
      { key: 'cancellation_notice_sms', name: 'Cancellation Notice (SMS)', type: 'sms' as const },
      { key: 'waitlist_promoted', name: 'Waitlist Promotion', type: 'sms' as const },
      { key: 'password_reset', name: 'Password Reset', type: 'email' as const },
      { key: 'welcome_email', name: 'Welcome Email', type: 'email' as const },
      { key: 'session_full', name: 'Session Full Alert', type: 'sms' as const }
    ];

    for (const template of templates) {
      await db.insert(commTemplates).values(template);
    }

    // 5. Seed Email Events
    console.log('✉️ Seeding email events...');
    
    const emailEventTypes = ['processed', 'delivered', 'open', 'click', 'bounce', 'dropped', 'spamreport', 'deferred'];
    const emailProviders = ['resend', 'mailgun', 'ses'];
    
    for (let i = 0; i < 1000; i++) {
      const createdAt = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      
      await db.insert(emailEvents).values({
        provider: emailProviders[Math.floor(Math.random() * emailProviders.length)],
        event: emailEventTypes[Math.floor(Math.random() * emailEventTypes.length)],
        toAddr: `user${Math.floor(Math.random() * 100)}@example.com`,
        templateKey: templates.filter(t => t.type === 'email')[Math.floor(Math.random() * templates.filter(t => t.type === 'email').length)].key,
        messageId: `msg_${Math.random().toString(36).substring(7)}`,
        reason: Math.random() > 0.7 ? ['Invalid email', 'Mailbox full', 'Spam filter'][Math.floor(Math.random() * 3)] : null,
        tenantId: Math.random() > 0.2 && tenantIds.length > 0 ? tenantIds[Math.floor(Math.random() * tenantIds.length)] : null,
        createdAt: createdAt
      });
    }

    // 6. Seed SMS Events
    console.log('📱 Seeding SMS events...');
    
    const smsEventTypes = ['delivered', 'undelivered', 'failed', 'sent'];
    const smsProviders = ['telnyx', 'vonage'];
    
    for (let i = 0; i < 300; i++) {
      const createdAt = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      
      await db.insert(smsEvents).values({
        provider: smsProviders[Math.floor(Math.random() * smsProviders.length)],
        event: smsEventTypes[Math.floor(Math.random() * smsEventTypes.length)],
        toNumber: `+1555${Math.floor(Math.random() * 9000000) + 1000000}`,
        templateKey: templates.filter(t => t.type === 'sms')[Math.floor(Math.random() * templates.filter(t => t.type === 'sms').length)].key,
        messageSid: `SM${Math.random().toString(36).substring(7)}`,
        errorCode: Math.random() > 0.8 ? ['30001', '30003', '30005', '21211'][Math.floor(Math.random() * 4)] : null,
        tenantId: Math.random() > 0.2 && tenantIds.length > 0 ? tenantIds[Math.floor(Math.random() * tenantIds.length)] : null,
        createdAt: createdAt
      });
    }

    // 7. Seed Impersonation Events
    console.log('👥 Seeding impersonation events...');
    
    // Get existing super admin users
    const superAdmins = await db.select().from(users).where(sql`role = 'super_admin'`);
    
    if (superAdmins.length > 0) {
      for (let i = 0; i < 15; i++) {
        const startedAt = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
        const duration = Math.floor(Math.random() * 4 + 1) * 60 * 60 * 1000; // 1-4 hours
        const expiresAt = new Date(startedAt.getTime() + duration);
        const wasRevoked = Math.random() > 0.7; // 30% chance of being revoked
        
        const superAdmin = superAdmins[Math.floor(Math.random() * superAdmins.length)];
        
        if (tenantIds.length > 0) {
          await db.insert(impersonationEvents).values({
            superAdminId: superAdmin.id,
            tenantId: tenantIds[Math.floor(Math.random() * tenantIds.length)],
            reason: [
              'Debug payment processing issue',
              'Help with session setup',
              'Investigate user complaint',
              'Test new feature deployment',
              'Resolve booking discrepancy'
            ][Math.floor(Math.random() * 5)],
            tokenJti: `jti_${Math.random().toString(36).substring(7)}`,
            startedAt: startedAt,
            expiresAt: expiresAt,
            revokedAt: wasRevoked ? new Date(startedAt.getTime() + Math.random() * duration) : null,
            ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
          });
        }
      }
    } else {
      console.log('⚠️  No super admin users found, skipping impersonation events');
    }

    // 8. Seed Audit Logs
    console.log('📋 Seeding audit logs...');
    
    const sections = ['users', 'sessions', 'payments', 'settings', 'tenants', 'integrations'];
    const actions = ['create', 'update', 'delete', 'login', 'logout', 'export', 'import'];
    const roles = ['super_admin', 'admin', 'parent'];
    
    for (let i = 0; i < 500; i++) {
      const createdAt = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      const section = sections[Math.floor(Math.random() * sections.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      
      // Create realistic diff objects
      const diffs = {
        create: { status: 'active', created_at: createdAt.toISOString() },
        update: { 
          status: { from: 'pending', to: 'active' },
          updated_at: createdAt.toISOString()
        },
        delete: { deleted_at: createdAt.toISOString() },
        login: null,
        logout: null,
        export: { format: 'csv', records: Math.floor(Math.random() * 1000) },
        import: { rows: Math.floor(Math.random() * 100), success: Math.random() > 0.1 }
      };
      
      await db.insert(auditLogs).values({
        actorId: `user_${Math.floor(Math.random() * 20) + 1}`,
        actorRole: roles[Math.floor(Math.random() * roles.length)],
        section,
        action,
        targetId: `${section}_${Math.random().toString(36).substring(7)}`,
        diff: diffs[action as keyof typeof diffs],
        ip: `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        createdAt: createdAt
      });
    }

    console.log('✅ Super Admin features seeding completed!');
    console.log(`
📊 Seeded:
   - ${webhooks.length} webhook configurations
   - ${webhookEventsList.length} webhook events
   - ~${webhookEventsList.length * 1.5} webhook delivery attempts
   - ${templates.length} communication templates
   - 1000 email events
   - 300 SMS events
   - 15 impersonation sessions
   - 500 audit log entries
    `);

  } catch (error) {
    console.error('❌ Error during Super Admin seeding:', error);
    throw error;
  }
}

// Run seeding if called directly
seedSuperAdminFeatures()
  .then(() => {
    console.log('🎉 Super Admin seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Super Admin seeding failed:', error);
    process.exit(1);
  });

export { seedSuperAdminFeatures };