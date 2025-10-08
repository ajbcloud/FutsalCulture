import { Router } from "express";
import { db } from "../db";
import { tenantPolicies } from "../../shared/db/schema/tenantPolicy";
import { eq } from "drizzle-orm";

export const policyRouter = Router();

// Get tenant policy
policyRouter.get("/policy", async (req: any, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID required" });
    }

    const [row] = await db.select().from(tenantPolicies).where(eq(tenantPolicies.tenantId, tenantId));
    
    // Return default policy if none exists
    if (!row) {
      return res.json({
        tenantId,
        region: "US",
        audienceMode: "mixed",
        parentRequiredBelow: 13,
        teenSelfAccessAt: 13,
        adultAge: 18,
        allowTeenPayments: false,
        allowSplitPayments: false,
        requireSavedMethodForAdult: false,
      });
    }
    
    res.json(row);
  } catch (error) {
    console.error("Error fetching policy:", error);
    res.status(500).json({ error: "Failed to fetch policy" });
  }
});

// Update tenant policy (admin only)
policyRouter.patch("/policy", async (req: any, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const isAdmin = req.user?.isAdmin;
    
    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID required" });
    }
    
    if (!isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const body = req.body;

    // Enhanced validation for age policy conflicts
    if (body.requireParent && body.minAge && body.requireParent < body.minAge) {
      return res.status(400).json({ 
        error: "Invalid parent requirement",
        message: "Parent requirement age must be greater than or equal to minimum age"
      });
    }

    if (body.requireParent && body.teenSelfMin && body.requireParent > body.teenSelfMin) {
      return res.status(400).json({ 
        error: "Invalid configuration",
        message: "Parent requirement age cannot be greater than teen self-signup age"
      });
    }

    if (body.teenSelfMin && body.teenPayMin && body.teenPayMin < body.teenSelfMin) {
      return res.status(400).json({ 
        error: "Invalid payment age",
        message: "Teen payment age must be greater than or equal to teen self-signup age"
      });
    }

    if (body.audience !== "adult" && body.maxAge && body.teenPayMin && body.teenPayMin > body.maxAge) {
      return res.status(400).json({ 
        error: "Invalid configuration",
        message: "Teen payment age cannot exceed maximum program age"
      });
    }
    
    // Insert or update policy
    const [existing] = await db.select().from(tenantPolicies).where(eq(tenantPolicies.tenantId, tenantId));
    
    let result;
    if (existing) {
      [result] = await db
        .update(tenantPolicies)
        .set(body)
        .where(eq(tenantPolicies.tenantId, tenantId))
        .returning();
    } else {
      [result] = await db
        .insert(tenantPolicies)
        .values({ tenantId, ...body })
        .returning();
    }
    
    res.json(result);
  } catch (error) {
    console.error("Error updating policy:", error);
    res.status(500).json({ error: "Failed to update policy" });
  }
});

// Add POST route that delegates to PATCH for compatibility
policyRouter.post("/policy", async (req: any, res) => {
  // Manually handle POST as PATCH for backwards compatibility
  const { storage } = await import('../storage');
  const user = await storage.getUser(req.user.id);
  
  if (!user?.tenantId) {
    return res.status(400).json({ error: "Tenant ID required" });
  }

  const tenantId = user.tenantId;
  const body = req.body;
  
  try {
    // Validation
    if (body.audienceMode === "youth_only" && body.parentRequiredBelow >= 18) {
      return res.status(400).json({
        error: "Invalid configuration",
        message: "Youth programs require parental involvement below age 18"
      });
    }
    
    if (body.parentRequiredBelow && body.teenSelfAccessAt && body.parentRequiredBelow > body.teenSelfAccessAt) {
      return res.status(400).json({
        error: "Invalid configuration",
        message: "Parent requirement age cannot be greater than teen self-access age"
      });
    }
    
    if (body.teenSelfAccessAt && body.adultAge && body.teenSelfAccessAt >= body.adultAge) {
      return res.status(400).json({
        error: "Invalid configuration",
        message: "Teen self-access age must be less than adult age"
      });
    }
    
    // Insert or update policy
    const [existing] = await db.select().from(tenantPolicies).where(eq(tenantPolicies.tenantId, tenantId));
    
    let result;
    if (existing) {
      [result] = await db
        .update(tenantPolicies)
        .set(body)
        .where(eq(tenantPolicies.tenantId, tenantId))
        .returning();
    } else {
      [result] = await db
        .insert(tenantPolicies)
        .values({ tenantId, ...body })
        .returning();
    }
    
    res.json(result);
  } catch (error) {
    console.error("Error updating policy:", error);
    res.status(500).json({ error: "Failed to update policy" });
  }
});

export default policyRouter;