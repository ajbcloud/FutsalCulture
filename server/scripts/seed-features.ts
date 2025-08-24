import { db } from '../db';
import { features, planFeatures, planCatalog } from '../../shared/schema';
import { sql } from 'drizzle-orm';

const seedFeatures = async () => {
  console.log('🌱 Seeding features...');

  // Clear existing features and plan_features
  await db.delete(planFeatures);
  await db.delete(features);

  // Define all features
  const allFeatures = [
    // Core Features
    {
      key: 'core.session_management',
      name: 'Session Management',
      category: 'core',
      type: 'enum',
      description: 'Create and manage training sessions',
      optionsJson: { values: ['manual_only', 'recurring', 'recurring_bulk'] },
      displayOrder: 1
    },
    {
      key: 'core.parent_player_booking',
      name: 'Parent/Player Booking',
      category: 'core',
      type: 'boolean',
      description: 'Allow parents and players to book sessions',
      displayOrder: 2
    },
    {
      key: 'core.waitlist',
      name: 'Waitlist Management',
      category: 'core',
      type: 'enum',
      description: 'Manage session waitlists',
      optionsJson: { values: ['off', 'manual_only', 'auto_promote'] },
      displayOrder: 3
    },
    {
      key: 'core.csv_export',
      name: 'CSV Export',
      category: 'core',
      type: 'boolean',
      description: 'Export data to CSV format',
      displayOrder: 4
    },
    {
      key: 'core.csv_import',
      name: 'CSV Import',
      category: 'core',
      type: 'boolean',
      description: 'Import data from CSV files',
      displayOrder: 5
    },
    {
      key: 'core.bulk_operations',
      name: 'Bulk Operations',
      category: 'core',
      type: 'boolean',
      description: 'Perform bulk actions on multiple items',
      displayOrder: 6
    },
    {
      key: 'core.access_codes',
      name: 'Access Codes',
      category: 'core',
      type: 'boolean',
      description: 'Create and manage access codes for sessions',
      displayOrder: 7
    },
    {
      key: 'core.discount_codes',
      name: 'Discount Codes',
      category: 'core',
      type: 'boolean',
      description: 'Create and manage discount codes',
      displayOrder: 8
    },

    // Communication Features
    {
      key: 'comm.email_notifications',
      name: 'Email Notifications',
      category: 'communication',
      type: 'boolean',
      description: 'Send email notifications to users',
      displayOrder: 10
    },
    {
      key: 'comm.sms_notifications',
      name: 'SMS Notifications',
      category: 'communication',
      type: 'boolean',
      description: 'Send SMS notifications to users',
      displayOrder: 11
    },
    {
      key: 'comm.email_sms_gateway',
      name: 'Email/SMS Gateway',
      category: 'communication',
      type: 'boolean',
      description: 'Advanced email and SMS delivery options',
      displayOrder: 12
    },

    // Payments & Billing Features
    {
      key: 'pay.accept_online_payments',
      name: 'Accept Online Payments',
      category: 'payments_billing',
      type: 'boolean',
      description: 'Accept payments online through integrated processors',
      displayOrder: 20
    },
    {
      key: 'pay.payment_integrations',
      name: 'Payment Integrations',
      category: 'payments_billing',
      type: 'enum',
      description: 'Available payment processing integrations',
      optionsJson: { values: ['stripe_only', 'multiple_providers'] },
      displayOrder: 21
    },

    // Analytics & Automation Features
    {
      key: 'analytics.level',
      name: 'Analytics Level',
      category: 'analytics',
      type: 'enum',
      description: 'Level of analytics and reporting available',
      optionsJson: { values: ['none', 'basic', 'advanced', 'ai_powered'] },
      displayOrder: 30
    },

    // Integration Features
    {
      key: 'integrations.calendar',
      name: 'Calendar Integration',
      category: 'integrations',
      type: 'boolean',
      description: 'Integrate with calendar applications',
      displayOrder: 40
    },
    {
      key: 'integrations.additional',
      name: 'Additional Integrations',
      category: 'integrations',
      type: 'enum',
      description: 'Third-party service integrations',
      optionsJson: { values: ['none', 'sendgrid_mailchimp_quickbooks', 'sendgrid_mailchimp_quickbooks_braintree'] },
      displayOrder: 41
    },

    // Developer/API Features
    {
      key: 'dev.api_access',
      name: 'API Access',
      category: 'developer',
      type: 'boolean',
      description: 'Access to developer APIs',
      displayOrder: 50
    },

    // Support Features
    {
      key: 'support.level',
      name: 'Support Level',
      category: 'support',
      type: 'enum',
      description: 'Level of customer support available',
      optionsJson: { values: ['basic', 'standard', 'priority_phone'] },
      displayOrder: 60
    },
    {
      key: 'support.feature_request_queue',
      name: 'Feature Request Queue',
      category: 'support',
      type: 'enum',
      description: 'Priority level for feature requests',
      optionsJson: { values: ['basic', 'standard', 'priority'] },
      displayOrder: 61
    },

    // Limits & Pricing
    {
      key: 'limit.players_max',
      name: 'Maximum Players',
      category: 'limits',
      type: 'limit',
      description: 'Maximum number of players allowed',
      optionsJson: { min: 0, max: 999999, unit: 'players', step: 1 },
      displayOrder: 70
    },
    {
      key: 'limit.sessions_monthly',
      name: 'Monthly Sessions',
      category: 'limits',
      type: 'limit',
      description: 'Maximum sessions per month',
      optionsJson: { min: 0, max: 999999, unit: 'sessions', step: 1 },
      displayOrder: 71
    },
    {
      key: 'limit.storage_gb',
      name: 'Storage (GB)',
      category: 'limits',
      type: 'limit',
      description: 'Storage space in gigabytes',
      optionsJson: { min: 0, max: 10000, unit: 'GB', step: 1 },
      displayOrder: 72
    }
  ];

  // Insert features
  await db.insert(features).values(allFeatures);
  console.log(`✅ Inserted ${allFeatures.length} features`);

  // Define plan configurations
  const planConfigurations = {
    'core': {
      'core.session_management': { variant: 'manual_only' },
      'core.parent_player_booking': { enabled: true },
      'core.waitlist': { variant: 'manual_only' },
      'core.csv_export': { enabled: true },
      'core.csv_import': { enabled: false },
      'core.bulk_operations': { enabled: false },
      'core.access_codes': { enabled: false },
      'core.discount_codes': { enabled: false },
      'comm.email_notifications': { enabled: true },
      'comm.sms_notifications': { enabled: false },
      'comm.email_sms_gateway': { enabled: false },
      'pay.accept_online_payments': { enabled: false },
      'pay.payment_integrations': { variant: 'stripe_only' },
      'analytics.level': { variant: 'basic' },
      'integrations.calendar': { enabled: false },
      'integrations.additional': { variant: 'none' },
      'dev.api_access': { enabled: false },
      'support.level': { variant: 'basic' },
      'support.feature_request_queue': { variant: 'basic' },
      'limit.players_max': { limitValue: 150 },
      'limit.sessions_monthly': { limitValue: 50 },
      'limit.storage_gb': { limitValue: 5 }
    },
    'growth': {
      'core.session_management': { variant: 'recurring' },
      'core.parent_player_booking': { enabled: true },
      'core.waitlist': { variant: 'auto_promote' },
      'core.csv_export': { enabled: true },
      'core.csv_import': { enabled: true },
      'core.bulk_operations': { enabled: true },
      'core.access_codes': { enabled: true },
      'core.discount_codes': { enabled: true },
      'comm.email_notifications': { enabled: true },
      'comm.sms_notifications': { enabled: true },
      'comm.email_sms_gateway': { enabled: true },
      'pay.accept_online_payments': { enabled: true },
      'pay.payment_integrations': { variant: 'stripe_only' },
      'analytics.level': { variant: 'advanced' },
      'integrations.calendar': { enabled: true },
      'integrations.additional': { variant: 'sendgrid_mailchimp_quickbooks' },
      'dev.api_access': { enabled: false },
      'support.level': { variant: 'standard' },
      'support.feature_request_queue': { variant: 'standard' },
      'limit.players_max': { limitValue: 500 },
      'limit.sessions_monthly': { limitValue: 200 },
      'limit.storage_gb': { limitValue: 25 }
    },
    'elite': {
      'core.session_management': { variant: 'recurring_bulk' },
      'core.parent_player_booking': { enabled: true },
      'core.waitlist': { variant: 'auto_promote' },
      'core.csv_export': { enabled: true },
      'core.csv_import': { enabled: true },
      'core.bulk_operations': { enabled: true },
      'core.access_codes': { enabled: true },
      'core.discount_codes': { enabled: true },
      'comm.email_notifications': { enabled: true },
      'comm.sms_notifications': { enabled: true },
      'comm.email_sms_gateway': { enabled: true },
      'pay.accept_online_payments': { enabled: true },
      'pay.payment_integrations': { variant: 'multiple_providers' },
      'analytics.level': { variant: 'ai_powered' },
      'integrations.calendar': { enabled: true },
      'integrations.additional': { variant: 'sendgrid_mailchimp_quickbooks_braintree' },
      'dev.api_access': { enabled: true },
      'support.level': { variant: 'priority_phone' },
      'support.feature_request_queue': { variant: 'priority' },
      'limit.players_max': { limitValue: 999999 },
      'limit.sessions_monthly': { limitValue: 999999 },
      'limit.storage_gb': { limitValue: 100 }
    }
  };

  // Ensure plans exist
  const existingPlans = await db.select().from(planCatalog);
  const planCodes = ['core', 'growth', 'elite'];
  
  for (const code of planCodes) {
    if (!existingPlans.find(p => p.code === code)) {
      await db.insert(planCatalog).values({
        code,
        name: code.charAt(0).toUpperCase() + code.slice(1) + ' Plan',
        priceCents: code === 'core' ? 9900 : code === 'growth' ? 19900 : 49900,
        limits: {}
      });
    }
  }

  // Insert plan-feature mappings
  const planFeatureValues = [];
  for (const [planCode, featureConfig] of Object.entries(planConfigurations)) {
    for (const [featureKey, config] of Object.entries(featureConfig)) {
      planFeatureValues.push({
        planCode,
        featureKey,
        ...config
      });
    }
  }

  await db.insert(planFeatures).values(planFeatureValues);
  console.log(`✅ Inserted ${planFeatureValues.length} plan-feature mappings`);

  console.log('✅ Feature seeding complete!');
};

// Run the seed script
seedFeatures()
  .then(() => {
    console.log('✅ Seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });