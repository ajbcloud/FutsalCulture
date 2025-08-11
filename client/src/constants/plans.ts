export type FeatureKey =
  | 'maxPlayers'
  | 'manualSessions'
  | 'parentPlayerBooking'
  | 'emailSmsNotifications'
  | 'recurringSessions'
  | 'csvImport'
  | 'payments'
  | 'emailNotifications'
  | 'smsNotifications'
  | 'advancedAnalytics'
  | 'revenueAnalytics'
  | 'autoPromotion'
  | 'bulkOps'
  | 'featureRequests'
  | 'prioritySupport'
  | 'apiAccess'
  | 'whiteLabelEmail'
  | 'playerDevelopment';

export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    features: {
      maxPlayers: 10,
      manualSessions: true,
      parentPlayerBooking: true,
      emailSmsNotifications: false,
      recurringSessions: false,
      csvImport: false,
      payments: false,
      emailNotifications: false,
      smsNotifications: false,
      advancedAnalytics: false,
      revenueAnalytics: false,
      autoPromotion: false,
      bulkOps: false,
      featureRequests: false,
      prioritySupport: false,
      apiAccess: false,
      whiteLabelEmail: false,
      playerDevelopment: false,
    },
  },
  core: {
    id: 'core',
    name: 'Core',
    price: 99,
    features: {
      maxPlayers: 150,
      manualSessions: false, // Core doesn't include manual session creation
      parentPlayerBooking: false, // Core doesn't include basic booking functionality
      emailSmsNotifications: false, // Core only has email, no SMS
      recurringSessions: true,
      csvImport: false,
      payments: false, // Core doesn't include online payments
      emailNotifications: true, // Only email notifications, no SMS
      smsNotifications: false, // No SMS in Core
      advancedAnalytics: 'basic' as const,
      revenueAnalytics: false,
      autoPromotion: false,
      bulkOps: false,
      featureRequests: 'low' as const,
      prioritySupport: false,
      apiAccess: false,
      whiteLabelEmail: false,
      playerDevelopment: false,
    },
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    price: 199,
    features: {
      maxPlayers: 500,
      manualSessions: false, // Growth doesn't include basic manual sessions
      parentPlayerBooking: false, // Growth doesn't include basic booking (only Free has this)
      emailSmsNotifications: true, // Growth includes both email and SMS
      recurringSessions: true,
      csvImport: true,
      payments: true, // Growth includes online payments
      emailNotifications: true,
      smsNotifications: true, // Growth includes SMS
      advancedAnalytics: 'advanced' as const,
      revenueAnalytics: true,
      autoPromotion: true,
      bulkOps: true,
      featureRequests: 'medium' as const,
      prioritySupport: false,
      apiAccess: false,
      whiteLabelEmail: true,
      playerDevelopment: false,
    },
  },
  elite: {
    id: 'elite',
    name: 'Elite',
    price: 499,
    features: {
      maxPlayers: 'unlimited' as const,
      manualSessions: false, // Elite doesn't include basic manual sessions (only Free has this)
      parentPlayerBooking: false, // Elite doesn't include basic booking (only Free has this)
      emailSmsNotifications: true,
      recurringSessions: true,
      csvImport: true,
      payments: true,
      emailNotifications: true,
      smsNotifications: true,
      advancedAnalytics: 'elite' as const,
      revenueAnalytics: true,
      autoPromotion: true,
      bulkOps: true,
      featureRequests: 'high' as const,
      prioritySupport: true,
      apiAccess: true,
      whiteLabelEmail: true,
      playerDevelopment: true,
    },
  },
} as const;

export type PlanId = keyof typeof PLANS;
export type Plan = typeof PLANS[PlanId];