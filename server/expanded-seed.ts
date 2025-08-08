#!/usr/bin/env tsx

/*
 * Expanded Database Seeding Script
 * 
 * Generates 3 sessions per day, Monday-Friday for April-July 2025
 * With realistic signup data and session fill rates
 */

import { db } from "./db";
import { 
  users, 
  players, 
  futsalSessions, 
  signups, 
  payments, 
  helpRequests
} from "../shared/schema";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

// Constants
const AGE_GROUPS = ['U8', 'U9', 'U10', 'U11', 'U12', 'U13', 'U14', 'U15', 'U16', 'U17', 'U18'];
const GENDERS = ['boys', 'girls'];
const LOCATIONS = ['Turf City', 'Sports Hub', 'Jurong East'];
const SESSION_TIMES = [
  { hour: 17, minute: 0 },   // 5:00 PM
  { hour: 18, minute: 45 },  // 6:45 PM  
  { hour: 20, minute: 30 }   // 8:30 PM
];
const PRICE_CENTS = 1000; // $10.00
const CAPACITY = 12;

// Utility functions
function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function isWeekday(date: Date): boolean {
  const day = date.getDay();
  return day >= 1 && day <= 5; // Monday = 1, Friday = 5
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 30) return `${diffDays} days ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

async function clearExistingData() {
  console.log('🧹 Clearing existing data...');
  
  await db.delete(payments);
  await db.delete(signups);
  await db.delete(futsalSessions);
  await db.delete(helpRequests);
  await db.delete(players);
  await db.delete(users).where(eq(users.isAdmin, false));
  
  console.log('✅ Existing data cleared');
}

async function createParents() {
  console.log('👨‍👩‍👧‍👦 Creating 20 parent accounts...');
  
  const parentNames = [
    'Michael Johnson', 'Sarah Williams', 'David Brown', 'Jennifer Davis',
    'Robert Miller', 'Lisa Wilson', 'Christopher Moore', 'Maria Taylor',
    'James Anderson', 'Patricia Thomas', 'John Jackson', 'Linda White',
    'Mark Harris', 'Susan Martin', 'Paul Thompson', 'Sandra Garcia',
    'Steven Martinez', 'Donna Robinson', 'Kevin Clark', 'Carol Rodriguez'
  ];
  
  const parentData = parentNames.map((name, index) => {
    const [firstName, lastName] = name.split(' ');
    return {
      id: nanoid(),
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
      firstName,
      lastName,
      isAdmin: false,
      isApproved: true,
      registrationStatus: 'approved' as const,
      approvedAt: new Date(2025, 3, getRandomInt(1, 15)),
      createdAt: new Date(2025, 3, getRandomInt(1, 15))
    };
  });

  await db.insert(users).values(parentData);
  console.log(`✅ Created ${parentData.length} parent accounts`);
  
  return parentData;
}

async function createPlayers(parents: any[]) {
  console.log('⚽ Creating player profiles...');
  
  const boyNames = ['Alex', 'Ben', 'Carlos', 'Diego', 'Ethan', 'Felix', 'Gabriel', 'Hugo', 'Ivan', 'Jake'];
  const girlNames = ['Ana', 'Bella', 'Chloe', 'Diana', 'Emma', 'Fiona', 'Grace', 'Hannah', 'Isabella', 'Julia'];
  const soccerClubs = ['Inter Miami CF Academy', 'Orlando City Youth', 'Tampa Bay United', 'Jacksonville Armada Youth'];
  
  const playersData = [];
  
  for (const parent of parents) {
    const numPlayers = Math.random() < 0.4 ? 2 : 1; // 40% have 2 players
    
    for (let i = 0; i < numPlayers; i++) {
      const gender = getRandomElement(GENDERS) as 'boys' | 'girls';
      const firstName = getRandomElement(gender === 'boys' ? boyNames : girlNames);
      const ageGroup = getRandomElement(AGE_GROUPS);
      const birthYear = 2025 - parseInt(ageGroup.substring(1));
      const currentAge = 2025 - birthYear;
      
      playersData.push({
        id: nanoid(),
        firstName,
        lastName: parent.lastName,
        birthYear,
        gender,
        parentId: parent.id,
        soccerClub: getRandomElement(soccerClubs),
        canAccessPortal: currentAge >= 13 && Math.random() < 0.6,
        canBookAndPay: true,
        email: `${firstName.toLowerCase()}.${parent.lastName.toLowerCase()}@email.com`,
        phoneNumber: `555-${getRandomInt(100, 999)}-${getRandomInt(1000, 9999)}`,
        isApproved: true,
        registrationStatus: 'approved' as const,
        approvedAt: new Date(2025, 3, getRandomInt(1, 30)),
        createdAt: new Date(2025, 3, getRandomInt(1, 30))
      });
    }
  }
  
  const insertedPlayers = await db.insert(players).values(playersData).returning();
  console.log(`✅ Created ${insertedPlayers.length} player profiles`);
  
  return insertedPlayers;
}

async function createSessions() {
  console.log('📅 Creating comprehensive session schedule (April-July 2025)...');
  
  const sessionsData = [];
  const startDate = new Date(2025, 3, 1); // April 1, 2025
  const endDate = new Date(2025, 6, 31); // July 31, 2025
  
  let ageGroupIndex = 0;
  let sessionCount = 0;
  
  for (let date = new Date(startDate); date <= endDate; date = addDays(date, 1)) {
    if (isWeekday(date)) {
      // Create exactly 3 sessions per weekday
      for (const timeSlot of SESSION_TIMES) {
        const startTime = new Date(date);
        startTime.setHours(timeSlot.hour, timeSlot.minute, 0, 0);
        
        const endTime = new Date(startTime);
        endTime.setHours(startTime.getHours() + 1, startTime.getMinutes() + 30); // 1.5 hours
        
        const ageGroup = AGE_GROUPS[ageGroupIndex % AGE_GROUPS.length];
        const gender = GENDERS[Math.floor(ageGroupIndex / AGE_GROUPS.length) % GENDERS.length] as 'boys' | 'girls';
        const location = LOCATIONS[sessionCount % LOCATIONS.length];
        
        sessionsData.push({
          title: `${ageGroup} ${gender.charAt(0).toUpperCase() + gender.slice(1)} Training`,
          location,
          ageGroups: [ageGroup],
          genders: [gender],
          startTime,
          endTime,
          capacity: CAPACITY,
          priceCents: PRICE_CENTS,
          status: 'closed' as const, // Past sessions are closed
          bookingOpenHour: 8,
          bookingOpenMinute: 0
        });
        
        ageGroupIndex++;
        sessionCount++;
      }
    }
  }
  
  const insertedSessions = await db.insert(futsalSessions).values(sessionsData).returning();
  console.log(`✅ Created ${insertedSessions.length} training sessions`);
  console.log(`   • 3 sessions per weekday across 4 months`);
  console.log(`   • Covering all age groups: ${AGE_GROUPS.join(', ')}`);
  console.log(`   • Both boys and girls sessions`);
  console.log(`   • Multiple locations: ${LOCATIONS.join(', ')}`);
  
  return insertedSessions;
}

async function createSignupsAndPayments(sessions: any[], playersData: any[]) {
  console.log('📝 Creating realistic signups with progressive fill rates...');
  
  const signupsData = [];
  const paymentsData = [];
  
  for (const session of sessions) {
    const sessionMonth = session.startTime.getMonth(); // 3=April, 4=May, 5=June, 6=July
    
    // Progressive growth pattern with realistic fill rates
    let minPlayers: number, maxPlayers: number;
    if (sessionMonth === 3) { // April - soft launch
      minPlayers = 4;
      maxPlayers = 8;
    } else if (sessionMonth === 4) { // May - growing
      minPlayers = 6;
      maxPlayers = 10;
    } else if (sessionMonth === 5) { // June - peak
      minPlayers = 8;
      maxPlayers = 12;
    } else { // July - summer steady
      minPlayers = 7;
      maxPlayers = 11;
    }
    
    const numSignups = getRandomInt(minPlayers, maxPlayers);
    
    // Find eligible players for this session
    const eligiblePlayers = playersData.filter(player => {
      const playerAgeGroup = `U${2025 - player.birthYear}`;
      return session.ageGroups.includes(playerAgeGroup) && 
             session.genders.includes(player.gender);
    });
    
    if (eligiblePlayers.length === 0) continue;
    
    // Select random eligible players for this session
    const selectedPlayers = [];
    for (let i = 0; i < Math.min(numSignups, eligiblePlayers.length); i++) {
      const availablePlayers = eligiblePlayers.filter(p => 
        !selectedPlayers.find(sp => sp.id === p.id)
      );
      if (availablePlayers.length > 0) {
        selectedPlayers.push(getRandomElement(availablePlayers));
      }
    }
    
    // Create signups and payments for selected players
    for (const player of selectedPlayers) {
      const signupId = nanoid();
      const createdAt = new Date(session.startTime.getTime() - getRandomInt(1, 48) * 60 * 60 * 1000);
      const isPaid = Math.random() < 0.92; // 92% paid, 8% pending for testing
      
      signupsData.push({
        playerId: player.id!,
        sessionId: session.id!,
        paid: isPaid,
        paymentIntentId: isPaid ? `pi_${nanoid()}` : null
      });
      
      if (isPaid) {
        paymentsData.push({
          signupId,
          paymentIntentId: `pi_${nanoid()}`,
          amountCents: PRICE_CENTS,
          paidAt: new Date(createdAt.getTime() + getRandomInt(1, 10) * 60 * 1000)
        });
      }
    }
  }
  
  await db.insert(signups).values(signupsData);
  await db.insert(payments).values(paymentsData);
  
  console.log(`✅ Created ${signupsData.length} signups and ${paymentsData.length} payments`);
  console.log(`   • Average fill rate: ${Math.round((signupsData.length / (sessions.length * CAPACITY)) * 100)}%`);
  console.log(`   • ${paymentsData.length} paid bookings (${Math.round((paymentsData.length / signupsData.length) * 100)}%)`);
  console.log(`   • ${signupsData.length - paymentsData.length} pending payments for testing`);
  
  return { signupsData, paymentsData };
}

async function createHelpRequests(parents: any[]) {
  console.log('🆘 Creating help requests across 4 months...');
  
  const subjects = [
    'Cannot access my booking',
    'Payment not showing as processed',
    'Session time conflict',
    'Player age group question',
    'Portal access for my child',
    'Booking confirmation missing'
  ];
  
  const helpRequestsData = [];
  
  for (let month = 3; month <= 6; month++) { // April-July
    const numRequests = getRandomInt(3, 6);
    
    for (let i = 0; i < numRequests; i++) {
      const parent = getRandomElement(parents);
      const createdAt = new Date(2025, month, getRandomInt(1, 28));
      const isResolved = Math.random() < 0.75; // 75% resolved
      
      helpRequestsData.push({
        name: `${parent.firstName} ${parent.lastName}`,
        email: parent.email,
        phone: `555-${getRandomInt(100, 999)}-${getRandomInt(1000, 9999)}`,
        subject: getRandomElement(subjects),
        note: 'I need assistance with this issue. Please help me resolve this matter.',
        category: getRandomElement(['booking', 'payment', 'account', 'general']) as any,
        priority: getRandomElement(['low', 'medium', 'high']) as any,
        status: isResolved ? 'resolved' : getRandomElement(['open', 'replied']) as any,
        resolvedAt: isResolved ? new Date(createdAt.getTime() + getRandomInt(1, 72) * 60 * 60 * 1000) : null
      });
    }
  }
  
  await db.insert(helpRequests).values(helpRequestsData);
  console.log(`✅ Created ${helpRequestsData.length} help requests`);
}

async function printSummaryStats() {
  console.log('\n📊 COMPREHENSIVE DATA SUMMARY');
  console.log('═'.repeat(60));
  
  const totalSessions = await db.select({ count: sql<number>`COUNT(*)` }).from(futsalSessions);
  const totalSignups = await db.select({ count: sql<number>`COUNT(*)` }).from(signups);
  const totalPayments = await db.select({ count: sql<number>`COUNT(*)` }).from(payments);
  const totalRevenue = await db.select({ revenue: sql<number>`COALESCE(SUM(amount_cents), 0)` }).from(payments);
  const totalPlayers = await db.select({ count: sql<number>`COUNT(*)` }).from(players);
  const totalParents = await db.select({ count: sql<number>`COUNT(*)` }).from(users).where(eq(users.isAdmin, false));
  
  console.log(`📅 Total Sessions: ${totalSessions[0]?.count || 0}`);
  console.log(`⚽ Total Players: ${totalPlayers[0]?.count || 0}`);
  console.log(`👨‍👩‍👧‍👦 Total Parents: ${totalParents[0]?.count || 0}`);
  console.log(`📝 Total Signups: ${totalSignups[0]?.count || 0}`);
  console.log(`💰 Total Payments: ${totalPayments[0]?.count || 0}`);
  console.log(`💵 Total Revenue: $${((totalRevenue[0]?.revenue || 0) / 100).toFixed(2)}`);
  console.log(`📈 Fill Rate: ${Math.round(((totalSignups[0]?.count || 0) / ((totalSessions[0]?.count || 1) * CAPACITY)) * 100)}%`);
  
  // Monthly breakdown
  console.log('\n📊 Monthly Session Distribution:');
  const monthlyStats = await db.execute(sql`
    SELECT 
      TO_CHAR(start_time, 'YYYY-MM') as month,
      COUNT(*) as sessions
    FROM futsal_sessions 
    GROUP BY TO_CHAR(start_time, 'YYYY-MM') 
    ORDER BY month
  `);
  
  for (const stat of monthlyStats.rows) {
    console.log(`   ${stat.month}: ${stat.sessions} sessions`);
  }
  
  console.log('\n✅ Database seeding completed successfully!');
  console.log('🎯 Ready for comprehensive testing and demos');
}

async function main() {
  try {
    console.log('🚀 Starting comprehensive database seeding...');
    console.log('📋 Target: 3 sessions/day × 5 days/week × 17 weeks = ~255 sessions');
    
    await clearExistingData();
    const parents = await createParents();
    const playersData = await createPlayers(parents);
    const sessions = await createSessions();
    await createSignupsAndPayments(sessions, playersData);
    await createHelpRequests(parents);
    await printSummaryStats();
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run the seeding function directly
main().catch(console.error);