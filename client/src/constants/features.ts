import type { FeatureKey } from './plans';

export const FEATURE_LABELS: Record<FeatureKey, {label: string; description?: string}> = {
  maxPlayers: { 
    label: 'Player limit', 
    description: 'Maximum number of players that can be registered' 
  },
  manualSessions: { 
    label: 'Manual session creation', 
    description: 'Create individual training sessions' 
  },
  parentPlayerBooking: { 
    label: 'Parent and player session booking', 
    description: 'Allow parents and players to book session spots' 
  },
  emailSmsNotifications: { 
    label: 'Email & SMS notifications', 
    description: 'Combined email and SMS notification system' 
  },
  recurringSessions: { 
    label: 'Recurring sessions', 
    description: 'Set up weekly, bi-weekly, or monthly recurring sessions' 
  },
  csvImport: { 
    label: 'CSV import (sessions/players)', 
    description: 'Bulk import sessions and players via CSV files' 
  },
  payments: { 
    label: 'Accept online payments', 
    description: 'Collect payments for session bookings via Stripe' 
  },
  emailNotifications: { 
    label: 'Email notifications', 
    description: 'Send automated emails for bookings and updates' 
  },
  smsNotifications: { 
    label: 'SMS notifications', 
    description: 'Send SMS alerts for important updates' 
  },
  advancedAnalytics: { 
    label: 'AI-powered analytics & forecasting', 
    description: 'Machine learning insights, predictive revenue modeling, and intelligent business optimization' 
  },
  revenueAnalytics: { 
    label: 'Revenue analytics', 
    description: 'Detailed revenue tracking and financial insights' 
  },
  autoPromotion: { 
    label: 'Waitlist auto-promotion', 
    description: 'Automatically promote players from waitlists' 
  },
  bulkOps: { 
    label: 'Bulk operations', 
    description: 'Perform actions on multiple items at once' 
  },
  featureRequests: { 
    label: 'Feature request queue', 
    description: 'Submit feature requests with priority based on subscription level' 
  },
  prioritySupport: { 
    label: 'Phone & email priority support', 
    description: 'Direct access to priority support via phone and email' 
  },
  apiAccess: { 
    label: 'API access', 
    description: 'Integrate with external systems via REST API' 
  },
  whiteLabelEmail: { 
    label: 'White-label email sending', 
    description: 'Send emails from your custom domain' 
  },
  playerDevelopment: { 
    label: 'Advanced player development system', 
    description: 'Comprehensive skill assessments, goal tracking, training plans, and progress analytics for individual player growth' 
  },
};