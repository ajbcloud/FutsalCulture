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
    },
    {
      id: "45439e2e-bb06-47e1-8c31-ba4f48e9d254",
      firstName: "Parent5",
      lastName: "User5",
      email: "parent5@example.com",
      phoneNumber: "555-000-1005"
    },
    {
      id: "fb1b0f49-444f-48b4-b4ec-5b855394a87",
      firstName: "Parent6",
      lastName: "User6",
      email: "parent6@example.com",
      phoneNumber: "555-000-1006"
    },
    {
      id: "401e8fc0-16d7-4392-ab6c-efa33e186d48",
      firstName: "Parent7",
      lastName: "User7",
      email: "parent7@example.com",
      phoneNumber: "555-000-1007"
    },
    {
      id: "3046d940-2beb-4abf-ab68-b248ae89dbc9",
      firstName: "Parent8",
      lastName: "User8",
      email: "parent8@example.com",
      phoneNumber: "555-000-1008"
    },
    {
      id: "2f23b853-0c7a-4ae5-871e-f3364d668949",
      firstName: "Parent9",
      lastName: "User9",
      email: "parent9@example.com",
      phoneNumber: "555-000-1009"
    }
  ],

  // Sample Players
  players: [
    {
      id: "9238a5fa-a87f-4add-b830-574c553f60a5",
      firstName: "Player0",
      lastName: "Test",
      birthYear: 2012,
      gender: "boys" as const,
      parentId: "1b64fc3a-7b11-45a9-af02-1fd71bed574f",
      soccerClub: "Boca FC Youth",
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
      soccerClub: "Miami United",
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
      soccerClub: "FC Dallas Academy",
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
      soccerClub: "Real Salt Lake Academy",
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
      soccerClub: "Houston Dash Youth",
      canAccessPortal: false,
      canBookAndPay: true,
      email: "player4@example.com",
      phoneNumber: "555-100-1004"
    },
    {
      id: "d12ecb1d-f304-4dcf-98b7-ce5bf7718b3c",
      firstName: "Player5",
      lastName: "Test",
      birthYear: 2014,
      gender: "boys" as const,
      parentId: "45439e2e-bb06-47e1-8c31-ba4f48e9d254",
      soccerClub: "LA Galaxy Academy",
      canAccessPortal: false,
      canBookAndPay: false
    },
    {
      id: "ac1bc29b-0107-4c32-a707-0b4c3e3dd369",
      firstName: "Player6",
      lastName: "Test",
      birthYear: 2009,
      gender: "girls" as const,
      parentId: "fb1b0f49-444f-48b4-b4ec-5b855394a87",
      soccerClub: "Seattle Sounders Academy",
      canAccessPortal: true,
      canBookAndPay: false,
      email: "player6@example.com",
      phoneNumber: "555-100-1006"
    },
    {
      id: "a3c96080-2b4d-4e47-8e9f-95d7f0127725",
      firstName: "Player7",
      lastName: "Test",
      birthYear: 2013,
      gender: "boys" as const,
      parentId: "401e8fc0-16d7-4392-ab6c-efa33e186d48",
      soccerClub: "Columbus Crew Academy",
      canAccessPortal: false,
      canBookAndPay: false
    },
    {
      id: "d7fc56b1-8a89-4d54-ab9e-1d4c9a3ec57b",
      firstName: "Player8",
      lastName: "Test",
      birthYear: 2015,
      gender: "girls" as const,
      parentId: "3046d940-2beb-4abf-ab68-b248ae89dbc9",
      soccerClub: "Chicago Fire Academy",
      canAccessPortal: false,
      canBookAndPay: true,
      email: "player8@example.com",
      phoneNumber: "555-100-1008"
    },
    {
      id: "5b5b7299-8bd5-4cb7-81f5-832a73035e39",
      firstName: "Player9",
      lastName: "Test",
      birthYear: 2014,
      gender: "boys" as const,
      parentId: "2f23b853-0c7a-4ae5-871e-f3364d668949",
      soccerClub: "Portland Timbers Academy",
      canAccessPortal: false,
      canBookAndPay: false
    },
    {
      id: "e168d0d3-e65c-423c-8221-2185eaf580fb",
      firstName: "Player10",
      lastName: "Test",
      birthYear: 2009,
      gender: "girls" as const,
      parentId: "1b64fc3a-7b11-45a9-af02-1fd71bed574f",
      soccerClub: "Atlanta United Academy",
      canAccessPortal: false,
      canBookAndPay: false,
      email: "player10@example.com",
      phoneNumber: "555-100-1010"
    },
    {
      id: "a6df4848-fa00-4a4d-be02-50603233c526",
      firstName: "Player11",
      lastName: "Test",
      birthYear: 2011,
      gender: "boys" as const,
      parentId: "92f7e250-457f-47c3-97a1-37a9349134e",
      soccerClub: "New York City FC Academy",
      canAccessPortal: false,
      canBookAndPay: false
    },
    {
      id: "2958d4ec-edab-498e-b548-136f15f7c55a",
      firstName: "Player12",
      lastName: "Test",
      birthYear: 2009,
      gender: "girls" as const,
      parentId: "88ef8969-12f0-47be-965b-21e774ed32a7",
      soccerClub: "Inter Miami CF Academy",
      canAccessPortal: true,
      canBookAndPay: true,
      email: "player12@example.com",
      phoneNumber: "555-100-1012"
    },
    {
      id: "1451baca-3263-4db1-b46e-643ab079ff34",
      firstName: "Player13",
      lastName: "Test",
      birthYear: 2012,
      gender: "boys" as const,
      parentId: "5c1aeaad-1e58-449e-b01b-722460cb456d",
      soccerClub: "Philadelphia Union Academy",
      canAccessPortal: false,
      canBookAndPay: false
    }
  ],

  // Sample Sessions - Monday-Friday schedule with proper timing and booking rules
  sessions: [
    // Today's sessions (should be open for booking if after 8 AM)
    {
      id: "a33a14e7-7a3b-4f34-8cde-b581632e67ab",
      title: "U10 Boys Morning Training",
      location: "Sugar Sand Park, Boca Raton",
      ageGroups: ["U10"],
      genders: ["boys"],
      startTime: new Date(new Date().setHours(16, 0, 0, 0)), // Today 4:00 PM
      endTime: new Date(new Date().setHours(17, 30, 0, 0)), // Today 5:30 PM
      capacity: 12,
      priceCents: 1000,
      status: "open" as const,
      bookingOpenHour: 8,
      bookingOpenMinute: 0
    },
    {
      id: "9999534f-4427-48d8-9123-f05b06c6ba06",
      title: "U12 Girls Afternoon Training",
      location: "Sugar Sand Park, Boca Raton",
      ageGroups: ["U12"],
      genders: ["girls"],
      startTime: new Date(new Date().setHours(18, 0, 0, 0)), // Today 6:00 PM
      endTime: new Date(new Date().setHours(19, 30, 0, 0)), // Today 7:30 PM
      capacity: 10,
      priceCents: 1000,
      status: "open" as const,
      bookingOpenHour: 8,
      bookingOpenMinute: 0
    },
    // Tomorrow's sessions (should show as "pending" until 8 AM tomorrow)
    {
      id: "169afc69-20bc-4eb9-963a-86f0b054eeb",
      title: "U11 Boys Morning Session", 
      location: "Central Park Field",
      ageGroups: ["U11"],
      genders: ["boys"],
      startTime: new Date(new Date().getTime() + 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000), // Tomorrow 9:00 AM
      endTime: new Date(new Date().getTime() + 24 * 60 * 60 * 1000 + 10.5 * 60 * 60 * 1000), // Tomorrow 10:30 AM
      capacity: 14,
      priceCents: 1000,
      status: "upcoming" as const,
      bookingOpenHour: 8,
      bookingOpenMinute: 0
    },
    {
      id: "1a4bb050-3819-4ace-94ef-cfcb255c1e0d",
      title: "U13 Girls Evening Session",
      location: "Westside Athletic Complex",
      ageGroups: ["U13"],
      genders: ["girls"],
      startTime: new Date(new Date().getTime() + 24 * 60 * 60 * 1000 + 17 * 60 * 60 * 1000), // Tomorrow 5:00 PM
      endTime: new Date(new Date().getTime() + 24 * 60 * 60 * 1000 + 18.5 * 60 * 60 * 1000), // Tomorrow 6:30 PM
      capacity: 12,
      priceCents: 1000,
      status: "upcoming" as const,
      bookingOpenHour: 8,
      bookingOpenMinute: 0
    },
    {
      id: "b80fe8d9-3c20-4aef-a87e-6b1490cf333c",
      title: "U9 Boys Afternoon Training",
      location: "Sugar Sand Park, Boca Raton",
      ageGroups: ["U9"],
      genders: ["boys"],
      startTime: new Date(new Date().getTime() + 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000), // Tomorrow 3:00 PM
      endTime: new Date(new Date().getTime() + 24 * 60 * 60 * 1000 + 16.5 * 60 * 60 * 1000), // Tomorrow 4:30 PM
      capacity: 16,
      priceCents: 1000,
      status: "upcoming" as const,
      bookingOpenHour: 8,
      bookingOpenMinute: 0
    },
    // Next week sessions (various weekdays)
    {
      id: "79e4be17-d209-4ed5-b67b-c9f05589677b",
      title: "U14 Girls Advanced Training",
      location: "Elite Sports Center",
      ageGroups: ["U14"],
      genders: ["girls"],
      startTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000), // Next week Monday 4:00 PM
      endTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000 + 17.5 * 60 * 60 * 1000), // Next week Monday 5:30 PM
      capacity: 10,
      priceCents: 1000,
      status: "upcoming" as const,
      bookingOpenHour: 8,
      bookingOpenMinute: 0
    },
    {
      id: "157b1038-f6d3-49bb-a8c2-385c3ad98da8",
      title: "U11 Girls Skills Development",
      location: "Central Park Field",
      ageGroups: ["U11"],
      genders: ["girls"],
      startTime: new Date(new Date().getTime() + 9 * 24 * 60 * 60 * 1000 + 16.5 * 60 * 60 * 1000), // Next week Wednesday 4:30 PM
      endTime: new Date(new Date().getTime() + 9 * 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000), // Next week Wednesday 6:00 PM
      capacity: 12,
      priceCents: 1000,
      status: "upcoming" as const,
      bookingOpenHour: 8,
      bookingOpenMinute: 0
    },
    {
      id: "40446271-d86b-4d70-9e4e-946602dce859", 
      title: "U15 Boys Competitive Training",
      location: "Premier Soccer Academy",
      ageGroups: ["U15"],
      genders: ["boys"],
      startTime: new Date(new Date().getTime() + 11 * 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000), // Next week Friday 6:00 PM
      endTime: new Date(new Date().getTime() + 11 * 24 * 60 * 60 * 1000 + 19.5 * 60 * 60 * 1000), // Next week Friday 7:30 PM
      capacity: 8,
      priceCents: 1000,
      status: "upcoming" as const,
      bookingOpenHour: 8,
      bookingOpenMinute: 0
    },
    {
      id: "73816243-ef6f-4a63-9fa7-5fa908ad2710",
      title: "U8 Mixed Fundamentals",
      location: "Community Recreation Center",
      ageGroups: ["U8"],
      genders: ["boys"],
      startTime: new Date(new Date().getTime() + 8 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000), // Next week Tuesday 10:00 AM
      endTime: new Date(new Date().getTime() + 8 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000), // Next week Tuesday 11:00 AM
      capacity: 20,
      priceCents: 1000,
      status: "upcoming" as const,
      bookingOpenHour: 8,
      bookingOpenMinute: 0
    },
    {
      id: "ff303889-6e81-4e07-be64-dfc718715282",
      title: "U12 Boys Technical Skills",
      location: "Westside Athletic Complex", 
      ageGroups: ["U12"],
      genders: ["boys"],
      startTime: new Date(new Date().getTime() + 10 * 24 * 60 * 60 * 1000 + 17 * 60 * 60 * 1000), // Next week Thursday 5:00 PM
      endTime: new Date(new Date().getTime() + 10 * 24 * 60 * 60 * 1000 + 18.5 * 60 * 60 * 1000), // Next week Thursday 6:30 PM
      capacity: 14,
      priceCents: 1000,
      status: "upcoming" as const,
      bookingOpenHour: 8,
      bookingOpenMinute: 0
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
      sessionId: "79e4be17-d209-4ed5-b67b-c9f05589677b",
      paid: true,
      paymentIntentId: "pi_1c5ad33b"
    },
    {
      id: "3f6cf800-c53b-4207-b9c6-0f625e4fba3c",
      playerId: "9714db88-b5b3-4b16-944c-d8a5bc04f1b7",
      sessionId: "ff303889-6e81-4e07-be64-dfc718715282",
      paid: true,
      paymentIntentId: "pi_a7cd62a3"
    },
    {
      id: "cdfee28b-32cc-4112-a590-10568e2b6910",
      playerId: "38d502ea-1198-431d-87ef-5e5eb852bfa80",
      sessionId: "157b1038-f6d3-49bb-a8c2-385c3ad98da8",
      paid: true,
      paymentIntentId: "pi_90cc869c"
    },
    {
      id: "fc497c5e-8887-486b-b387-1fdfaab6ca9",
      playerId: "e40e87c5-c0f1-4b43-83fc-aa080de1d983",
      sessionId: "1a4bb050-3819-4ace-94ef-cfcb255c1e0d",
      paid: true,
      paymentIntentId: "pi_cb35bf22"
    },
    {
      id: "fba3b2c5-15e2-4653-a80f-65f5393878de9",
      playerId: "d12ecb1d-f304-4dcf-98b7-ce5bf7718b3c",
      sessionId: "b80fe8d9-3c20-4aef-a87e-6b1490cf333c",
      paid: true,
      paymentIntentId: "pi_9e9eb350"
    },
    {
      id: "ec3204a0-bb04-4a23-b2f2-1f0ad17528f4",
      playerId: "ac1bc29b-0107-4c32-a707-0b4c3e3dd369",
      sessionId: "ff303889-6e81-4e07-be64-dfc718715282",
      paid: true,
      paymentIntentId: "pi_34a1b48b"
    },
    {
      id: "56d311a8-a80a-4975-bd21-69eb79067804",
      playerId: "a3c96080-2b4d-4e47-8e9f-95d7f0127725",
      sessionId: "169afc69-20bc-4eb9-963a-86f0b054eeb",
      paid: true,
      paymentIntentId: "pi_d6699dfa"
    },
    {
      id: "898f3c0e-fb1d-4e43-96ac-5b279af2d2c3",
      playerId: "d7fc56b1-8a89-4d54-ab9e-1d4c9a3ec57b",
      sessionId: "9999534f-4427-48d8-9123-f05b06c6ba06",
      paid: true,
      paymentIntentId: "pi_775fef2c"
    },
    {
      id: "abe623df-0759-4be0-aa42-4b47212f0247",
      playerId: "5b5b7299-8bd5-4cb7-81f5-832a73035e39",
      sessionId: "1a4bb050-3819-4ace-94ef-cfcb255c1e0d",
      paid: true,
      paymentIntentId: "pi_0c8e4fae"
    },
    {
      id: "142e94ab-c8cc-4a61-b765-bbc1801f76c",
      playerId: "e168d0d3-e65c-423c-8221-2185eaf580fb",
      sessionId: "73816243-ef6f-4a63-9fa7-5fa908ad2710",
      paid: true,
      paymentIntentId: "pi_e935ad58"
    },
    {
      id: "18f67dbe-31f5-41ec-aa5a-0987a3ab2741",
      playerId: "a6df4848-fa00-4a4d-be02-50603233c526",
      sessionId: "169afc69-20bc-4eb9-963a-86f0b054eeb",
      paid: true,
      paymentIntentId: "pi_db613916"
    },
    {
      id: "f7af1782-35d9-4d24-b81e-0d4fe663e9e5",
      playerId: "2958d4ec-edab-498e-b548-136f15f7c55a",
      sessionId: "a33a14e7-7a3b-4f34-8cde-b581632e67ab",
      paid: true,
      paymentIntentId: "pi_452d1be8"
    },
    {
      id: "51e5192b-ad60-4408-8ef1-76fffe50559c",
      playerId: "1451baca-3263-4db1-b46e-643ab079ff34",
      sessionId: "40446271-d86b-4d70-9e4e-946602dce859",
      paid: true,
      paymentIntentId: "pi_07796c2f"
    }
  ],

  // Sample Payments
  payments: [
    {
      id: "ae2cbc93-5b56-41fb-8440-0fa6b65036862",
      signupId: "db8d2de3-76c1-4aee-9850-a16756035542",
      paymentIntentId: "pi_fa7e86d7",
      amountCents: 1000,
      paidAt: new Date("2025-07-26T03:59:40.741791")
    },
    {
      id: "2c5a683d-93cc-492a-9646-89d4bf6c70f0",
      signupId: "4598249c-b848-403a-aeeb-5f6ec470af0b",
      paymentIntentId: "pi_47cc9185",
      amountCents: 1000,
      paidAt: new Date("2025-07-26T03:59:40.741817")
    },
    {
      id: "a54eab34-3260-401b-8144-d021d02c9027",
      signupId: "3f6cf800-c53b-4207-b9c6-0f625e4fba3c",
      paymentIntentId: "pi_7a08fe38",
      amountCents: 1000,
      paidAt: new Date("2025-07-26T03:59:40.741840")
    },
    {
      id: "1f2d1f5-b93f-46f8-bf37-ae8eaad87f85e",
      signupId: "cdfee28b-32cc-4112-a590-10568e2b6910",
      paymentIntentId: "pi_c433e75a",
      amountCents: 1000,
      paidAt: new Date("2025-07-26T03:59:40.741864")
    },
    {
      id: "f9921456-ccf3-4ae9-b4ef-c28a6039b95b",
      signupId: "fc497c5e-8887-486b-b387-1fdfaab6ca9",
      paymentIntentId: "pi_4cf5eb0a",
      amountCents: 1000,
      paidAt: new Date("2025-07-26T03:59:40.741888")
    },
    {
      id: "2482148c-af83-44a9-ba2a-837e8cd0d688",
      signupId: "fba3b2c5-15e2-4653-a80f-65f5393878de9",
      paymentIntentId: "pi_37e6b578",
      amountCents: 1000,
      paidAt: new Date("2025-07-26T03:59:40.741911")
    },
    {
      id: "8b86755g-34f9-4505-b069-12ae096bc0b",
      signupId: "ec3204a0-bb04-4a23-b2f2-1f0ad17528f4",
      paymentIntentId: "pi_c44ff638",
      amountCents: 1000,
      paidAt: new Date("2025-07-26T03:59:40.741933")
    },
    {
      id: "46579df5-6b8d-4aad-be5f-6c96a17da1e9",
      signupId: "56d311a8-a80a-4975-bd21-69eb79067804",
      paymentIntentId: "pi_720296a9",
      amountCents: 1000,
      paidAt: new Date("2025-07-26T03:59:40.742002")
    },
    {
      id: "5ffab1d4-05e5-4b2b-be8a-3d323b9db74",
      signupId: "898f3c0e-fb1d-4e43-96ac-5b279af2d2c3",
      paymentIntentId: "pi_e98741d0",
      amountCents: 1000,
      paidAt: new Date("2025-07-26T03:59:40.742028")
    },
    {
      id: "e784f699-4158-4a94-9002-e850d249a40",
      signupId: "abe623df-0759-4be0-aa42-4b47212f0247",
      paymentIntentId: "pi_5e25c994",
      amountCents: 1000,
      paidAt: new Date("2025-07-26T03:59:40.742053")
    },
    {
      id: "7d1ddc7a-3fa2-41ff-b5c0-e1adc001fdca",
      signupId: "142e94ab-c8cc-4a61-b765-bbc1801f76c",
      paymentIntentId: "pi_c982b150",
      amountCents: 1000,
      paidAt: new Date("2025-07-26T03:59:40.742093")
    },
    {
      id: "d84a402a-c9d8-488b-be84-143de8e5566",
      signupId: "18f67dbe-31f5-41ec-aa5a-0987a3ab2741",
      paymentIntentId: "pi_c1cee381",
      amountCents: 1000,
      paidAt: new Date("2025-07-26T03:59:40.742121")
    },
    {
      id: "326390cf-09a1-4ea5-800e-f38f397a5460",
      signupId: "f7af1782-35d9-4d24-b81e-0d4fe663e9e5",
      paymentIntentId: "pi_c0ee7e6d",
      amountCents: 1000,
      paidAt: new Date("2025-07-26T03:59:40.742146")
    },
    {
      id: "39bc41a-2b6d-4d8c-8030-a02178a1a623",
      signupId: "51e5192b-ad60-4408-8ef1-76fffe50559c",
      paymentIntentId: "pi_7e492308",
      amountCents: 1000,
      paidAt: new Date("2025-07-26T03:59:40.742188")
    }
  ]
};

export async function seedDatabase() {
  try {
    console.log("Starting database seeding...");

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