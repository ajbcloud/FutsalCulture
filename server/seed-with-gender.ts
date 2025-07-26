import { db } from "./db";
import { users, players, futsalSessions, signups, payments } from "@shared/schema";

const sampleData = {
  // Sample Parents (Users)
  parents: [
    {
      id: "1b64fc3a-7b11-45a9-af02-1fd71bed574f",
      firstName: "Parent0",
      lastName: "User0",
      email: "parent0@example.com",
      phoneNumber: "555-000-1000"
    },
    {
      id: "92f7e250-457f-47c3-97a1-37a9349134e",
      firstName: "Parent1",
      lastName: "User1",
      email: "parent1@example.com",
      phoneNumber: "555-000-1001"
    },
    {
      id: "88ef8969-12f0-47be-965b-21e774ed32a7",
      firstName: "Parent2",
      lastName: "User2",
      email: "parent2@example.com",
      phoneNumber: "555-000-1002"
    },
    {
      id: "5c1aeaad-1e58-449e-b01b-722460cb456d",
      firstName: "Parent3",
      lastName: "User3",
      email: "parent3@example.com",
      phoneNumber: "555-000-1003"
    },
    {
      id: "3bdda034-835e-4432-b564-4dddbbd6f843",
      firstName: "Parent4",
      lastName: "User4",
      email: "parent4@example.com",
      phoneNumber: "555-000-1004"
    }
  ],

  // Sample Players with Gender
  players: [
    {
      id: "9238a5fa-a87f-4add-b830-574c553f60a5",
      firstName: "Player0",
      lastName: "Test",
      birthYear: 2012,
      gender: "boys" as const,
      parentId: "1b64fc3a-7b11-45a9-af02-1fd71bed574f",
      canAccessPortal: true,
      canBookAndPay: true,
      email: "player0@example.com",
      phoneNumber: "555-100-1000"
    },
    {
      id: "9dff839f-b64f-41f8-8759-5bc49b106655",
      firstName: "Player1",
      lastName: "Test",
      birthYear: 2016,
      gender: "girls" as const,
      parentId: "92f7e250-457f-47c3-97a1-37a9349134e",
      canAccessPortal: false,
      canBookAndPay: false
    },
    {
      id: "9714db88-b5b3-4b16-944c-d8a5bc04f1b7",
      firstName: "Player2",
      lastName: "Test",
      birthYear: 2016,
      gender: "girls" as const,
      parentId: "88ef8969-12f0-47be-965b-21e774ed32a7",
      canAccessPortal: false,
      canBookAndPay: false,
      email: "player2@example.com",
      phoneNumber: "555-100-1002"
    },
    {
      id: "38d502ea-1198-431d-87ef-5e5eb852bfa80",
      firstName: "Player3",
      lastName: "Test",
      birthYear: 2012,
      gender: "boys" as const,
      parentId: "5c1aeaad-1e58-449e-b01b-722460cb456d",
      canAccessPortal: true,
      canBookAndPay: false
    },
    {
      id: "e40e87c5-c0f1-4b43-83fc-aa080de1d983",
      firstName: "Player4",
      lastName: "Test",
      birthYear: 2010,
      gender: "girls" as const,
      parentId: "3bdda034-835e-4432-b564-4dddbbd6f843",
      canAccessPortal: false,
      canBookAndPay: true,
      email: "player4@example.com",
      phoneNumber: "555-100-1004"
    }
  ],

  // Sample Sessions with Gender
  sessions: [
    {
      id: "9999534f-4427-48d8-9123-f05b06c6ba06",
      title: "U13 Boys Session 0",
      location: "Sugar Sand Park, Boca Raton",
      ageGroup: "U13",
      gender: "boys" as const,
      startTime: new Date("2025-08-09T03:59:40.739Z"),
      endTime: new Date("2025-07-28T04:59:40.739Z"),
      capacity: 12,
      priceCents: 1000,
      status: "open" as const
    },
    {
      id: "a33a14e7-7a3b-4f34-8cde-b581632e67ab",
      title: "U9 Girls Session 1",
      location: "Sugar Sand Park, Boca Raton",
      ageGroup: "U9",
      gender: "girls" as const,
      startTime: new Date("2025-07-27T03:59:40.738Z"),
      endTime: new Date("2025-08-03T04:59:40.739Z"),
      capacity: 12,
      priceCents: 1000,
      status: "open" as const
    },
    {
      id: "169afc69-20bc-4eb9-963a-86f0b054eeb",
      title: "U11 Boys Session 2",
      location: "Sugar Sand Park, Boca Raton",
      ageGroup: "U11",
      gender: "boys" as const,
      startTime: new Date("2025-07-30T03:59:40.740Z"),
      endTime: new Date("2025-08-10T04:59:40.740Z"),
      capacity: 12,
      priceCents: 1000,
      status: "open" as const
    },
    {
      id: "1a4bb050-3819-4ace-94ef-cfcb255c1e0d",
      title: "U13 Girls Session 3",
      location: "Sugar Sand Park, Boca Raton",
      ageGroup: "U13",
      gender: "girls" as const,
      startTime: new Date("2025-08-06T03:59:40.740Z"),
      endTime: new Date("2025-08-09T04:59:40.740Z"),
      capacity: 12,
      priceCents: 1000,
      status: "open" as const
    },
    {
      id: "b80fe8d9-3c20-4aef-a87e-6b1490cf333c",
      title: "U13 Boys Session 4",
      location: "Sugar Sand Park, Boca Raton",
      ageGroup: "U13",
      gender: "boys" as const,
      startTime: new Date("2025-08-03T03:59:40.741Z"),
      endTime: new Date("2025-08-03T04:59:40.741Z"),
      capacity: 12,
      priceCents: 1000,
      status: "open" as const
    }
  ],

  // Sample Signups
  signups: [
    {
      id: "db8d2de3-76c1-4aee-9850-a16756035542",
      playerId: "9238a5fa-a87f-4add-b830-574c553f60a5",
      sessionId: "b80fe8d9-3c20-4aef-a87e-6b1490cf333c",
      paid: true,
      paymentIntentId: "pi_43058b06"
    },
    {
      id: "4598249c-b848-403a-aeeb-5f6ec470af0b",
      playerId: "9dff839f-b64f-41f8-8759-5bc49b106655",
      sessionId: "a33a14e7-7a3b-4f34-8cde-b581632e67ab",
      paid: true,
      paymentIntentId: "pi_1c5ad33b"
    }
  ],

  // Sample Payments
  payments: [
    {
      id: "ae2cbc93-5b56-41fb-8440-0fa6b65036862",
      signupId: "db8d2de3-76c1-4aee-9850-a16756035542",
      stripePaymentIntentId: "pi_fa7e86d7",
      amountCents: 1000,
      paidAt: new Date("2025-07-26T03:59:40.741791")
    },
    {
      id: "2c5a683d-93cc-492a-9646-89d4bf6c70f0",
      signupId: "4598249c-b848-403a-aeeb-5f6ec470af0b",
      stripePaymentIntentId: "pi_47cc9185",
      amountCents: 1000,
      paidAt: new Date("2025-07-26T03:59:40.741817")
    }
  ]
};

export async function seedDatabase() {
  try {
    console.log("Starting database seeding with gender data...");

    // Clear existing data
    await db.delete(payments);
    await db.delete(signups);
    await db.delete(futsalSessions);
    await db.delete(players);
    await db.delete(users);

    console.log("Cleared existing data");

    // Insert sample parents (users)
    console.log("Inserting parents...");
    await db.insert(users).values(sampleData.parents);

    // Insert sample players
    console.log("Inserting players...");
    await db.insert(players).values(sampleData.players);

    // Insert sample sessions
    console.log("Inserting sessions...");
    await db.insert(futsalSessions).values(sampleData.sessions);

    // Insert sample signups
    console.log("Inserting signups...");
    await db.insert(signups).values(sampleData.signups);

    // Insert sample payments
    console.log("Inserting payments...");
    await db.insert(payments).values(sampleData.payments);

    console.log("Database seeding completed successfully!");
    console.log(`Inserted:
    - ${sampleData.parents.length} parents
    - ${sampleData.players.length} players  
    - ${sampleData.sessions.length} sessions
    - ${sampleData.signups.length} signups
    - ${sampleData.payments.length} payments`);

  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log("Seeding complete!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seeding failed:", error);
      process.exit(1);
    });
}