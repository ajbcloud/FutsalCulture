import { Router } from "express";
import { db } from "../db";
import { guardianLinks } from "../../shared/db/schema/guardianLink";
import { eq, and } from "drizzle-orm";

export const guardianRouter = Router();

// Create or update guardian link
guardianRouter.post("/guardians", async (req: any, res) => {
  try {
    const { parentId, playerId, permissionBook, permissionPay } = req.body;
    
    if (!parentId || !playerId) {
      return res.status(400).json({ error: "Parent ID and Player ID required" });
    }
    
    // Check if link already exists
    const [existing] = await db
      .select()
      .from(guardianLinks)
      .where(and(
        eq(guardianLinks.parentId, parentId),
        eq(guardianLinks.playerId, playerId)
      ));
    
    let result;
    if (existing) {
      // Update existing link
      [result] = await db
        .update(guardianLinks)
        .set({ 
          permissionBook: permissionBook ?? existing.permissionBook,
          permissionPay: permissionPay ?? existing.permissionPay,
          active: true,
          updatedAt: new Date(),
        })
        .where(eq(guardianLinks.id, existing.id))
        .returning();
    } else {
      // Create new link
      [result] = await db
        .insert(guardianLinks)
        .values({ 
          parentId, 
          playerId, 
          permissionBook: permissionBook ?? false,
          permissionPay: permissionPay ?? false,
        })
        .returning();
    }
    
    res.json(result);
  } catch (error) {
    console.error("Error managing guardian link:", error);
    res.status(500).json({ error: "Failed to manage guardian link" });
  }
});

// Get guardian links for a parent
guardianRouter.get("/guardians/parent/:parentId", async (req: any, res) => {
  try {
    const { parentId } = req.params;
    
    const rows = await db
      .select()
      .from(guardianLinks)
      .where(and(
        eq(guardianLinks.parentId, parentId),
        eq(guardianLinks.active, true)
      ));
    
    res.json(rows);
  } catch (error) {
    console.error("Error fetching guardian links:", error);
    res.status(500).json({ error: "Failed to fetch guardian links" });
  }
});

// Get guardians for a player
guardianRouter.get("/guardians/player/:playerId", async (req: any, res) => {
  try {
    const { playerId } = req.params;
    
    const rows = await db
      .select()
      .from(guardianLinks)
      .where(and(
        eq(guardianLinks.playerId, playerId),
        eq(guardianLinks.active, true)
      ));
    
    res.json(rows);
  } catch (error) {
    console.error("Error fetching player guardians:", error);
    res.status(500).json({ error: "Failed to fetch player guardians" });
  }
});

// Remove guardian link
guardianRouter.delete("/guardians/:id", async (req: any, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user?.isAdmin;
    
    if (!isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    const [result] = await db
      .update(guardianLinks)
      .set({ active: false, updatedAt: new Date() })
      .where(eq(guardianLinks.id, id))
      .returning();
    
    res.json(result);
  } catch (error) {
    console.error("Error removing guardian link:", error);
    res.status(500).json({ error: "Failed to remove guardian link" });
  }
});

export default guardianRouter;