import cron from 'node-cron';
import { rollupUsageForDay } from './usageRollup';
import './webhookStatsRollup';

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

console.log('📅 Usage rollup scheduler initialized - runs daily at 03:12 UTC');

export {}; // imported at server bootstrap