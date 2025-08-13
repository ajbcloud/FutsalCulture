import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { futsalSessions, signups, players, users, payments } from '../shared/schema';
import { eq, and, sql, gte, lte, inArray } from 'drizzle-orm';

const connection = neon(process.env.DATABASE_URL!);
const db = drizzle(connection);

/**
 * Historical Session Fill Rate Generator
 * 
 * Creates realistic signups for April 1 - June 30th sessions to achieve:
 * - 65-100% fill rates for each session
 * - Realistic player distribution across age groups and genders
 * - Proper payment status (95% paid, 5% pending)
 * - Maintains existing future sessions unchanged
 */

async function seedHistoricalFillRates() {

  try {
    // Get all players for signup generation
    const allPlayers = await db.select().from(players);

    // Get all historical sessions (April 1 - June 30, 2025)
    const historicalSessions = await db
      .select()
      .from(futsalSessions)
      .where(
        and(
          gte(futsalSessions.startTime, new Date('2025-04-01')),
          lte(futsalSessions.startTime, new Date('2025-06-30T23:59:59'))
        )
      )
      .orderBy(futsalSessions.startTime);


    // Clear existing signups and payments for historical period only
    const sessionIds = historicalSessions.map(s => s.id);
    
    if (sessionIds.length > 0) {
      // Delete payments for historical signups
      const historicalSignupIds = await db
        .select({ id: signups.id })
        .from(signups)
        .where(inArray(signups.sessionId, sessionIds));
      
      if (historicalSignupIds.length > 0) {
        await db
          .delete(payments)
          .where(inArray(payments.signupId, historicalSignupIds.map(s => s.id)));
      }
      
      // Delete historical signups
      await db
        .delete(signups)
        .where(inArray(signups.sessionId, sessionIds));
      
    }

    let totalSignups = 0;
    let totalPayments = 0;
    let totalPending = 0;

    // Process each historical session
    for (const session of historicalSessions) {
      // Calculate target fill rate (65-100%) - ensure we hit the minimum
      const fillRate = Math.random() * 0.35 + 0.65; // 65% to 100%
      const targetSignups = Math.max(
        Math.ceil(session.capacity * 0.65), // Minimum 65% fill rate
        Math.floor(session.capacity * fillRate)
      );
      
      // Filter eligible players by age and gender
      const eligiblePlayers = allPlayers.filter((player: any) => {
        const age = 2025 - player.birthYear;
        const ageGroup = `U${Math.min(Math.ceil(age), 18)}`;
        
        return session.ageGroups.includes(ageGroup) && 
               session.genders.includes(player.gender);
      });

      // If not enough eligible players, expand criteria progressively
      let selectedPlayers = eligiblePlayers;
      if (eligiblePlayers.length < targetSignups) {
        // First, allow players within 2 years of target age group
        selectedPlayers = allPlayers.filter((player: any) => {
          const age = 2025 - player.birthYear;
          const sessionAgeNum = parseInt(session.ageGroups[0].substring(1));
          return Math.abs(age - sessionAgeNum) <= 2 && 
                 session.genders.includes(player.gender);
        });
        
        // If still not enough, allow any gender match for the age group
        if (selectedPlayers.length < targetSignups) {
          selectedPlayers = allPlayers.filter((player: any) => {
            const age = 2025 - player.birthYear;
            const sessionAgeNum = parseInt(session.ageGroups[0].substring(1));
            return Math.abs(age - sessionAgeNum) <= 2;
          });
        }
        
        // If still not enough, use all players and prioritize by session requirements
        if (selectedPlayers.length < targetSignups) {
          selectedPlayers = [...allPlayers];
        }
      }

      // Randomly select players for this session
      const shuffledPlayers = selectedPlayers.sort(() => Math.random() - 0.5);
      const attendingPlayers = shuffledPlayers.slice(0, Math.min(targetSignups, selectedPlayers.length));

      // Create signups for attending players
      for (const player of attendingPlayers) {
        const sessionDate = new Date(session.startTime);
        
        // 95% chance of payment being completed, 5% pending
        const isPaid = Math.random() < 0.95;
        
        // Create signup
        const [signup] = await db.insert(signups).values({
          playerId: player.id,
          sessionId: session.id,
          paid: isPaid,
          paymentIntentId: isPaid ? `pi_${Math.random().toString(36).substring(7)}` : null,
          createdAt: new Date(sessionDate.getTime() - Math.random() * 24 * 60 * 60 * 1000) // Created up to 24h before session
        }).returning();

        totalSignups++;

        if (isPaid) {
          // Create payment record
          await db.insert(payments).values({
            signupId: signup.id,
            amountCents: 1000, // $10.00 in cents
            paidAt: new Date(sessionDate.getTime() - Math.random() * 12 * 60 * 60 * 1000), // Paid up to 12h before session
            paymentIntentId: `pi_${Math.random().toString(36).substring(7)}`,
            status: 'paid'
          });
          totalPayments++;
        } else {
          totalPending++;
        }
      }

      // Log progress every 50 sessions
      if (totalSignups % 50 === 0) {
      }
    }


    // Verify fill rates
    const sampleVerification = await db
      .select({
        sessionId: futsalSessions.id,
        title: futsalSessions.title,
        capacity: futsalSessions.capacity,
        signupCount: sql<number>`COUNT(${signups.id})`,
        fillRate: sql<number>`ROUND((COUNT(${signups.id})::numeric / ${futsalSessions.capacity}) * 100, 1)`
      })
      .from(futsalSessions)
      .leftJoin(signups, eq(futsalSessions.id, signups.sessionId))
      .where(
        and(
          gte(futsalSessions.startTime, new Date('2025-04-01')),
          lte(futsalSessions.startTime, new Date('2025-04-10'))
        )
      )
      .groupBy(futsalSessions.id, futsalSessions.title, futsalSessions.capacity)
      .orderBy(futsalSessions.startTime)
      .limit(10);

    sampleVerification.forEach(session => {
    });

  } catch (error) {
    console.error('❌ Error generating historical fill rates:', error);
    throw error;
  }
}

// Run the seeding if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedHistoricalFillRates()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed to generate historical fill rates:', error);
      process.exit(1);
    });
}

export { seedHistoricalFillRates };