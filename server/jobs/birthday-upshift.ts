import { db } from "../db";
import { players } from "../../shared/schema";
import { tenantPolicies } from "../../shared/db/schema/tenantPolicy";
import { guardianLinks } from "../../shared/db/schema/guardianLink";
import { consentEvents } from "../../shared/db/schema/consentEvent";
import { eq, and, lte, gte, sql, isNull } from "drizzle-orm";
import { evaluatePolicy } from "../services/agePolicy";

/**
 * Birthday Upshift Job
 * 
 * This job runs daily to automatically update player permissions
 * when they reach age thresholds defined in the tenant's age policy.
 * 
 * Key transitions:
 * - When a player turns 13: They may gain portal access (teen self-access)
 * - When a player turns 16: They may gain payment capabilities  
 * - When a player turns 18: They become an adult with full access
 */

export async function runBirthdayUpshift() {
  console.log("Starting birthday upshift job...");
  
  try {
    // Get all tenants with their policies
    const policies = await db.select()
      .from(tenantPolicies)
      .execute();
    
    for (const policy of policies) {
      await processTenantsPlayers(policy);
    }
    
    console.log("Birthday upshift job completed successfully");
  } catch (error) {
    console.error("Error in birthday upshift job:", error);
  }
}

async function processTenantsPlayers(policy: any) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get all players for this tenant that have a date of birth
  const tenantPlayers = await db.select()
    .from(players)
    .where(
      and(
        eq(players.tenantId, policy.tenantId),
        sql`${players.dateOfBirth} IS NOT NULL`
      )
    )
    .execute();
  
  for (const player of tenantPlayers) {
    if (!player.dateOfBirth) continue;
    
    const dob = new Date(player.dateOfBirth);
    const age = calculateAge(dob, today);
    const previousAge = calculateAge(dob, new Date(today.getTime() - 24 * 60 * 60 * 1000));
    
    // Check if the player crossed an age threshold today
    if (age !== previousAge) {
      await handleAgeTransition(player, age, policy);
    }
  }
}

function calculateAge(birthDate: Date, currentDate: Date): number {
  let age = currentDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = currentDate.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && currentDate.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

async function handleAgeTransition(player: any, newAge: number, policy: any) {
  console.log(`Player ${player.firstName} ${player.lastName} turned ${newAge} today`);
  
  // Evaluate what permissions the player should have at their new age
  const outcome = evaluatePolicy(policy, newAge);
  
  // Track what changed
  const changes: string[] = [];
  
  // Update portal access if changed
  if (outcome.teenSelf && !player.canAccessPortal) {
    await db.update(players)
      .set({ 
        canAccessPortal: true,
        portalActivatedAt: new Date()
      })
      .where(eq(players.id, player.id))
      .execute();
    changes.push("gained portal access");
  }
  
  // Update payment capability if changed
  if (outcome.whoCanPay !== "parent" && !player.canBookAndPay) {
    await db.update(players)
      .set({ 
        canBookAndPay: true,
        paymentActivatedAt: new Date()
      })
      .where(eq(players.id, player.id))
      .execute();
    changes.push("gained payment capability");
  }
  
  // If player turned 18, they become fully independent
  if (newAge >= 18) {
    // Update player to have full access
    await db.update(players)
      .set({
        canAccessPortal: true,
        canBookAndPay: true,
        isAdult: true,
        adultTransitionAt: new Date()
      })
      .where(eq(players.id, player.id))
      .execute();
    
    // Update guardian links to mark as aged out
    await db.update(guardianLinks)
      .set({
        relationshipStatus: "aged_out",
        agedOutAt: new Date()
      })
      .where(eq(guardianLinks.playerId, player.id))
      .execute();
    
    changes.push("became adult with full access");
  }
  
  // Log the transition
  if (changes.length > 0) {
    console.log(`Age transition for ${player.firstName} ${player.lastName}: ${changes.join(", ")}`);
    
    // Record consent event for the transition
    await recordAgeTransitionConsent(player, newAge, changes);
  }
}

async function recordAgeTransitionConsent(player: any, newAge: number, changes: string[]) {
  // Record an automatic consent event for the age transition
  await db.insert(consentEvents).values({
    tenantId: player.tenantId,
    subjectId: player.id,
    subjectRole: "player",
    policyKey: "age_transition",
    policyVersion: "1.0",
    acceptedAt: new Date(),
    acceptedBy: "system",
    metadata: {
      newAge,
      changes,
      automatic: true,
      reason: "Birthday age threshold reached"
    },
    ipAddress: "system",
    userAgent: "birthday-upshift-job"
  }).execute();
}

// Schedule the job to run daily at 2 AM
export function scheduleBirthdayUpshift() {
  const runAt2AM = () => {
    const now = new Date();
    const next2AM = new Date();
    next2AM.setHours(2, 0, 0, 0);
    
    // If it's already past 2 AM today, schedule for tomorrow
    if (now.getTime() > next2AM.getTime()) {
      next2AM.setDate(next2AM.getDate() + 1);
    }
    
    const msUntil2AM = next2AM.getTime() - now.getTime();
    
    setTimeout(() => {
      runBirthdayUpshift();
      // Schedule the next run
      setInterval(runBirthdayUpshift, 24 * 60 * 60 * 1000); // Run every 24 hours
    }, msUntil2AM);
  };
  
  runAt2AM();
  
  console.log("Birthday upshift job scheduled to run daily at 2 AM");
}