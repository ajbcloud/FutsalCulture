import { Request, Response } from "express";
import { db } from "../../db";
import { 
  notificationTemplates, 
  notifications, 
  messageLogs, 
  contactGroups, 
  contactGroupMembers,
  communicationCampaigns,
  communicationLogs,
  tenants,
  users,
  tenantPlanAssignments
} from "../../../shared/schema";
import { eq, and, or, sql, desc, asc, inArray, ilike, gte, lte } from "drizzle-orm";
import { sendEmail, sendBulkEmail, sendCampaignEmail } from "../../emailService";
import { sendSMS, sendBulkSMS } from "../../smsService";
import { replaceTemplateVariables } from "../../utils/template-variables";
import { trackEmailEvent, trackSMSEvent } from "../../utils/communication-analytics";
import { nanoid } from "nanoid";

// Template Management
export async function getPlatformTemplates(req: Request, res: Response) {
  try {
    const { category, type } = req.query;
    
    let query = db
      .select()
      .from(notificationTemplates)
      .where(sql`${notificationTemplates.tenantId} IS NULL`)
      .orderBy(desc(notificationTemplates.createdAt));

    const templates = await query;

    // Filter by category and type if provided
    let filteredTemplates = templates;
    if (category) {
      filteredTemplates = filteredTemplates.filter(t => 
        t.method?.toLowerCase().includes(category.toString().toLowerCase())
      );
    }
    if (type) {
      filteredTemplates = filteredTemplates.filter(t => t.type === type);
    }

    res.json({
      templates: filteredTemplates,
      count: filteredTemplates.length
    });
  } catch (error) {
    console.error('Error fetching platform templates:', error);
    res.status(500).json({ message: 'Failed to fetch templates' });
  }
}

export async function createPlatformTemplate(req: Request, res: Response) {
  try {
    const { name, type, method, subject, template: content, category } = req.body;

    const templateId = nanoid();
    await db.insert(notificationTemplates).values({
      id: templateId,
      tenantId: null, // Platform template
      name,
      type,
      method: category || method,
      subject,
      template: content,
      active: true,
    });

    const newTemplate = await db
      .select()
      .from(notificationTemplates)
      .where(eq(notificationTemplates.id, templateId))
      .limit(1);

    res.status(201).json({ 
      template: newTemplate[0],
      message: 'Platform template created successfully' 
    });
  } catch (error) {
    console.error('Error creating platform template:', error);
    res.status(500).json({ message: 'Failed to create template' });
  }
}

export async function updatePlatformTemplate(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, type, method, subject, template: content, active, category } = req.body;

    await db
      .update(notificationTemplates)
      .set({
        name,
        type,
        method: category || method,
        subject,
        template: content,
        active
      })
      .where(and(
        eq(notificationTemplates.id, id),
        sql`${notificationTemplates.tenantId} IS NULL`
      ));

    const updatedTemplate = await db
      .select()
      .from(notificationTemplates)
      .where(eq(notificationTemplates.id, id))
      .limit(1);

    res.json({ 
      template: updatedTemplate[0],
      message: 'Template updated successfully' 
    });
  } catch (error) {
    console.error('Error updating platform template:', error);
    res.status(500).json({ message: 'Failed to update template' });
  }
}

export async function deletePlatformTemplate(req: Request, res: Response) {
  try {
    const { id } = req.params;

    await db
      .delete(notificationTemplates)
      .where(and(
        eq(notificationTemplates.id, id),
        sql`${notificationTemplates.tenantId} IS NULL`
      ));

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting platform template:', error);
    res.status(500).json({ message: 'Failed to delete template' });
  }
}

export async function cloneTemplateToTenants(req: Request, res: Response) {
  try {
    const { templateId, tenantIds } = req.body;

    // Get the platform template
    const [template] = await db
      .select()
      .from(notificationTemplates)
      .where(and(
        eq(notificationTemplates.id, templateId),
        sql`${notificationTemplates.tenantId} IS NULL`
      ))
      .limit(1);

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Clone to each tenant
    const clonedTemplates = await Promise.all(
      tenantIds.map(async (tenantId: string) => {
        const clonedId = nanoid();
        await db.insert(notificationTemplates).values({
          id: clonedId,
          tenantId,
          name: template.name,
          type: template.type,
          method: template.method,
          subject: template.subject,
          template: template.template,
          active: true,
        });
        return { tenantId, templateId: clonedId };
      })
    );

    res.json({ 
      cloned: clonedTemplates,
      message: `Template cloned to ${tenantIds.length} tenants successfully` 
    });
  } catch (error) {
    console.error('Error cloning template:', error);
    res.status(500).json({ message: 'Failed to clone template' });
  }
}

// Message Sending
export async function sendPlatformMessage(req: Request, res: Response) {
  try {
    const { 
      recipientType, 
      recipientFilter,
      type, 
      subject, 
      message, 
      templateId,
      schedule,
      testMode = false 
    } = req.body;

    // Get recipients based on type and filters
    const recipients = await getRecipients(recipientType, recipientFilter);

    if (recipients.length === 0) {
      return res.status(400).json({ message: 'No recipients found' });
    }

    // If test mode, only send to first 3 recipients
    const finalRecipients = testMode ? recipients.slice(0, 3) : recipients;

    // If scheduled, create a campaign
    if (schedule && schedule !== 'immediate') {
      const [newCampaign] = await db.insert(communicationCampaigns).values({
        tenantId: null, // Platform campaign
        name: subject || 'Platform Announcement',
        type,
        subject,
        content: message,
        recipientType,
        recipientFilters: recipientFilter,
        schedule,
        scheduledFor: schedule === 'scheduled' ? req.body.scheduledFor : null,
        recurringPattern: req.body.recurringPattern,
        recurringDays: req.body.recurringDays,
        recurringTime: req.body.recurringTime,
        recurringEndDate: req.body.recurringEndDate,
        status: 'scheduled',
        createdBy: (req as any).user?.id || null,
      }).returning();

      return res.json({ 
        message: 'Campaign scheduled successfully',
        campaignId: newCampaign.id,
        recipientCount: finalRecipients.length
      });
    }

    // Send immediately
    const results = await sendMessages(finalRecipients, type, subject, message, templateId);

    res.json({
      sent: results.sent,
      failed: results.failed,
      total: finalRecipients.length,
      testMode,
      message: `Messages sent to ${results.sent} recipients`
    });
  } catch (error) {
    console.error('Error sending platform message:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
}

// Get message history
export async function getMessageHistory(req: Request, res: Response) {
  try {
    const { 
      startDate, 
      endDate, 
      type, 
      status,
      campaignId,
      limit = 100,
      offset = 0
    } = req.query;

    // Build conditions for the query
    const conditions: any[] = [sql`${communicationCampaigns.tenantId} IS NULL`];
    if (type) conditions.push(eq(communicationCampaigns.type, type as string));
    if (status) conditions.push(eq(communicationCampaigns.status, status as string));
    if (campaignId) conditions.push(eq(communicationCampaigns.id, campaignId as string));
    if (startDate) conditions.push(gte(communicationCampaigns.createdAt, new Date(startDate as string)));
    if (endDate) conditions.push(lte(communicationCampaigns.createdAt, new Date(endDate as string)));

    const results = await db
      .select({
        campaign: communicationCampaigns,
        logs: communicationLogs
      })
      .from(communicationCampaigns)
      .leftJoin(communicationLogs, eq(communicationCampaigns.id, communicationLogs.campaignId))
      .where(and(...conditions))
      .orderBy(desc(communicationCampaigns.createdAt))
      .limit(Number(limit))
      .offset(Number(offset));

    // Group logs by campaign
    const campaignsMap = new Map();
    results.forEach(row => {
      if (!campaignsMap.has(row.campaign.id)) {
        campaignsMap.set(row.campaign.id, {
          ...row.campaign,
          logs: [] as any[]
        });
      }
      if (row.logs) {
        campaignsMap.get(row.campaign.id).logs.push(row.logs);
      }
    });

    const campaigns = Array.from(campaignsMap.values());

    // Calculate metrics for each campaign
    const campaignsWithMetrics = campaigns.map(campaign => {
      const logs = campaign.logs || [] as any[];
      const sent = logs.filter((l: any) => l.status === 'sent').length;
      const delivered = logs.filter((l: any) => l.status === 'delivered').length;
      const opened = logs.filter((l: any) => l.openedAt).length;
      const clicked = logs.filter((l: any) => l.clickedAt).length;
      const failed = logs.filter((l: any) => l.status === 'failed').length;

      return {
        ...campaign,
        metrics: {
          sent,
          delivered,
          deliveryRate: sent > 0 ? (delivered / sent * 100).toFixed(1) : 0,
          opened,
          openRate: delivered > 0 ? (opened / delivered * 100).toFixed(1) : 0,
          clicked,
          clickRate: opened > 0 ? (clicked / opened * 100).toFixed(1) : 0,
          failed,
          failureRate: sent > 0 ? (failed / sent * 100).toFixed(1) : 0
        }
      };
    });

    res.json({
      campaigns: campaignsWithMetrics,
      total: campaigns.length
    });
  } catch (error) {
    console.error('Error fetching message history:', error);
    res.status(500).json({ message: 'Failed to fetch message history' });
  }
}

// Get available recipients with filters
export async function getAvailableRecipients(req: Request, res: Response) {
  try {
    const { type, filter } = req.query;

    let recipients = [];

    if (type === 'all_admins') {
      // Get all tenant admins
      recipients = await db
        .select({
          id: users.id,
          email: users.email,
          name: sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
          tenantId: users.tenantId,
          tenantName: tenants.name,
        })
        .from(users)
        .leftJoin(tenants, eq(users.tenantId, tenants.id))
        .where(eq(users.isAdmin, true));
    } else if (type === 'by_plan') {
      // Get admins by plan
      const planFilter = filter as string;
      recipients = await db
        .select({
          id: users.id,
          email: users.email,
          name: sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
          tenantId: users.tenantId,
          tenantName: tenants.name,
          plan: tenantPlanAssignments.planCode,
        })
        .from(users)
        .leftJoin(tenants, eq(users.tenantId, tenants.id))
        .leftJoin(tenantPlanAssignments, eq(tenants.id, tenantPlanAssignments.tenantId))
        .where(and(
          eq(users.isAdmin, true),
          planFilter ? eq(tenantPlanAssignments.planCode, planFilter) : sql`1=1`
        ));
    } else if (type === 'trial_tenants') {
      // Get admins from trial tenants
      recipients = await db
        .select({
          id: users.id,
          email: users.email,
          name: sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
          tenantId: users.tenantId,
          tenantName: tenants.name,
        })
        .from(users)
        .leftJoin(tenants, eq(users.tenantId, tenants.id))
        .where(and(
          eq(users.isAdmin, true),
          eq(tenants.trialStatus, 'active')
        ));
    } else if (type === 'specific_tenants') {
      // Get admins from specific tenants
      const tenantIds = (filter as string)?.split(',') || [];
      if (tenantIds.length > 0) {
        recipients = await db
          .select({
            id: users.id,
            email: users.email,
            name: sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
            tenantId: users.tenantId,
            tenantName: tenants.name,
          })
          .from(users)
          .leftJoin(tenants, eq(users.tenantId, tenants.id))
          .where(and(
            eq(users.isAdmin, true),
            inArray(users.tenantId, tenantIds)
          ));
      }
    }

    res.json({
      recipients,
      count: recipients.length
    });
  } catch (error) {
    console.error('Error fetching recipients:', error);
    res.status(500).json({ message: 'Failed to fetch recipients' });
  }
}

// Schedule a message campaign
export async function scheduleMessage(req: Request, res: Response) {
  try {
    const { 
      name,
      recipientType,
      recipientFilter,
      type,
      subject,
      message,
      templateId,
      scheduledFor,
      recurringPattern,
      recurringDays,
      recurringTime,
      recurringEndDate
    } = req.body;

    const campaignId = nanoid();
    await db.insert(communicationCampaigns).values({
      id: campaignId,
      tenantId: null, // Platform campaign
      name,
      type,
      subject,
      content: message,
      recipientType,
      recipientFilters: recipientFilter,
      schedule: recurringPattern ? 'recurring' : 'scheduled',
      scheduledFor: new Date(scheduledFor),
      recurringPattern,
      recurringDays,
      recurringTime,
      recurringEndDate: recurringEndDate ? new Date(recurringEndDate) : null,
      status: 'scheduled',
      createdBy: req.user?.id || 'system',
    });

    res.status(201).json({
      campaignId,
      message: 'Message campaign scheduled successfully'
    });
  } catch (error) {
    console.error('Error scheduling message:', error);
    res.status(500).json({ message: 'Failed to schedule message' });
  }
}

// Cancel scheduled campaign
export async function cancelScheduledCampaign(req: Request, res: Response) {
  try {
    const { id } = req.params;

    await db
      .update(communicationCampaigns)
      .set({ status: 'cancelled' })
      .where(and(
        eq(communicationCampaigns.id, id),
        sql`${communicationCampaigns.tenantId} IS NULL`
      ));

    res.json({ message: 'Campaign cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling campaign:', error);
    res.status(500).json({ message: 'Failed to cancel campaign' });
  }
}

// Get campaign analytics
export async function getCampaignAnalytics(req: Request, res: Response) {
  try {
    const { campaignId } = req.params;

    const [campaign] = await db
      .select()
      .from(communicationCampaigns)
      .where(eq(communicationCampaigns.id, campaignId))
      .limit(1);

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const logs = await db
      .select()
      .from(communicationLogs)
      .where(eq(communicationLogs.campaignId, campaignId));

    // Calculate metrics
    const metrics = {
      total: logs.length,
      sent: logs.filter(l => l.status === 'sent').length,
      delivered: logs.filter(l => l.status === 'delivered').length,
      opened: logs.filter(l => l.openedAt).length,
      clicked: logs.filter(l => l.clickedAt).length,
      bounced: logs.filter(l => l.status === 'bounced').length,
      failed: logs.filter(l => l.status === 'failed').length,
    };

    // Calculate rates
    const rates = {
      deliveryRate: metrics.sent > 0 ? (metrics.delivered / metrics.sent * 100) : 0,
      openRate: metrics.delivered > 0 ? (metrics.opened / metrics.delivered * 100) : 0,
      clickRate: metrics.opened > 0 ? (metrics.clicked / metrics.opened * 100) : 0,
      bounceRate: metrics.sent > 0 ? (metrics.bounced / metrics.sent * 100) : 0,
      failureRate: metrics.total > 0 ? (metrics.failed / metrics.total * 100) : 0,
    };

    // Get delivery timeline
    const timeline = logs.reduce((acc, log) => {
      const date = log.sentAt ? new Date(log.sentAt).toISOString().split('T')[0] : 'unknown';
      if (!acc[date]) {
        acc[date] = { sent: 0, delivered: 0, opened: 0, clicked: 0 };
      }
      if (log.status === 'sent') acc[date].sent++;
      if (log.status === 'delivered') acc[date].delivered++;
      if (log.openedAt) acc[date].opened++;
      if (log.clickedAt) acc[date].clicked++;
      return acc;
    }, {} as Record<string, any>);

    res.json({
      campaign,
      metrics,
      rates,
      timeline,
      logs: logs.slice(0, 100) // Return first 100 logs
    });
  } catch (error) {
    console.error('Error fetching campaign analytics:', error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
}

// Helper Functions
async function getRecipients(type: string, filter: any) {
  let recipients = [];

  switch (type) {
    case 'all_admins':
      const admins = await db
        .select({
          id: users.id,
          email: users.email,
          phone: users.phone,
          firstName: users.firstName,
          lastName: users.lastName,
          tenantId: users.tenantId,
        })
        .from(users)
        .where(eq(users.isAdmin, true));
      recipients = admins;
      break;

    case 'by_plan':
      const planUsers = await db
        .select({
          id: users.id,
          email: users.email,
          phone: users.phone,
          firstName: users.firstName,
          lastName: users.lastName,
          tenantId: users.tenantId,
        })
        .from(users)
        .leftJoin(tenants, eq(users.tenantId, tenants.id))
        .leftJoin(tenantPlanAssignments, eq(tenants.id, tenantPlanAssignments.tenantId))
        .where(and(
          eq(users.isAdmin, true),
          inArray(tenantPlanAssignments.planCode, filter.plans || [])
        ));
      recipients = planUsers;
      break;

    case 'trial_tenants':
      const trialAdmins = await db
        .select({
          id: users.id,
          email: users.email,
          phone: users.phone,
          firstName: users.firstName,
          lastName: users.lastName,
          tenantId: users.tenantId,
        })
        .from(users)
        .leftJoin(tenants, eq(users.tenantId, tenants.id))
        .where(and(
          eq(users.isAdmin, true),
          eq(tenants.trialStatus, 'active')
        ));
      recipients = trialAdmins;
      break;

    case 'specific_tenants':
      const specificAdmins = await db
        .select({
          id: users.id,
          email: users.email,
          phone: users.phone,
          firstName: users.firstName,
          lastName: users.lastName,
          tenantId: users.tenantId,
        })
        .from(users)
        .where(and(
          eq(users.isAdmin, true),
          inArray(users.tenantId, filter.tenantIds || [])
        ));
      recipients = specificAdmins;
      break;

    case 'contact_group':
      const groupMembers = await db
        .select({
          id: users.id,
          email: users.email,
          phone: users.phone,
          firstName: users.firstName,
          lastName: users.lastName,
          tenantId: users.tenantId,
        })
        .from(contactGroupMembers)
        .leftJoin(users, eq(contactGroupMembers.userId, users.id))
        .where(eq(contactGroupMembers.groupId, filter.groupId));
      recipients = groupMembers.map(m => m);
      break;
  }

  return recipients;
}

async function sendMessages(recipients: any[], type: string, subject: string, message: string, templateId?: string) {
  let sent = 0;
  let failed = 0;

  // Create a campaign for tracking
  const campaignId = nanoid();
  await db.insert(communicationCampaigns).values({
    id: campaignId,
    tenantId: null,
    name: subject || 'Platform Message',
    type,
    subject,
    content: message,
    recipientType: 'custom',
    recipientFilters: { recipientIds: recipients.map(r => r.id) },
    schedule: 'immediate',
    status: 'sending',
    createdBy: 'system',
  });

  if (type === 'email' || type === 'both') {
    const emailRecipients = recipients.filter(r => r.email).map(r => ({
      email: r.email,
      subject: replaceTemplateVariables(subject, {
        userName: `${r.firstName} ${r.lastName}`,
        recipientName: `${r.firstName} ${r.lastName}`,
      }),
      html: replaceTemplateVariables(message, {
        userName: `${r.firstName} ${r.lastName}`,
        recipientName: `${r.firstName} ${r.lastName}`,
      }),
      tenantId: r.tenantId,
      campaignId,
    }));

    const emailResult = await sendBulkEmail(emailRecipients);
    sent += emailResult.sent;
    failed += emailResult.failed;

    // Log results
    for (const result of emailResult.results) {
      await db.insert(communicationLogs).values({
        campaignId,
        recipientId: recipients.find(r => r.email === result.email)?.id || '',
        recipientEmail: result.email,
        status: result.success ? 'sent' : 'failed',
        error: result.error,
      });
    }
  }

  if (type === 'sms' || type === 'both') {
    const smsRecipients = recipients.filter(r => r.phone).map(r => ({
      phone: r.phone,
      body: replaceTemplateVariables(message, {
        userName: `${r.firstName} ${r.lastName}`,
        recipientName: `${r.firstName} ${r.lastName}`,
      }),
      tenantId: r.tenantId,
      campaignId,
    }));

    const smsResult = await sendBulkSMS(smsRecipients);
    sent += smsResult.sent;
    failed += smsResult.failed;

    // Log results
    for (const result of smsResult.results) {
      await db.insert(communicationLogs).values({
        campaignId,
        recipientId: recipients.find(r => r.phone === result.phone)?.id || '',
        recipientPhone: result.phone,
        status: result.success ? 'sent' : 'failed',
        error: result.error,
      });
    }
  }

  // Update campaign status
  await db
    .update(communicationCampaigns)
    .set({
      status: 'sent',
      sentCount: sent,
      failedCount: failed,
      lastSentAt: new Date(),
    })
    .where(eq(communicationCampaigns.id, campaignId));

  return { sent, failed };
}

// Export analytics data
export async function exportAnalytics(req: Request, res: Response) {
  try {
    const { startDate, endDate, format = 'csv' } = req.query;

    const campaigns = await db
      .select()
      .from(communicationCampaigns)
      .where(and(
        sql`${communicationCampaigns.tenantId} IS NULL`,
        startDate ? gte(communicationCampaigns.createdAt, new Date(startDate as string)) : sql`1=1`,
        endDate ? lte(communicationCampaigns.createdAt, new Date(endDate as string)) : sql`1=1`
      ))
      .orderBy(desc(communicationCampaigns.createdAt));

    // Format data for export
    const exportData = campaigns.map(campaign => ({
      id: campaign.id,
      name: campaign.name,
      type: campaign.type,
      status: campaign.status,
      sentCount: campaign.sentCount,
      failedCount: campaign.failedCount,
      createdAt: campaign.createdAt,
      lastSentAt: campaign.lastSentAt,
    }));

    if (format === 'csv') {
      const csv = [
        'ID,Name,Type,Status,Sent,Failed,Created,Last Sent',
        ...exportData.map(row => 
          `${row.id},${row.name},${row.type},${row.status},${row.sentCount},${row.failedCount},${row.createdAt},${row.lastSentAt || ''}`
        )
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="communications-export.csv"');
      res.send(csv);
    } else {
      res.json(exportData);
    }
  } catch (error) {
    console.error('Error exporting analytics:', error);
    res.status(500).json({ message: 'Failed to export analytics' });
  }
}