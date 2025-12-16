import cron from 'node-cron';
import { rollupUsageForDay } from './usageRollup';
import './webhookStatsRollup';
import './roster-email-job';
import { processPendingDowngrades, isBraintreeEnabled } from '../services/braintreeService';

// Nightly usage rollup at 03:12 UTC
cron.schedule('12 3 * * *', async () => { 
  console.log('🔄 Starting nightly usage rollup...');
  const yesterday = new Date(Date.now() - 86400000);
  try {
    await rollupUsageForDay(yesterday);
    console.log('✅ Nightly usage rollup completed successfully');
  } catch (error) {
    console.error('❌ Nightly usage rollup failed:', error);
  }
});

// Process pending Braintree downgrades at 04:00 UTC daily
cron.schedule('0 4 * * *', async () => {
  if (!isBraintreeEnabled()) {
    return; // Skip if Braintree is not configured
  }
  
  console.log('🔄 Processing pending Braintree downgrades...');
  try {
    const processedCount = await processPendingDowngrades();
    if (processedCount > 0) {
      console.log(`✅ Processed ${processedCount} Braintree downgrade(s)`);
    } else {
      console.log('✅ No pending Braintree downgrades to process');
    }
  } catch (error) {
    console.error('❌ Braintree downgrade processing failed:', error);
  }
});

// Usage rollup scheduler initialized

export {}; // imported at server bootstrap