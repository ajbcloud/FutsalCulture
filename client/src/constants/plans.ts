export type FeatureKey =
  | 'maxPlayers'
  | 'manualSessions'
  | 'recurringSessions'
  | 'csvImport'
  | 'payments'
  | 'emailNotifications'
  | 'smsNotifications'
  | 'advancedAnalytics'
  | 'autoPromotion'
  | 'bulkOps'
  | 'themeCustomization'
  | 'customFeatureQueue'
  | 'prioritySupport'
  | 'apiAccess'
  | 'whiteLabelEmail';

export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    features: {
      maxPlayers: 10,
      manualSessions: true,
      recurringSessions: false,
      csvImport: false,
      payments: false,
      emailNotifications: false,
      smsNotifications: false,
      advancedAnalytics: false,
      autoPromotion: false,
      bulkOps: false,
      themeCustomization: false,
      customFeatureQueue: false,
      prioritySupport: false,
      apiAccess: false,
      whiteLabelEmail: false,
    },
  },
  core: {
    id: 'core',
    name: 'Core',
    price: 99,
    features: {
      maxPlayers: 150,
      manualSessions: true,
      recurringSessions: true,
      csvImport: false,
      payments: true,
      emailNotifications: true,
      smsNotifications: false,
      advancedAnalytics: 'basic' as const,
      autoPromotion: false,
      bulkOps: false,
      themeCustomization: false,
      customFeatureQueue: false,
      prioritySupport: false,
      apiAccess: false,
      whiteLabelEmail: false,
    },
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    price: 199,
    features: {
      maxPlayers: 500,
      manualSessions: true,
      recurringSessions: true,
      csvImport: true,
      payments: true,
      emailNotifications: true,
      smsNotifications: true,
      advancedAnalytics: 'advanced' as const,
      autoPromotion: true,
      bulkOps: true,
      themeCustomization: false, // Now Elite-only
      customFeatureQueue: false,
      prioritySupport: false,
      apiAccess: false,
      whiteLabelEmail: true,
    },
  },
  elite: {
    id: 'elite',
    name: 'Elite',
    price: 499,
    features: {
      maxPlayers: 'unlimited' as const,
      manualSessions: true,
      recurringSessions: true,
      csvImport: true,
      payments: true,
      emailNotifications: true,
      smsNotifications: true,
      advancedAnalytics: 'elite' as const, // Enhanced with multi-location, progression, forecasting
      autoPromotion: true,
      bulkOps: true,
      themeCustomization: true, // Elite-only feature
      customFeatureQueue: true, // NEW Elite feature
      prioritySupport: true, // NEW Elite feature
      apiAccess: true,
      whiteLabelEmail: true,
    },
  },
} as const;

export type PlanId = keyof typeof PLANS;
export type Plan = typeof PLANS[PlanId];