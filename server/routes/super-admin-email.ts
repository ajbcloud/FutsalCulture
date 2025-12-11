import { Router } from "express";
import { z } from "zod";
import { sendEmail } from "../emailService";
import { db } from "../db";
import { users, tenants } from "../../shared/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

// Email templates for different scenarios
const emailTemplates = {
  welcome: {
    subject: "Welcome to PlayHQ",
    getHtml: (data: any) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Welcome to PlayHQ!</h1>
        <p>Hi ${data.name},</p>
        <p>Welcome to PlayHQ, the comprehensive sports club management platform.</p>
        <p>We're excited to have you on board!</p>
        <p>Best regards,<br>The PlayHQ Team</p>
      </div>
    `,
    getText: (data: any) => `Welcome to PlayHQ!\n\nHi ${data.name},\n\nWelcome to PlayHQ, the comprehensive sports club management platform.\n\nWe're excited to have you on board!\n\nBest regards,\nThe PlayHQ Team`
  },
  announcement: {
    subject: "Important Update from PlayHQ",
    getHtml: (data: any) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">PlayHQ Announcement</h1>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          ${data.message}
        </div>
        <p>Thank you for using PlayHQ!</p>
        <p>The PlayHQ Team</p>
      </div>
    `,
    getText: (data: any) => `PlayHQ Announcement\n\n${data.message}\n\nThank you for using PlayHQ!\nThe PlayHQ Team`
  },
  maintenance: {
    subject: "Scheduled Maintenance - PlayHQ",
    getHtml: (data: any) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #f59e0b;">Scheduled Maintenance Notice</h1>
        <p>Dear PlayHQ Users,</p>
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p><strong>Maintenance Window:</strong> ${data.maintenanceWindow}</p>
          <p><strong>Expected Duration:</strong> ${data.duration}</p>
          <p><strong>Services Affected:</strong> ${data.servicesAffected}</p>
        </div>
        <p>During this time, you may experience brief interruptions in service. We apologize for any inconvenience and appreciate your patience.</p>
        <p>For updates, visit our status page: <a href="https://playhq.app/status">https://playhq.app/status</a></p>
        <p>Thank you,<br>The PlayHQ Team</p>
      </div>
    `,
    getText: (data: any) => `Scheduled Maintenance Notice\n\nDear PlayHQ Users,\n\nMaintenance Window: ${data.maintenanceWindow}\nExpected Duration: ${data.duration}\nServices Affected: ${data.servicesAffected}\n\nDuring this time, you may experience brief interruptions in service. We apologize for any inconvenience and appreciate your patience.\n\nFor updates, visit: https://playhq.app/status\n\nThank you,\nThe PlayHQ Team`
  },
  security: {
    subject: "Important Security Update - PlayHQ",
    getHtml: (data: any) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #dc2626;">Security Update Required</h1>
        <p>Dear PlayHQ User,</p>
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          ${data.message}
        </div>
        <p>Please take action as soon as possible to ensure your account remains secure.</p>
        <p>If you have any questions, contact our support team immediately at <a href="mailto:support@playhq.app">support@playhq.app</a></p>
        <p>Best regards,<br>The PlayHQ Security Team</p>
      </div>
    `,
    getText: (data: any) => `Security Update Required\n\nDear PlayHQ User,\n\n${data.message}\n\nPlease take action as soon as possible to ensure your account remains secure.\n\nIf you have any questions, contact our support team immediately at support@playhq.app\n\nBest regards,\nThe PlayHQ Security Team`
  }
};

// Send email to specific users
const sendEmailSchema = z.object({
  recipients: z.array(z.string().email()),
  template: z.enum(['welcome', 'announcement', 'maintenance', 'security']),
  data: z.record(z.any()).optional(),
  customSubject: z.string().optional(),
  customMessage: z.string().optional()
});

router.post("/send-email", async (req: any, res) => {
  try {
    const { recipients, template, data = {}, customSubject, customMessage } = sendEmailSchema.parse(req.body);
    
    const emailTemplate = emailTemplates[template];
    const subject = customSubject || emailTemplate.subject;
    
    const results = [];
    
    for (const email of recipients) {
      const emailData = { ...data, customMessage };
      const result = await sendEmail({
        to: email,
        from: 'playhq@playhq.app',
        subject: subject,
        html: emailTemplate.getHtml(emailData),
        text: emailTemplate.getText(emailData)
      });
      
      results.push({ email, ...result });
    }
    
    res.json({ 
      success: true, 
      message: `Email sent to ${recipients.length} recipients`,
      results 
    });
    
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
});

// Send email to all users in a tenant
router.post("/send-tenant-email", async (req: any, res) => {
  try {
    const schema = z.object({
      tenantId: z.string(),
      template: z.enum(['welcome', 'announcement', 'maintenance', 'security']),
      data: z.record(z.any()).optional(),
      customSubject: z.string().optional(),
      userRole: z.enum(['all', 'admin', 'parent', 'player']).optional()
    });
    
    const { tenantId, template, data = {}, customSubject, userRole = 'all' } = schema.parse(req.body);
    
    // Get all users for the tenant
    let query = db.select().from(users).where(eq(users.tenantId, tenantId));
    
    if (userRole === 'admin') {
      query = db.select().from(users).where(and(eq(users.tenantId, tenantId), eq(users.isAdmin, true)));
    } else if (userRole === 'parent') {
      query = db.select().from(users).where(and(eq(users.tenantId, tenantId), eq(users.role, 'parent')));
    } else if (userRole === 'player') {
      query = db.select().from(users).where(and(eq(users.tenantId, tenantId), eq(users.role, 'player')));
    }
    
    const tenantUsers = await query;
    
    if (tenantUsers.length === 0) {
      return res.status(404).json({ error: "No users found for this tenant" });
    }
    
    const emailTemplate = emailTemplates[template];
    const subject = customSubject || emailTemplate.subject;
    
    const results = [];
    
    for (const user of tenantUsers) {
      if (user.email) {
        const emailData = { 
          name: `${user.firstName} ${user.lastName}`,
          ...data 
        };
        
        const result = await sendEmail({
          to: user.email,
          from: 'playhq@playhq.app',
          subject: subject,
          html: emailTemplate.getHtml(emailData),
          text: emailTemplate.getText(emailData)
        });
        
        results.push({ email: user.email, ...result });
      }
    }
    
    res.json({ 
      success: true, 
      message: `Email sent to ${results.length} users in tenant`,
      results 
    });
    
  } catch (error) {
    console.error("Error sending tenant email:", error);
    res.status(500).json({ error: "Failed to send tenant email" });
  }
});

// Send platform-wide announcement
router.post("/send-platform-email", async (req: any, res) => {
  try {
    const schema = z.object({
      template: z.enum(['announcement', 'maintenance', 'security']),
      data: z.record(z.any()).optional(),
      customSubject: z.string().optional(),
      userRole: z.enum(['all', 'admin', 'parent']).optional()
    });
    
    const { template, data = {}, customSubject, userRole = 'all' } = schema.parse(req.body);
    
    // Get all users across all tenants
    let query = db.select().from(users);
    
    if (userRole === 'admin') {
      query = db.select().from(users).where(eq(users.isAdmin, true));
    } else if (userRole === 'parent') {
      query = db.select().from(users).where(eq(users.role, 'parent'));
    }
    
    const allUsers = await query;
    
    if (allUsers.length === 0) {
      return res.status(404).json({ error: "No users found" });
    }
    
    const emailTemplate = emailTemplates[template];
    const subject = customSubject || emailTemplate.subject;
    
    const results = [];
    
    for (const user of allUsers) {
      if (user.email) {
        const emailData = { 
          name: `${user.firstName} ${user.lastName}`,
          ...data 
        };
        
        const result = await sendEmail({
          to: user.email,
          from: 'playhq@playhq.app',
          subject: subject,
          html: emailTemplate.getHtml(emailData),
          text: emailTemplate.getText(emailData)
        });
        
        results.push({ email: user.email, ...result });
      }
    }
    
    res.json({ 
      success: true, 
      message: `Platform-wide email sent to ${results.length} users`,
      results 
    });
    
  } catch (error) {
    console.error("Error sending platform email:", error);
    res.status(500).json({ error: "Failed to send platform email" });
  }
});

// Get email templates
router.get("/templates", (req: any, res) => {
  const templates = Object.keys(emailTemplates).map(key => ({
    id: key,
    name: key.charAt(0).toUpperCase() + key.slice(1),
    subject: (emailTemplates as any)[key].subject
  }));
  
  res.json({ templates });
});

export { router as superAdminEmailRouter };