import { Router } from "express";
import { db } from "../db";
import { tenantPolicies } from "../../shared/db/schema/tenantPolicy";
import { households, householdMembers, players, tenants } from "../../shared/schema";
import { eq, and, lt, sql, ne } from "drizzle-orm";
import { differenceInYears } from "date-fns";
import { getTerminologyLabels } from "../../shared/utils/terminology";

export const terminologyRouter = Router();

// Platform-controlled domains for tenant resolution
const PLATFORM_DOMAINS = ['skorehq.com', 'localhost', 'replit.dev', 'replit.app'];

// Helper function to extract subdomain from hostname
function extractSubdomain(hostname: string): string | null {
  if (!hostname) return null;
  
  // Remove port if present
  const host = hostname.split(':')[0];
  
  // Split by dots
  const parts = host.split('.');
  
  // Handle based on number of parts:
  // 1 part (localhost) → null
  // 2 parts (tenant.localhost OR customdomain.com) → first part
  // 3+ parts (tenant.domain.com) → first part
  if (parts.length === 1) {
    // Single part like "localhost" - no subdomain
    return null;
  }
  
  if (parts.length >= 2) {
    // 2+ parts - extract first part as subdomain/tenant identifier
    return parts[0];
  }
  
  return null;
}

// Get user terminology based on tenant policy and household composition
terminologyRouter.get("/terminology/user-term", async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const tenantId = req.user?.tenantId;

    // ISSUE 1 FIX: Handle unauthenticated users by deriving tenant from subdomain
    let actualTenantId = tenantId;
    
    if (!userId || !tenantId) {
      // User is not authenticated, derive tenant using two-phase resolution
      // Extract and normalize hostname
      const hostname = (req.get('host') || req.hostname || '')
        .split(':')[0]  // Remove port
        .toLowerCase()  // Normalize case
        .trim();
      
      // Check if this is a platform domain (require segment boundaries)
      const isPlatformDomain = PLATFORM_DOMAINS.some(domain => 
        hostname === domain ||                    // Exact match: "skorehq.com"
        hostname.endsWith(`.${domain}`)          // Subdomain match: "tenant.skorehq.com"
      );
      
      let tenant;
      
      if (isPlatformDomain) {
        // Platform domain: use subdomain lookup
        const subdomain = extractSubdomain(hostname);
        if (subdomain) {
          tenant = await db.select()
            .from(tenants)
            .where(eq(tenants.subdomain, subdomain))
            .limit(1)
            .then(rows => rows[0]);
        }
      } else {
        // Custom domain: use exact hostname match
        tenant = await db.select()
          .from(tenants)
          .where(eq(tenants.customDomain, hostname))
          .limit(1)
          .then(rows => rows[0]);
      }
      
      if (!tenant) {
        return res.status(404).json({ error: "Tenant not found" });
      }
      
      actualTenantId = tenant.id;
      
      // Get tenant policy for unauthenticated user
      const [policy] = await db
        .select()
        .from(tenantPolicies)
        .where(eq(tenantPolicies.tenantId, actualTenantId));
      
      if (!policy) {
        console.warn(`No policy found for tenant ${actualTenantId}, defaulting to youth_only for safety`);
        return res.json({ term: "Parent" });
      }
      
      const audienceMode = policy.audienceMode || "youth_only";
      
      // For unauthenticated users, return term based on audience mode
      if (audienceMode === "youth_only") {
        return res.json({ term: "Parent" });
      } else if (audienceMode === "adult_only") {
        return res.json({ term: "Player" });
      } else {
        // Mixed mode - default to "Player" since we can't check household
        return res.json({ term: "Player" });
      }
    }

    // User is authenticated, proceed with existing logic
    // Get tenant policy
    const [policy] = await db
      .select()
      .from(tenantPolicies)
      .where(eq(tenantPolicies.tenantId, actualTenantId));

    if (!policy) {
      console.warn(`No policy found for tenant ${actualTenantId}, defaulting to youth_only for safety`);
      return res.json({ term: "Parent" });
    }

    const audienceMode = policy.audienceMode || "youth_only";

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
          eq(householdMembers.tenantId, actualTenantId)
        )
      );

    if (!userHouseholdMember) {
      // User is not in a household, default to "Player"
      return res.json({ term: "Player" });
    }

    // ISSUE 2 FIX: Get all players in the user's household, excluding the current user's own player record
    const householdPlayers = await db
      .select({
        playerId: householdMembers.playerId,
        playerUserId: players.userId,
        dateOfBirth: players.dateOfBirth,
        birthYear: players.birthYear,
      })
      .from(householdMembers)
      .leftJoin(players, eq(householdMembers.playerId, players.id))
      .where(
        and(
          eq(householdMembers.householdId, userHouseholdMember.householdId),
          eq(householdMembers.tenantId, actualTenantId)
        )
      );

    // Check if any OTHER player in the household is under 18 (exclude current user's own player)
    const hasChildren = householdPlayers.some((member) => {
      if (!member.playerId) return false;
      
      // ISSUE 2 FIX: Exclude the current user's own player record
      if (member.playerUserId === userId) return false;

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

// Get terminology policy with labels
terminologyRouter.get("/terminology/policy", async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const tenantId = req.user?.tenantId;

    // Handle unauthenticated users by deriving tenant from subdomain/custom domain
    let actualTenantId = tenantId;
    
    if (!userId || !tenantId) {
      // User is not authenticated, derive tenant using two-phase resolution
      const hostname = (req.get('host') || req.hostname || '')
        .split(':')[0]
        .toLowerCase()
        .trim();
      
      const isPlatformDomain = PLATFORM_DOMAINS.some(domain => 
        hostname === domain || hostname.endsWith(`.${domain}`)
      );
      
      let tenant;
      
      if (isPlatformDomain) {
        const subdomain = extractSubdomain(hostname);
        if (subdomain) {
          tenant = await db.select()
            .from(tenants)
            .where(eq(tenants.subdomain, subdomain))
            .limit(1)
            .then(rows => rows[0]);
        }
      } else {
        tenant = await db.select()
          .from(tenants)
          .where(eq(tenants.customDomain, hostname))
          .limit(1)
          .then(rows => rows[0]);
      }
      
      if (!tenant) {
        // Return sensible defaults when tenant can't be resolved (e.g., development mode)
        return res.json({
          audienceMode: "youth_only",
          adultAge: 18,
          parentRequiredBelow: 18,
          teenSelfAccessAt: 13,
          labels: {
            adultColumnLabel: "Parent",
            adult1: "Parent 1",
            adult2: "Parent 2",
            userTerm: "Parent",
            guardianTerm: "Parent"
          },
          showGuardianColumns: true
        });
      }
      
      actualTenantId = tenant.id;
    }

    // Get tenant policy
    const [policy] = await db
      .select()
      .from(tenantPolicies)
      .where(eq(tenantPolicies.tenantId, actualTenantId));

    if (!policy) {
      // Return sensible defaults when no policy exists
      return res.json({
        audienceMode: "youth_only",
        adultAge: 18,
        parentRequiredBelow: 18,
        teenSelfAccessAt: 13,
        labels: {
          adultColumnLabel: "Parent",
          adult1: "Parent 1",
          adult2: "Parent 2",
          userTerm: "Parent",
          guardianTerm: "Parent"
        },
        showGuardianColumns: true
      });
    }

    const audienceMode = policy.audienceMode || "youth_only";
    
    // Get terminology labels using utility function
    const terminologyLabels = getTerminologyLabels(audienceMode);
    
    // Calculate userTerm based on user authentication and household composition
    let userTerm: "Parent" | "Player" = "Player";
    
    if (userId && tenantId) {
      // User is authenticated, calculate userTerm based on audience mode and household
      if (audienceMode === "youth_only") {
        userTerm = "Parent";
      } else if (audienceMode === "adult_only") {
        userTerm = "Player";
      } else {
        // Mixed mode - check if user has children in household
        const [userHouseholdMember] = await db
          .select()
          .from(householdMembers)
          .where(
            and(
              eq(householdMembers.userId, userId),
              eq(householdMembers.tenantId, actualTenantId)
            )
          );

        if (userHouseholdMember) {
          const householdPlayers = await db
            .select({
              playerId: householdMembers.playerId,
              playerUserId: players.userId,
              dateOfBirth: players.dateOfBirth,
              birthYear: players.birthYear,
            })
            .from(householdMembers)
            .leftJoin(players, eq(householdMembers.playerId, players.id))
            .where(
              and(
                eq(householdMembers.householdId, userHouseholdMember.householdId),
                eq(householdMembers.tenantId, actualTenantId)
              )
            );

          const hasChildren = householdPlayers.some((member) => {
            if (!member.playerId || member.playerUserId === userId) return false;

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

          userTerm = hasChildren ? "Parent" : "Player";
        }
      }
    } else {
      // Unauthenticated user - determine default based on audience mode
      if (audienceMode === "youth_only") {
        userTerm = "Parent";
      } else {
        userTerm = "Player";
      }
    }

    // Return complete policy object with labels
    res.json({
      audienceMode: audienceMode,
      adultAge: policy.adultAge,
      parentRequiredBelow: policy.parentRequiredBelow,
      teenSelfAccessAt: policy.teenSelfAccessAt,
      labels: {
        adultColumnLabel: terminologyLabels.adultColumnLabel,
        adult1: terminologyLabels.adult1,
        adult2: terminologyLabels.adult2,
        userTerm: userTerm,
        guardianTerm: terminologyLabels.guardianTerm
      },
      showGuardianColumns: terminologyLabels.showGuardianColumns
    });
  } catch (error) {
    console.error("Error fetching terminology policy:", error);
    res.status(500).json({ error: "Failed to fetch terminology policy" });
  }
});

export default terminologyRouter;
