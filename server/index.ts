import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { startWaitlistProcessor } from "./jobs/waitlist-processor";
import superAdminRoutes from './routes/superAdmin'; // Import superAdminRoutes
import adminCampaignsRoutes from './admin-campaigns-routes'; // Import admin campaigns routes
import { ensureAdminUser } from './init-admin'; // Import admin initialization
// Lazy load background jobs to reduce startup time
let jobsInitialized = false;
const initializeBackgroundJobs = async () => {
  if (jobsInitialized) return;
  jobsInitialized = true;
  
  // Initialize all background jobs
  await import('./jobs/capacity-monitor');
  await import('./jobs/session-status');
  await import('./jobs/scheduler'); // Initialize usage rollup scheduler  
  const { scheduleBirthdayUpshift } = await import('./jobs/birthday-upshift');
  const { scheduleAgeTransitionProcessor } = await import('./jobs/age-transition');
  scheduleBirthdayUpshift();
  scheduleAgeTransitionProcessor();
};
import { rateLimitMiddleware, ipRestrictionMiddleware, sessionMonitoringMiddleware } from './middleware/security';
import policyRouter from './routes/policy';
import signupRouter from './routes/signup';
import consentRouter from './routes/consent';
import guardianRouter from './routes/guardian';
import companySignupRouter from './routes/company-signup';
import { superAdminEmailRouter } from './routes/super-admin-email';
import authVerificationRouter from './routes/auth-verification';
import userRouter from './routes/user';
import authRedirectRouter from './routes/auth-redirect';
import { stripeWebhookRouter } from './stripe-webhooks';
import creditsRouter from './routes/credits';
import templatesRouter from './routes/templates';
import notificationsRouter from './routes/notifications';
import contactGroupsRouter from './routes/contact-groups';
import terminologyRouter from './routes/terminology';

const app = express();

// CORS configuration for production domain
app.use((req, res, next) => {
  const allowedOrigins = [
    'https://playhq.app',
    'https://www.playhq.app',
    'http://localhost:5000',
    'http://localhost:5173'
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin as string)) {
    res.setHeader('Access-Control-Allow-Origin', origin as string);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }

  next();
});

// Webhook needs raw body parsing before JSON middleware
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Apply security middleware
app.use(rateLimitMiddleware);
app.use(ipRestrictionMiddleware);
app.use(sessionMonitoringMiddleware);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Clean API request logging (removed verbose debug logs)

  // Mount auth redirect to handle legacy /api/login URLs
  app.use('/api', authRedirectRouter);
  
  // Stripe webhook routes are already mounted in registerRoutes - removing duplicate
  
  // Mount auth verification routes FIRST to avoid any conflicts
  app.use('/api/auth', authVerificationRouter);

  // Mount public routes BEFORE authentication
  app.use('/api', signupRouter);
  app.use('/api', companySignupRouter);
  
  // Ensure admin user exists for testing
  await ensureAdminUser();
  
  const server = await registerRoutes(app);
  
  // Mount user routes
  app.use('/api/user', userRouter);

  // Mount superAdmin routes
  app.use('/api/super-admin', superAdminRoutes);
  
  // Mount super admin email routes
  app.use('/api/super-admin', superAdminEmailRouter);
  
  // Mount admin campaigns routes
  app.use('/api/admin', adminCampaignsRoutes);
  
  // Mount credits routes
  app.use('/api', creditsRouter);
  
  // Mount communication system routes (with auth check)
  app.use('/api', (req: any, res, next) => {
    // For these routes, ensure req.user is populated from session
    if (req.session?.userId && !req.user) {
      req.user = { id: req.session.userId, claims: { sub: req.session.userId } };
    }
    next();
  }, templatesRouter);
  app.use('/api', (req: any, res, next) => {
    if (req.session?.userId && !req.user) {
      req.user = { id: req.session.userId, claims: { sub: req.session.userId } };
    }
    next();
  }, notificationsRouter);
  app.use('/api', (req: any, res, next) => {
    if (req.session?.userId && !req.user) {
      req.user = { id: req.session.userId, claims: { sub: req.session.userId } };
    }
    next();
  }, contactGroupsRouter);
  
  // Old invitation routes removed - using unified system
  
  // Mount age policy routes
  app.use('/api', policyRouter);
  app.use('/api', consentRouter);
  app.use('/api', guardianRouter);
  
  // Mount terminology routes
  app.use('/api', terminologyRouter);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  const host = '0.0.0.0'; // Explicitly bind to all interfaces for Replit deployment
  
  server.listen(port, host, () => {
    if (process.env.NODE_ENV === 'production') {
      console.log(`PlayHQ server running on http://${host}:${port}`);
    } else {
      log(`serving on http://${host}:${port}`);
    }
    
    // Start background processors after server is up
    setTimeout(() => {
      startWaitlistProcessor();
      initializeBackgroundJobs();
    }, 1000); // Delay background jobs to ensure server is fully initialized
  });

  // Background job to clean up expired reservations - delayed start
  setTimeout(() => {
    setInterval(async () => {
    try {
      const { storage } = await import("./storage");
      const cutoff = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
      const expiredSignups = await storage.getPendingPaymentSignups();

      const expiredReservations = expiredSignups.filter(signup => 
        signup.createdAt && new Date(signup.createdAt) < cutoff
      );

      for (const signup of expiredReservations) {
        await storage.deleteSignup(signup.id);
        log(`Expired reservation cleaned up: ${signup.id} for player ${signup.player.firstName}`);

        // TODO: Optional - notify parent of cancellation via SMS/email
      }

      if (expiredReservations.length > 0) {
        log(`Cleaned up ${expiredReservations.length} expired reservations`);
      }
    } catch (error) {
      console.error("Error cleaning up expired reservations:", error);
    }
    }, 15 * 60 * 1000); // Run every 15 minutes
  }, 10000); // Start cleanup job after 10 seconds
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
})();