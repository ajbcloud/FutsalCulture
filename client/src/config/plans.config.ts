export type FeatureStatus = 'included' | 'not_included' | 'upgraded';

export interface PlanFeature {
  name: string;
  description?: string;
  status: FeatureStatus;
  upgradeLabel?: string; // Shown if status = upgraded
}

export interface PlanConfig {
  id: string;
  name: string;
  price: number; // monthly in USD
  playerLimit: number | 'unlimited';
  features: Record<string, PlanFeature>;
}

export const plans: PlanConfig[] = [
  {
    id: 'free',
    name: 'Starter',
    price: 0,
    playerLimit: 10,
    features: {
      sessionManagement: { name: 'Session Management', description: 'Manual only', status: 'included' },
      parentPlayerBooking: { name: 'Adult/Player Booking', status: 'included' },
      payments: { name: 'Accept Online Payments', status: 'not_included' },
      emailNotifications: { name: 'Email Notifications', status: 'not_included' },
      smsNotifications: { name: 'SMS Notifications', status: 'not_included' },
      analytics: { name: 'Analytics', description: 'Not available', status: 'not_included' },
      waitlist: { name: 'Waitlist', status: 'not_included' },
      csvExport: { name: 'CSV Export', status: 'not_included' },
      csvImport: { name: 'CSV Import', status: 'not_included' },
      bulkOperations: { name: 'Bulk Operations', status: 'not_included' },
      accessCodes: { name: 'Access Codes', status: 'not_included' },
      discountCodes: { name: 'Discount Codes', status: 'not_included' },
      apiAccess: { name: 'API Access', status: 'not_included' },
      support: { name: 'Support Level', description: 'Basic', status: 'included' },
      playerDevelopment: { name: 'Advanced Player Development', status: 'not_included' },
      calendarIntegration: { name: 'Calendar Integrations', status: 'not_included' },
      paymentIntegrations: { name: 'Payment Integrations', status: 'not_included' },
      emailSmsGateway: { name: 'Email/SMS Gateway', status: 'not_included' },
      additionalIntegrations: { name: 'Additional Integrations', description: 'SendGrid, Mailchimp, QuickBooks', status: 'not_included' },
      featureRequests: { name: 'Feature Request Queue', status: 'not_included' },
    }
  },
  {
    id: 'core',
    name: 'Core',
    price: 99,
    playerLimit: 150,
    features: {
      sessionManagement: { name: 'Session Management', description: 'Recurring', status: 'included' },
      parentPlayerBooking: { name: 'Adult/Player Booking', status: 'included' },
      payments: { name: 'Accept Online Payments', status: 'not_included' },
      emailNotifications: { name: 'Email Notifications', status: 'included' },
      smsNotifications: { name: 'SMS Notifications', status: 'not_included' },
      analytics: { name: 'Analytics', description: 'Basic', status: 'included' },
      waitlist: { name: 'Waitlist', description: 'Manual only', status: 'included' },
      csvExport: { name: 'CSV Export', status: 'included' },
      csvImport: { name: 'CSV Import', status: 'not_included' },
      bulkOperations: { name: 'Bulk Operations', status: 'not_included' },
      accessCodes: { name: 'Access Codes', status: 'included' },
      discountCodes: { name: 'Discount Codes', status: 'included' },
      apiAccess: { name: 'API Access', status: 'not_included' },
      support: { name: 'Support Level', description: 'Basic', status: 'included' },
      playerDevelopment: { name: 'Advanced Player Development', status: 'not_included' },
      calendarIntegration: { name: 'Calendar Integrations', status: 'included' },
      paymentIntegrations: { name: 'Payment Integrations', status: 'not_included' },
      emailSmsGateway: { name: 'Email/SMS Gateway', status: 'not_included' },
      additionalIntegrations: { name: 'Additional Integrations', description: 'SendGrid, Mailchimp, QuickBooks', status: 'not_included' },
      featureRequests: { name: 'Feature Request Queue', description: 'Basic queue', status: 'included' },
    }
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 199,
    playerLimit: 500,
    features: {
      sessionManagement: { name: 'Session Management', description: 'Recurring + Bulk', status: 'included' },
      parentPlayerBooking: { name: 'Adult/Player Booking', status: 'included' },
      payments: { name: 'Accept Online Payments', description: 'Stripe only', status: 'included' },
      emailNotifications: { name: 'Email Notifications', status: 'included' },
      smsNotifications: { name: 'SMS Notifications', status: 'included' },
      analytics: { name: 'Analytics', description: 'Advanced', status: 'included' },
      waitlist: { name: 'Waitlist', description: 'Auto-promote', status: 'included' },
      csvExport: { name: 'CSV Export', status: 'included' },
      csvImport: { name: 'CSV Import', status: 'included' },
      bulkOperations: { name: 'Bulk Operations', status: 'included' },
      accessCodes: { name: 'Access Codes', status: 'included' },
      discountCodes: { name: 'Discount Codes', status: 'included' },
      apiAccess: { name: 'API Access', status: 'not_included' },
      support: { name: 'Support Level', description: 'Standard', status: 'included' },
      playerDevelopment: { name: 'Advanced Player Development', status: 'not_included' },
      calendarIntegration: { name: 'Calendar Integrations', status: 'included' },
      paymentIntegrations: { name: 'Payment Integrations', description: 'Stripe only', status: 'included' },
      emailSmsGateway: { name: 'Email/SMS Gateway', status: 'included' },
      additionalIntegrations: { name: 'Additional Integrations', description: 'SendGrid, Mailchimp, QuickBooks', status: 'included' },
      featureRequests: { name: 'Feature Request Queue', description: 'Standard queue', status: 'included' },
    }
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 499,
    playerLimit: 'unlimited',
    features: {
      sessionManagement: { name: 'Session Management', description: 'Recurring + Bulk', status: 'included' },
      parentPlayerBooking: { name: 'Adult/Player Booking', status: 'included' },
      payments: { name: 'Accept Online Payments', description: 'Multiple payment integrations (Stripe, QuickBooks, more)', status: 'included' },
      emailNotifications: { name: 'Email Notifications', status: 'included' },
      smsNotifications: { name: 'SMS Notifications', status: 'included' },
      analytics: { name: 'Analytics', description: 'AI-powered forecasting', status: 'included' },
      waitlist: { name: 'Waitlist', description: 'Auto-promote', status: 'included' },
      csvExport: { name: 'CSV Export', status: 'included' },
      csvImport: { name: 'CSV Import', status: 'included' },
      bulkOperations: { name: 'Bulk Operations', status: 'included' },
      accessCodes: { name: 'Access Codes', status: 'included' },
      discountCodes: { name: 'Discount Codes', status: 'included' },
      apiAccess: { name: 'API Access', status: 'included' },
      support: { name: 'Support Level', description: 'High priority + phone/email', status: 'included' },
      playerDevelopment: { name: 'Advanced Player Development', status: 'included' },
      calendarIntegration: { name: 'Calendar Integrations', status: 'included' },
      paymentIntegrations: { name: 'Payment Integrations', description: 'Stripe + QuickBooks + more', status: 'included' },
      emailSmsGateway: { name: 'Email/SMS Gateway', status: 'included' },
      additionalIntegrations: { name: 'Additional Integrations', description: 'SendGrid, Mailchimp, QuickBooks, Braintree', status: 'included' },
      featureRequests: { name: 'Feature Request Queue', description: 'Priority queue', status: 'included' },
    }
  }
];