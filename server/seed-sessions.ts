import { db } from "./db";
import { futsalSessions, signups, payments } from "@shared/schema";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";

// Age groups and configurations
const AGE_GROUPS = ['U8', 'U9', 'U10', 'U11', 'U12', 'U13', 'U14', 'U15', 'U16', 'U17', 'U18'];
const GENDERS = ['boys', 'girls', 'mixed'];
const LOCATIONS = ['Central Park', 'Riverside Fields', 'Community Center', 'Sports Complex'];

// Session time slots (Monday-Friday only)
const TIME_SLOTS = [
  { hour: 16, minute: 0 },  // 4:00 PM
  { hour: 17, minute: 0 },  // 5:00 PM
  { hour: 18, minute: 0 },  // 6:00 PM
  { hour: 19, minute: 0 },  // 7:00 PM
  { hour: 16, minute: 30 }, // 4:30 PM
  { hour: 17, minute: 30 }, // 5:30 PM
  { hour: 18, minute: 30 }, // 6:30 PM
];

// Pricing tiers
const PRICING = [
  { price: 2500, capacity: 12 }, // $25.00 for 12 spots
  { price: 3000, capacity: 15 }, // $30.00 for 15 spots
  { price: 3500, capacity: 18 }, // $35.00 for 18 spots
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function isWeekday(date: Date): boolean {
  const day = date.getDay();
  return day >= 1 && day <= 5; // Monday (1) to Friday (5)
}

function generateSessionTitle(ageGroups: string[], genders: string[]): string {
  const ageRange = ageGroups.length === 1 ? ageGroups[0] : `${ageGroups[0]}-${ageGroups[ageGroups.length - 1]}`;
  const genderText = genders.includes('mixed') ? 'Mixed' : 
                    genders.includes('boys') && genders.includes('girls') ? 'Mixed' :
                    genders.includes('boys') ? 'Boys' : 'Girls';
  return `${genderText} ${ageRange} Training Session`;
}

async function clearExistingSessions() {
  console.log("Clearing existing sessions, signups, and payments...");
  
  // Delete in correct order due to foreign key constraints
  await db.delete(payments);
  await db.delete(signups);
  await db.delete(futsalSessions);
  
  console.log("Existing data cleared successfully");
}

async function seedHistoricalSessions() {
  console.log("Starting comprehensive session seeding...");
  
  // Clear existing data first
  await clearExistingSessions();
  
  const sessions = [];
  const now = new Date();
  
  // Generate date range: 3 months back to 1 month forward
  const startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0); // End of next month
  
  console.log(`Generating sessions from ${startDate.toDateString()} to ${endDate.toDateString()}`);
  
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    // Only create sessions on weekdays (Monday-Friday)
    if (isWeekday(currentDate)) {
      // Generate 2-4 sessions per weekday
      const sessionsPerDay = Math.floor(Math.random() * 3) + 2; // 2-4 sessions
      
      for (let i = 0; i < sessionsPerDay; i++) {
        const timeSlot = getRandomElement(TIME_SLOTS);
        const pricing = getRandomElement(PRICING);
        
        // Create session date/time
        const sessionDate = new Date(currentDate);
        sessionDate.setHours(timeSlot.hour, timeSlot.minute, 0, 0);
        
        // End time is 90 minutes later
        const endTime = new Date(sessionDate);
        endTime.setMinutes(endTime.getMinutes() + 90);
        
        // Random age groups (1-3 age groups per session)
        const numAgeGroups = Math.floor(Math.random() * 3) + 1;
        const selectedAgeGroups = getRandomElements(AGE_GROUPS, numAgeGroups).sort();
        
        // Random genders (1-2 genders per session)
        const numGenders = Math.random() < 0.3 ? 1 : Math.random() < 0.7 ? 2 : 3;
        const selectedGenders = getRandomElements(GENDERS, numGenders);
        
        // Determine session status based on date
        const isPast = sessionDate < now;
        let status = 'open';
        
        if (isPast) {
          status = 'closed';
        } else if (sessionDate.toDateString() === now.toDateString()) {
          status = Math.random() < 0.5 ? 'open' : 'full';
        } else {
          status = Math.random() < 0.1 ? 'full' : 'open';
        }
        
        const session = {
          id: nanoid(),
          title: generateSessionTitle(selectedAgeGroups, selectedGenders),
          description: `Professional futsal training session focusing on technical skills, tactical awareness, and game play for ${selectedAgeGroups.join(', ')} age groups.`,
          location: getRandomElement(LOCATIONS),
          startTime: sessionDate,
          endTime: endTime,
          capacity: pricing.capacity,
          priceInCents: pricing.price,
          ageGroups: selectedAgeGroups,
          genders: selectedGenders,
          status: status,
          tenantId: 'd98c4191-c7e0-474d-9dd7-672219d85e4d', // Default tenant
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        sessions.push(session);
      }
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  console.log(`Generated ${sessions.length} sessions`);
  
  // Insert sessions in batches
  const batchSize = 50;
  for (let i = 0; i < sessions.length; i += batchSize) {
    const batch = sessions.slice(i, i + batchSize);
    await db.insert(futsalSessions).values(batch);
    console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(sessions.length / batchSize)}`);
  }
  
  console.log(`Successfully seeded ${sessions.length} sessions!`);
  
  // Summary by month
  const monthCounts: { [key: string]: number } = {};
  sessions.forEach(session => {
    const monthKey = session.startTime.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
  });
  
  console.log("\nSession distribution by month:");
  Object.entries(monthCounts).forEach(([month, count]) => {
    console.log(`${month}: ${count} sessions`);
  });
  
  return sessions;
}

// Run the seeding
seedHistoricalSessions()
  .then(() => {
    console.log("Session seeding completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error seeding sessions:", error);
    process.exit(1);
  });

export { seedHistoricalSessions };