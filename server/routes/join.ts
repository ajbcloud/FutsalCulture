import { Router } from "express";
import { db } from "../db";
import { users, tenants, invites } from "../../shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { nanoid } from "nanoid";

export const joinRouter = Router();

const joinByTokenSchema = z.object({
  token: z.string().min(1, "Token is required")
});

const joinByCodeSchema = z.object({
  code: z.string().min(1, "Team code is required"),
  email: z.string().email("Valid email is required"),
  name: z.string().optional()
});

// Join by invite token
joinRouter.post("/join/by-token", async (req: any, res) => {
  try {
    const { token } = joinByTokenSchema.parse(req.body);
    
    // Find the invite
    const [invite] = await db.select()
      .from(invites)
      .where(eq(invites.token, token));
    
    if (!invite) {
      return res.status(400).json({ error: "Invalid or expired invite" });
    }
    
    // For now, assume invites don't expire
    // TODO: Add expiration logic if needed
    
    // Get the tenant
    const [tenant] = await db.select()
      .from(tenants)
      .where(eq(tenants.id, invite.tenantId));
    
    if (!tenant) {
      return res.status(400).json({ error: "Club not found" });
    }
    
    // Create or update user
    let user;
    const existingUsers = await db.select()
      .from(users)
      .where(eq(users.email, invite.email));
    
    if (existingUsers.length > 0) {
      // Update existing user
      [user] = await db.update(users)
        .set({
          tenantId: tenant.id
        })
        .where(eq(users.email, invite.email))
        .returning();
    } else {
      // Create new user
      [user] = await db.insert(users).values({
        email: invite.email,
        firstName: "New",
        lastName: "User",
        tenantId: tenant.id
      }).returning();
    }
    
    // TODO: Mark invite as used if tracking is needed
    
    // Set session if using session auth
    if (req.session) {
      req.session.userId = user.id;
    }
    
    console.log(`User ${user.email} joined ${tenant.name} via invite`);
    
    res.json({ 
      ok: true,
      status: "joined",
      message: "Successfully joined the club"
    });
  } catch (error) {
    console.error("Error joining by token:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Invalid data", 
        details: error.errors 
      });
    }
    res.status(500).json({ error: "Failed to join club" });
  }
});

// Join by team code
joinRouter.post("/join/by-code", async (req: any, res) => {
  try {
    const { code, email, name } = joinByCodeSchema.parse(req.body);
    
    // For now, just return an error since we don't have tenant codes in current schema
    return res.status(400).json({ error: "Team code functionality not yet implemented" });
    
    // Team code functionality will be implemented later
    // Return error for now
  } catch (error) {
    console.error("Error joining by code:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Invalid data", 
        details: error.errors 
      });
    }
    res.status(500).json({ error: "Failed to join club" });
  }
});

export default joinRouter;