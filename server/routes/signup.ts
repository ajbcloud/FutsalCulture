import { Router } from "express";
import { db } from "../db";
import { tenantPolicies } from "../../shared/db/schema/tenantPolicy";
import { users, tenants, inviteTokens, tenantMemberships, players } from "../../shared/schema";
import { eq } from "drizzle-orm";
import { evaluatePolicy } from "../services/agePolicy";
import bcrypt from 'bcrypt';

export const signupRouter = Router();

// Evaluate signup flow based on date of birth
signupRouter.post("/signup/evaluate", async (req: any, res) => {
  try {
    const tenantId = req.body.tenantId || req.user?.tenantId;
    const { dob } = req.body; // ISO string
    
    if (!dob) {
      return res.status(400).json({ error: "Date of birth required" });
    }
    
    // For signup evaluation, we can use default policy if no tenant ID provided
    let policyData;
    
    if (tenantId) {
      // Get tenant-specific policy
      const [policy] = await db.select().from(tenantPolicies).where(eq(tenantPolicies.tenantId, tenantId));
      policyData = policy;
    }
    
    // Use default policy if none exists for tenant or no tenant provided
    policyData = policyData || {
      audienceMode: "mixed" as const,
      parentRequiredBelow: 13,
      teenSelfAccessAt: 13,
      adultAge: 18,
      allowTeenPayments: false,
    };
    
    // Evaluate policy based on date of birth
    const outcome = evaluatePolicy({ 
      dob: new Date(dob), 
      policy: {
        audienceMode: policyData.audienceMode as "mixed" | "parents" | "players",
        parentRequiredBelow: policyData.parentRequiredBelow,
        teenSelfAccessAt: policyData.teenSelfAccessAt,
        adultAge: policyData.adultAge,
        allowTeenPayments: policyData.allowTeenPayments,
      }
    });
    
    res.json({ 
      outcome,
      policy: policyData,
    });
  } catch (error) {
    console.error("Error evaluating signup:", error);
    res.status(500).json({ error: "Failed to evaluate signup flow" });
  }
});

// Accept invitation endpoint
signupRouter.post('/accept-invite', async (req, res) => {
  try {
    const { token, password, firstName, lastName } = req.body;
    
    if (!token || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Find and validate the token
    const inviteToken = await db.select({
      id: inviteTokens.id,
      tenantId: inviteTokens.tenantId,
      invitedEmail: inviteTokens.invitedEmail,
      role: inviteTokens.role,
      playerId: inviteTokens.playerId,
      expiresAt: inviteTokens.expiresAt,
      usedAt: inviteTokens.usedAt,
    })
    .from(inviteTokens)
    .where(eq(inviteTokens.token, token))
    .limit(1);
    
    if (!inviteToken[0]) {
      return res.status(404).json({ error: 'Invalid invitation token' });
    }
    
    const invite = inviteToken[0];
    
    // Check if already used
    if (invite.usedAt) {
      return res.status(400).json({ error: 'This invitation has already been used' });
    }
    
    // Check if expired
    if (new Date() > new Date(invite.expiresAt)) {
      return res.status(400).json({ error: 'This invitation has expired' });
    }
    
    // Check if user already exists
    const existingUser = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.email, invite.invitedEmail))
      .limit(1);
    
    let userId: string;
    
    if (existingUser.length > 0 && existingUser[0]) {
      // User exists, just create membership
      userId = existingUser[0].id;
    } else {
      // Create new user
      const passwordHash = await bcrypt.hash(password, 10);
      
      const [newUser] = await db.insert(users)
        .values({
          email: invite.invitedEmail,
          firstName,
          lastName,
          passwordHash,
          authProvider: 'local',
          verificationStatus: 'verified', // Auto-verify invited users
          tenantId: invite.tenantId, // Set primary tenant
        })
        .returning();
      userId = newUser.id;
    }
    
    // Create tenant membership
    await db.insert(tenantMemberships)
      .values({
        userId,
        tenantId: invite.tenantId,
        role: invite.role,
        status: 'active',
      });
    
    // If invite was for a player and player is 13+, link player to user
    if (invite.playerId && invite.role === 'player') {
      await db.update(players)
        .set({ userId })
        .where(eq(players.id, invite.playerId));
    }
    
    // Mark token as used
    await db.update(inviteTokens)
      .set({ usedAt: new Date() })
      .where(eq(inviteTokens.id, invite.id));
    
    // Send welcome email (non-blocking)
    try {
      const tenantInfo = await db.select({ name: tenants.name })
        .from(tenants)
        .where(eq(tenants.id, invite.tenantId))
        .limit(1);
      
      if (tenantInfo[0]) {
        const { sendWelcomeEmail } = await import('../utils/email-service');
        await sendWelcomeEmail({
          to: invite.invitedEmail,
          firstName,
          tenantName: tenantInfo[0].name,
          role: invite.role as 'parent' | 'player',
        });
      }
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Continue without failing the response
    }
    
    res.json({
      message: 'Invitation accepted successfully',
      userId,
      tenantId: invite.tenantId,
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    
    if (error instanceof Error && error.message.includes('token')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to accept invitation' });
  }
});

export default signupRouter;