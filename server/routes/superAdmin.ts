import { Router } from 'express';
import requireAuth from '../middleware/requireAuth';
import requireSuperAdmin from '../middleware/requireSuperAdmin';
import * as overview from '../controllers/superAdmin/overview';
import * as tenants from '../controllers/superAdmin/tenants';
import * as sessions from '../controllers/superAdmin/sessions';
import * as payments from '../controllers/superAdmin/payments';
import * as platformPayments from '../controllers/superAdmin/platformPayments';
import * as registrations from '../controllers/superAdmin/registrations';
import * as parents from '../controllers/superAdmin/parents';
import * as players from '../controllers/superAdmin/players';
import * as analytics from '../controllers/superAdmin/analytics';
import * as detailedAnalytics from '../controllers/superAdmin/detailedAnalytics';
import * as help from '../controllers/superAdmin/help';
import * as settings from '../controllers/superAdmin/settings';
import * as impersonate from '../controllers/superAdmin/impersonate';
import * as integ from '../controllers/superAdmin/integrationsHealth';
import * as comms from '../controllers/superAdmin/comms';
import * as sec from '../controllers/superAdmin/security';

const r = Router();
r.use(requireAuth, requireSuperAdmin);

r.get('/stats', overview.getStats);

r.get('/tenants', tenants.list);
r.post('/tenants', tenants.create);
r.patch('/tenants/:id', tenants.update);

r.get('/sessions', sessions.list);

r.get('/payments', payments.list);

r.get('/registrations', registrations.list);

r.get('/parents', parents.list);

r.get('/players', players.list);

r.get('/analytics/series', analytics.series);
r.get('/analytics/by-tenant', analytics.byTenant);
r.get('/analytics/overview', analytics.overview);

// Detailed KPI endpoints
r.get('/analytics/platform-billing', detailedAnalytics.platformBillingKPIs);
r.get('/analytics/client-commerce', detailedAnalytics.clientCommerceKPIs);
r.get('/analytics/registrations', detailedAnalytics.registrationKPIs);
r.get('/analytics/players', detailedAnalytics.playerKPIs);
r.get('/analytics/sessions', detailedAnalytics.sessionKPIs);
r.get('/analytics/parents', detailedAnalytics.parentKPIs);
r.get('/analytics/cross-cutting', detailedAnalytics.crossCuttingKPIs);

// Help Request Management routes
r.get('/help-requests', help.list);
r.get('/help-requests/stats', help.getStats);
r.get('/help-requests/export', help.exportToCsv);
r.get('/help-requests/:id', help.getById);
r.post('/help-requests/:id/reply', help.reply);
r.patch('/help-requests/:id', help.update);
r.post('/help-requests/bulk-update', help.bulkUpdate);

// Legacy routes (keep for backward compatibility)
r.get('/help', help.list);
r.patch('/help/:id', help.update);

r.get('/settings', settings.get);
r.patch('/settings', settings.patch);

r.get('/platform-payments', platformPayments.list);

r.post('/impersonate', impersonate.start);

// Integrations & Webhooks Health routes
r.get('/integrations/health/overview', integ.overview);
r.get('/integrations/webhooks/:id/events', integ.events);
r.get('/integrations/webhooks/events/:id/attempts', integ.attempts);
r.post('/integrations/webhooks/events/:id/replay', integ.replay);

// Comms Deliverability routes
r.get('/comms/overview', comms.overview);
r.get('/comms/series',   comms.series);
r.get('/comms/events',   comms.events); // ?channel=email|sms&from=&to=&page=&pageSize=

// Security & Audit routes
r.get('/security/overview', sec.overview);
r.get('/security/impersonations', sec.impersonations);
r.post('/security/impersonations/:id/revoke', sec.revokeImpersonation);
r.get('/security/audit-logs', sec.auditLogs);

export default r;