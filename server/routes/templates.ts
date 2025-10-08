import { Router } from "express";
import { storage } from "../storage";
import { insertNotificationTemplateSchema } from "@shared/schema";
import { z } from "zod";

const router = Router();

router.get('/templates', async (req: any, res) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await storage.getUser(userId);
    if (!user?.tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    const type = req.query.type as 'email' | 'sms' | undefined;
    const templates = await storage.getTemplates(user.tenantId, type);

    res.json({ templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ message: 'Failed to fetch templates' });
  }
});

router.post('/templates', async (req: any, res) => {
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

    const validatedData = insertNotificationTemplateSchema.parse({
      ...req.body,
      tenantId: user.tenantId,
    });

    const template = await storage.createTemplate(validatedData);

    res.status(201).json({ template });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Error creating template:', error);
    res.status(500).json({ message: 'Failed to create template' });
  }
});

router.get('/templates/:id', async (req: any, res) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await storage.getUser(userId);
    if (!user?.tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    const template = await storage.getTemplateById(req.params.id, user.tenantId);

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    res.json({ template });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ message: 'Failed to fetch template' });
  }
});

router.patch('/templates/:id', async (req: any, res) => {
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

    const template = await storage.updateTemplate(req.params.id, user.tenantId, req.body);

    res.json({ template });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ message: 'Failed to update template' });
  }
});

router.delete('/templates/:id', async (req: any, res) => {
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

    await storage.deleteTemplate(req.params.id, user.tenantId);

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ message: 'Failed to delete template' });
  }
});

export default router;
