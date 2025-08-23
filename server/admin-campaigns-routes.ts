import { Router, Request, Response } from 'express';
import { db } from './db';
import { communicationCampaigns, communicationLogs, users, players } from '@shared/schema';
import { eq, and, or, inArray, isNull, gte, lte } from 'drizzle-orm';
import type { User } from '@shared/schema';

interface AuthRequest extends Request {
  user?: User & { tenantId: string };
}

const router = Router();

// Note: Authentication is handled by the parent app mounting these routes

// Get all campaigns
router.get('/campaigns', async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const campaigns = await db
      .select()
      .from(communicationCampaigns)
      .where(eq(communicationCampaigns.tenantId, tenantId))
      .orderBy(communicationCampaigns.createdAt);

    res.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// Get single campaign
router.get('/campaigns/:id', async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const campaign = await db
      .select()
      .from(communicationCampaigns)
      .where(
        and(
          eq(communicationCampaigns.id, id),
          eq(communicationCampaigns.tenantId, tenantId)
        )
      )
      .limit(1);

    if (campaign.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json(campaign[0]);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

// Create campaign
router.post('/campaigns', async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;

    if (!tenantId || !userId) {
      return res.status(400).json({ error: 'Tenant ID and User ID are required' });
    }

    const {
      name,
      type,
      subject,
      content,
      recipientType,
      recipientFilters,
      schedule,
      scheduledFor,
      recurringPattern,
      recurringDays,
      recurringTime,
      recurringEndDate
    } = req.body;

    // Validate required fields
    if (!name || !type || !content || !recipientType || !schedule) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // For emails, subject is required
    if (type === 'email' && !subject) {
      return res.status(400).json({ error: 'Subject is required for email campaigns' });
    }

    // Calculate nextRunAt based on schedule
    let nextRunAt = null;
    let status = 'draft';
    
    if (schedule === 'immediate') {
      nextRunAt = new Date();
      status = 'scheduled';
    } else if (schedule === 'scheduled' && scheduledFor) {
      nextRunAt = new Date(scheduledFor);
      status = 'scheduled';
    } else if (schedule === 'recurring') {
      // For recurring, calculate the first run time
      // This is simplified - you'd want more complex logic here
      nextRunAt = new Date();
      status = 'scheduled';
    }

    const newCampaign = await db
      .insert(communicationCampaigns)
      .values({
        tenantId,
        name,
        type,
        subject,
        content,
        recipientType,
        recipientFilters,
        schedule,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        recurringPattern,
        recurringDays,
        recurringTime,
        recurringEndDate: recurringEndDate ? new Date(recurringEndDate) : null,
        status,
        nextRunAt,
        createdBy: userId
      })
      .returning();

    res.json(newCampaign[0]);
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// Update campaign
router.patch('/campaigns/:id', async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    // First check if campaign exists and belongs to tenant
    const existingCampaign = await db
      .select()
      .from(communicationCampaigns)
      .where(
        and(
          eq(communicationCampaigns.id, id),
          eq(communicationCampaigns.tenantId, tenantId)
        )
      )
      .limit(1);

    if (existingCampaign.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Don't allow updating sent campaigns
    if (existingCampaign[0].status === 'sent' || existingCampaign[0].status === 'sending') {
      return res.status(400).json({ error: 'Cannot update a campaign that has been sent' });
    }

    const updatedCampaign = await db
      .update(communicationCampaigns)
      .set({
        ...req.body,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(communicationCampaigns.id, id),
          eq(communicationCampaigns.tenantId, tenantId)
        )
      )
      .returning();

    res.json(updatedCampaign[0]);
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ error: 'Failed to update campaign' });
  }
});

// Delete campaign
router.delete('/campaigns/:id', async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    // First check if campaign exists and can be deleted
    const existingCampaign = await db
      .select()
      .from(communicationCampaigns)
      .where(
        and(
          eq(communicationCampaigns.id, id),
          eq(communicationCampaigns.tenantId, tenantId)
        )
      )
      .limit(1);

    if (existingCampaign.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Only allow deleting draft or cancelled campaigns
    if (!['draft', 'cancelled'].includes(existingCampaign[0].status)) {
      return res.status(400).json({ error: 'Can only delete draft or cancelled campaigns' });
    }

    await db
      .delete(communicationCampaigns)
      .where(
        and(
          eq(communicationCampaigns.id, id),
          eq(communicationCampaigns.tenantId, tenantId)
        )
      );

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

// Send campaign
router.post('/campaigns/:id/send', async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    // Get the campaign
    const campaign = await db
      .select()
      .from(communicationCampaigns)
      .where(
        and(
          eq(communicationCampaigns.id, id),
          eq(communicationCampaigns.tenantId, tenantId)
        )
      )
      .limit(1);

    if (campaign.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const campaignData = campaign[0];

    // Don't send if already sent or sending
    if (campaignData.status === 'sent' || campaignData.status === 'sending') {
      return res.status(400).json({ error: 'Campaign has already been sent' });
    }

    // Get recipients based on campaign settings
    let recipients: any[] = [];
    
    if (campaignData.recipientType === 'all_parents') {
      // Get all parents in the tenant
      recipients = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.tenantId, tenantId),
            eq(users.role, 'parent')
          )
        );
    } else if (campaignData.recipientType === 'all_players') {
      // Get all players with portal access
      recipients = await db
        .select()
        .from(players)
        .where(
          and(
            eq(players.tenantId, tenantId),
            eq(players.canAccessPortal, true)
          )
        );
    }
    // Add more recipient logic based on filters...

    // Update campaign status
    await db
      .update(communicationCampaigns)
      .set({
        status: 'sending',
        lastSentAt: new Date()
      })
      .where(eq(communicationCampaigns.id, id));

    // In a real implementation, you would:
    // 1. Queue the messages for sending
    // 2. Integrate with SendGrid for emails
    // 3. Integrate with Twilio for SMS
    // 4. Log each send attempt in communicationLogs
    // 5. Update campaign with final counts

    // For now, just simulate success
    setTimeout(async () => {
      await db
        .update(communicationCampaigns)
        .set({
          status: 'sent',
          sentCount: recipients.length,
          failedCount: 0
        })
        .where(eq(communicationCampaigns.id, id));
    }, 2000);

    res.json({ 
      success: true, 
      message: `Campaign queued for sending to ${recipients.length} recipients` 
    });
  } catch (error) {
    console.error('Error sending campaign:', error);
    res.status(500).json({ error: 'Failed to send campaign' });
  }
});

// Get campaign logs
router.get('/campaigns/:id/logs', async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    // Verify campaign belongs to tenant
    const campaign = await db
      .select()
      .from(communicationCampaigns)
      .where(
        and(
          eq(communicationCampaigns.id, id),
          eq(communicationCampaigns.tenantId, tenantId)
        )
      )
      .limit(1);

    if (campaign.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Get logs for this campaign
    const logs = await db
      .select()
      .from(communicationLogs)
      .where(eq(communicationLogs.campaignId, id))
      .orderBy(communicationLogs.sentAt);

    res.json(logs);
  } catch (error) {
    console.error('Error fetching campaign logs:', error);
    res.status(500).json({ error: 'Failed to fetch campaign logs' });
  }
});

export default router;