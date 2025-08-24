import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { startWaitlistProcessor } from "./jobs/waitlist-processor";
import superAdminRoutes from './routes/superAdmin'; // Import superAdminRoutes
import adminCampaignsRoutes from './admin-campaigns-routes'; // Import admin campaigns routes
import './jobs/scheduler'; // Initialize usage rollup scheduler
import { scheduleBirthdayUpshift } from './jobs/birthday-upshift';
import { scheduleAgeTransitionProcessor } from './jobs/age-transition';
import { rateLimitMiddleware, ipRestrictionMiddleware, sessionMonitoringMiddleware } from './middleware/security';
import policyRouter from './routes/policy';
import signupRouter from './routes/signup';
import consentRouter from './routes/consent';
import guardianRouter from './routes/guardian';

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
  const server = await registerRoutes(app);

  // Mount superAdmin routes
  app.use('/api/super-admin', superAdminRoutes);
  
  // Mount admin campaigns routes
  app.use('/api/admin', adminCampaignsRoutes);
  
  // Mount age policy routes
  app.use('/api', policyRouter);
  app.use('/api', signupRouter);
  app.use('/api', consentRouter);
  app.use('/api', guardianRouter);

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
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    // Start background processors
    startWaitlistProcessor();
    scheduleBirthdayUpshift();
    scheduleAgeTransitionProcessor();
  });

  // Background job to clean up expired reservations (pending payment > 1 hour)
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
})();