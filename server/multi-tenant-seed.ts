import { db } from "./db";
import { 
  tenants, 
  users, 
  players, 
  futsalSessions, 
  signups, 
  payments, 
  helpRequests,
  systemSettings,
  type TenantInsert,
  type UpsertUser,
  type InsertPlayer,
  type InsertSession,
  type InsertSignup,
  type InsertPayment,
  type InsertHelpRequest
} from "@shared/schema";
import { nanoid } from "nanoid";

// Helper functions for date generation
const now = new Date();
const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
const endOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0);

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Data arrays
const tenantDataArray: TenantInsert[] = [
  {
    name: "PlayHQ",
    subdomain: "playhq",
  },
  {
    name: "Elite Footwork Academy", 
    subdomain: "elite-footwork",
  }
];

const ageGroups = ["U8", "U9", "U10", "U11", "U12", "U13", "U14", "U15", "U16", "U17", "U18"];
const genders = ["boys", "girls", "mixed"];
const locations = ["Turf City", "Sports Hub", "Jurong East"];

const firstNames = [
  "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda",
  "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica",
  "Thomas", "Sarah", "Christopher", "Karen", "Charles", "Nancy", "Daniel", "Lisa",
  "Matthew", "Betty", "Anthony", "Helen", "Mark", "Sandra", "Donald", "Donna",
  "Steven", "Carol", "Paul", "Ruth", "Andrew", "Sharon", "Kenneth", "Michelle",
  "Joshua", "Laura", "Kevin", "Sarah", "Brian", "Kimberly", "George", "Deborah"
];

const lastNames = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas",
  "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White",
  "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young",
  "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores"
];

const helpRequestSubjects = [
  "Can't book session",
  "Payment didn't go through", 
  "Password reset request",
  "Session cancellation inquiry",
  "Age group eligibility question",
  "Location change request",
  "Refund request",
  "Account access issue",
  "Session time conflict",
  "Mobile app not working"
];

async function clearExistingData() {
  await db.delete(payments);
  await db.delete(signups);
  await db.delete(futsalSessions);
  await db.delete(players);
  await db.delete(helpRequests);
  await db.delete(users);
  await db.delete(tenants);
}

async function seedTenants() {
  const createdTenants = [];
  
  for (const tenantData of tenantDataArray) {
    const [tenant] = await db.insert(tenants).values(tenantData).returning();
    createdTenants.push(tenant);
  }
  
  return createdTenants;
}

async function seedUsersForTenant(tenantId: string, tenantName: string) {
  const createdUsers = [];
  
  // Create 1 super admin
  const superAdmin = {
    id: `super-admin-${tenantId}`,
    tenantId,
    email: `superadmin@${tenantName.toLowerCase().replace(/\s+/g, '')}.com`,
    firstName: randomElement(firstNames),
    lastName: randomElement(lastNames),
    isAdmin: true,
    isAssistant: false,
    isSuperAdmin: true,
    isApproved: true,
    registrationStatus: "approved" as const,
  };
  
  const [superAdminUser] = await db.insert(users).values(superAdmin).returning();
  createdUsers.push(superAdminUser);
  
  // Create 2 regular admins
  for (let i = 0; i < 2; i++) {
    const admin = {
      id: `admin-${tenantId}-${i}`,
      tenantId,
      email: `admin${i + 1}@${tenantName.toLowerCase().replace(/\s+/g, '')}.com`,
      firstName: randomElement(firstNames),
      lastName: randomElement(lastNames),
      isAdmin: true,
      isAssistant: false,
      isSuperAdmin: false,
      isApproved: true,
      registrationStatus: "approved" as const,
    };
    
    const [adminUser] = await db.insert(users).values(admin).returning();
    createdUsers.push(adminUser);
  }
  
  // Create 20 parents
  for (let i = 0; i < 20; i++) {
    const approvedAt = randomDate(threeMonthsAgo, now);
    const parent = {
      id: `parent-${tenantId}-${i}`,
      tenantId,
      email: `parent${i + 1}@${tenantName.toLowerCase().replace(/\s+/g, '')}.com`,
      firstName: randomElement(firstNames),
      lastName: randomElement(lastNames),
      phone: `+1${randomInt(200, 999)}${randomInt(100, 999)}${randomInt(1000, 9999)}`,
      isAdmin: false,
      isAssistant: false,
      isSuperAdmin: false,
      isApproved: true,
      registrationStatus: "approved" as const,
      approvedAt,
    };
    
    const [parentUser] = await db.insert(users).values(parent).returning();
    createdUsers.push(parentUser);
  }
  
  return createdUsers;
}

async function seedPlayersForTenant(tenantId: string, tenantName: string, parents: any[]) {
  const createdPlayers = [];
  const parentUsers = parents.filter(u => !u.isAdmin);
  
  // Create 30-40 players (1-3 per parent)
  const targetPlayers = randomInt(30, 40);
  let playersCreated = 0;
  
  for (const parent of parentUsers) {
    const playersForParent = randomInt(1, 3);
    
    for (let i = 0; i < playersForParent && playersCreated < targetPlayers; i++) {
      const age = randomInt(8, 18);
      const birthYear = now.getFullYear() - age;
      const createdAt = randomDate(threeMonthsAgo, now);
      
      const player = {
        tenantId,
        parentId: parent.id,
        firstName: randomElement(firstNames),
        lastName: parent.lastName,
        email: Math.random() > 0.7 ? `${randomElement(firstNames).toLowerCase()}${randomInt(1, 999)}@email.com` : null,
        phoneNumber: Math.random() > 0.8 ? `+1${randomInt(200, 999)}${randomInt(100, 999)}${randomInt(1000, 9999)}` : null,
        birthYear,
        gender: randomElement(["boys", "girls"]) as "boys" | "girls",
        isApproved: true,
        registrationStatus: "approved" as const,
        approvedAt: createdAt,
        canAccessPortal: age >= 13,
        canBookAndPay: age >= 13 && Math.random() > 0.3,
      };
      
      const [createdPlayer] = await db.insert(players).values(player).returning();
      createdPlayers.push(createdPlayer);
      playersCreated++;
    }
  }
  
  return createdPlayers;
}

async function seedSessionsForTenant(tenantId: string, tenantName: string) {
  const createdSessions = [];
  
  // Generate sessions for past 3 months (3 per week)
  const startDate = threeMonthsAgo;
  const endDate = now;
  
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    // 3 sessions per week (Mon, Wed, Fri)
    for (let dayOffset of [1, 3, 5]) { // Monday, Wednesday, Friday
      const sessionDate = new Date(currentDate);
      sessionDate.setDate(sessionDate.getDate() + dayOffset);
      
      if (sessionDate <= endDate) {
        const startTime = new Date(sessionDate);
        startTime.setHours(randomInt(16, 19), randomInt(0, 3) * 15, 0, 0); // 4-7 PM
        
        const endTime = new Date(startTime);
        endTime.setHours(startTime.getHours() + 1, startTime.getMinutes() + 30); // 90 minutes
        
        const capacity = randomInt(8, 20);
        const ageGroup = randomElement(ageGroups);
        const gender = randomElement(genders);
        
        const session = {
          tenantId,
          title: `${ageGroup} ${gender.charAt(0).toUpperCase() + gender.slice(1)} Training`,
          location: randomElement(locations),
          startTime,
          endTime,
          capacity,
          priceCents: randomInt(15, 25) * 100, // $15-25 in cents
          ageGroups: [ageGroup],
          genders: [gender],
          status: (sessionDate < now ? "closed" : "open") as "closed" | "open",
          accessCode: Math.random() > 0.7 ? `${ageGroup}${randomInt(100, 999)}` : null,
        };
        
        const [createdSession] = await db.insert(futsalSessions).values(session).returning();
        createdSessions.push(createdSession);
      }
    }
    
    // Move to next week
    currentDate.setDate(currentDate.getDate() + 7);
  }
  
  // Generate future sessions for next month (4 sessions)
  const futureStartDate = nextMonth;
  const futureEndDate = endOfNextMonth;
  
  for (let i = 0; i < 4; i++) {
    const sessionDate = randomDate(futureStartDate, futureEndDate);
    const startTime = new Date(sessionDate);
    startTime.setHours(randomInt(16, 19), randomInt(0, 3) * 15, 0, 0);
    
    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + 1, startTime.getMinutes() + 30);
    
    const capacity = randomInt(8, 20);
    const ageGroup = randomElement(ageGroups);
    const gender = randomElement(genders);
    
    const session = {
      tenantId,
      title: `${ageGroup} ${gender.charAt(0).toUpperCase() + gender.slice(1)} Training`,
      location: randomElement(locations),
      startTime,
      endTime,
      capacity,
      priceCents: randomInt(15, 25) * 100,
      ageGroups: [ageGroup],
      genders: [gender],
      status: "open" as const,
      accessCode: Math.random() > 0.7 ? `${ageGroup}${randomInt(100, 999)}` : null,
    };
    
    const [createdSession] = await db.insert(futsalSessions).values(session).returning();
    createdSessions.push(createdSession);
  }
  
  return createdSessions;
}

async function seedSignupsAndPaymentsForTenant(tenantId: string, tenantName: string, players: any[], sessions: any[]) {
  const createdSignups = [];
  const createdPayments = [];
  
  for (const session of sessions) {
    const sessionDate = new Date(session.startTime);
    const isPastSession = sessionDate < now;
    const isFutureSession = sessionDate > now;
    
    let targetSignups: number;
    if (isPastSession) {
      // Past sessions: 50-95% capacity
      targetSignups = Math.floor(session.capacity * (0.5 + Math.random() * 0.45));
    } else {
      // Future sessions: 0-30% capacity  
      targetSignups = Math.floor(session.capacity * Math.random() * 0.3);
    }
    
    // Filter eligible players by age and gender
    const eligiblePlayers = players.filter(player => {
      const playerAge = now.getFullYear() - player.birthYear;
      const sessionAgeGroup = session.ageGroups[0];
      const sessionAgeNum = parseInt(sessionAgeGroup.substring(1));
      
      const ageMatch = playerAge <= sessionAgeNum;
      const genderMatch = session.genders.includes("mixed") || session.genders.includes(player.gender);
      
      return ageMatch && genderMatch;
    });
    
    if (eligiblePlayers.length === 0) continue;
    
    // Create signups
    const selectedPlayers: string[] = [];
    for (let i = 0; i < Math.min(targetSignups, eligiblePlayers.length); i++) {
      let randomPlayer;
      do {
        randomPlayer = randomElement(eligiblePlayers);
      } while (selectedPlayers.includes(randomPlayer.id));
      
      selectedPlayers.push(randomPlayer.id);
      
      const signupTime = isPastSession 
        ? randomDate(new Date(sessionDate.getTime() - 7 * 24 * 60 * 60 * 1000), sessionDate)
        : randomDate(now, sessionDate);
      
      // 90% paid, 10% unpaid for past sessions
      // 70% paid, 30% unpaid for future sessions  
      const shouldBePaid = isPastSession ? Math.random() < 0.9 : Math.random() < 0.7;
      
      const signup = {
        tenantId,
        playerId: randomPlayer.id,
        sessionId: session.id,
        paid: shouldBePaid,
        paymentIntentId: shouldBePaid ? `pi_${nanoid()}` : null,
      };
      
      const [createdSignup] = await db.insert(signups).values(signup).returning();
      createdSignups.push(createdSignup);
      
      // Create payment record
      if (shouldBePaid) {
        const paidAt = new Date(signupTime.getTime() + randomInt(1, 60) * 60 * 1000);
        const payment = {
          tenantId,
          signupId: createdSignup.id,
          paymentIntentId: `pi_${nanoid()}`,
          amountCents: session.priceCents,
          status: "paid" as const,
          paidAt,
        };
        
        const [createdPayment] = await db.insert(payments).values(payment).returning();
        createdPayments.push(createdPayment);
      }
    }
  }
  
  return { signups: createdSignups, payments: createdPayments };
}

async function seedHelpRequestsForTenant(tenantId: string, tenantName: string, parents: any[], admins: any[]) {
  const createdHelpRequests = [];
  const parentUsers = parents.filter(u => !u.isAdmin);
  const adminUsers = admins.filter(u => u.isAdmin);
  
  const numRequests = randomInt(5, 10);
  
  for (let i = 0; i < numRequests; i++) {
    const createdAt = randomDate(threeMonthsAgo, now);
    const isResolved = Math.random() < 0.7; // 70% resolved
    
    const helpRequest = {
      tenantId,
      firstName: randomElement(firstNames),
      lastName: randomElement(lastNames),
      email: randomElement(parentUsers).email!,
      subject: randomElement(helpRequestSubjects),
      priority: randomElement(["low", "medium", "high"]),
      category: randomElement(["technical", "billing", "general"]),
      message: `Help request regarding ${randomElement(helpRequestSubjects).toLowerCase()}. Please assist with this matter.`,
      status: isResolved ? "resolved" : randomElement(["open", "replied"]),
      resolvedAt: isResolved ? new Date(createdAt.getTime() + randomInt(1, 48) * 60 * 60 * 1000) : null,
      resolvedBy: isResolved ? randomElement(adminUsers).id : null,
      resolutionNote: isResolved ? "Issue has been resolved. Thank you for contacting support." : null,
    };
    
    const [createdHelpRequest] = await db.insert(helpRequests).values(helpRequest).returning();
    createdHelpRequests.push(createdHelpRequest);
  }
  
  return createdHelpRequests;
}

async function seedSystemSettings() {
  
  const settings = [
    { key: "autoApproveRegistrations", value: "true" },
    { key: "businessName", value: "PlayHQ" },
    { key: "supportEmail", value: "support@playhq.app" },
    { key: "supportPhone", value: "+1 (555) 123-4567" },
    { key: "supportHours", value: "Mon-Fri 9AM-6PM EST" },
    { key: "businessLocation", value: "123 Sports Center Dr, Athletic City, AC 12345" },
  ];
  
  for (const setting of settings) {
    // Simple insert for now - will need proper upsert logic later if needed
    await db.insert(systemSettings).values(setting);
  }
  
}

async function main() {
  
  try {
    await clearExistingData();
    await seedSystemSettings();
    
    const createdTenants = await seedTenants();
    
    for (const tenant of createdTenants) {
      
      const users = await seedUsersForTenant(tenant.id, tenant.name);
      const players = await seedPlayersForTenant(tenant.id, tenant.name, users);
      const sessions = await seedSessionsForTenant(tenant.id, tenant.name);
      const { signups, payments } = await seedSignupsAndPaymentsForTenant(tenant.id, tenant.name, players, sessions);
      const helpRequests = await seedHelpRequestsForTenant(tenant.id, tenant.name, users, users);
      
    }
    
    
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

// Run if this file is executed directly
main().then(() => process.exit(0));