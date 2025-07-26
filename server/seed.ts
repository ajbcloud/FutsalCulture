import { db } from "./db";
import { futsalSessions, users } from "@shared/schema";

async function seed() {
  console.log("Seeding database...");
  
  try {
    // Create an admin user
    await db.insert(users).values({
      id: "admin-user",
      email: "admin@futsalculture.com",
      firstName: "Admin",
      lastName: "User",
      isAdmin: true,
    }).onConflictDoNothing();

    // Create sample futsal sessions
    const sessions = [
      {
        title: "U8 Morning Skills",
        location: "Boca Raton Sports Complex",
        ageGroup: "U8",
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // Tomorrow + 1 hour
        capacity: 12,
        priceCents: 1000,
        status: "upcoming" as const,
      },
      {
        title: "U10 Afternoon Training",
        location: "Fort Lauderdale FC",
        ageGroup: "U10",
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // Tomorrow + 2 hours
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // Tomorrow + 3 hours
        capacity: 10,
        priceCents: 1000,
        status: "upcoming" as const,
      },
      {
        title: "U12 Elite Training",
        location: "Miami Futsal Academy",
        ageGroup: "U12",
        startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
        endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000), // Day after tomorrow + 1.5 hours
        capacity: 8,
        priceCents: 1000,
        status: "upcoming" as const,
      },
      {
        title: "U14 Advanced Skills",
        location: "Boca Raton Sports Complex",
        ageGroup: "U14",
        startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000), // 3 days from now + 1.5 hours
        capacity: 6,
        priceCents: 1000,
        status: "upcoming" as const,
      },
      // Add a session for today that should be open for booking
      {
        title: "U10 Today's Session",
        location: "Local Futsal Center",
        ageGroup: "U10",
        startTime: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
        endTime: new Date(Date.now() + 5 * 60 * 60 * 1000), // 5 hours from now
        capacity: 10,
        priceCents: 1000,
        status: "open" as const, // This one is already open for booking
      },
    ];

    for (const session of sessions) {
      await db.insert(futsalSessions).values(session).onConflictDoNothing();
    }

    console.log("Database seeded successfully!");
    
    console.log("Sample sessions created:");
    console.log("- U8 Morning Skills (Tomorrow)");
    console.log("- U10 Afternoon Training (Tomorrow)");
    console.log("- U12 Elite Training (Day after tomorrow)");
    console.log("- U14 Advanced Skills (3 days from now)");
    console.log("- U10 Today's Session (Available for booking now)");
    console.log("");
    console.log("Admin user created: admin@futsalculture.com");
    
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

// Run the seed function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed().then(() => process.exit(0));
}

export { seed };