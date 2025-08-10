export type FeatureKey =
  | 'maxPlayers'
  | 'manualSessions'
  | 'recurringSessions'
  | 'csvImport'
  | 'payments'
  | 'emailNotifications'
  | 'smsNotifications'
  | 'advancedAnalytics'
  | 'revenueAnalytics'
  | 'autoPromotion'
  | 'bulkOps'
  | 'themeCustomization'
  | 'customFeatureQueue'
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
      recurringSessions: false,
      csvImport: false,
      payments: false,
      emailNotifications: false,
      smsNotifications: false,
      advancedAnalytics: false,
      revenueAnalytics: false,
      autoPromotion: false,
      bulkOps: false,
      themeCustomization: false,
      customFeatureQueue: false,
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
      manualSessions: true,
      recurringSessions: true,
      csvImport: false,
      payments: true,
      emailNotifications: true,
      smsNotifications: false,
      advancedAnalytics: 'basic' as const,
      revenueAnalytics: false, // Basic analytics only, no revenue tracking
      autoPromotion: false,
      bulkOps: false,
      themeCustomization: false,
      customFeatureQueue: false,
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
      manualSessions: true,
      recurringSessions: true,
      csvImport: true,
      payments: true,
      emailNotifications: true,
      smsNotifications: true,
      advancedAnalytics: 'advanced' as const,
      revenueAnalytics: true, // Revenue analytics available since they can accept payments
      autoPromotion: true,
      bulkOps: true,
      themeCustomization: false, // Now Elite-only
      customFeatureQueue: false,
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
      manualSessions: true,
      recurringSessions: true,
      csvImport: true,
      payments: true,
      emailNotifications: true,
      smsNotifications: true,
      advancedAnalytics: 'elite' as const, // Enhanced with multi-location, progression, forecasting
      revenueAnalytics: true, // Full revenue analytics available
      autoPromotion: true,
      bulkOps: true,
      themeCustomization: true, // Elite-only feature
      customFeatureQueue: true, // NEW Elite feature
      prioritySupport: true, // NEW Elite feature
      apiAccess: true,
      whiteLabelEmail: true,
      playerDevelopment: true, // Elite-only comprehensive player development system
    },
  },
} as const;

export type PlanId = keyof typeof PLANS;
export type Plan = typeof PLANS[PlanId];