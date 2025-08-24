import { Router } from "express";
import { db } from "../db";
import { consentEvents } from "../../shared/db/schema/consentEvent";
import { eq, and, desc } from "drizzle-orm";

export const consentRouter = Router();

// Record consent event
consentRouter.post("/consent", async (req: any, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    const { subjectId, subjectRole, policyKey, policyVersion } = req.body;
    
    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID required" });
    }
    
    if (!subjectId || !subjectRole || !policyKey || !policyVersion) {
      return res.status(400).json({ error: "Missing required consent fields" });
    }
    
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    const [row] = await db.insert(consentEvents).values({ 
      tenantId, 
      subjectId, 
      subjectRole, 
      policyKey, 
      policyVersion, 
      acceptedBy: userId || req.body.acceptedBy || 'anonymous',
      ip: ip?.toString() || 'unknown',
      userAgent: userAgent || 'unknown',
    }).returning();
    
    res.json(row);
  } catch (error) {
    console.error("Error recording consent:", error);
    res.status(500).json({ error: "Failed to record consent" });
  }
});

// Get consent history for a subject
consentRouter.get("/consent/:subjectId", async (req: any, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const { subjectId } = req.params;
    
    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID required" });
    }
    
    const rows = await db
      .select()
      .from(consentEvents)
      .where(and(
        eq(consentEvents.tenantId, tenantId),
        eq(consentEvents.subjectId, subjectId)
      ))
      .orderBy(desc(consentEvents.createdAt));
    
    res.json(rows);
  } catch (error) {
    console.error("Error fetching consent history:", error);
    res.status(500).json({ error: "Failed to fetch consent history" });
  }
});

export default consentRouter;