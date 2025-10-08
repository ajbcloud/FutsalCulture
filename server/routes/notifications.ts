import { Router } from "express";
import { storage } from "../storage";
import { insertNotificationSchema } from "@shared/schema";
import { z } from "zod";

const router = Router();

router.post('/notifications/send', async (req: any, res) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await storage.getUser(userId);
    if (!user?.tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    const validatedData = insertNotificationSchema.parse({
      ...req.body,
      tenantId: user.tenantId,
      status: 'pending',
    });

    const notification = await storage.createNotification(validatedData);

    res.status(201).json({ notification });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Error sending notification:', error);
    res.status(500).json({ message: 'Failed to send notification' });
  }
});

router.post('/notifications/send-bulk', async (req: any, res) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await storage.getUser(userId);
    if (!user?.tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    if (!user.isAdmin && !user.isSuperAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { recipients, type, subject, message } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ message: 'Recipients array required' });
    }

    const notifications = await Promise.all(
      recipients.map(async (recipient: string) => {
        const validatedData = insertNotificationSchema.parse({
          tenantId: user.tenantId,
          type,
          recipient,
          subject,
          message,
          status: 'pending',
        });

        return await storage.createNotification(validatedData);
      })
    );

    res.status(201).json({ 
      message: 'Bulk notifications created successfully',
      count: notifications.length,
      notifications 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Error sending bulk notifications:', error);
    res.status(500).json({ message: 'Failed to send bulk notifications' });
  }
});

router.get('/notifications/history', async (req: any, res) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await storage.getUser(userId);
    if (!user?.tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    const filters = {
      status: req.query.status as string | undefined,
      type: req.query.type as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
    };

    const notifications = await storage.getNotifications(user.tenantId, filters);

    res.json({ notifications });
  } catch (error) {
    console.error('Error fetching notification history:', error);
    res.status(500).json({ message: 'Failed to fetch notification history' });
  }
});

router.get('/notifications/logs', async (req: any, res) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await storage.getUser(userId);
    if (!user?.tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    if (!user.isAdmin && !user.isSuperAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const filters = {
      direction: req.query.direction as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
    };

    const logs = await storage.getMessageLogs(user.tenantId, filters);

    res.json({ logs });
  } catch (error) {
    console.error('Error fetching message logs:', error);
    res.status(500).json({ message: 'Failed to fetch message logs' });
  }
});

export default router;
