import { Router } from 'express';
import requireAuth from '../middleware/requireAuth';
import requireSuperAdmin from '../middleware/requireSuperAdmin';
import * as overview from '../controllers/superAdmin/overview';
import * as tenants from '../controllers/superAdmin/tenants';
import * as sessions from '../controllers/superAdmin/sessions';
import * as payments from '../controllers/superAdmin/payments';
import * as registrations from '../controllers/superAdmin/registrations';
import * as parents from '../controllers/superAdmin/parents';
import * as players from '../controllers/superAdmin/players';
import * as analytics from '../controllers/superAdmin/analytics';
import * as help from '../controllers/superAdmin/help';
import * as settings from '../controllers/superAdmin/settings';

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

r.get('/help', help.list);
r.patch('/help/:id', help.update);

r.get('/settings', settings.get);
r.patch('/settings', settings.patch);

export default r;