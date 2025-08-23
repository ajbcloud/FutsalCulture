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

r.get('/help', help.list);
r.patch('/help/:id', help.update);

r.get('/settings', settings.get);
r.patch('/settings', settings.patch);

r.get('/platform-payments', platformPayments.list);

r.post('/impersonate', impersonate.start);

export default r;