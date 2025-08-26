
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as MicrosoftStrategy } from "passport-microsoft";
import bcrypt from "bcrypt";
import session from "express-session";
import connectPg from "connect-pg-simple";
import type { Express } from "express";
import { storage } from "./storage";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Local Strategy (Email/Password)
  passport.use(new LocalStrategy(
    { usernameField: 'email' },
    async (email: string, password: string, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        if (!user || !user.passwordHash) {
          return done(null, false, { message: 'Invalid credentials' });
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          return done(null, false, { message: 'Invalid credentials' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback"
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('No email found in Google profile'));
        }

        let user = await storage.getUserByEmail(email);
        if (!user) {
          // Create new user
          user = await storage.upsertUser({
            email,
            firstName: profile.name?.givenName || '',
            lastName: profile.name?.familyName || '',
            profileImageUrl: profile.photos?.[0]?.value,
            authProvider: 'google',
            authProviderId: profile.id,
            isApproved: false,
            registrationStatus: 'pending'
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }));
  }

  // Microsoft OAuth Strategy
  if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
    passport.use(new MicrosoftStrategy({
      clientID: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      callbackURL: "/api/auth/microsoft/callback",
      scope: ['user.read']
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('No email found in Microsoft profile'));
        }

        let user = await storage.getUserByEmail(email);
        if (!user) {
          // Create new user
          user = await storage.upsertUser({
            email,
            firstName: profile.name?.givenName || '',
            lastName: profile.name?.familyName || '',
            authProvider: 'microsoft',
            authProviderId: profile.id,
            isApproved: false,
            registrationStatus: 'pending'
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }));
  }

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Auth routes
  app.post("/api/auth/login", passport.authenticate('local'), (req: any, res) => {
    const user = req.user as any;
    
    // Determine redirect based on user role
    let redirect = "/dashboard"; // Default redirect
    if (user?.isAdmin || user?.isSuperAdmin) {
      redirect = "/admin";
    } else if (user?.isAssistant) {
      redirect = "/admin";
    }
    
    res.json({ 
      success: true, 
      user: req.user,
      redirect 
    });
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName, role } = req.body;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user
      const user = await storage.upsertUser({
        email,
        firstName,
        lastName,
        passwordHash,
        isApproved: false,
        registrationStatus: 'pending'
      });

      res.json({ success: true, message: "Registration successful" });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Google OAuth routes
  app.get("/api/auth/google", passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  }));

  app.get("/api/auth/google/callback", 
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
      res.redirect('/');
    }
  );

  // Microsoft OAuth routes
  app.get("/api/auth/microsoft", passport.authenticate('microsoft'));

  app.get("/api/auth/microsoft/callback",
    passport.authenticate('microsoft', { failureRedirect: '/login' }),
    (req, res) => {
      res.redirect('/');
    }
  );

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destruction error:', err);
        }
        res.json({ success: true });
      });
    });
  });

  // Organization/Club signup endpoint
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { 
        org_name, 
        contact_name, 
        contact_email, 
        country, 
        state, 
        city, 
        zip_code,
        sports, 
        plan_key, 
        accept 
      } = req.body;

      // Validate required fields
      if (!org_name || !contact_name || !contact_email || !accept) {
        return res.status(400).json({ 
          error: "Missing required fields: org_name, contact_name, contact_email, and accept terms" 
        });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(contact_email);
      if (existingUser) {
        return res.status(400).json({ error: "User with this email already exists" });
      }

      // Import necessary modules
      const { db } = await import("./db");
      const { tenants } = await import("../shared/schema");
      const { nanoid } = await import("nanoid");

      // Generate tenant slug and code
      const tenantSlug = org_name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50);
      
      const tenantCode = nanoid(8).toUpperCase();

      // Create tenant
      const [tenant] = await db.insert(tenants).values({
        name: org_name,
        subdomain: tenantSlug,
        city,
        state,
        country
      }).returning();

      // Create owner user
      const user = await storage.upsertUser({
        email: contact_email,
        firstName: contact_name.split(' ')[0] || contact_name,
        lastName: contact_name.split(' ').slice(1).join(' ') || '',
        tenantId: tenant.id,
        isAdmin: true,
        isApproved: true,
        registrationStatus: 'active'
      });

      // Send welcome email (TODO: implement email service)
      console.log(`Created tenant ${tenant.name} for ${contact_email}`);
      
      res.json({ 
        success: true,
        message: "Club created successfully! You can now log in.",
        tenantId: tenant.id,
        tenantSlug: tenantSlug
      });
    } catch (error) {
      console.error("Organization signup error:", error);
      res.status(500).json({ error: "Failed to create club. Please try again." });
    }
  });
}

export const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Authentication required" });
};
