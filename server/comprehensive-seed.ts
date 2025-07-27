#!/usr/bin/env tsx

/*
 * Comprehensive 3-Month Database Seeding Script
 * 
 * Generates realistic business data for April-June 2025:
 * - Progressive growth from soft launch to peak season
 * - Realistic parent/player relationships
 * - Consistent session schedules and signups
 * - Aligned revenue and metrics
 */

import { db } from "./db";
import { 
  users, 
  players, 
  futsalSessions, 
  signups, 
  payments, 
  helpRequests,
  notificationPreferences,
  type UpsertUser,
  type InsertPlayer,
  type InsertSession,
  type InsertSignup,
  type InsertPayment,
  type InsertHelpRequest,
  type InsertNotificationPreferences
} from "../shared/schema";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

// Constants
const AGE_GROUPS = ['U8', 'U9', 'U10', 'U11', 'U12', 'U13', 'U14', 'U15'];
const GENDERS = ['boys', 'girls'];
const LOCATIONS = ['Sugar Sand Park, Boca Raton'] as const;
const SESSION_TIMES = ['17:00', '18:45', '20:30']; // 5:00 PM, 6:45 PM, 8:30 PM
const PRICE_CENTS = 1000; // $10.00
const CAPACITY = 12;

// Parent data
const PARENT_NAMES = [
  { firstName: 'Michael', lastName: 'Johnson', email: 'michael.johnson@email.com' },
  { firstName: 'Sarah', lastName: 'Williams', email: 'sarah.williams@email.com' },
  { firstName: 'David', lastName: 'Brown', email: 'david.brown@email.com' },
  { firstName: 'Jennifer', lastName: 'Davis', email: 'jennifer.davis@email.com' },
  { firstName: 'Robert', lastName: 'Miller', email: 'robert.miller@email.com' },
  { firstName: 'Lisa', lastName: 'Wilson', email: 'lisa.wilson@email.com' },
  { firstName: 'Christopher', lastName: 'Moore', email: 'christopher.moore@email.com' },
  { firstName: 'Maria', lastName: 'Taylor', email: 'maria.taylor@email.com' },
  { firstName: 'James', lastName: 'Anderson', email: 'james.anderson@email.com' },
  { firstName: 'Patricia', lastName: 'Thomas', email: 'patricia.thomas@email.com' },
  { firstName: 'John', lastName: 'Jackson', email: 'john.jackson@email.com' },
  { firstName: 'Linda', lastName: 'White', email: 'linda.white@email.com' },
  { firstName: 'Mark', lastName: 'Harris', email: 'mark.harris@email.com' },
  { firstName: 'Susan', lastName: 'Martin', email: 'susan.martin@email.com' },
  { firstName: 'Paul', lastName: 'Thompson', email: 'paul.thompson@email.com' },
  { firstName: 'Sandra', lastName: 'Garcia', email: 'sandra.garcia@email.com' },
  { firstName: 'Steven', lastName: 'Martinez', email: 'steven.martinez@email.com' },
  { firstName: 'Donna', lastName: 'Robinson', email: 'donna.robinson@email.com' },
  { firstName: 'Kevin', lastName: 'Clark', email: 'kevin.clark@email.com' },
  { firstName: 'Carol', lastName: 'Rodriguez', email: 'carol.rodriguez@email.com' }
];

// Player names
const PLAYER_FIRST_NAMES = {
  boys: ['Alex', 'Ben', 'Carlos', 'Diego', 'Ethan', 'Felix', 'Gabriel', 'Hugo', 'Ivan', 'Jake', 'Kyle', 'Luis', 'Max', 'Noah', 'Oscar', 'Pablo', 'Quinn', 'Ryan', 'Sam', 'Tyler'],
  girls: ['Ana', 'Bella', 'Chloe', 'Diana', 'Emma', 'Fiona', 'Grace', 'Hannah', 'Isabella', 'Julia', 'Katie', 'Luna', 'Maya', 'Nora', 'Olivia', 'Paige', 'Quinn', 'Riley', 'Sofia', 'Tara']
};

const SOCCER_CLUBS = [
  'Inter Miami CF Academy',
  'Orlando City Youth',
  'Tampa Bay United',
  'Jacksonville Armada Youth',
  'Boca Raton FC',
  'Fort Lauderdale CF Youth',
  'Miami United FC',
  'Plantation Soccer Club',
  'Coral Springs United',
  'Davie United FC'
];

// Utility functions
function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function isWeekday(date: Date): boolean {
  const day = date.getDay();
  return day >= 1 && day <= 5; // Monday = 1, Friday = 5
}

function getBirthYear(ageGroup: string): number {
  const age = parseInt(ageGroup.substring(1));
  const currentYear = 2025;
  return currentYear - age;
}

async function clearExistingData() {
  console.log('🧹 Clearing existing data...');
  
  await db.delete(payments);
  await db.delete(signups);
  await db.delete(futsalSessions);
  await db.delete(players);
  await db.delete(notificationPreferences);
  await db.delete(helpRequests);
  await db.delete(users);
  
  console.log('✅ Existing data cleared');
}

async function createParents() {
  console.log('👨‍👩‍👧‍👦 Creating parent accounts...');
  
  const parentData: UpsertUser[] = PARENT_NAMES.map((parent) => ({
    id: nanoid(),
    email: parent.email,
    firstName: parent.firstName,
    lastName: parent.lastName,
    isAdmin: false,
    isApproved: true,
    registrationStatus: 'approved' as const,
    approvedAt: new Date(2025, 3, getRandomInt(1, 15)),
    createdAt: new Date(2025, 3, getRandomInt(1, 15)), // Early April
  }));

  await db.insert(users).values(parentData);
  console.log(`✅ Created ${parentData.length} parent accounts`);
  
  return parentData;
}

async function createPlayers(parents: UpsertUser[]) {
  console.log('⚽ Creating player profiles...');
  
  const playersData: InsertPlayer[] = [];
  
  for (const parent of parents) {
    const numPlayers = Math.random() < 0.3 ? 2 : 1; // 30% chance of 2 players, 70% chance of 1
    
    for (let i = 0; i < numPlayers; i++) {
      const gender = getRandomElement(GENDERS) as 'boys' | 'girls';
      const ageGroup = getRandomElement(AGE_GROUPS);
      const firstName = getRandomElement(PLAYER_FIRST_NAMES[gender]);
      const birthYear = getBirthYear(ageGroup);
      const currentAge = 2025 - birthYear;
      
      playersData.push({
        id: nanoid(),
        firstName,
        lastName: parent.lastName || 'Unknown',
        birthYear,
        gender,
        parentId: parent.id,
        soccerClub: getRandomElement(SOCCER_CLUBS),
        canAccessPortal: currentAge >= 13 && Math.random() < 0.6, // Only 13+ can have portal access
        canBookAndPay: true,
        email: `${firstName.toLowerCase()}.${(parent.lastName || 'unknown').toLowerCase()}@email.com`,
        phoneNumber: `555-${getRandomInt(100, 999)}-${getRandomInt(1000, 9999)}`,
        isApproved: true,
        registrationStatus: 'approved' as const,
        approvedAt: new Date(2025, 3, getRandomInt(1, 30)),
        createdAt: new Date(2025, 3, getRandomInt(1, 30)),
      });
    }
  }
  
  await db.insert(players).values(playersData);
  console.log(`✅ Created ${playersData.length} player profiles`);
  
  return playersData;
}

async function createSessions() {
  console.log('📅 Creating session schedule (April-June 2025)...');
  
  const sessionsData: InsertSession[] = [];
  const startDate = new Date(2025, 3, 1); // April 1, 2025
  const endDate = new Date(2025, 5, 30); // June 30, 2025
  
  let ageGroupIndex = 0;
  
  for (let date = new Date(startDate); date <= endDate; date = addDays(date, 1)) {
    if (isWeekday(date)) {
      // Create 3 sessions per weekday
      for (const timeSlot of SESSION_TIMES) {
        const [hour, minute] = timeSlot.split(':').map(Number);
        const startTime = new Date(date);
        startTime.setHours(hour, minute, 0, 0);
        
        const endTime = new Date(startTime);
        endTime.setHours(startTime.getHours() + 1, startTime.getMinutes() + 30); // 1.5 hours
        
        const ageGroup = AGE_GROUPS[ageGroupIndex % AGE_GROUPS.length];
        const gender = GENDERS[Math.floor(ageGroupIndex / AGE_GROUPS.length) % GENDERS.length] as 'boys' | 'girls';
        
        sessionsData.push({
          id: nanoid(),
          title: `${ageGroup} ${gender.charAt(0).toUpperCase() + gender.slice(1)} Training`,
          location: LOCATIONS[0],
          ageGroups: [ageGroup],
          genders: [gender],
          startTime,
          endTime,
          capacity: CAPACITY,
          priceCents: PRICE_CENTS,
          status: 'closed', // Past sessions are closed
          bookingOpenHour: 8,
          bookingOpenMinute: 0,
          createdAt: new Date(startTime.getTime() - 7 * 24 * 60 * 60 * 1000), // Created 1 week before
        });
        
        ageGroupIndex++;
      }
    }
  }
  
  await db.insert(futsalSessions).values(sessionsData);
  console.log(`✅ Created ${sessionsData.length} training sessions`);
  
  return sessionsData;
}

async function createSignupsAndPayments(sessions: InsertSession[], playersData: InsertPlayer[]) {
  console.log('📝 Creating signups and payments with growth pattern...');
  
  const signupsData: InsertSignup[] = [];
  const paymentsData: InsertPayment[] = [];
  
  for (const session of sessions) {
    const sessionMonth = session.startTime.getMonth(); // 3=April, 4=May, 5=June
    
    // Growth pattern: April (4-8 players), May (6-10 players), June (8-12 players)
    let minPlayers: number, maxPlayers: number;
    if (sessionMonth === 3) { // April
      minPlayers = 4;
      maxPlayers = 8;
    } else if (sessionMonth === 4) { // May
      minPlayers = 6;
      maxPlayers = 10;
    } else { // June
      minPlayers = 8;
      maxPlayers = 12;
    }
    
    const numSignups = getRandomInt(minPlayers, maxPlayers);
    const eligiblePlayers = playersData.filter(player => {
      const ageGroup = `U${2025 - player.birthYear}`;
      return session.ageGroups.includes(ageGroup) && 
             session.genders.includes(player.gender);
    });
    
    if (eligiblePlayers.length === 0) continue;
    
    const selectedPlayers: InsertPlayer[] = [];
    for (let i = 0; i < Math.min(numSignups, eligiblePlayers.length); i++) {
      const randomPlayer = getRandomElement(eligiblePlayers.filter(p => 
        !selectedPlayers.find(sp => sp.id === p.id)
      ));
      if (randomPlayer) selectedPlayers.push(randomPlayer);
    }
    
    for (const player of selectedPlayers) {
      const signupId = nanoid();
      const createdAt = new Date(session.startTime.getTime() - getRandomInt(1, 48) * 60 * 60 * 1000);
      const isPaid = Math.random() < 0.9; // 90% paid, 10% pending
      
      signupsData.push({
        id: signupId,
        playerId: player.id,
        sessionId: session.id,
        paid: isPaid,
        paymentIntentId: isPaid ? `pi_${nanoid()}` : null,
        createdAt,
      });
      
      if (isPaid) {
        paymentsData.push({
          id: nanoid(),
          signupId,
          paymentIntentId: `pi_${nanoid()}`,
          amountCents: PRICE_CENTS,
          paidAt: new Date(createdAt.getTime() + getRandomInt(1, 10) * 60 * 1000), // Paid within 10 minutes
          createdAt,
        });
      }
    }
  }
  
  await db.insert(signups).values(signupsData);
  await db.insert(payments).values(paymentsData);
  
  console.log(`✅ Created ${signupsData.length} signups and ${paymentsData.length} payments`);
  
  return { signupsData, paymentsData };
}

async function createHelpRequests(parents: UpsertUser[]) {
  console.log('🆘 Creating help requests...');
  
  const helpRequestsData: InsertHelpRequest[] = [];
  
  const subjects = [
    'Cannot access my booking',
    'Payment not showing as processed',
    'Forgot my password',
    'Session time conflict',
    'Player age group question',
    'Refund request for cancelled session',
    'Portal access for my child',
    'Booking confirmation email missing'
  ];
  
  for (let month = 3; month <= 5; month++) { // April-June
    const numRequests = getRandomInt(5, 8);
    
    for (let i = 0; i < numRequests; i++) {
      const parent = getRandomElement(parents);
      const createdAt = new Date(2025, month, getRandomInt(1, 28));
      const isResolved = Math.random() < 0.7; // 70% resolved
      
      helpRequestsData.push({
        id: nanoid(),
        userId: parent.id,
        name: `${parent.firstName} ${parent.lastName}`,
        email: parent.email || 'parent@example.com',
        phone: `555-${getRandomInt(100, 999)}-${getRandomInt(1000, 9999)}`,
        subject: getRandomElement(subjects),
        note: 'I need assistance with this issue. Please help me resolve this matter as soon as possible.',
        category: getRandomElement(['booking', 'payment', 'account', 'general']) as 'booking' | 'payment' | 'account' | 'general',
        priority: getRandomElement(['low', 'medium', 'high']) as 'low' | 'medium' | 'high',
        status: isResolved ? 'resolved' : getRandomElement(['open', 'replied']) as 'open' | 'replied' | 'resolved',
        resolvedAt: isResolved ? new Date(createdAt.getTime() + getRandomInt(1, 72) * 60 * 60 * 1000) : null,
        createdAt,
      });
    }
  }
  
  await db.insert(helpRequests).values(helpRequestsData);
  console.log(`✅ Created ${helpRequestsData.length} help requests`);
}

async function createNotificationPreferences(parents: UpsertUser[]) {
  console.log('🔔 Creating notification preferences...');
  
  const preferencesData: InsertNotificationPreferences[] = parents.map(parent => ({
    parentId: parent.id,
    email: true,
    sms: Math.random() < 0.6, // 60% opt into SMS
  }));
  
  await db.insert(notificationPreferences).values(preferencesData);
  console.log(`✅ Created ${preferencesData.length} notification preferences`);
}

async function printSummaryStats() {
  console.log('\n📊 SUMMARY STATISTICS');
  console.log('═'.repeat(50));
  
  // Revenue by month
  const revenueStats = await db
    .select({
      month: sql<string>`TO_CHAR(paid_at, 'YYYY-MM')`,
      revenue: sql<number>`SUM(amount_cents)`,
      payments: sql<number>`COUNT(*)`
    })
    .from(payments)
    .where(sql`paid_at IS NOT NULL`)
    .groupBy(sql`TO_CHAR(paid_at, 'YYYY-MM')`)
    .orderBy(sql`TO_CHAR(paid_at, 'YYYY-MM')`);
    
  console.log('\n💰 REVENUE BY MONTH:');
  if (revenueStats && revenueStats.length > 0) {
    for (const stat of revenueStats) {
      console.log(`  ${stat.month}: $${(stat.revenue / 100).toFixed(2)} (${stat.payments} payments)`);
    }
  } else {
    console.log('  No revenue data found');
  }
  
  // Total stats
  const totalStats = await db
    .select({
      totalPlayers: sql<number>`(SELECT COUNT(*) FROM ${players})`,
      totalSessions: sql<number>`(SELECT COUNT(*) FROM ${futsalSessions})`,
      totalSignups: sql<number>`(SELECT COUNT(*) FROM ${signups})`,
      totalRevenue: sql<number>`(SELECT COALESCE(SUM(amount_cents), 0) FROM ${payments})`,
      pendingPayments: sql<number>`(SELECT COUNT(*) FROM ${signups} WHERE paid = false)`
    });
    
  const stats = totalStats[0];
    
  console.log('\n📈 OVERALL TOTALS:');
  console.log(`  Players: ${stats?.totalPlayers || 0}`);
  console.log(`  Sessions: ${stats?.totalSessions || 0}`);
  console.log(`  Signups: ${stats?.totalSignups || 0}`);
  console.log(`  Revenue: $${((stats?.totalRevenue || 0) / 100).toFixed(2)}`);
  console.log(`  Pending Payments: ${stats?.pendingPayments || 0}`);
  
  // Fill rate calculation
  const fillRateStats = await db
    .select({
      totalCapacity: sql<number>`SUM(capacity)`,
      totalBookings: sql<number>`(SELECT COUNT(*) FROM ${signups})`
    })
    .from(futsalSessions);
    
  const fillData = fillRateStats[0];
  const fillRate = fillData?.totalCapacity > 0 
    ? Math.round((fillData.totalBookings / fillData.totalCapacity) * 100)
    : 0;
    
  console.log(`  Fill Rate: ${fillRate}%`);
  console.log('═'.repeat(50));
}

async function main() {
  console.log('🚀 Starting comprehensive 3-month database seeding...\n');
  
  try {
    await clearExistingData();
    
    const parents = await createParents();
    const playersData = await createPlayers(parents);
    const sessions = await createSessions();
    const { signupsData, paymentsData } = await createSignupsAndPayments(sessions, playersData);
    
    await createHelpRequests(parents);
    await createNotificationPreferences(parents);
    
    await printSummaryStats();
    
    console.log('\n🎉 Comprehensive seeding completed successfully!');
    console.log('✨ Your database now contains 3 months of realistic business data.');
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

// Run the seeding script
main();