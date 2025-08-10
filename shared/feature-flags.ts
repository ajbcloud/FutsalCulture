import { PlanLevel, FEATURE_KEYS, type FeatureKey } from './schema';

// Feature configurations for each plan level
export const PLAN_FEATURES: Record<PlanLevel | 'free', Record<FeatureKey, boolean>> = {
  free: {
    [FEATURE_KEYS.SESSION_MANAGEMENT]: true,
    [FEATURE_KEYS.LOCATION_LINKS]: false,
    [FEATURE_KEYS.PARENT_PORTAL]: true,
    [FEATURE_KEYS.THEME_CUSTOMIZATION]: false,
    [FEATURE_KEYS.WAITLIST_MANUAL]: false,
    [FEATURE_KEYS.WAITLIST_AUTO_PROMOTE]: false,
    [FEATURE_KEYS.NOTIFICATIONS_EMAIL]: true,
    [FEATURE_KEYS.NOTIFICATIONS_SMS]: false,
    [FEATURE_KEYS.ANALYTICS_BASIC]: false,
    [FEATURE_KEYS.ANALYTICS_ADVANCED]: false,
    [FEATURE_KEYS.PAYMENTS_ENABLED]: false,
    [FEATURE_KEYS.INTEGRATIONS_CALENDAR]: false,
    [FEATURE_KEYS.INTEGRATIONS_MAILCHIMP]: false,
    [FEATURE_KEYS.INTEGRATIONS_QUICKBOOKS]: false,
    [FEATURE_KEYS.INTEGRATIONS_ZAPIER]: false,
    [FEATURE_KEYS.API_READ_ONLY]: false,
    [FEATURE_KEYS.API_FULL_ACCESS]: false,
    [FEATURE_KEYS.MULTI_TENANT]: false,
    [FEATURE_KEYS.SSO]: false,
    [FEATURE_KEYS.SUPPORT_STANDARD]: true,
    [FEATURE_KEYS.SUPPORT_PRIORITY]: false,
  },
  core: {
    [FEATURE_KEYS.SESSION_MANAGEMENT]: true,
    [FEATURE_KEYS.LOCATION_LINKS]: true,
    [FEATURE_KEYS.PARENT_PORTAL]: true,
    [FEATURE_KEYS.THEME_CUSTOMIZATION]: false,
    [FEATURE_KEYS.WAITLIST_MANUAL]: true,
    [FEATURE_KEYS.WAITLIST_AUTO_PROMOTE]: false,
    [FEATURE_KEYS.NOTIFICATIONS_EMAIL]: true,
    [FEATURE_KEYS.NOTIFICATIONS_SMS]: false,
    [FEATURE_KEYS.ANALYTICS_BASIC]: true,
    [FEATURE_KEYS.ANALYTICS_ADVANCED]: false,
    [FEATURE_KEYS.PAYMENTS_ENABLED]: false,
    [FEATURE_KEYS.INTEGRATIONS_CALENDAR]: false,
    [FEATURE_KEYS.INTEGRATIONS_MAILCHIMP]: false,
    [FEATURE_KEYS.INTEGRATIONS_QUICKBOOKS]: false,
    [FEATURE_KEYS.INTEGRATIONS_ZAPIER]: false,
    [FEATURE_KEYS.API_READ_ONLY]: false,
    [FEATURE_KEYS.API_FULL_ACCESS]: false,
    [FEATURE_KEYS.MULTI_TENANT]: false,
    [FEATURE_KEYS.SSO]: false,
    [FEATURE_KEYS.SUPPORT_STANDARD]: true,
    [FEATURE_KEYS.SUPPORT_PRIORITY]: false,
  },
  growth: {
    [FEATURE_KEYS.SESSION_MANAGEMENT]: true,
    [FEATURE_KEYS.LOCATION_LINKS]: true,
    [FEATURE_KEYS.PARENT_PORTAL]: true,
    [FEATURE_KEYS.THEME_CUSTOMIZATION]: false,
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
    [FEATURE_KEYS.INTEGRATIONS_ZAPIER]: false,
    [FEATURE_KEYS.API_READ_ONLY]: true,
    [FEATURE_KEYS.API_FULL_ACCESS]: false,
    [FEATURE_KEYS.MULTI_TENANT]: false,
    [FEATURE_KEYS.SSO]: false,
    [FEATURE_KEYS.SUPPORT_STANDARD]: false,
    [FEATURE_KEYS.SUPPORT_PRIORITY]: true,
  },
  elite: {
    [FEATURE_KEYS.SESSION_MANAGEMENT]: true,
    [FEATURE_KEYS.LOCATION_LINKS]: true,
    [FEATURE_KEYS.PARENT_PORTAL]: true,
    [FEATURE_KEYS.THEME_CUSTOMIZATION]: true,
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
    [FEATURE_KEYS.INTEGRATIONS_ZAPIER]: true,
    [FEATURE_KEYS.API_READ_ONLY]: true,
    [FEATURE_KEYS.API_FULL_ACCESS]: true,
    [FEATURE_KEYS.MULTI_TENANT]: true,
    [FEATURE_KEYS.SSO]: true,
    [FEATURE_KEYS.SUPPORT_STANDARD]: false,
    [FEATURE_KEYS.SUPPORT_PRIORITY]: true,
  },
};

// Plan limits and configurations
export const PLAN_LIMITS = {
  core: {
    maxPlayers: 150,
    price: 99,
    billingPeriod: 'monthly' as const,
    name: 'Core',
    description: 'Perfect for small clubs getting started with digital management',
  },
  growth: {
    maxPlayers: 500,
    price: 199,
    billingPeriod: 'monthly' as const,
    name: 'Growth',
    description: 'Ideal for established clubs looking to automate and grow',
  },
  elite: {
    maxPlayers: null, // unlimited
    price: 499,
    billingPeriod: 'monthly' as const,
    name: 'Elite',
    description: 'Enterprise-grade features for multi-location organizations',
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
    FEATURE_KEYS.THEME_CUSTOMIZATION,
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

// Get user-friendly feature names
export const FEATURE_NAMES: Record<FeatureKey, string> = {
  [FEATURE_KEYS.SESSION_MANAGEMENT]: 'Session Management',
  [FEATURE_KEYS.LOCATION_LINKS]: 'Google Maps Integration',
  [FEATURE_KEYS.PARENT_PORTAL]: 'Parent Portal',
  [FEATURE_KEYS.THEME_CUSTOMIZATION]: 'Custom Branding & Themes',
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
  [FEATURE_KEYS.INTEGRATIONS_ZAPIER]: 'Zapier Integration',
  [FEATURE_KEYS.API_READ_ONLY]: 'Read-Only API Access',
  [FEATURE_KEYS.API_FULL_ACCESS]: 'Full API Access',
  [FEATURE_KEYS.MULTI_TENANT]: 'Multi-Location Management',
  [FEATURE_KEYS.SSO]: 'Single Sign-On (SSO)',
  [FEATURE_KEYS.SUPPORT_STANDARD]: 'Standard Support',
  [FEATURE_KEYS.SUPPORT_PRIORITY]: 'Priority Support',
};

// Feature descriptions for tooltips/help text
export const FEATURE_DESCRIPTIONS: Record<FeatureKey, string> = {
  [FEATURE_KEYS.SESSION_MANAGEMENT]: 'Create and manage training sessions with capacity tracking',
  [FEATURE_KEYS.LOCATION_LINKS]: 'Clickable Google Maps links for all session locations',
  [FEATURE_KEYS.PARENT_PORTAL]: 'Dedicated portal for parents to manage their children\'s bookings',
  [FEATURE_KEYS.THEME_CUSTOMIZATION]: 'Custom colors, logos, and branding throughout the platform',
  [FEATURE_KEYS.WAITLIST_MANUAL]: 'Manual promotion of players from session waitlists',
  [FEATURE_KEYS.WAITLIST_AUTO_PROMOTE]: 'Automatic waitlist promotion with payment windows',
  [FEATURE_KEYS.NOTIFICATIONS_EMAIL]: 'Automated email notifications for bookings and updates',
  [FEATURE_KEYS.NOTIFICATIONS_SMS]: 'SMS notifications for urgent updates and confirmations',
  [FEATURE_KEYS.ANALYTICS_BASIC]: 'Basic reporting on attendance and revenue',
  [FEATURE_KEYS.ANALYTICS_ADVANCED]: 'Detailed analytics with trends, retention, and forecasting',
  [FEATURE_KEYS.PAYMENTS_ENABLED]: 'Integrated Stripe payment processing for bookings',
  [FEATURE_KEYS.INTEGRATIONS_CALENDAR]: 'Sync sessions with Google Calendar and other calendar apps',
  [FEATURE_KEYS.INTEGRATIONS_MAILCHIMP]: 'Email marketing integration with Mailchimp',
  [FEATURE_KEYS.INTEGRATIONS_QUICKBOOKS]: 'Accounting integration with QuickBooks Online',
  [FEATURE_KEYS.INTEGRATIONS_ZAPIER]: 'Connect with hundreds of apps via Zapier',
  [FEATURE_KEYS.API_READ_ONLY]: 'Read-only API access for data sync and reporting',
  [FEATURE_KEYS.API_FULL_ACCESS]: 'Full API access for custom integrations and automation',
  [FEATURE_KEYS.MULTI_TENANT]: 'Manage multiple locations or clubs from one account',
  [FEATURE_KEYS.SSO]: 'Single Sign-On integration for staff with Google/Microsoft',
  [FEATURE_KEYS.SUPPORT_STANDARD]: '48-hour email support response time',
  [FEATURE_KEYS.SUPPORT_PRIORITY]: '24-hour priority support with dedicated account manager',
};