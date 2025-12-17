import { Request, Response } from 'express';
import { db } from '../../db';
import { users, players, tenants } from '@shared/schema';
import { eq, and, or, desc, asc, sql, ilike, gte, lte, inArray } from 'drizzle-orm';
import { pageParams, wrapRows } from '../../lib/pagination';
import { sendEmail } from '../../utils/email-provider';

const WELCOME_EMAIL = 'welcome@skorehq.app';
const FROM_EMAIL = 'skorehq@skorehq.app';

// Get all pending registrations across tenants
export async function list(req: Request, res: Response) {
  try {
    const { page, pageSize } = pageParams(req.query);
    const { tenantId, type, status, dateFrom, dateTo, search } = req.query;

    // Build filters for users
    const userConditions = [];
    userConditions.push(eq(users.registrationStatus, status?.toString() || 'pending'));
    
    if (tenantId && tenantId !== 'all') {
      userConditions.push(eq(users.tenantId, tenantId as string));
    }
    
    if (dateFrom) {
      userConditions.push(gte(users.createdAt, new Date(dateFrom as string)));
    }
    
    if (dateTo) {
      userConditions.push(lte(users.createdAt, new Date(dateTo as string)));
    }
    
    if (search) {
      userConditions.push(or(
        ilike(users.firstName, `%${search}%`),
        ilike(users.lastName, `%${search}%`),
        ilike(users.email, `%${search}%`)
      ));
    }

    // Build filters for players  
    const playerConditions = [];
    playerConditions.push(eq(players.registrationStatus, status?.toString() || 'pending'));
    
    if (tenantId && tenantId !== 'all') {
      playerConditions.push(eq(players.tenantId, tenantId as string));
    }
    
    if (dateFrom) {
      playerConditions.push(gte(players.createdAt, new Date(dateFrom as string)));
    }
    
    if (dateTo) {
      playerConditions.push(lte(players.createdAt, new Date(dateTo as string)));
    }
    
    if (search) {
      playerConditions.push(or(
        ilike(players.firstName, `%${search}%`),
        ilike(players.lastName, `%${search}%`)
      ));
    }

    // Fetch parent/adult registrations
    const userRegistrations = type !== 'player' ? await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
        type: sql<string>`'parent'`,
        registrationStatus: users.registrationStatus,
        createdAt: users.createdAt,
        approvedAt: users.approvedAt,
        approvedBy: users.approvedBy,
        rejectedAt: users.rejectedAt,
        rejectedBy: users.rejectedBy,
        rejectionReason: users.rejectionReason,
        tenantId: users.tenantId,
        tenantName: tenants.name,
        role: users.role,
        isAdmin: users.isAdmin
      })
      .from(users)
      .leftJoin(tenants, eq(users.tenantId, tenants.id))
      .where(and(...userConditions))
      .orderBy(desc(users.createdAt)) : [];

    // Fetch player registrations
    const playerRegistrations = type !== 'parent' ? await db
      .select({
        id: players.id,
        firstName: players.firstName,
        lastName: players.lastName,
        email: players.email,
        phone: players.phoneNumber,
        type: sql<string>`'player'`,
        registrationStatus: players.registrationStatus,
        createdAt: players.createdAt,
        approvedAt: players.approvedAt,
        approvedBy: players.approvedBy,
        birthYear: players.birthYear,
        gender: players.gender,
        parentId: players.parentId,
        tenantId: players.tenantId,
        tenantName: tenants.name
      })
      .from(players)
      .leftJoin(tenants, eq(players.tenantId, tenants.id))
      .where(and(...playerConditions))
      .orderBy(desc(players.createdAt)) : [];

    // Combine and sort all registrations
    const allRegistrations = [...userRegistrations, ...playerRegistrations]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply pagination
    const start = (page - 1) * pageSize;
    const paginatedRegistrations = allRegistrations.slice(start, start + pageSize);

    console.log(`Super Admin: Fetched ${allRegistrations.length} pending registrations`);
    res.json(wrapRows(paginatedRegistrations, page, pageSize, allRegistrations.length));
  } catch (error) {
    console.error('Error fetching pending registrations:', error);
    res.status(500).json({ message: 'Failed to fetch pending registrations' });
  }
}

// Get registration statistics for dashboard
export async function getStats(req: Request, res: Response) {
  try {
    // Get total pending counts
    const [pendingUsers] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.registrationStatus, 'pending'));

    const [pendingPlayers] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(players)
      .where(eq(players.registrationStatus, 'pending'));

    // Get pending by tenant (top 5)
    const pendingByTenant = await db
      .select({
        tenantId: tenants.id,
        tenantName: tenants.name,
        pendingCount: sql<number>`
          (SELECT COUNT(*) FROM ${users} WHERE tenant_id = ${tenants.id} AND registration_status = 'pending') +
          (SELECT COUNT(*) FROM ${players} WHERE tenant_id = ${tenants.id} AND registration_status = 'pending')
        `
      })
      .from(tenants)
      .having(sql`
        (SELECT COUNT(*) FROM ${users} WHERE tenant_id = ${tenants.id} AND registration_status = 'pending') +
        (SELECT COUNT(*) FROM ${players} WHERE tenant_id = ${tenants.id} AND registration_status = 'pending') > 0
      `)
      .orderBy(desc(sql`
        (SELECT COUNT(*) FROM ${users} WHERE tenant_id = ${tenants.id} AND registration_status = 'pending') +
        (SELECT COUNT(*) FROM ${players} WHERE tenant_id = ${tenants.id} AND registration_status = 'pending')
      `))
      .limit(5);

    // Get recent pending registrations (last 5)
    const recentPendingUsers = await db
      .select({
        id: users.id,
        name: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        email: users.email,
        type: sql<string>`'parent'`,
        createdAt: users.createdAt,
        tenantName: tenants.name
      })
      .from(users)
      .leftJoin(tenants, eq(users.tenantId, tenants.id))
      .where(eq(users.registrationStatus, 'pending'))
      .orderBy(desc(users.createdAt))
      .limit(3);

    const recentPendingPlayers = await db
      .select({
        id: players.id,
        name: sql<string>`${players.firstName} || ' ' || ${players.lastName}`,
        email: players.email,
        type: sql<string>`'player'`,
        createdAt: players.createdAt,
        tenantName: tenants.name
      })
      .from(players)
      .leftJoin(tenants, eq(players.tenantId, tenants.id))
      .where(eq(players.registrationStatus, 'pending'))
      .orderBy(desc(players.createdAt))
      .limit(2);

    const recentRegistrations = [...recentPendingUsers, ...recentPendingPlayers]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    // Get trend data for last 7 days
    const trendData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const [userCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(and(
          eq(users.registrationStatus, 'pending'),
          gte(users.createdAt, date),
          lte(users.createdAt, nextDate)
        ));

      const [playerCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(players)
        .where(and(
          eq(players.registrationStatus, 'pending'),
          gte(players.createdAt, date),
          lte(players.createdAt, nextDate)
        ));

      trendData.push({
        date: date.toISOString().split('T')[0],
        count: (userCount?.count || 0) + (playerCount?.count || 0)
      });
    }

    res.json({
      totalPending: (pendingUsers?.count || 0) + (pendingPlayers?.count || 0),
      pendingByType: {
        parents: pendingUsers?.count || 0,
        players: pendingPlayers?.count || 0
      },
      pendingByTenant,
      recentRegistrations,
      trendData
    });
  } catch (error) {
    console.error('Error fetching registration stats:', error);
    res.status(500).json({ message: 'Failed to fetch registration statistics' });
  }
}

// Get single registration details
export async function getById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Try to find in users table
    const [user] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
        type: sql<string>`'parent'`,
        registrationStatus: users.registrationStatus,
        createdAt: users.createdAt,
        approvedAt: users.approvedAt,
        approvedBy: users.approvedBy,
        rejectedAt: users.rejectedAt,
        rejectedBy: users.rejectedBy,
        rejectionReason: users.rejectionReason,
        tenantId: users.tenantId,
        tenantName: tenants.name,
        role: users.role,
        isAdmin: users.isAdmin,
        emailVerifiedAt: users.emailVerifiedAt
      })
      .from(users)
      .leftJoin(tenants, eq(users.tenantId, tenants.id))
      .where(eq(users.id, id));

    if (user) {
      return res.json(user);
    }

    // Try to find in players table
    const [player] = await db
      .select({
        id: players.id,
        firstName: players.firstName,
        lastName: players.lastName,
        email: players.email,
        phone: players.phoneNumber,
        type: sql<string>`'player'`,
        registrationStatus: players.registrationStatus,
        createdAt: players.createdAt,
        approvedAt: players.approvedAt,
        approvedBy: players.approvedBy,
        birthYear: players.birthYear,
        gender: players.gender,
        parentId: players.parentId,
        tenantId: players.tenantId,
        tenantName: tenants.name,
        soccerClub: players.soccerClub
      })
      .from(players)
      .leftJoin(tenants, eq(players.tenantId, tenants.id))
      .where(eq(players.id, id));

    if (player) {
      // Get parent info
      const [parent] = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email
        })
        .from(users)
        .where(eq(users.id, player.parentId));

      return res.json({ ...player, parent });
    }

    res.status(404).json({ message: 'Registration not found' });
  } catch (error) {
    console.error('Error fetching registration details:', error);
    res.status(500).json({ message: 'Failed to fetch registration details' });
  }
}

// Approve registration
export async function approve(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const approvedBy = (req as any).user?.id;

    // Try to approve user
    const [updatedUser] = await db
      .update(users)
      .set({
        registrationStatus: 'approved',
        isApproved: true,
        approvedAt: new Date(),
        approvedBy
      })
      .where(and(
        eq(users.id, id),
        eq(users.registrationStatus, 'pending')
      ))
      .returning();

    if (updatedUser) {
      // Send approval email
      if (updatedUser.email) {
        try {
          await sendEmail({
            to: updatedUser.email,
            from: FROM_EMAIL,
            subject: 'Registration Approved',
            text: `Hi ${updatedUser.firstName},\n\nYour registration has been approved. You can now log in to your account.\n\nBest regards,\nSkoreHQ Team`,
            html: `<p>Hi ${updatedUser.firstName},</p><p>Your registration has been approved. You can now log in to your account.</p><p>Best regards,<br>SkoreHQ Team</p>`
          });
        } catch (emailError) {
          console.error('Failed to send approval email:', emailError);
        }
      }

      return res.json({ message: 'Registration approved successfully', registration: updatedUser });
    }

    // Try to approve player
    const [updatedPlayer] = await db
      .update(players)
      .set({
        registrationStatus: 'approved',
        isApproved: true,
        approvedAt: new Date(),
        approvedBy
      })
      .where(and(
        eq(players.id, id),
        eq(players.registrationStatus, 'pending')
      ))
      .returning();

    if (updatedPlayer) {
      // Send notification to parent
      if (updatedPlayer.parentId) {
        const [parent] = await db
          .select()
          .from(users)
          .where(eq(users.id, updatedPlayer.parentId));

        if (parent?.email) {
          try {
            await sendEmail({
              to: parent.email,
              from: FROM_EMAIL,
              subject: 'Player Registration Approved',
              text: `Hi ${parent.firstName},\n\nThe registration for ${updatedPlayer.firstName} ${updatedPlayer.lastName} has been approved.\n\nBest regards,\nSkoreHQ Team`,
              html: `<p>Hi ${parent.firstName},</p><p>The registration for ${updatedPlayer.firstName} ${updatedPlayer.lastName} has been approved.</p><p>Best regards,<br>SkoreHQ Team</p>`
            });
          } catch (emailError) {
            console.error('Failed to send approval email:', emailError);
          }
        }
      }

      return res.json({ message: 'Player registration approved successfully', registration: updatedPlayer });
    }

    res.status(404).json({ message: 'Registration not found or already processed' });
  } catch (error) {
    console.error('Error approving registration:', error);
    res.status(500).json({ message: 'Failed to approve registration' });
  }
}

// Reject registration
export async function reject(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const rejectedBy = (req as any).user?.id;

    if (!reason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    // Try to reject user
    const [updatedUser] = await db
      .update(users)
      .set({
        registrationStatus: 'rejected',
        isApproved: false,
        rejectedAt: new Date(),
        rejectedBy,
        rejectionReason: reason
      })
      .where(and(
        eq(users.id, id),
        eq(users.registrationStatus, 'pending')
      ))
      .returning();

    if (updatedUser) {
      // Send rejection email
      if (updatedUser.email) {
        try {
          await sendEmail({
            to: updatedUser.email,
            from: FROM_EMAIL,
            subject: 'Registration Status Update',
            text: `Hi ${updatedUser.firstName},\n\nWe regret to inform you that your registration could not be approved at this time.\n\nReason: ${reason}\n\nIf you have questions, please contact support.\n\nBest regards,\nSkoreHQ Team`,
            html: `<p>Hi ${updatedUser.firstName},</p><p>We regret to inform you that your registration could not be approved at this time.</p><p><strong>Reason:</strong> ${reason}</p><p>If you have questions, please contact support.</p><p>Best regards,<br>SkoreHQ Team</p>`
          });
        } catch (emailError) {
          console.error('Failed to send rejection email:', emailError);
        }
      }

      return res.json({ message: 'Registration rejected', registration: updatedUser });
    }

    // Try to reject player
    const [updatedPlayer] = await db
      .update(players)
      .set({
        registrationStatus: 'rejected',
        isApproved: false
      })
      .where(and(
        eq(players.id, id),
        eq(players.registrationStatus, 'pending')
      ))
      .returning();

    if (updatedPlayer) {
      // Send notification to parent
      if (updatedPlayer.parentId) {
        const [parent] = await db
          .select()
          .from(users)
          .where(eq(users.id, updatedPlayer.parentId));

        if (parent?.email) {
          try {
            await sendEmail({
              to: parent.email,
              from: FROM_EMAIL,
              subject: 'Player Registration Status Update',
              text: `Hi ${parent.firstName},\n\nThe registration for ${updatedPlayer.firstName} ${updatedPlayer.lastName} could not be approved.\n\nReason: ${reason}\n\nPlease contact support if you have questions.\n\nBest regards,\nSkoreHQ Team`,
              html: `<p>Hi ${parent.firstName},</p><p>The registration for ${updatedPlayer.firstName} ${updatedPlayer.lastName} could not be approved.</p><p><strong>Reason:</strong> ${reason}</p><p>Please contact support if you have questions.</p><p>Best regards,<br>SkoreHQ Team</p>`
            });
          } catch (emailError) {
            console.error('Failed to send rejection email:', emailError);
          }
        }
      }

      return res.json({ message: 'Player registration rejected', registration: updatedPlayer });
    }

    res.status(404).json({ message: 'Registration not found or already processed' });
  } catch (error) {
    console.error('Error rejecting registration:', error);
    res.status(500).json({ message: 'Failed to reject registration' });
  }
}

// Bulk approve registrations
export async function bulkApprove(req: Request, res: Response) {
  try {
    const { ids, type } = req.body;
    const approvedBy = (req as any).user?.id;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Invalid registration IDs' });
    }

    let successful = 0;
    let failed = 0;
    const errors = [];

    for (const id of ids) {
      try {
        if (!type || type === 'parent') {
          const [updated] = await db
            .update(users)
            .set({
              registrationStatus: 'approved',
              isApproved: true,
              approvedAt: new Date(),
              approvedBy
            })
            .where(and(
              eq(users.id, id),
              eq(users.registrationStatus, 'pending')
            ))
            .returning();

          if (updated) {
            successful++;
            continue;
          }
        }

        if (!type || type === 'player') {
          const [updated] = await db
            .update(players)
            .set({
              registrationStatus: 'approved',
              isApproved: true,
              approvedAt: new Date(),
              approvedBy
            })
            .where(and(
              eq(players.id, id),
              eq(players.registrationStatus, 'pending')
            ))
            .returning();

          if (updated) {
            successful++;
            continue;
          }
        }

        failed++;
        errors.push({ id, error: 'Not found or already processed' });
      } catch (error) {
        failed++;
        errors.push({ id, error: error.message });
      }
    }

    res.json({
      message: `Bulk approval completed: ${successful} successful, ${failed} failed`,
      successful,
      failed,
      errors
    });
  } catch (error) {
    console.error('Error bulk approving registrations:', error);
    res.status(500).json({ message: 'Failed to bulk approve registrations' });
  }
}

// Bulk reject registrations
export async function bulkReject(req: Request, res: Response) {
  try {
    const { ids, type, reason } = req.body;
    const rejectedBy = (req as any).user?.id;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Invalid registration IDs' });
    }

    if (!reason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    let successful = 0;
    let failed = 0;
    const errors = [];

    for (const id of ids) {
      try {
        if (!type || type === 'parent') {
          const [updated] = await db
            .update(users)
            .set({
              registrationStatus: 'rejected',
              isApproved: false,
              rejectedAt: new Date(),
              rejectedBy,
              rejectionReason: reason
            })
            .where(and(
              eq(users.id, id),
              eq(users.registrationStatus, 'pending')
            ))
            .returning();

          if (updated) {
            successful++;
            continue;
          }
        }

        if (!type || type === 'player') {
          const [updated] = await db
            .update(players)
            .set({
              registrationStatus: 'rejected',
              isApproved: false
            })
            .where(and(
              eq(players.id, id),
              eq(players.registrationStatus, 'pending')
            ))
            .returning();

          if (updated) {
            successful++;
            continue;
          }
        }

        failed++;
        errors.push({ id, error: 'Not found or already processed' });
      } catch (error) {
        failed++;
        errors.push({ id, error: error.message });
      }
    }

    res.json({
      message: `Bulk rejection completed: ${successful} successful, ${failed} failed`,
      successful,
      failed,
      errors
    });
  } catch (error) {
    console.error('Error bulk rejecting registrations:', error);
    res.status(500).json({ message: 'Failed to bulk reject registrations' });
  }
}

// Export registrations to CSV
export async function exportToCsv(req: Request, res: Response) {
  try {
    const { tenantId, type, status, dateFrom, dateTo } = req.query;

    // Build the same filters as list
    const userConditions = [];
    userConditions.push(eq(users.registrationStatus, status?.toString() || 'pending'));
    
    if (tenantId && tenantId !== 'all') {
      userConditions.push(eq(users.tenantId, tenantId as string));
    }
    
    if (dateFrom) {
      userConditions.push(gte(users.createdAt, new Date(dateFrom as string)));
    }
    
    if (dateTo) {
      userConditions.push(lte(users.createdAt, new Date(dateTo as string)));
    }

    const playerConditions = [...userConditions.map(c => c)]; // Clone conditions

    // Fetch data
    const userRegistrations = type !== 'player' ? await db
      .select({
        type: sql<string>`'Parent'`,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
        status: users.registrationStatus,
        createdAt: users.createdAt,
        tenantName: tenants.name
      })
      .from(users)
      .leftJoin(tenants, eq(users.tenantId, tenants.id))
      .where(and(...userConditions)) : [];

    const playerRegistrations = type !== 'parent' ? await db
      .select({
        type: sql<string>`'Player'`,
        firstName: players.firstName,
        lastName: players.lastName,
        email: players.email,
        phone: players.phoneNumber,
        status: players.registrationStatus,
        createdAt: players.createdAt,
        tenantName: tenants.name
      })
      .from(players)
      .leftJoin(tenants, eq(players.tenantId, tenants.id))
      .where(and(...playerConditions)) : [];

    const allRegistrations = [...userRegistrations, ...playerRegistrations];

    // Convert to CSV
    const headers = ['Type', 'First Name', 'Last Name', 'Email', 'Phone', 'Status', 'Created Date', 'Organization'];
    const rows = allRegistrations.map(r => [
      r.type,
      r.firstName,
      r.lastName,
      r.email || '',
      r.phone || '',
      r.status,
      new Date(r.createdAt).toLocaleDateString(),
      r.tenantName || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="pending-registrations.csv"');
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting registrations:', error);
    res.status(500).json({ message: 'Failed to export registrations' });
  }
}