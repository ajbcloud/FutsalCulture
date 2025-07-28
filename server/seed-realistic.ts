import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { futsalSessions, signups, players, users, payments } from '../shared/schema';
import { eq, and, sql } from 'drizzle-orm';

const connection = neon(process.env.DATABASE_URL!);
const db = drizzle(connection);

/**
 * Realistic Seeding Script for Futsal Culture
 * 
 * This creates realistic business data for 4+ months of operations:
 * - Sessions from April 2025 to August 2025 (existing)
 * - Realistic attendance patterns (players attend 1-3 times per week max)
 * - Varied payment scenarios (95% paid, 5% pending)
 * - Distributed across all 30 players from 21 families
 */

async function seedRealisticData() {
  console.log('Starting realistic data seeding...');

  try {
    // Clear existing signups and payments
    await db.delete(payments);
    await db.delete(signups);
    console.log('✓ Cleared existing signups and payments');

    // Get all players and sessions
    const allPlayers = await db.select().from(players);
    const allSessions = await db.select().from(futsalSessions).orderBy(futsalSessions.startTime);
    
    console.log(`Found ${allPlayers.length} players and ${allSessions.length} sessions`);

    // Create realistic attendance patterns
    const attendancePatterns = new Map();
    
    // Define realistic weekly attendance for each player (0-3 sessions per week)
    allPlayers.forEach((player: any) => {
      const weeklyAttendance = Math.floor(Math.random() * 4); // 0-3 sessions per week
      attendancePatterns.set(player.id, {
        weeklyLimit: weeklyAttendance,
        attendedThisWeek: 0,
        lastAttendanceWeek: -1
      });
    });

    let totalSignups = 0;
    let totalPaid = 0;
    let totalPending = 0;

    // Process sessions in chronological order
    for (const session of allSessions) {
      const sessionDate = new Date(session.startTime);
      const weekNumber = Math.floor((sessionDate.getTime() - new Date('2025-04-01').getTime()) / (7 * 24 * 60 * 60 * 1000));
      
      // Filter eligible players by age and gender
      const eligiblePlayers = allPlayers.filter((player: any) => {
        const age = 2025 - player.birthYear;
        const ageGroup = `U${Math.min(Math.ceil(age), 18)}`;
        
        return session.ageGroups.includes(ageGroup) && 
               session.genders.includes(player.gender);
      });

      // Reset weekly attendance counters for new week
      eligiblePlayers.forEach((player: any) => {
        const pattern = attendancePatterns.get(player.id);
        if (pattern.lastAttendanceWeek < weekNumber) {
          pattern.attendedThisWeek = 0;
          pattern.lastAttendanceWeek = weekNumber;
        }
      });

      // Select players who can attend this session (haven't exceeded weekly limit)
      const availablePlayers = eligiblePlayers.filter((player: any) => {
        const pattern = attendancePatterns.get(player.id);
        return pattern.attendedThisWeek < pattern.weeklyLimit;
      });

      // Randomly select 12-18 players to attend (realistic capacity usage)
      const attendanceCount = Math.min(
        Math.floor(Math.random() * 7) + 12, // 12-18 attendees
        availablePlayers.length,
        session.capacity
      );

      const attendingPlayers = availablePlayers
        .sort(() => Math.random() - 0.5)
        .slice(0, attendanceCount);

      // Create signups for attending players
      for (const player of attendingPlayers) {
        // Update attendance tracking
        const pattern = attendancePatterns.get(player.id);
        pattern.attendedThisWeek++;

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
            stripePaymentIntentId: `pi_${Math.random().toString(36).substring(7)}`
          });
          totalPaid++;
        } else {
          totalPending++;
        }
      }
    }

    console.log('\n🎯 Realistic seeding completed!');
    console.log(`📊 Total signups: ${totalSignups}`);
    console.log(`💰 Paid signups: ${totalPaid} (${((totalPaid/totalSignups)*100).toFixed(1)}%)`);
    console.log(`⏳ Pending signups: ${totalPending} (${((totalPending/totalSignups)*100).toFixed(1)}%)`);
    console.log(`💵 Total revenue: $${(totalPaid * 10).toFixed(2)}`);

    // Show attendance distribution
    console.log('\n👥 Player attendance distribution:');
    const attendanceStats = [];
    for (const player of allPlayers) {
      const playerSignups = await db.select().from(signups).where(eq(signups.playerId, player.id));
      attendanceStats.push({
        name: `${player.firstName} ${player.lastName}`,
        count: playerSignups.length
      });
    }
    
    attendanceStats.sort((a, b) => b.count - a.count);
    attendanceStats.slice(0, 10).forEach(stat => {
      console.log(`  ${stat.name}: ${stat.count} sessions`);
    });
    
    console.log(`  Average attendance per player: ${(totalSignups / allPlayers.length).toFixed(1)} sessions`);

  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  }
}

// Run seeding if called directly
seedRealisticData()
  .then(() => {
    console.log('✅ Realistic seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });

export { seedRealisticData };