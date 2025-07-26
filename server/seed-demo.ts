import { sql } from 'drizzle-orm';
import { db } from './db';
import { users, players, futsalSessions, signups, payments, helpRequests, notificationPreferences } from '../shared/schema';

// Helper function to shuffle array
function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Helper to generate realistic names
const firstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn', 'Sage', 'River', 'Dakota', 'Emery', 'Phoenix', 'Cameron', 'Skylar'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson'];

async function seedDemoData() {
  console.log('🌱 Starting demo data seeding...');
  
  try {
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await db.delete(payments);
    await db.delete(signups);
    await db.delete(futsalSessions);
    await db.delete(helpRequests);
    await db.delete(notificationPreferences);
    await db.delete(players);
    await db.delete(users);

    // 1. Create 12 realistic parents
    console.log('👨‍👩‍👧‍👦 Creating parents...');
    const parentData = [];
    for (let i = 0; i < 12; i++) {
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[i % lastNames.length];
      parentData.push({
        id: `parent-${i + 1}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
        firstName,
        lastName,
        phone: `555-${String(100 + i).padStart(3, '0')}-${String(1000 + i * 11).padStart(4, '0')}`,
        isAdmin: i === 0, // First parent is admin
        isAssistant: i === 1, // Second parent is assistant
        createdAt: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000), // Random date in last 6 months
        lastLogin: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random login in last week
      });
    }
    
    await db.insert(users).values(parentData);

    // 2. Create enough players to ensure 8+ per session (need more players)
    console.log('⚽ Creating players...');
    const playerData = [];
    let playerCount = 0;
    
    for (let i = 0; i < 12; i++) {
      const parentId = `parent-${i + 1}`;
      const numPlayers = i < 8 ? 2 : (Math.random() < 0.5 ? 2 : 3); // More players per parent
      
      for (let j = 0; j < numPlayers; j++) {
        playerCount++;
        // Realistic age distribution: more U10-U12 players
        const ageWeights = [0.1, 0.25, 0.3, 0.25, 0.1]; // U8, U10, U12, U14, U16
        const randomAge = Math.random();
        let age = 8;
        let cumulative = 0;
        for (let k = 0; k < ageWeights.length; k++) {
          cumulative += ageWeights[k];
          if (randomAge <= cumulative) {
            age = 8 + k * 2;
            break;
          }
        }
        
        const birthYear = new Date().getFullYear() - age;
        const gender = Math.random() < 0.6 ? 'boys' : 'girls'; // 60% boys, 40% girls
        const firstName = firstNames[playerCount % firstNames.length];
        
        playerData.push({
          id: `player-${playerCount}`,
          parentId,
          firstName,
          lastName: parentData[i].lastName,
          birthYear,
          gender,
          canAccessPortal: age >= 13,
          canBookAndPay: age >= 13,
          email: age >= 13 ? `${firstName.toLowerCase()}.${parentData[i].lastName.toLowerCase()}${age}@email.com` : null,
          phoneNumber: age >= 13 ? `555-${String(200 + playerCount).padStart(3, '0')}-${String(2000 + playerCount * 7).padStart(4, '0')}` : null,
          createdAt: new Date(parentData[i].createdAt.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000),
        });
      }
    }
    
    await db.insert(players).values(playerData);

    // 3. Create notification preferences for all parents
    console.log('📱 Setting up notification preferences...');
    const notificationData = parentData.map(parent => ({
      id: `notif-${parent.id}`,
      parentId: parent.id,
      email: true,
      sms: Math.random() < 0.7, // 70% opt into SMS
      createdAt: parent.createdAt,
    }));
    
    await db.insert(notificationPreferences).values(notificationData);

    // 4. Create one month of sessions (Mon-Fri, 3 sessions per day)
    console.log('🏟️ Creating futsal sessions...');
    const sessionData = [];
    const startDate = new Date('2025-01-06'); // Start of a Monday
    const locations = ['Sugar Sand Park', 'Boca Raton Community Center', 'Delray Beach Sports Complex'];
    const ageGroups = ['U8', 'U10', 'U12', 'U14', 'U16'];
    const genders = ['boys', 'girls'];
    
    for (let week = 0; week < 4; week++) {
      for (let day = 0; day < 5; day++) { // Monday to Friday
        const sessionDate = new Date(startDate);
        sessionDate.setDate(startDate.getDate() + (week * 7) + day);
        
        const times = ['17:00', '18:45', '20:30'];
        
        for (let timeSlot = 0; timeSlot < times.length; timeSlot++) {
          const [hours, minutes] = times[timeSlot].split(':').map(Number);
          const startTime = new Date(sessionDate);
          startTime.setHours(hours, minutes, 0, 0);
          
          const endTime = new Date(startTime);
          endTime.setMinutes(startTime.getMinutes() + 90); // 1.5 hours
          
          // Cycle through age groups and genders for variety
          const ageGroup = ageGroups[(week * 3 + timeSlot) % ageGroups.length];
          const gender = genders[(week * 3 + timeSlot + day) % genders.length];
          const location = locations[timeSlot % locations.length];
          
          sessionData.push({
            id: `session-${week}-${day}-${timeSlot}`,
            title: `${ageGroup} ${gender.charAt(0).toUpperCase() + gender.slice(1)} Training`,
            location,
            ageGroups: [ageGroup], // Array format
            genders: [gender], // Array format
            startTime,
            endTime,
            capacity: 12,
            priceCents: 1000, // $10.00
            status: startTime < new Date() ? 'closed' : 'upcoming',
            createdAt: new Date(startTime.getTime() - 7 * 24 * 60 * 60 * 1000), // Created a week before
          });
        }
      }
    }
    
    await db.insert(futsalSessions).values(sessionData);

    // 5. Create realistic signups and payments
    console.log('📝 Creating signups and payments...');
    const signupData = [];
    const paymentData = [];
    let signupCount = 0;
    
    for (const session of sessionData) {
      // Find eligible players for this session - be more lenient with age matching
      const eligiblePlayers = playerData.filter(player => {
        const age = new Date().getFullYear() - player.birthYear;
        // Allow players within 2 years of the target age group for better attendance
        const sessionAgeNum = parseInt(session.ageGroups[0].substring(1));
        const playerCanPlay = Math.abs(age - sessionAgeNum) <= 2 && session.genders.includes(player.gender);
        return playerCanPlay;
      });
      
      if (eligiblePlayers.length === 0) {
        // If no eligible players, allow any players of the right gender for demo purposes
        const anyEligible = playerData.filter(player => session.genders.includes(player.gender));
        eligiblePlayers.push(...anyEligible.slice(0, 8));
      }
      
      // Guarantee at least 8 players per session for demo
      const attendanceCount = Math.min(
        Math.max(8, Math.floor(Math.random() * 5) + 8), // Always 8-12 players
        eligiblePlayers.length,
        session.capacity
      );
      
      const shuffledPlayers = shuffle(eligiblePlayers);
      const attendingPlayers = shuffledPlayers.slice(0, attendanceCount);
      
      for (const player of attendingPlayers) {
        signupCount++;
        const signupId = `signup-${signupCount}`;
        const signupTime = new Date(session.startTime.getTime() - Math.random() * 24 * 60 * 60 * 1000); // Signed up within 24h of session
        
        signupData.push({
          id: signupId,
          playerId: player.id,
          sessionId: session.id,
          paid: true,
          createdAt: signupTime,
        });
        
        paymentData.push({
          id: `payment-${signupCount}`,
          signupId,
          stripePaymentIntentId: `pi_demo_${Math.random().toString(36).substring(2, 15)}`,
          amountCents: 1000,
          status: 'paid',
          paidAt: signupTime,
          createdAt: signupTime,
        });
      }
    }
    
    await db.insert(signups).values(signupData);
    await db.insert(payments).values(paymentData);

    // 6. Create realistic help requests
    console.log('🆘 Creating help requests...');
    const helpRequestData = [
      {
        id: 'help-1',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@email.com',
        note: "I can't see my son's upcoming sessions in the dashboard. They were showing yesterday but now they're gone.",
        resolved: true,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'help-2',
        name: 'Mike Rodriguez',
        email: 'mike.rodriguez@email.com',
        note: 'Having trouble with the payment system. It keeps saying my card was declined but I just used it elsewhere.',
        resolved: false,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'help-3',
        name: 'Lisa Chen',
        email: 'lisa.chen@email.com',
        note: 'My daughter wants to join the U12 girls session but the Reserve button is disabled. She just turned 12 last month.',
        resolved: true,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'help-4',
        name: 'David Wilson',
        email: 'david.wilson@email.com',
        note: 'Can you help me understand the portal access for my 13-year-old? I enabled it but he says he still can\'t log in.',
        resolved: false,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ];
    
    await db.insert(helpRequests).values(helpRequestData);

    console.log('✅ Demo data seeding completed successfully!');
    console.log(`
📊 DEMO DATA SUMMARY:
- Parents: ${parentData.length}
- Players: ${playerData.length}
- Sessions: ${sessionData.length} (4 weeks × 5 days × 3 sessions)
- Signups: ${signupData.length}
- Payments: ${paymentData.length}
- Revenue: $${(paymentData.length * 10).toLocaleString()}
- Average Attendance: ${Math.round(signupData.length / sessionData.length)} players per session
- Fill Rate: ${Math.round((signupData.length / (sessionData.length * 12)) * 100)}%
- Help Requests: ${helpRequestData.length} (${helpRequestData.filter(h => h.resolved).length} resolved)
    `);

  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    throw error;
  }
}

// Run the seeding
seedDemoData()
  .then(() => {
    console.log('🎉 Demo data seeding complete! Ready for your sales presentation.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  });