import { Router } from "express";
import { db } from "../db";
import { tenantPolicies } from "../../shared/db/schema/tenantPolicy";
import { eq } from "drizzle-orm";
import { evaluatePolicy } from "../services/agePolicy";

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
      policy: policyData 
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

export default signupRouter;