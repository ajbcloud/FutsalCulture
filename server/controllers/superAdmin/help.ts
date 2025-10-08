import { Request, Response } from 'express';
import { pageParams } from '../../lib/pagination';
import { db } from '../../db';
import { helpRequests, tenants, users } from '../../../shared/schema';
import { eq, desc, asc, and, or, sql, like, gte, lte, isNull, not } from 'drizzle-orm';
import { sendEmail } from '../../emailService';

// GET /api/super-admin/help-requests - List all help requests across tenants with filters
export async function list(req: Request, res: Response) {
  try {
    const { page = 1, pageSize = 20 } = pageParams(req.query);
    const {
      tenant: tenantFilter,
      status: statusFilter,
      priority: priorityFilter,
      search,
      source: sourceFilter,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Build filter conditions
    const conditions: any[] = [];

    if (tenantFilter && tenantFilter !== 'all') {
      conditions.push(eq(helpRequests.tenantId, tenantFilter as string));
    }

    if (statusFilter) {
      conditions.push(eq(helpRequests.status, statusFilter as string));
    }

    if (priorityFilter) {
      conditions.push(eq(helpRequests.priority, priorityFilter as string));
    }

    if (sourceFilter) {
      conditions.push(eq(helpRequests.source, sourceFilter as string));
    }

    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        or(
          like(helpRequests.subject, searchTerm),
          like(helpRequests.message, searchTerm),
          like(helpRequests.firstName, searchTerm),
          like(helpRequests.lastName, searchTerm),
          like(helpRequests.email, searchTerm),
        )
      );
    }

    if (dateFrom) {
      conditions.push(gte(helpRequests.createdAt, new Date(dateFrom as string)));
    }

    if (dateTo) {
      const endDate = new Date(dateTo as string);
      endDate.setHours(23, 59, 59, 999);
      conditions.push(lte(helpRequests.createdAt, endDate));
    }

    // Build query with joins for tenant information
    const query = db
      .select({
        id: helpRequests.id,
        tenantId: helpRequests.tenantId,
        tenantName: tenants.name,
        tenantSubdomain: tenants.subdomain,
        status: helpRequests.status,
        firstName: helpRequests.firstName,
        lastName: helpRequests.lastName,
        email: helpRequests.email,
        phone: helpRequests.phone,
        subject: helpRequests.subject,
        category: helpRequests.category,
        priority: helpRequests.priority,
        message: helpRequests.message,
        source: helpRequests.source,
        resolved: helpRequests.resolved,
        resolvedBy: helpRequests.resolvedBy,
        resolutionNote: helpRequests.resolutionNote,
        resolvedAt: helpRequests.resolvedAt,
        firstResponseAt: helpRequests.firstResponseAt,
        replyHistory: helpRequests.replyHistory,
        createdAt: helpRequests.createdAt,
      })
      .from(helpRequests)
      .leftJoin(tenants, eq(helpRequests.tenantId, tenants.id));

    // Apply conditions
    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    // Apply sorting
    const sortField = sortBy === 'tenant' ? tenants.name : 
                     sortBy === 'createdAt' ? helpRequests.createdAt :
                     sortBy === 'priority' ? helpRequests.priority :
                     sortBy === 'status' ? helpRequests.status :
                     helpRequests.createdAt;

    query.orderBy(sortOrder === 'asc' ? asc(sortField) : desc(sortField));

    // Execute query with pagination
    const offset = (page - 1) * pageSize;
    query.limit(pageSize).offset(offset);

    const rows = await query;

    // Get total count for pagination
    const countQuery = db
      .select({ count: sql<number>`count(*)::integer` })
      .from(helpRequests)
      .leftJoin(tenants, eq(helpRequests.tenantId, tenants.id));

    if (conditions.length > 0) {
      countQuery.where(and(...conditions));
    }

    const [{ count: totalCount }] = await countQuery;

    // Calculate SLA metrics for each request
    const enrichedRows = rows.map(row => ({
      ...row,
      responseTime: row.firstResponseAt ? 
        Math.floor((new Date(row.firstResponseAt).getTime() - new Date(row.createdAt).getTime()) / (1000 * 60)) : null,
      resolutionTime: row.resolvedAt ? 
        Math.floor((new Date(row.resolvedAt).getTime() - new Date(row.createdAt).getTime()) / (1000 * 60)) : null,
      replyCount: (row.replyHistory as any[])?.length || 0,
      lastReplyAt: (row.replyHistory as any[])?.slice(-1)[0]?.repliedAt || null,
    }));

    console.log(`Super Admin: help requests list retrieved by ${(req as any).user?.id || 'unknown'}`);

    res.json({
      rows: enrichedRows,
      page,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
    });
  } catch (error) {
    console.error('Error fetching help requests:', error);
    res.status(500).json({ error: 'Failed to fetch help requests' });
  }
}

// GET /api/super-admin/help-requests/stats - Get dashboard statistics
export async function getStats(req: Request, res: Response) {
  try {
    // Get overall stats
    const [stats] = await db
      .select({
        totalRequests: sql<number>`count(*)::integer`,
        openRequests: sql<number>`count(*) filter (where ${helpRequests.status} = 'open')::integer`,
        inProgressRequests: sql<number>`count(*) filter (where ${helpRequests.status} = 'in_progress')::integer`,
        resolvedRequests: sql<number>`count(*) filter (where ${helpRequests.status} = 'resolved')::integer`,
        closedRequests: sql<number>`count(*) filter (where ${helpRequests.status} = 'closed')::integer`,
        highPriority: sql<number>`count(*) filter (where ${helpRequests.priority} = 'high')::integer`,
        mediumPriority: sql<number>`count(*) filter (where ${helpRequests.priority} = 'medium')::integer`,
        lowPriority: sql<number>`count(*) filter (where ${helpRequests.priority} = 'low')::integer`,
        avgResponseTime: sql<number>`
          avg(
            EXTRACT(EPOCH FROM (${helpRequests.firstResponseAt} - ${helpRequests.createdAt})) / 60
          )::integer
        `,
        avgResolutionTime: sql<number>`
          avg(
            EXTRACT(EPOCH FROM (${helpRequests.resolvedAt} - ${helpRequests.createdAt})) / 60
          )::integer
        `,
      })
      .from(helpRequests);

    // Get requests by tenant (top 5)
    const requestsByTenant = await db
      .select({
        tenantId: helpRequests.tenantId,
        tenantName: tenants.name,
        count: sql<number>`count(*)::integer`,
        openCount: sql<number>`count(*) filter (where ${helpRequests.status} = 'open')::integer`,
      })
      .from(helpRequests)
      .leftJoin(tenants, eq(helpRequests.tenantId, tenants.id))
      .groupBy(helpRequests.tenantId, tenants.name)
      .orderBy(desc(sql`count(*)`))
      .limit(5);

    // Get recent urgent requests (high priority and open)
    const urgentRequests = await db
      .select({
        id: helpRequests.id,
        subject: helpRequests.subject,
        tenantName: tenants.name,
        createdAt: helpRequests.createdAt,
      })
      .from(helpRequests)
      .leftJoin(tenants, eq(helpRequests.tenantId, tenants.id))
      .where(
        and(
          eq(helpRequests.status, 'open'),
          eq(helpRequests.priority, 'high')
        )
      )
      .orderBy(desc(helpRequests.createdAt))
      .limit(5);

    // Get requests by category
    const requestsByCategory = await db
      .select({
        category: helpRequests.category,
        count: sql<number>`count(*)::integer`,
      })
      .from(helpRequests)
      .groupBy(helpRequests.category)
      .orderBy(desc(sql`count(*)`));

    // Get requests trend (last 7 days)
    const requestsTrend = await db
      .select({
        date: sql<string>`DATE(${helpRequests.createdAt})`,
        count: sql<number>`count(*)::integer`,
      })
      .from(helpRequests)
      .where(gte(helpRequests.createdAt, sql`CURRENT_DATE - INTERVAL '7 days'`))
      .groupBy(sql`DATE(${helpRequests.createdAt})`)
      .orderBy(asc(sql`DATE(${helpRequests.createdAt})`));

    console.log(`Super Admin: help request stats retrieved by ${(req as any).user?.id || 'unknown'}`);

    res.json({
      overview: stats,
      requestsByTenant,
      urgentRequests,
      requestsByCategory,
      requestsTrend,
    });
  } catch (error) {
    console.error('Error fetching help request stats:', error);
    res.status(500).json({ error: 'Failed to fetch help request statistics' });
  }
}

// GET /api/super-admin/help-requests/:id - Get single request with full details
export async function getById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const [request] = await db
      .select({
        id: helpRequests.id,
        tenantId: helpRequests.tenantId,
        tenantName: tenants.name,
        tenantSubdomain: tenants.subdomain,
        status: helpRequests.status,
        firstName: helpRequests.firstName,
        lastName: helpRequests.lastName,
        email: helpRequests.email,
        phone: helpRequests.phone,
        subject: helpRequests.subject,
        category: helpRequests.category,
        priority: helpRequests.priority,
        message: helpRequests.message,
        source: helpRequests.source,
        resolved: helpRequests.resolved,
        resolvedBy: helpRequests.resolvedBy,
        resolutionNote: helpRequests.resolutionNote,
        resolvedAt: helpRequests.resolvedAt,
        firstResponseAt: helpRequests.firstResponseAt,
        replyHistory: helpRequests.replyHistory,
        createdAt: helpRequests.createdAt,
      })
      .from(helpRequests)
      .leftJoin(tenants, eq(helpRequests.tenantId, tenants.id))
      .where(eq(helpRequests.id, id))
      .limit(1);

    if (!request) {
      return res.status(404).json({ error: 'Help request not found' });
    }

    // Get resolver details if resolved
    let resolver = null;
    if (request.resolvedBy) {
      const [resolverUser] = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        })
        .from(users)
        .where(eq(users.id, request.resolvedBy))
        .limit(1);
      
      resolver = resolverUser;
    }

    console.log(`Super Admin: help request ${id} details retrieved by ${(req as any).user?.id || 'unknown'}`);

    res.json({
      ...request,
      resolver,
    });
  } catch (error) {
    console.error('Error fetching help request details:', error);
    res.status(500).json({ error: 'Failed to fetch help request details' });
  }
}

// POST /api/super-admin/help-requests/:id/reply - Add super admin response
export async function reply(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { message, internal = false } = req.body;
    const userId = (req as any).user?.id || 'super_admin';

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get the current request
    const [request] = await db
      .select()
      .from(helpRequests)
      .where(eq(helpRequests.id, id))
      .limit(1);

    if (!request) {
      return res.status(404).json({ error: 'Help request not found' });
    }

    // Get super admin details
    let adminName = 'Super Admin';
    try {
      const [adminUser] = await db
        .select({
          firstName: users.firstName,
          lastName: users.lastName,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      if (adminUser) {
        adminName = `${adminUser.firstName} ${adminUser.lastName}`;
      }
    } catch (e) {
      // Continue with default name if user not found
    }

    // Prepare reply object
    const reply = {
      message,
      repliedBy: adminName,
      repliedAt: new Date().toISOString(),
      internal,
      isSuperAdmin: true,
    };

    // Update reply history
    const currentHistory = (request.replyHistory as any[]) || [];
    const updatedHistory = [...currentHistory, reply];

    // Update the help request
    const updateData: any = {
      replyHistory: updatedHistory,
      status: request.status === 'open' ? 'in_progress' : request.status,
    };

    // Set first response time if not already set
    if (!request.firstResponseAt) {
      updateData.firstResponseAt = new Date();
    }

    await db
      .update(helpRequests)
      .set(updateData)
      .where(eq(helpRequests.id, id));

    // Send email notification to user if not internal
    if (!internal && request.email) {
      try {
        await sendEmail({
          to: request.email,
          subject: `Re: ${request.subject}`,
          html: `
            <p>Dear ${request.firstName} ${request.lastName},</p>
            <p>You have received a response to your help request:</p>
            <blockquote style="border-left: 3px solid #ddd; margin-left: 0; padding-left: 1em;">
              ${message}
            </blockquote>
            <p>Best regards,<br>Support Team</p>
          `,
        });
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Continue without failing the request
      }
    }

    console.log(`Super Admin: reply added to help request ${id} by ${userId}`);

    res.json({ 
      success: true, 
      reply,
      emailSent: !internal,
    });
  } catch (error) {
    console.error('Error adding reply to help request:', error);
    res.status(500).json({ error: 'Failed to add reply' });
  }
}

// PATCH /api/super-admin/help-requests/:id - Update request status, priority, etc.
export async function update(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status, priority, category, resolutionNote, internal_note } = req.body;
    const userId = (req as any).user?.id || 'super_admin';

    // Get the current request
    const [request] = await db
      .select()
      .from(helpRequests)
      .where(eq(helpRequests.id, id))
      .limit(1);

    if (!request) {
      return res.status(404).json({ error: 'Help request not found' });
    }

    const updateData: any = {};
    
    if (status !== undefined) {
      updateData.status = status;
      
      // If resolving or closing, set resolution fields
      if ((status === 'resolved' || status === 'closed') && !request.resolved) {
        updateData.resolved = true;
        updateData.resolvedBy = userId;
        updateData.resolvedAt = new Date();
        
        if (resolutionNote) {
          updateData.resolutionNote = resolutionNote;
        }
      }
      
      // If reopening
      if (status === 'open' && request.resolved) {
        updateData.resolved = false;
        updateData.resolvedBy = null;
        updateData.resolvedAt = null;
        updateData.resolutionNote = null;
      }
    }
    
    if (priority !== undefined) {
      updateData.priority = priority;
    }
    
    if (category !== undefined) {
      updateData.category = category;
    }

    // Add internal note to reply history if provided
    if (internal_note) {
      const currentHistory = (request.replyHistory as any[]) || [];
      
      // Get super admin details
      let adminName = 'Super Admin';
      try {
        const [adminUser] = await db
          .select({
            firstName: users.firstName,
            lastName: users.lastName,
          })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);
        
        if (adminUser) {
          adminName = `${adminUser.firstName} ${adminUser.lastName}`;
        }
      } catch (e) {
        // Continue with default name if user not found
      }

      const internalNote = {
        message: `[Internal Note] ${internal_note}`,
        repliedBy: adminName,
        repliedAt: new Date().toISOString(),
        internal: true,
        isSuperAdmin: true,
      };
      
      updateData.replyHistory = [...currentHistory, internalNote];
    }

    await db
      .update(helpRequests)
      .set(updateData)
      .where(eq(helpRequests.id, id));

    console.log(`Super Admin: help request ${id} updated by ${userId}`);

    res.json({ success: true, updated: updateData });
  } catch (error) {
    console.error('Error updating help request:', error);
    res.status(500).json({ error: 'Failed to update help request' });
  }
}

// POST /api/super-admin/help-requests/bulk-update - Bulk update multiple requests
export async function bulkUpdate(req: Request, res: Response) {
  try {
    const { ids, status, priority } = req.body;
    const userId = (req as any).user?.id || 'super_admin';

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Request IDs are required' });
    }

    const updateData: any = {};
    
    if (status !== undefined) {
      updateData.status = status;
      
      if (status === 'resolved' || status === 'closed') {
        updateData.resolved = true;
        updateData.resolvedBy = userId;
        updateData.resolvedAt = new Date();
      }
    }
    
    if (priority !== undefined) {
      updateData.priority = priority;
    }

    await db
      .update(helpRequests)
      .set(updateData)
      .where(sql`${helpRequests.id} = ANY(${ids})`);

    console.log(`Super Admin: bulk update ${ids.length} help requests by ${userId}`);

    res.json({ 
      success: true, 
      updatedCount: ids.length,
      updates: updateData,
    });
  } catch (error) {
    console.error('Error bulk updating help requests:', error);
    res.status(500).json({ error: 'Failed to bulk update help requests' });
  }
}

// GET /api/super-admin/help-requests/export - Export help requests to CSV
export async function exportToCsv(req: Request, res: Response) {
  try {
    const {
      tenant: tenantFilter,
      status: statusFilter,
      priority: priorityFilter,
      dateFrom,
      dateTo,
    } = req.query;

    // Build filter conditions
    const conditions: any[] = [];

    if (tenantFilter && tenantFilter !== 'all') {
      conditions.push(eq(helpRequests.tenantId, tenantFilter as string));
    }

    if (statusFilter) {
      conditions.push(eq(helpRequests.status, statusFilter as string));
    }

    if (priorityFilter) {
      conditions.push(eq(helpRequests.priority, priorityFilter as string));
    }

    if (dateFrom) {
      conditions.push(gte(helpRequests.createdAt, new Date(dateFrom as string)));
    }

    if (dateTo) {
      const endDate = new Date(dateTo as string);
      endDate.setHours(23, 59, 59, 999);
      conditions.push(lte(helpRequests.createdAt, endDate));
    }

    // Build query
    const query = db
      .select({
        id: helpRequests.id,
        tenant: tenants.name,
        status: helpRequests.status,
        priority: helpRequests.priority,
        firstName: helpRequests.firstName,
        lastName: helpRequests.lastName,
        email: helpRequests.email,
        phone: helpRequests.phone,
        subject: helpRequests.subject,
        category: helpRequests.category,
        message: helpRequests.message,
        source: helpRequests.source,
        resolved: helpRequests.resolved,
        createdAt: helpRequests.createdAt,
        resolvedAt: helpRequests.resolvedAt,
        firstResponseAt: helpRequests.firstResponseAt,
      })
      .from(helpRequests)
      .leftJoin(tenants, eq(helpRequests.tenantId, tenants.id));

    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    query.orderBy(desc(helpRequests.createdAt));

    const rows = await query;

    // Transform data for CSV
    const csvData = rows.map(row => ({
      'Request ID': row.id,
      'Tenant': row.tenant || 'N/A',
      'Status': row.status,
      'Priority': row.priority,
      'First Name': row.firstName,
      'Last Name': row.lastName,
      'Email': row.email,
      'Phone': row.phone || 'N/A',
      'Subject': row.subject,
      'Category': row.category,
      'Message': row.message,
      'Source': row.source,
      'Resolved': row.resolved ? 'Yes' : 'No',
      'Created Date': row.createdAt ? new Date(row.createdAt).toISOString() : '',
      'Resolved Date': row.resolvedAt ? new Date(row.resolvedAt).toISOString() : '',
      'First Response': row.firstResponseAt ? new Date(row.firstResponseAt).toISOString() : '',
      'Response Time (min)': row.firstResponseAt ? 
        Math.floor((new Date(row.firstResponseAt).getTime() - new Date(row.createdAt).getTime()) / (1000 * 60)) : '',
      'Resolution Time (min)': row.resolvedAt ? 
        Math.floor((new Date(row.resolvedAt).getTime() - new Date(row.createdAt).getTime()) / (1000 * 60)) : '',
    }));

    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="help_requests_${new Date().toISOString()}.csv"`);

    // Convert to CSV format
    const csvString = format({ headers: true });
    csvString.pipe(res);

    csvData.forEach(row => {
      csvString.write(row);
    });

    csvString.end();

    console.log(`Super Admin: exported ${csvData.length} help requests to CSV by ${(req as any).user?.id || 'unknown'}`);
  } catch (error) {
    console.error('Error exporting help requests to CSV:', error);
    res.status(500).json({ error: 'Failed to export help requests' });
  }
}