
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
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


  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      // Handle null or undefined id gracefully
      if (!id) {
        return done(null, null);
      }
      const user = await storage.getUser(id);
      done(null, user || null);
    } catch (error) {
      // Don't throw errors during deserialization, just return null user
      console.error('Deserialization error:', error);
      done(null, null);
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

}

export const isAuthenticated = async (req: any, res: any, next: any) => {
  // Check if user is already set by Clerk middleware (syncClerkUser)
  if (req.user) {
    return next();
  }
  
  // Fallback: Check for Passport.js authentication (legacy)
  if (typeof req.isAuthenticated === 'function' && req.isAuthenticated()) {
    return next();
  }
  
  // Fallback: Check for legacy session-based authentication
  if (req.session?.userId) {
    try {
      const { storage } = await import('./storage');
      const user = await storage.getUser(req.session.userId);
      if (user) {
        req.user = user;
        req.userId = user.id;
        return next();
      }
    } catch (error) {
      console.error('Error fetching session user:', error);
    }
  }
  
  res.status(401).json({ message: "Authentication required" });
};
