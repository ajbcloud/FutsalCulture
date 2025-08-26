import { Router } from "express";
import { db } from "../db";
import { users, tenants } from "../../shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { nanoid } from "nanoid";

export const companySignupRouter = Router();

const getStartedSchema = z.object({
  org_name: z.string().min(1, "Organization name is required"),
  contact_name: z.string().min(1, "Contact name is required"),
  contact_email: z.string().email("Valid email is required"),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  sports: z.array(z.string()).optional(),
  plan_key: z.string().default("free"),
  accept: z.boolean().refine(val => val === true, "You must accept the terms")
});

// OLD ENDPOINT - Replaced by /api/auth/signup with email verification
// Keeping for reference but disabled
/*
companySignupRouter.post("/get-started", async (req: any, res) => {
  try {
    const validatedData = getStartedSchema.parse(req.body);
    
    // Generate tenant slug and code
    const tenantSlug = validatedData.org_name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
    
    const tenantCode = nanoid(8).toUpperCase();
    const verificationToken = nanoid(32);
    
    // Create tenant
    const [tenant] = await db.insert(tenants).values({
      name: validatedData.org_name,
      subdomain: tenantSlug,
      city: validatedData.city,
      state: validatedData.state,
      country: validatedData.country
    }).returning();
    
    // Create owner user
    const [user] = await db.insert(users).values({
      email: validatedData.contact_email,
      firstName: validatedData.contact_name.split(' ')[0] || validatedData.contact_name,
      lastName: validatedData.contact_name.split(' ').slice(1).join(' ') || '',
      tenantId: tenant.id,
      isAdmin: true
    }).returning();
    
    // Send welcome email
    const { sendEmail } = await import('../emailService');
    await sendEmail({
      to: validatedData.contact_email,
      from: 'welcome@playhq.app',
      subject: 'Welcome to PlayHQ - Your Club is Ready!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Welcome to PlayHQ!</h1>
          <p>Hi ${validatedData.contact_name},</p>
          <p>Congratulations! Your club <strong>${validatedData.org_name}</strong> has been successfully created on PlayHQ.</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Your Club Details:</h3>
            <p><strong>Club Name:</strong> ${validatedData.org_name}</p>
            <p><strong>Contact Email:</strong> ${validatedData.contact_email}</p>
            <p><strong>Club URL:</strong> https://${tenantSlug}.playhq.app</p>
          </div>
          
          <p>You can now log in to your admin dashboard to:</p>
          <ul>
            <li>Set up your first training sessions</li>
            <li>Invite players and parents</li>
            <li>Configure payment settings</li>
            <li>Customize your club settings</li>
          </ul>
          
          <p><a href="https://playhq.app/login" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Get Started →</a></p>
          
          <p>If you have any questions, our support team is here to help at <a href="mailto:support@playhq.app">support@playhq.app</a></p>
          
          <p>Welcome to the PlayHQ family!</p>
          <p>The PlayHQ Team</p>
        </div>
      `,
      text: `Welcome to PlayHQ!\n\nHi ${validatedData.contact_name},\n\nCongratulations! Your club "${validatedData.org_name}" has been successfully created on PlayHQ.\n\nYour club URL: https://${tenantSlug}.playhq.app\n\nYou can now log in to set up your sessions, invite players and parents, and configure your club.\n\nGet started: https://playhq.app/login\n\nFor support, contact us at support@playhq.app\n\nWelcome to PlayHQ!`
    });
    
    console.log(`Created tenant ${tenant.name} for ${validatedData.contact_email}`);
    
    res.json({ 
      ok: true,
      message: "Club created successfully. Check your email for verification."
    });
  } catch (error) {
    console.error("Error creating company:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Invalid data", 
        details: error.errors 
      });
    }
    res.status(500).json({ error: "Failed to create club" });
  }
});
*/

// Email verification
companySignupRouter.get("/verify", async (req: any, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ error: "Verification token required" });
    }
    
    // Find user by verification token - for now, just redirect to login
    // TODO: Implement proper email verification system
    res.redirect("/login");
    return;
    
    // TODO: Implement proper user verification
    // if (!user) {
    //   return res.status(400).json({ error: "Invalid or expired verification token" });
    // }
    
    // This is handled above with early return
  } catch (error) {
    console.error("Error verifying email:", error);
    res.status(500).json({ error: "Failed to verify email" });
  }
});

export default companySignupRouter;