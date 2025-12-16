import cron from 'node-cron';
import { db } from '../db';
import { eq, and, gte, lte, or, ne } from 'drizzle-orm';
import { futsalSessions } from '@shared/schema';
import { sendRosterEmail } from '../utils/roster-email';

const HOURS_BEFORE_SESSION = 3;

async function sendUpcomingSessionRosters() {
  console.log('🔄 Checking for upcoming sessions to send roster emails...');
  
  try {
    const now = new Date();
    const targetTime = new Date(now.getTime() + (HOURS_BEFORE_SESSION * 60 * 60 * 1000));
    const windowStart = new Date(targetTime.getTime() - (15 * 60 * 1000));
    const windowEnd = new Date(targetTime.getTime() + (15 * 60 * 1000));

    const upcomingSessions = await db
      .select({
        id: futsalSessions.id,
        tenantId: futsalSessions.tenantId,
        title: futsalSessions.title,
        startTime: futsalSessions.startTime,
      })
      .from(futsalSessions)
      .where(
        and(
          gte(futsalSessions.startTime, windowStart),
          lte(futsalSessions.startTime, windowEnd),
          or(
            eq(futsalSessions.status, 'open'),
            eq(futsalSessions.status, 'upcoming'),
            eq(futsalSessions.status, 'full')
          )
        )
      );

    if (upcomingSessions.length === 0) {
      console.log('✅ No upcoming sessions need roster emails at this time');
      return;
    }

    console.log(`📧 Found ${upcomingSessions.length} session(s) starting in ~${HOURS_BEFORE_SESSION} hours`);

    for (const session of upcomingSessions) {
      try {
        const result = await sendRosterEmail({
          sessionId: session.id,
          tenantId: session.tenantId,
        });
        
        if (result.success) {
          console.log(`✅ Roster email sent for "${session.title}" to ${result.sentTo.length} recipient(s)`);
        } else {
          console.warn(`⚠️ Roster email for "${session.title}" had some failures:`, result.errors);
        }
      } catch (error) {
        console.error(`❌ Failed to send roster email for session ${session.id}:`, error);
      }
    }
  } catch (error) {
    console.error('❌ Error in roster email job:', error);
  }
}

cron.schedule('0 * * * *', async () => {
  await sendUpcomingSessionRosters();
});

console.log('📅 Roster email job scheduled - runs every hour to check for upcoming sessions');

export { sendUpcomingSessionRosters };
