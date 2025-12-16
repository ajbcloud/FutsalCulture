import { sendEmail } from './email-provider';
import { db } from '../db';
import { eq, and } from 'drizzle-orm';
import { 
  signups, 
  players, 
  users, 
  futsalSessions, 
  coachSessionAssignments, 
  coachTenantAssignments,
  tenants
} from '@shared/schema';
import { format } from 'date-fns';

function calculateAgeGroup(birthYear: number): string {
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;
  if (age <= 6) return 'U6';
  if (age <= 8) return 'U8';
  if (age <= 10) return 'U10';
  if (age <= 12) return 'U12';
  if (age <= 14) return 'U14';
  if (age <= 16) return 'U16';
  if (age <= 18) return 'U18';
  return 'Adult';
}

const FROM_EMAIL = 'playhq@playhq.app';

interface RosterPlayer {
  playerName: string;
  ageGroup: string | null;
  paymentStatus: 'paid' | 'pending';
  parentName: string;
  parentEmail: string;
}

interface SessionRoster {
  sessionId: string;
  sessionTitle: string;
  sessionDate: string;
  sessionTime: string;
  location: string;
  ageGroups: string[];
  players: RosterPlayer[];
}

export async function getSessionRoster(sessionId: string): Promise<SessionRoster | null> {
  const [session] = await db
    .select()
    .from(futsalSessions)
    .where(eq(futsalSessions.id, sessionId));

  if (!session) {
    return null;
  }

  const sessionPlayers = await db
    .select({
      playerId: players.id,
      playerFirstName: players.firstName,
      playerLastName: players.lastName,
      playerBirthYear: players.birthYear,
      paid: signups.paid,
      parentId: users.id,
      parentFirstName: users.firstName,
      parentLastName: users.lastName,
      parentEmail: users.email,
    })
    .from(signups)
    .innerJoin(players, eq(signups.playerId, players.id))
    .innerJoin(users, eq(players.parentId, users.id))
    .where(eq(signups.sessionId, sessionId));

  const rosterPlayers: RosterPlayer[] = sessionPlayers.map(p => ({
    playerName: `${p.playerFirstName} ${p.playerLastName}`,
    ageGroup: calculateAgeGroup(p.playerBirthYear),
    paymentStatus: p.paid ? 'paid' : 'pending',
    parentName: `${p.parentFirstName} ${p.parentLastName}`,
    parentEmail: p.parentEmail || '',
  }));

  const sessionDate = new Date(session.startTime);

  return {
    sessionId: session.id,
    sessionTitle: session.title,
    sessionDate: format(sessionDate, 'EEEE, MMMM d, yyyy'),
    sessionTime: `${format(sessionDate, 'h:mm a')} - ${format(new Date(session.endTime), 'h:mm a')}`,
    location: session.location,
    ageGroups: session.ageGroups || [],
    players: rosterPlayers,
  };
}

function generateRosterEmailHtml(roster: SessionRoster, tenantName: string): string {
  const paidCount = roster.players.filter(p => p.paymentStatus === 'paid').length;
  const pendingCount = roster.players.filter(p => p.paymentStatus === 'pending').length;

  const playersByAgeGroup = roster.players.reduce((acc, player) => {
    const ageGroup = player.ageGroup || 'No Age Group';
    if (!acc[ageGroup]) {
      acc[ageGroup] = [];
    }
    acc[ageGroup].push(player);
    return acc;
  }, {} as Record<string, RosterPlayer[]>);

  const ageGroupSections = Object.entries(playersByAgeGroup)
    .map(([ageGroup, players]) => {
      const playerRows = players
        .map(p => `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${p.playerName}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
              <span style="background: ${p.paymentStatus === 'paid' ? '#22c55e' : '#f59e0b'}; color: white; padding: 3px 8px; border-radius: 4px; font-size: 12px;">
                ${p.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
              </span>
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${p.parentName}</td>
          </tr>
        `)
        .join('');

      return `
        <div style="margin-bottom: 24px;">
          <h3 style="margin: 0 0 12px 0; color: #374151; font-size: 16px; border-bottom: 2px solid #3b82f6; padding-bottom: 6px;">
            ${ageGroup} (${players.length} player${players.length !== 1 ? 's' : ''})
          </h3>
          <table style="width: 100%; border-collapse: collapse; background: white;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 10px; text-align: left; font-weight: 600; color: #374151;">Player Name</th>
                <th style="padding: 10px; text-align: left; font-weight: 600; color: #374151;">Payment</th>
                <th style="padding: 10px; text-align: left; font-weight: 600; color: #374151;">Parent/Guardian</th>
              </tr>
            </thead>
            <tbody>
              ${playerRows}
            </tbody>
          </table>
        </div>
      `;
    })
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Session Roster - ${roster.sessionTitle}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f3f4f6;">
  <div style="max-width: 700px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 24px; border-radius: 12px 12px 0 0;">
      <h1 style="margin: 0; font-size: 24px;">Session Roster</h1>
      <p style="margin: 8px 0 0 0; opacity: 0.9;">${tenantName}</p>
    </div>
    
    <div style="background: white; padding: 24px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
        <h2 style="margin: 0 0 12px 0; color: #1f2937; font-size: 20px;">${roster.sessionTitle}</h2>
        <p style="margin: 4px 0; color: #6b7280;">
          <strong>Date:</strong> ${roster.sessionDate}
        </p>
        <p style="margin: 4px 0; color: #6b7280;">
          <strong>Time:</strong> ${roster.sessionTime}
        </p>
        <p style="margin: 4px 0; color: #6b7280;">
          <strong>Location:</strong> ${roster.location}
        </p>
        <p style="margin: 4px 0; color: #6b7280;">
          <strong>Age Groups:</strong> ${roster.ageGroups.length > 0 ? roster.ageGroups.join(', ') : 'All ages'}
        </p>
      </div>

      <div style="display: flex; gap: 16px; margin-bottom: 24px;">
        <div style="flex: 1; background: #f0fdf4; padding: 16px; border-radius: 8px; text-align: center;">
          <div style="font-size: 28px; font-weight: bold; color: #22c55e;">${roster.players.length}</div>
          <div style="color: #16a34a; font-size: 14px;">Total Players</div>
        </div>
        <div style="flex: 1; background: #f0fdf4; padding: 16px; border-radius: 8px; text-align: center;">
          <div style="font-size: 28px; font-weight: bold; color: #22c55e;">${paidCount}</div>
          <div style="color: #16a34a; font-size: 14px;">Paid</div>
        </div>
        <div style="flex: 1; background: ${pendingCount > 0 ? '#fffbeb' : '#f0fdf4'}; padding: 16px; border-radius: 8px; text-align: center;">
          <div style="font-size: 28px; font-weight: bold; color: ${pendingCount > 0 ? '#f59e0b' : '#22c55e'};">${pendingCount}</div>
          <div style="color: ${pendingCount > 0 ? '#d97706' : '#16a34a'}; font-size: 14px;">Pending</div>
        </div>
      </div>

      <h3 style="margin: 0 0 16px 0; color: #1f2937; font-size: 18px;">Player Roster</h3>
      
      ${roster.players.length > 0 ? ageGroupSections : '<p style="color: #6b7280; text-align: center; padding: 24px;">No players registered for this session yet.</p>'}
    </div>
    
    <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
      <p>This is an automated roster email from PlayHQ</p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateRosterEmailText(roster: SessionRoster, tenantName: string): string {
  const paidCount = roster.players.filter(p => p.paymentStatus === 'paid').length;
  const pendingCount = roster.players.filter(p => p.paymentStatus === 'pending').length;

  const playerList = roster.players
    .map(p => `- ${p.playerName} (${p.ageGroup || 'No age group'}) - ${p.paymentStatus === 'paid' ? 'PAID' : 'PENDING'} - Parent: ${p.parentName}`)
    .join('\n');

  return `
SESSION ROSTER - ${tenantName}
==============================

${roster.sessionTitle}

Date: ${roster.sessionDate}
Time: ${roster.sessionTime}
Location: ${roster.location}
Age Groups: ${roster.ageGroups.length > 0 ? roster.ageGroups.join(', ') : 'All ages'}

SUMMARY
-------
Total Players: ${roster.players.length}
Paid: ${paidCount}
Pending: ${pendingCount}

PLAYER LIST
-----------
${roster.players.length > 0 ? playerList : 'No players registered for this session yet.'}

---
This is an automated roster email from PlayHQ
  `.trim();
}

export interface SendRosterEmailOptions {
  sessionId: string;
  tenantId: string;
}

export async function sendRosterEmail(options: SendRosterEmailOptions): Promise<{ 
  success: boolean; 
  sentTo: string[]; 
  errors: string[] 
}> {
  const { sessionId, tenantId } = options;
  const sentTo: string[] = [];
  const errors: string[] = [];

  const roster = await getSessionRoster(sessionId);
  if (!roster) {
    return { success: false, sentTo: [], errors: ['Session not found'] };
  }

  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId));

  const tenantName = tenant?.name || 'PlayHQ';

  const emailHtml = generateRosterEmailHtml(roster, tenantName);
  const emailText = generateRosterEmailText(roster, tenantName);
  const subject = `Session Roster: ${roster.sessionTitle} - ${roster.sessionDate}`;

  const adminUsers = await db
    .select({ email: users.email, firstName: users.firstName })
    .from(users)
    .where(and(eq(users.tenantId, tenantId), eq(users.isAdmin, true)));

  for (const admin of adminUsers) {
    if (admin.email) {
      const result = await sendEmail({
        to: admin.email,
        from: FROM_EMAIL,
        fromName: tenantName,
        subject,
        text: emailText,
        html: emailHtml,
        categories: ['roster', 'admin', 'session'],
      });
      if (result.success) {
        sentTo.push(admin.email);
      } else {
        errors.push(`Failed to send to admin ${admin.email}: ${result.error}`);
      }
    }
  }

  const sessionCoaches = await db
    .select({
      coachEmail: users.email,
      coachFirstName: users.firstName,
      isLead: coachSessionAssignments.isLead,
    })
    .from(coachSessionAssignments)
    .innerJoin(coachTenantAssignments, eq(coachSessionAssignments.coachAssignmentId, coachTenantAssignments.id))
    .innerJoin(users, eq(coachTenantAssignments.userId, users.id))
    .where(eq(coachSessionAssignments.sessionId, sessionId));

  for (const coach of sessionCoaches) {
    if (coach.coachEmail && !sentTo.includes(coach.coachEmail)) {
      const result = await sendEmail({
        to: coach.coachEmail,
        from: FROM_EMAIL,
        fromName: tenantName,
        subject,
        text: emailText,
        html: emailHtml,
        categories: ['roster', 'coach', 'session'],
      });
      if (result.success) {
        sentTo.push(coach.coachEmail);
      } else {
        errors.push(`Failed to send to coach ${coach.coachEmail}: ${result.error}`);
      }
    }
  }

  console.log(`✅ Roster email sent for session ${sessionId} to ${sentTo.length} recipients`);
  
  return {
    success: errors.length === 0,
    sentTo,
    errors,
  };
}
