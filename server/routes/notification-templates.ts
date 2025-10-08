
import { Router, Request, Response } from 'express';
import { db } from '../db';
import { eq, and, desc } from 'drizzle-orm';
import type { User } from '@shared/schema';

interface AuthRequest extends Request {
  user?: User & { tenantId: string };
}

const router = Router();

// Note: Authentication is handled by the parent app mounting these routes

// Get all templates for tenant
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const templates = await db.query.notificationTemplates.findMany({
      where: (templates, { eq }) => eq(templates.tenantId, tenantId),
      orderBy: (templates, { desc }) => [desc(templates.createdAt)]
    });

    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Get single template
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const template = await db.query.notificationTemplates.findFirst({
      where: (templates, { eq, and }) => and(
        eq(templates.id, id),
        eq(templates.tenantId, tenantId)
      )
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// Create template
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;

    if (!tenantId || !userId) {
      return res.status(400).json({ error: 'Tenant ID and User ID are required' });
    }

    const { name, type, method, subject, template, active = true } = req.body;

    // Validate required fields
    if (!name || !type || !template) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // For emails, subject is recommended but not required
    if (type === 'email' && !subject) {
      console.warn('Email template created without subject');
    }

    // Basic template validation
    const openBraces = (template.match(/\{\{/g) || []).length;
    const closeBraces = (template.match(/\}\}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      return res.status(400).json({ 
        error: 'Template validation failed: Mismatched template braces' 
      });
    }

    const newTemplate = await db.insert(notificationTemplates).values({
      tenantId,
      name,
      type,
      method: method || 'manual',
      subject: type === 'email' ? subject : null,
      template,
      active
    }).returning();

    console.log(`✅ Template created: ${name} (${type}) for tenant ${tenantId}`);
    res.status(201).json(newTemplate[0]);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// Update template
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const updates = { ...req.body, updatedAt: new Date() };

    // Validate template if being updated
    if (updates.template) {
      const openBraces = (updates.template.match(/\{\{/g) || []).length;
      const closeBraces = (updates.template.match(/\}\}/g) || []).length;
      
      if (openBraces !== closeBraces) {
        return res.status(400).json({ 
          error: 'Template validation failed: Mismatched template braces' 
        });
      }
    }

    const updatedTemplate = await db
      .update(notificationTemplates)
      .set(updates)
      .where(and(
        eq(notificationTemplates.id, id),
        eq(notificationTemplates.tenantId, tenantId)
      ))
      .returning();

    if (updatedTemplate.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    console.log(`✅ Template updated: ${updatedTemplate[0].name} for tenant ${tenantId}`);
    res.json(updatedTemplate[0]);
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// Delete template
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }

    const deletedTemplate = await db
      .delete(notificationTemplates)
      .where(and(
        eq(notificationTemplates.id, id),
        eq(notificationTemplates.tenantId, tenantId)
      ))
      .returning();

    if (deletedTemplate.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    console.log(`✅ Template deleted: ${deletedTemplate[0].name} for tenant ${tenantId}`);
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// Template preview endpoint
router.post('/preview', async (req: AuthRequest, res: Response) => {
  try {
    const { template, subject, type, variables } = req.body;
    
    // Use sample data if no variables provided
    const templateVariables = variables || {
      customerName: 'John Doe',
      firstName: 'John',
      playerName: 'Alex Smith',
      sessionDate: 'Monday, January 15, 2024',
      sessionTime: '2:00 PM',
      location: 'Main Training Center',
      sessionName: 'Elite Training',
      confirmationCode: 'ABC123',
      tenantName: 'Elite Sports Academy',
      businessPhone: '(555) 123-4567',
      inviteUrl: 'https://app.playhq.app/invite/abc123',
      expiresAt: 'January 20, 2024'
    };

    // Simple variable replacement
    let processedContent = template;
    let processedSubject = subject;

    Object.entries(templateVariables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processedContent = processedContent.replace(regex, value);
      if (processedSubject) {
        processedSubject = processedSubject.replace(regex, value);
      }
    });

    // Optimize for SMS if needed
    let smsOptimized = null;
    if (type === 'sms') {
      smsOptimized = processedContent.length > 160 
        ? processedContent.substring(0, 157) + '...' 
        : processedContent;
    }

    // Convert to HTML for email
    let htmlContent = null;
    if (type === 'email') {
      htmlContent = processedContent
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/^/, '<p>')
        .replace(/$/, '</p>');
    }

    res.json({
      subject: processedSubject,
      content: processedContent,
      htmlContent,
      smsOptimized,
      characterCount: processedContent.length,
      isValid: true
    });
  } catch (error) {
    console.error('Error previewing template:', error);
    res.status(500).json({ error: 'Failed to generate preview' });
  }
});

export default router;
