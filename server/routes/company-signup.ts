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

// Company/tenant signup
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
    
    // TODO: Send verification email with Resend
    // await sendVerificationEmail(validatedData.contact_email, verificationToken);
    
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