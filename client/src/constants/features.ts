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
    label: 'Advanced analytics', 
    description: 'Detailed reporting and business insights' 
  },
  autoPromotion: { 
    label: 'Waitlist auto-promotion', 
    description: 'Automatically promote players from waitlists' 
  },
  bulkOps: { 
    label: 'Bulk operations', 
    description: 'Perform actions on multiple items at once' 
  },
  themeCustomization: { 
    label: 'Theme customization', 
    description: 'Customize colors and branding' 
  },
  apiAccess: { 
    label: 'API access', 
    description: 'Integrate with external systems via REST API' 
  },
  whiteLabelEmail: { 
    label: 'White-label email sending', 
    description: 'Send emails from your custom domain' 
  },
};