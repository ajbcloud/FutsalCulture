import { Router } from "express";
import { db } from "../db";
import { tenantPolicies } from "../../shared/db/schema/tenantPolicy";
import { households, householdMembers, players } from "../../shared/schema";
import { eq, and, lt, sql } from "drizzle-orm";
import { differenceInYears } from "date-fns";

export const terminologyRouter = Router();

// Get user terminology based on tenant policy and household composition
terminologyRouter.get("/terminology/user-term", async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const tenantId = req.user?.tenantId;

    if (!userId || !tenantId) {
      return res.status(400).json({ error: "User ID and Tenant ID required" });
    }

    // Get tenant policy
    const [policy] = await db
      .select()
      .from(tenantPolicies)
      .where(eq(tenantPolicies.tenantId, tenantId));

    // Default policy if none exists
    const audienceMode = policy?.audienceMode || "mixed";

    // For "youth_only" mode, always return "Parent"
    if (audienceMode === "youth_only") {
      return res.json({ term: "Parent" });
    }

    // For "adult_only" mode, always return "Player"
    if (audienceMode === "adult_only") {
      return res.json({ term: "Player" });
    }

    // For "mixed" mode, check if user has children in household
    // First, find user's household
    const [userHouseholdMember] = await db
      .select()
      .from(householdMembers)
      .where(
        and(
          eq(householdMembers.userId, userId),
          eq(householdMembers.tenantId, tenantId)
        )
      );

    if (!userHouseholdMember) {
      // User is not in a household, default to "Player"
      return res.json({ term: "Player" });
    }

    // Get all players in the user's household
    const householdPlayers = await db
      .select({
        playerId: householdMembers.playerId,
        dateOfBirth: players.dateOfBirth,
        birthYear: players.birthYear,
      })
      .from(householdMembers)
      .leftJoin(players, eq(householdMembers.playerId, players.id))
      .where(
        and(
          eq(householdMembers.householdId, userHouseholdMember.householdId),
          eq(householdMembers.tenantId, tenantId)
        )
      );

    // Check if any player in the household is under 18
    const hasChildren = householdPlayers.some((member) => {
      if (!member.playerId) return false;

      // Calculate age from dateOfBirth if available, otherwise from birthYear
      let age: number;
      if (member.dateOfBirth) {
        age = differenceInYears(new Date(), new Date(member.dateOfBirth));
      } else if (member.birthYear) {
        age = new Date().getFullYear() - member.birthYear;
      } else {
        return false;
      }

      return age < 18;
    });

    // Return "Parent" if user has children under 18, otherwise "Player"
    const term = hasChildren ? "Parent" : "Player";
    res.json({ term });
  } catch (error) {
    console.error("Error fetching user terminology:", error);
    res.status(500).json({ error: "Failed to fetch user terminology" });
  }
});

export default terminologyRouter;
