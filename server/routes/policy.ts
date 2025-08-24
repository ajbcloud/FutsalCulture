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