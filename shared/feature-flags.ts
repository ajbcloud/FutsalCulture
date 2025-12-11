// Define types locally since pgEnum doesn't export TypeScript types directly
export type PlanLevel = 'free' | 'core' | 'growth' | 'elite';
export type FeatureKey = typeof FEATURE_KEYS[keyof typeof FEATURE_KEYS];

// Feature key constants
export const FEATURE_KEYS = {
  SESSION_MANAGEMENT: 'session_management',
  LOCATION_LINKS: 'location_links',
  PARENT_PORTAL: 'parent_portal',
  WAITLIST_MANUAL: 'waitlist_manual',
  WAITLIST_AUTO_PROMOTE: 'waitlist_auto_promote',
  NOTIFICATIONS_EMAIL: 'notifications_email',
  NOTIFICATIONS_SMS: 'notifications_sms',
  ANALYTICS_BASIC: 'analytics_basic',
  ANALYTICS_ADVANCED: 'analytics_advanced',
  PAYMENTS_ENABLED: 'payments_enabled',
  INTEGRATIONS_CALENDAR: 'integrations_calendar',
  INTEGRATIONS_MAILCHIMP: 'integrations_mailchimp',
  INTEGRATIONS_QUICKBOOKS: 'integrations_quickbooks',
  INTEGRATIONS_BRAINTREE: 'integrations_braintree',
  INTEGRATIONS_ZAPIER: 'integrations_zapier',
  API_READ_ONLY: 'api_read_only',
  API_FULL_ACCESS: 'api_full_access',
  MULTI_TENANT: 'multi_tenant',
  SSO: 'sso',
  SUPPORT_STANDARD: 'support_standard',
  SUPPORT_PRIORITY: 'support_priority',
  BULK_OPERATIONS: 'bulk_operations',
  PLAYER_DEVELOPMENT: 'player_development',
  FEATURE_REQUESTS: 'feature_requests',
} as const;

// Feature configurations for each plan level
export const PLAN_FEATURES: Record<PlanLevel, Record<FeatureKey, boolean>> = {
  free: {
    [FEATURE_KEYS.SESSION_MANAGEMENT]: true,  // Manual creation only
    [FEATURE_KEYS.LOCATION_LINKS]: false,
    [FEATURE_KEYS.PARENT_PORTAL]: true,
    [FEATURE_KEYS.WAITLIST_MANUAL]: false,  // Disabled for free
    [FEATURE_KEYS.WAITLIST_AUTO_PROMOTE]: false,
    [FEATURE_KEYS.NOTIFICATIONS_EMAIL]: false,  // Disabled for free
    [FEATURE_KEYS.NOTIFICATIONS_SMS]: false,
    [FEATURE_KEYS.ANALYTICS_BASIC]: false,  // Disabled for free
    [FEATURE_KEYS.ANALYTICS_ADVANCED]: false,
    [FEATURE_KEYS.PAYMENTS_ENABLED]: false,  // Disabled for free
    [FEATURE_KEYS.INTEGRATIONS_CALENDAR]: false,
    [FEATURE_KEYS.INTEGRATIONS_MAILCHIMP]: false,
    [FEATURE_KEYS.INTEGRATIONS_QUICKBOOKS]: false,
    [FEATURE_KEYS.INTEGRATIONS_BRAINTREE]: false,
    [FEATURE_KEYS.INTEGRATIONS_ZAPIER]: false,
    [FEATURE_KEYS.API_READ_ONLY]: false,
    [FEATURE_KEYS.API_FULL_ACCESS]: false,
    [FEATURE_KEYS.MULTI_TENANT]: false,
    [FEATURE_KEYS.SSO]: false,
    [FEATURE_KEYS.SUPPORT_STANDARD]: true,
    [FEATURE_KEYS.SUPPORT_PRIORITY]: false,
    [FEATURE_KEYS.BULK_OPERATIONS]: false,  // Disabled for free
    [FEATURE_KEYS.PLAYER_DEVELOPMENT]: false,  // Elite-only feature
    [FEATURE_KEYS.FEATURE_REQUESTS]: false,  // Disabled for free
  },
  core: {
    [FEATURE_KEYS.SESSION_MANAGEMENT]: true,
    [FEATURE_KEYS.LOCATION_LINKS]: true,
    [FEATURE_KEYS.PARENT_PORTAL]: true,
    [FEATURE_KEYS.WAITLIST_MANUAL]: true,
    [FEATURE_KEYS.WAITLIST_AUTO_PROMOTE]: false,
    [FEATURE_KEYS.NOTIFICATIONS_EMAIL]: true,
    [FEATURE_KEYS.NOTIFICATIONS_SMS]: false,
    [FEATURE_KEYS.ANALYTICS_BASIC]: true,
    [FEATURE_KEYS.ANALYTICS_ADVANCED]: false,
    [FEATURE_KEYS.PAYMENTS_ENABLED]: false,
    [FEATURE_KEYS.INTEGRATIONS_CALENDAR]: true,  // Calendar sync included in Core
    [FEATURE_KEYS.INTEGRATIONS_MAILCHIMP]: false,
    [FEATURE_KEYS.INTEGRATIONS_QUICKBOOKS]: false,
    [FEATURE_KEYS.INTEGRATIONS_BRAINTREE]: false,
    [FEATURE_KEYS.INTEGRATIONS_ZAPIER]: false,
    [FEATURE_KEYS.API_READ_ONLY]: false,
    [FEATURE_KEYS.API_FULL_ACCESS]: false,
    [FEATURE_KEYS.MULTI_TENANT]: false,
    [FEATURE_KEYS.SSO]: false,
    [FEATURE_KEYS.SUPPORT_STANDARD]: true,
    [FEATURE_KEYS.SUPPORT_PRIORITY]: false,
    [FEATURE_KEYS.BULK_OPERATIONS]: false,  // CSV export only, not bulk import
    [FEATURE_KEYS.PLAYER_DEVELOPMENT]: false,  // Elite-only feature
    [FEATURE_KEYS.FEATURE_REQUESTS]: true,  // Available with low priority
  },
  growth: {
    [FEATURE_KEYS.SESSION_MANAGEMENT]: true,
    [FEATURE_KEYS.LOCATION_LINKS]: true,
    [FEATURE_KEYS.PARENT_PORTAL]: true,
    [FEATURE_KEYS.WAITLIST_MANUAL]: true,
    [FEATURE_KEYS.WAITLIST_AUTO_PROMOTE]: true,
    [FEATURE_KEYS.NOTIFICATIONS_EMAIL]: true,
    [FEATURE_KEYS.NOTIFICATIONS_SMS]: true,
    [FEATURE_KEYS.ANALYTICS_BASIC]: true,
    [FEATURE_KEYS.ANALYTICS_ADVANCED]: true,
    [FEATURE_KEYS.PAYMENTS_ENABLED]: true,
    [FEATURE_KEYS.INTEGRATIONS_CALENDAR]: true,
    [FEATURE_KEYS.INTEGRATIONS_MAILCHIMP]: true,
    [FEATURE_KEYS.INTEGRATIONS_QUICKBOOKS]: false,
    [FEATURE_KEYS.INTEGRATIONS_BRAINTREE]: true,
    [FEATURE_KEYS.INTEGRATIONS_ZAPIER]: false,
    [FEATURE_KEYS.API_READ_ONLY]: true,
    [FEATURE_KEYS.API_FULL_ACCESS]: false,
    [FEATURE_KEYS.MULTI_TENANT]: false,
    [FEATURE_KEYS.SSO]: false,
    [FEATURE_KEYS.SUPPORT_STANDARD]: false,
    [FEATURE_KEYS.SUPPORT_PRIORITY]: true,
    [FEATURE_KEYS.BULK_OPERATIONS]: true,
    [FEATURE_KEYS.PLAYER_DEVELOPMENT]: false,  // Elite-only feature
    [FEATURE_KEYS.FEATURE_REQUESTS]: true,  // Available with medium priority
  },
  elite: {
    [FEATURE_KEYS.SESSION_MANAGEMENT]: true,
    [FEATURE_KEYS.LOCATION_LINKS]: true,
    [FEATURE_KEYS.PARENT_PORTAL]: true,
    [FEATURE_KEYS.WAITLIST_MANUAL]: true,
    [FEATURE_KEYS.WAITLIST_AUTO_PROMOTE]: true,
    [FEATURE_KEYS.NOTIFICATIONS_EMAIL]: true,
    [FEATURE_KEYS.NOTIFICATIONS_SMS]: true,
    [FEATURE_KEYS.ANALYTICS_BASIC]: true,
    [FEATURE_KEYS.ANALYTICS_ADVANCED]: true,
    [FEATURE_KEYS.PAYMENTS_ENABLED]: true,
    [FEATURE_KEYS.INTEGRATIONS_CALENDAR]: true,
    [FEATURE_KEYS.INTEGRATIONS_MAILCHIMP]: true,
    [FEATURE_KEYS.INTEGRATIONS_QUICKBOOKS]: true,
    [FEATURE_KEYS.INTEGRATIONS_BRAINTREE]: true,
    [FEATURE_KEYS.INTEGRATIONS_ZAPIER]: true,
    [FEATURE_KEYS.API_READ_ONLY]: true,
    [FEATURE_KEYS.API_FULL_ACCESS]: true,
    [FEATURE_KEYS.MULTI_TENANT]: true,
    [FEATURE_KEYS.SSO]: true,
    [FEATURE_KEYS.SUPPORT_STANDARD]: false,
    [FEATURE_KEYS.SUPPORT_PRIORITY]: true,
    [FEATURE_KEYS.BULK_OPERATIONS]: true,
    [FEATURE_KEYS.PLAYER_DEVELOPMENT]: true,  // Elite-only feature
    [FEATURE_KEYS.FEATURE_REQUESTS]: true,  // Available with high priority
  },
};

// Plan limits and configurations
export const PLAN_LIMITS = {
  free: {
    maxPlayers: 10, // Limited to 10 players
    maxUsers: null, // No separate user limit
    maxSessions: null, // No total session limit
    maxSessionsPerMonth: 5, // Limited to 5 sessions per month
    maxLocations: 1,
    price: 0,
    billingPeriod: 'monthly' as const,
    name: 'Free Plan',
    description: 'Perfect for small trainers just getting started',
  },
  core: {
    maxPlayers: null, // Unlimited players
    maxUsers: null, // No user limit for paid plans
    maxSessions: null,
    maxSessionsPerMonth: null, // Unlimited sessions per month
    maxLocations: 1,
    price: 79,
    billingPeriod: 'monthly' as const,
    name: 'Core',
    description: 'For trainers managing more sessions or growing small teams',
  },
  growth: {
    maxPlayers: null, // Unlimited players
    maxUsers: null, // No user limit for paid plans
    maxSessions: null,
    maxSessionsPerMonth: null, // Unlimited sessions per month
    maxLocations: 3,
    price: 149,
    billingPeriod: 'monthly' as const,
    name: 'Growth',
    description: 'Designed for multi-coach teams or multi-location programs',
  },
  elite: {
    maxPlayers: null, // Unlimited
    maxUsers: null, // No user limit for paid plans
    maxSessions: null,
    maxSessionsPerMonth: null, // Unlimited sessions per month
    maxLocations: null, // Unlimited
    price: 299,
    billingPeriod: 'monthly' as const,
    name: 'Elite',
    description: 'For serious programs running competitive academies or training networks',
  },
};

// Feature categories for UI organization
export const FEATURE_CATEGORIES = {
  'Core Operations': [
    FEATURE_KEYS.SESSION_MANAGEMENT,
    FEATURE_KEYS.LOCATION_LINKS,
    FEATURE_KEYS.PARENT_PORTAL,
  ],
  'Advanced Features': [
    FEATURE_KEYS.WAITLIST_AUTO_PROMOTE,
    FEATURE_KEYS.ANALYTICS_ADVANCED,
  ],
  'Payments & Commerce': [
    FEATURE_KEYS.PAYMENTS_ENABLED,
  ],
  'Communications': [
    FEATURE_KEYS.NOTIFICATIONS_EMAIL,
    FEATURE_KEYS.NOTIFICATIONS_SMS,
  ],
  'Integrations': [
    FEATURE_KEYS.INTEGRATIONS_CALENDAR,
    FEATURE_KEYS.INTEGRATIONS_MAILCHIMP,
    FEATURE_KEYS.INTEGRATIONS_QUICKBOOKS,
    FEATURE_KEYS.INTEGRATIONS_BRAINTREE,
    FEATURE_KEYS.INTEGRATIONS_ZAPIER,
  ],
  'API Access': [
    FEATURE_KEYS.API_READ_ONLY,
    FEATURE_KEYS.API_FULL_ACCESS,
  ],
  'Enterprise': [
    FEATURE_KEYS.MULTI_TENANT,
    FEATURE_KEYS.SSO,
    FEATURE_KEYS.SUPPORT_PRIORITY,
  ],
};

// Utility function to check if a feature is enabled for a plan
export function hasFeature(planLevel: PlanLevel, featureKey: FeatureKey): boolean {
  return PLAN_FEATURES[planLevel]?.[featureKey] ?? false;
}

// Get all enabled features for a plan
export function getEnabledFeatures(planLevel: PlanLevel): FeatureKey[] {
  const features = PLAN_FEATURES[planLevel];
  if (!features) return [];
  
  return Object.entries(features)
    .filter(([_, enabled]) => enabled)
    .map(([key, _]) => key as FeatureKey);
}

// Get features that would be gained by upgrading to a higher plan
export function getUpgradeFeatures(currentPlan: PlanLevel, targetPlan: PlanLevel): FeatureKey[] {
  const currentFeatures = getEnabledFeatures(currentPlan);
  const targetFeatures = getEnabledFeatures(targetPlan);
  
  return targetFeatures.filter(feature => !currentFeatures.includes(feature));
}

// Check if user has reached plan limits
export function checkPlanLimits(planLevel: PlanLevel, playerCount: number): {
  withinLimit: boolean;
  limit: number | null;
  percentage: number;
} {
  const limit = PLAN_LIMITS[planLevel].maxPlayers;
  
  if (limit === null) {
    return { withinLimit: true, limit: null, percentage: 0 };
  }
  
  return {
    withinLimit: playerCount <= limit,
    limit,
    percentage: (playerCount / limit) * 100,
  };
}

// Check if user has reached monthly session limits
export function checkSessionLimits(planLevel: PlanLevel, sessionCountThisMonth: number): {
  withinLimit: boolean;
  limit: number | null;
  remaining: number | null;
  percentage: number;
} {
  const limit = PLAN_LIMITS[planLevel].maxSessionsPerMonth;
  
  if (limit === null) {
    return { withinLimit: true, limit: null, remaining: null, percentage: 0 };
  }
  
  return {
    withinLimit: sessionCountThisMonth < limit,
    limit,
    remaining: Math.max(0, limit - sessionCountThisMonth),
    percentage: (sessionCountThisMonth / limit) * 100,
  };
}

// Get user-friendly feature names
export const FEATURE_NAMES: Record<FeatureKey, string> = {
  [FEATURE_KEYS.SESSION_MANAGEMENT]: 'Session Management',
  [FEATURE_KEYS.LOCATION_LINKS]: 'Google Maps Integration',
  [FEATURE_KEYS.PARENT_PORTAL]: 'Parent Portal',
  [FEATURE_KEYS.WAITLIST_MANUAL]: 'Manual Waitlist Management',
  [FEATURE_KEYS.WAITLIST_AUTO_PROMOTE]: 'Automated Waitlist Promotion',
  [FEATURE_KEYS.NOTIFICATIONS_EMAIL]: 'Email Notifications',
  [FEATURE_KEYS.NOTIFICATIONS_SMS]: 'SMS Notifications',
  [FEATURE_KEYS.ANALYTICS_BASIC]: 'Basic Analytics',
  [FEATURE_KEYS.ANALYTICS_ADVANCED]: 'Advanced Analytics & Reporting',
  [FEATURE_KEYS.PAYMENTS_ENABLED]: 'Online Payment Processing',
  [FEATURE_KEYS.INTEGRATIONS_CALENDAR]: 'Calendar Integration',
  [FEATURE_KEYS.INTEGRATIONS_MAILCHIMP]: 'Mailchimp Integration',
  [FEATURE_KEYS.INTEGRATIONS_QUICKBOOKS]: 'QuickBooks Integration',
  [FEATURE_KEYS.INTEGRATIONS_BRAINTREE]: 'Braintree Payment Gateway',
  [FEATURE_KEYS.INTEGRATIONS_ZAPIER]: 'Zapier Integration',
  [FEATURE_KEYS.API_READ_ONLY]: 'Read-Only API Access',
  [FEATURE_KEYS.API_FULL_ACCESS]: 'Full API Access',
  [FEATURE_KEYS.MULTI_TENANT]: 'Multi-Location Management',
  [FEATURE_KEYS.SSO]: 'Single Sign-On (SSO)',
  [FEATURE_KEYS.SUPPORT_STANDARD]: 'Standard Support',
  [FEATURE_KEYS.SUPPORT_PRIORITY]: 'Priority Support',
  [FEATURE_KEYS.BULK_OPERATIONS]: 'Bulk Operations',
  [FEATURE_KEYS.PLAYER_DEVELOPMENT]: 'Player Development System',
  [FEATURE_KEYS.FEATURE_REQUESTS]: 'Feature Request Queue',
};

// Feature descriptions for tooltips/help text
export const FEATURE_DESCRIPTIONS: Record<FeatureKey, string> = {
  [FEATURE_KEYS.SESSION_MANAGEMENT]: 'Create and manage training sessions with capacity tracking',
  [FEATURE_KEYS.LOCATION_LINKS]: 'Clickable Google Maps links for all session locations',
  [FEATURE_KEYS.PARENT_PORTAL]: 'Dedicated portal for parents to manage their children\'s bookings',
  [FEATURE_KEYS.WAITLIST_MANUAL]: 'Manual promotion of players from session waitlists',
  [FEATURE_KEYS.WAITLIST_AUTO_PROMOTE]: 'Automatic waitlist promotion with payment windows',
  [FEATURE_KEYS.NOTIFICATIONS_EMAIL]: 'Automated email notifications for bookings and updates',
  [FEATURE_KEYS.NOTIFICATIONS_SMS]: 'SMS notifications for urgent updates and confirmations',
  [FEATURE_KEYS.ANALYTICS_BASIC]: 'Essential reporting on attendance and revenue basics',
  [FEATURE_KEYS.ANALYTICS_ADVANCED]: 'AI-powered analytics with predictive insights, retention forecasting, and business intelligence',
  [FEATURE_KEYS.PAYMENTS_ENABLED]: 'Integrated Stripe payment processing for bookings',
  [FEATURE_KEYS.INTEGRATIONS_CALENDAR]: 'Sync sessions with Google Calendar and other calendar apps',
  [FEATURE_KEYS.INTEGRATIONS_MAILCHIMP]: 'Email marketing integration with Mailchimp',
  [FEATURE_KEYS.INTEGRATIONS_QUICKBOOKS]: 'Accounting integration with QuickBooks Online',
  [FEATURE_KEYS.INTEGRATIONS_BRAINTREE]: 'Alternative payment gateway integration with Braintree for PayPal and card processing',
  [FEATURE_KEYS.INTEGRATIONS_ZAPIER]: 'Connect with hundreds of apps via Zapier',
  [FEATURE_KEYS.API_READ_ONLY]: 'Read-only API access for data sync and reporting',
  [FEATURE_KEYS.API_FULL_ACCESS]: 'Full API access for custom integrations and automation',
  [FEATURE_KEYS.MULTI_TENANT]: 'Manage multiple locations or clubs from one account',
  [FEATURE_KEYS.SSO]: 'Single Sign-On integration for staff with Google/Microsoft',
  [FEATURE_KEYS.SUPPORT_STANDARD]: '48-hour email support response time',
  [FEATURE_KEYS.SUPPORT_PRIORITY]: '24-hour priority support with dedicated account manager',
  [FEATURE_KEYS.BULK_OPERATIONS]: 'Mass upload sessions and players via CSV imports',
  [FEATURE_KEYS.PLAYER_DEVELOPMENT]: 'Comprehensive player tracking with assessments, goals, and training plans',
  [FEATURE_KEYS.FEATURE_REQUESTS]: 'Submit feature requests with prioritized review based on your subscription level',
};