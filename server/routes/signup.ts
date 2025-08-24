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
    
    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID required" });
    }
    
    if (!dob) {
      return res.status(400).json({ error: "Date of birth required" });
    }

    // Get tenant policy
    const [policy] = await db.select().from(tenantPolicies).where(eq(tenantPolicies.tenantId, tenantId));
    
    // Use default policy if none exists
    const policyData = policy || {
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