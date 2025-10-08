import { Router } from "express";
import { storage } from "../storage";
import { db } from "../db";
import { userCredits, users, signups, futsalSessions } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

const router = Router();

// GET /api/credits/balance - Get user's available credit balance
router.get('/credits/balance', async (req: any, res) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await storage.getUser(userId);
    if (!user?.tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    // Get available credit balance using storage method
    const balance = await storage.getAvailableCreditBalance(userId, user.tenantId);

    res.json({ 
      balance,
      balanceDollars: (balance / 100).toFixed(2)
    });

  } catch (error) {
    console.error('Error fetching credit balance:', error);
    res.status(500).json({ message: 'Failed to fetch credit balance' });
  }
});

// GET /api/credits/history - Get user's credit history
router.get('/credits/history', async (req: any, res) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await storage.getUser(userId);
    if (!user?.tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    // Get all user credits (both used and unused) using storage method
    const credits = await storage.getUserCredits(userId, user.tenantId);

    // Enrich with session information
    const enrichedCredits = await Promise.all(credits.map(async (credit) => {
      let sessionInfo = null;
      let usedForSessionInfo = null;

      // Get session info for the credit source
      if (credit.sessionId) {
        const session = await db.select({
          title: futsalSessions.title,
          startTime: futsalSessions.startTime,
        })
        .from(futsalSessions)
        .where(eq(futsalSessions.id, credit.sessionId))
        .limit(1);
        
        if (session.length > 0) {
          sessionInfo = {
            title: session[0].title,
            date: session[0].startTime,
          };
        }
      }

      // Get session info for where credit was used
      if (credit.usedForSignupId) {
        const usedSignup = await db.select({
          sessionId: signups.sessionId,
        })
        .from(signups)
        .where(eq(signups.id, credit.usedForSignupId))
        .limit(1);

        if (usedSignup.length > 0) {
          const usedSession = await db.select({
            title: futsalSessions.title,
            startTime: futsalSessions.startTime,
          })
          .from(futsalSessions)
          .where(eq(futsalSessions.id, usedSignup[0].sessionId))
          .limit(1);

          if (usedSession.length > 0) {
            usedForSessionInfo = {
              title: usedSession[0].title,
              date: usedSession[0].startTime,
            };
          }
        }
      }

      return {
        ...credit,
        amountDollars: (credit.amountCents / 100).toFixed(2),
        sessionInfo,
        usedForSessionInfo,
      };
    }));

    res.json({ credits: enrichedCredits });

  } catch (error) {
    console.error('Error fetching credit history:', error);
    res.status(500).json({ message: 'Failed to fetch credit history' });
  }
});

// POST /api/credits/apply - Manually apply credit (admin only)
router.post('/credits/apply', async (req: any, res) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const currentUser = await storage.getUser(userId);
    if (!currentUser?.tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    // Check if user is admin
    if (!currentUser.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { targetUserId, amountCents, reason, expiresAt, applyToHousehold } = req.body;

    if (!targetUserId || !amountCents || !reason) {
      return res.status(400).json({ message: 'Target user ID, amount, and reason are required' });
    }

    if (amountCents <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than zero' });
    }

    // Verify target user exists and belongs to same tenant
    const targetUser = await storage.getUser(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: 'Target user not found' });
    }

    if (targetUser.tenantId !== currentUser.tenantId) {
      return res.status(403).json({ message: 'Cannot apply credit to user from different tenant' });
    }

    // Check if user belongs to a household and if household credit is requested
    let householdId = null;
    let creditUserId = targetUserId;

    if (applyToHousehold) {
      const household = await storage.getUserHousehold(targetUserId, currentUser.tenantId);
      if (!household) {
        return res.status(400).json({ message: 'User is not part of a household. Cannot apply household credit.' });
      }
      householdId = household.id;
      creditUserId = null;
    }

    // Create credit record
    const credit = await storage.createCredit({
      userId: creditUserId,
      householdId,
      tenantId: currentUser.tenantId,
      amountCents,
      reason,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    res.json({
      success: true,
      message: 'Credit applied successfully',
      credit: {
        ...credit,
        amountDollars: (credit.amountCents / 100).toFixed(2),
      },
    });

  } catch (error) {
    console.error('Error applying credit:', error);
    res.status(500).json({ message: 'Failed to apply credit' });
  }
});

// POST /api/credits/use - Use credit during checkout
router.post('/credits/use', async (req: any, res) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await storage.getUser(userId);
    if (!user?.tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    const { signupId, amountCents } = req.body;

    if (!signupId || !amountCents) {
      return res.status(400).json({ message: 'Signup ID and amount are required' });
    }

    if (amountCents <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than zero' });
    }

    // Verify signup exists and belongs to user
    const signup = await db.select()
      .from(signups)
      .where(and(
        eq(signups.id, signupId),
        eq(signups.tenantId, user.tenantId)
      ))
      .limit(1);

    if (!signup.length) {
      return res.status(404).json({ message: 'Signup not found' });
    }

    // Check available credit balance
    const availableBalance = await storage.getAvailableCreditBalance(userId, user.tenantId);
    
    if (availableBalance < amountCents) {
      return res.status(400).json({ 
        message: 'Insufficient credit balance',
        availableBalance,
        requested: amountCents,
      });
    }

    // Get available credits sorted by expiration (oldest first)
    const availableCredits = await storage.getAvailableCredits(userId, user.tenantId);
    
    let remainingAmount = amountCents;
    const usedCredits = [];

    // Use credits in order until we have enough
    for (const credit of availableCredits) {
      if (remainingAmount <= 0) break;

      const amountToUse = Math.min(credit.amountCents, remainingAmount);
      
      // Use this credit
      await storage.useCredit(credit.id, signupId);
      
      usedCredits.push({
        creditId: credit.id,
        amountUsed: amountToUse,
      });

      remainingAmount -= amountToUse;
    }

    res.json({
      success: true,
      message: 'Credits applied successfully',
      totalUsed: amountCents,
      creditsUsed: usedCredits.length,
      remainingBalance: availableBalance - amountCents,
    });

  } catch (error) {
    console.error('Error using credit:', error);
    res.status(500).json({ message: 'Failed to use credit' });
  }
});

export default router;
