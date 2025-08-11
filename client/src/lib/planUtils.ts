import { plans, type PlanConfig } from '@/config/plans.config';

export { plans };

export function getPlan(planId: string): PlanConfig | undefined {
  return plans.find(p => p.id === planId);
}

export function isFeatureIncluded(planId: string, featureKey: string): boolean {
  const plan = getPlan(planId);
  const f = plan?.features?.[featureKey];
  return f?.status === 'included';
}

export function featureLabel(planId: string, featureKey: string): {name: string; description?: string; included: boolean} {
  const plan = getPlan(planId);
  const f = plan?.features?.[featureKey];
  return { name: f?.name ?? featureKey, description: f?.description, included: f?.status === 'included' };
}

export function upgradeTargetFor(featureKey: string): 'core'|'growth'|'elite'|null {
  // Return the cheapest plan that includes this feature
  const order: Array<'free'|'core'|'growth'|'elite'> = ['free','core','growth','elite'];
  for (const pid of order) {
    const p = getPlan(pid);
    if (p?.features?.[featureKey]?.status === 'included') return pid as any;
  }
  return null;
}

export function getFeaturesByCategory(planId: string) {
  const plan = getPlan(planId);
  if (!plan) return {};

  return {
    'Core': ['sessionManagement', 'parentPlayerBooking'],
    'Payments': ['payments', 'paymentIntegrations'],
    'Communications': ['emailNotifications', 'smsNotifications', 'emailSmsGateway'],
    'Analytics': ['analytics'],
    'Waitlist': ['waitlist'],
    'Data Tools': ['csvExport', 'csvImport'],
    'Operations': ['bulkOperations'],
    'Codes': ['accessCodes', 'discountCodes'],
    'API': ['apiAccess', 'apiIntegrations'],
    'Support': ['support'],
    'Development': ['playerDevelopment'],
    'Integrations': ['calendarIntegration'],
    'Requests': ['featureRequests'],
  };
}