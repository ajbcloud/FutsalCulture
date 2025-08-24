import { db } from '../db';
import { players, consentDocuments, consentSignatures, consentTemplates } from '@shared/schema';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { differenceInYears, parseISO, startOfDay } from 'date-fns';

const ADULT_AGE = 18;

/**
 * Calculate player's current age from birth year
 */
export function calculatePlayerAge(birthYear: number): number {
  return new Date().getFullYear() - birthYear;
}

/**
 * Check if a player has transitioned to adult status (turned 18)
 * Returns true if player is now 18+ but wasn't marked as adult yet
 */
export function hasPlayerBecomeAdult(birthYear: number, isCurrentlyMarkedAsAdult: boolean): boolean {
  const currentAge = calculatePlayerAge(birthYear);
  return currentAge >= ADULT_AGE && !isCurrentlyMarkedAsAdult;
}

/**
 * Process age transitions for all players in a tenant
 * Marks players as adults when they turn 18 and invalidates parent-signed consent forms
 */
export async function processAgeTransitions(tenantId?: string): Promise<{
  playersProcessed: number;
  newAdults: number;
  consentFormsInvalidated: number;
}> {
  let playersProcessed = 0;
  let newAdults = 0;
  let consentFormsInvalidated = 0;

  try {
    // Query for players who may have become adults
    const whereClause = tenantId 
      ? and(eq(players.tenantId, tenantId), eq(players.isAdult, false))
      : eq(players.isAdult, false);

    const playersToCheck = await db
      .select({
        id: players.id,
        tenantId: players.tenantId,
        firstName: players.firstName,
        lastName: players.lastName,
        birthYear: players.birthYear,
        isAdult: players.isAdult,
        becameAdultAt: players.becameAdultAt
      })
      .from(players)
      .where(whereClause);

    for (const player of playersToCheck) {
      playersProcessed++;
      
      if (hasPlayerBecomeAdult(player.birthYear, player.isAdult)) {
        // Mark player as adult
        const becameAdultAt = new Date();
        await db
          .update(players)
          .set({ 
            isAdult: true, 
            becameAdultAt,
            ageBand: 'adult'
          })
          .where(eq(players.id, player.id));

        newAdults++;

        // Invalidate parent-signed consent forms for this player
        const invalidatedCount = await invalidateParentConsentForms(player.id, player.tenantId);
        consentFormsInvalidated += invalidatedCount;

        console.log(`Player ${player.firstName} ${player.lastName} (${player.id}) became adult - ${invalidatedCount} consent forms invalidated`);
      }
    }

    return {
      playersProcessed,
      newAdults,
      consentFormsInvalidated
    };
  } catch (error) {
    console.error('Error processing age transitions:', error);
    throw error;
  }
}

/**
 * Invalidate parent-signed consent forms when a player becomes an adult
 * Adult players must sign their own consent forms
 */
export async function invalidateParentConsentForms(playerId: string, tenantId: string): Promise<number> {
  try {
    // Get all active consent documents for this player (these were signed by parents)
    const parentSignedDocuments = await db
      .select({
        id: consentDocuments.id,
        templateType: consentDocuments.templateType
      })
      .from(consentDocuments)
      .where(
        and(
          eq(consentDocuments.playerId, playerId),
          eq(consentDocuments.tenantId, tenantId),
          eq(consentDocuments.isActive, true)
        )
      );

    // Deactivate these documents as they're no longer valid for adult players
    let deactivatedCount = 0;
    for (const doc of parentSignedDocuments) {
      await db
        .update(consentDocuments)
        .set({ isActive: false })
        .where(eq(consentDocuments.id, doc.id));
      
      deactivatedCount++;
    }

    return deactivatedCount;
  } catch (error) {
    console.error(`Error invalidating parent consent forms for player ${playerId}:`, error);
    throw error;
  }
}

/**
 * Check if a player needs to re-sign consent forms due to age transition
 * Returns true if the player became an adult and has invalidated parent-signed forms
 */
export async function needsAdultConsentResign(playerId: string, tenantId: string): Promise<{
  needsResign: boolean;
  becameAdultAt?: Date;
  invalidatedTemplateTypes: string[];
}> {
  try {
    // Get player's adult transition info
    const [player] = await db
      .select({
        isAdult: players.isAdult,
        becameAdultAt: players.becameAdultAt
      })
      .from(players)
      .where(
        and(
          eq(players.id, playerId),
          eq(players.tenantId, tenantId)
        )
      )
      .limit(1);

    if (!player || !player.isAdult || !player.becameAdultAt) {
      return { needsResign: false, invalidatedTemplateTypes: [] };
    }

    // Check for invalidated consent forms after becoming adult
    const invalidatedDocs = await db
      .select({
        templateType: consentDocuments.templateType
      })
      .from(consentDocuments)
      .where(
        and(
          eq(consentDocuments.playerId, playerId),
          eq(consentDocuments.tenantId, tenantId),
          eq(consentDocuments.isActive, false),
          // Documents that were invalidated after becoming adult
          sql`${consentDocuments.signedAt} < ${player.becameAdultAt}`
        )
      );

    const invalidatedTemplateTypes = invalidatedDocs.map(doc => doc.templateType);

    return {
      needsResign: invalidatedTemplateTypes.length > 0,
      becameAdultAt: player.becameAdultAt,
      invalidatedTemplateTypes
    };
  } catch (error) {
    console.error(`Error checking adult consent resign need for player ${playerId}:`, error);
    return { needsResign: false, invalidatedTemplateTypes: [] };
  }
}

/**
 * Get consent form status with age transition awareness
 * Considers both completed forms and age transition requirements
 */
export async function getConsentStatusWithAgeTransition(playerId: string, tenantId: string): Promise<{
  completedCount: number;
  missingCount: number;
  totalTemplates: number;
  needsAdultResign: boolean;
  invalidatedTypes: string[];
}> {
  try {
    // Get all consent templates for this tenant
    const templates = await db
      .select({
        id: consentTemplates.id,
        templateType: consentTemplates.templateType
      })
      .from(consentTemplates)
      .where(
        and(
          eq(consentTemplates.tenantId, tenantId),
          eq(consentTemplates.isActive, true)
        )
      );

    // Get currently valid consent documents for this player
    const validDocuments = await db
      .select({
        templateId: consentDocuments.templateId,
        templateType: consentDocuments.templateType
      })
      .from(consentDocuments)
      .where(
        and(
          eq(consentDocuments.playerId, playerId),
          eq(consentDocuments.tenantId, tenantId),
          eq(consentDocuments.isActive, true)
        )
      );

    // Check age transition requirements
    const ageTransitionInfo = await needsAdultConsentResign(playerId, tenantId);

    const totalTemplates = templates.length;
    const completedCount = validDocuments.length;
    const missingCount = totalTemplates - completedCount;

    return {
      completedCount,
      missingCount,
      totalTemplates,
      needsAdultResign: ageTransitionInfo.needsResign,
      invalidatedTypes: ageTransitionInfo.invalidatedTemplateTypes
    };
  } catch (error) {
    console.error(`Error getting consent status with age transition for player ${playerId}:`, error);
    return {
      completedCount: 0,
      missingCount: 0,
      totalTemplates: 0,
      needsAdultResign: false,
      invalidatedTypes: []
    };
  }
}