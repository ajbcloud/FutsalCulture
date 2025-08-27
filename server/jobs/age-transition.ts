import cron from 'node-cron';
import { processAgeTransitions } from '../services/ageTransition';
import { storage } from '../storage';

/**
 * Background job to process age transitions (players turning 18)
 * Runs daily at 1 AM to check for players who became adults
 */

export function scheduleAgeTransitionProcessor() {
  // Process age transitions daily at 1 AM
  cron.schedule('0 1 * * *', async () => {
    // Starting age transition processing
    
    try {
      // Get all active tenants
      const tenants = await storage.getTenants();
      let totalPlayersProcessed = 0;
      let totalNewAdults = 0;
      let totalConsentFormsInvalidated = 0;

      // Process age transitions for each tenant
      for (const tenant of tenants) {
        try {
          const result = await processAgeTransitions(tenant.id);
          totalPlayersProcessed += result.playersProcessed;
          totalNewAdults += result.newAdults;
          totalConsentFormsInvalidated += result.consentFormsInvalidated;

          if (result.newAdults > 0) {
            // Tenant age transitions processed successfully
          }
        } catch (error) {
          console.error(`❌ Error processing age transitions for tenant ${tenant.name}:`, error);
        }
      }

      if (totalNewAdults > 0) {
        // Age transition processing completed
      } else {
        // No new adults found during age transition processing
      }
    } catch (error) {
      console.error('❌ Age transition processing failed:', error);
    }
  });

  // Age transition processor scheduled
}

/**
 * Process age transitions for a specific tenant immediately
 * Used for testing or manual processing
 */
export async function processAgeTransitionsForTenant(tenantId: string): Promise<{
  playersProcessed: number;
  newAdults: number;
  consentFormsInvalidated: number;
}> {
  try {
    console.log(`🎂 Processing age transitions for tenant: ${tenantId}`);
    const result = await processAgeTransitions(tenantId);
    
    if (result.newAdults > 0) {
      console.log(`✅ ${result.newAdults} players became adults, ${result.consentFormsInvalidated} consent forms invalidated`);
    }
    
    return result;
  } catch (error) {
    console.error(`❌ Error processing age transitions for tenant ${tenantId}:`, error);
    throw error;
  }
}

/**
 * Process age transitions for all tenants immediately
 * Used for testing or manual processing
 */
export async function processAllAgeTransitions(): Promise<{
  totalPlayersProcessed: number;
  totalNewAdults: number;
  totalConsentFormsInvalidated: number;
  tenantResults: Array<{
    tenantId: string;
    tenantName: string;
    playersProcessed: number;
    newAdults: number;
    consentFormsInvalidated: number;
  }>;
}> {
  try {
    console.log('🎂 Processing age transitions for all tenants...');
    
    const tenants = await storage.getTenants();
    let totalPlayersProcessed = 0;
    let totalNewAdults = 0;
    let totalConsentFormsInvalidated = 0;
    const tenantResults = [];

    for (const tenant of tenants) {
      try {
        const result = await processAgeTransitions(tenant.id);
        totalPlayersProcessed += result.playersProcessed;
        totalNewAdults += result.newAdults;
        totalConsentFormsInvalidated += result.consentFormsInvalidated;

        tenantResults.push({
          tenantId: tenant.id,
          tenantName: tenant.name,
          playersProcessed: result.playersProcessed,
          newAdults: result.newAdults,
          consentFormsInvalidated: result.consentFormsInvalidated
        });

        if (result.newAdults > 0) {
          console.log(`✅ Tenant ${tenant.name}: ${result.newAdults} players became adults, ${result.consentFormsInvalidated} consent forms invalidated`);
        }
      } catch (error) {
        console.error(`❌ Error processing age transitions for tenant ${tenant.name}:`, error);
      }
    }

    console.log(`🎂 Age transition processing completed: ${totalNewAdults} new adults across ${tenants.length} tenants`);
    
    return {
      totalPlayersProcessed,
      totalNewAdults,
      totalConsentFormsInvalidated,
      tenantResults
    };
  } catch (error) {
    console.error('❌ Age transition processing failed:', error);
    throw error;
  }
}