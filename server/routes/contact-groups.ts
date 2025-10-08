import { Router } from "express";
import { storage } from "../storage";
import { insertContactGroupSchema, players, users } from "@shared/schema";
import { z } from "zod";
import { db } from "../db";
import { eq } from "drizzle-orm";

const router = Router();

router.get('/contact-groups', async (req: any, res) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await storage.getUser(userId);
    if (!user?.tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    const groups = await storage.getContactGroups(user.tenantId);
    res.json({ groups });
  } catch (error) {
    console.error('Error fetching contact groups:', error);
    res.status(500).json({ message: 'Failed to fetch contact groups' });
  }
});

router.post('/contact-groups', async (req: any, res) => {
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

    const validatedData = insertContactGroupSchema.parse({
      ...req.body,
      tenantId: user.tenantId,
      createdBy: userId,
    });

    const group = await storage.createContactGroup(validatedData);
    res.status(201).json({ group });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Error creating contact group:', error);
    res.status(500).json({ message: 'Failed to create contact group' });
  }
});

router.get('/contact-groups/:id', async (req: any, res) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await storage.getUser(userId);
    if (!user?.tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    const group = await storage.getContactGroupById(req.params.id, user.tenantId);
    if (!group) {
      return res.status(404).json({ message: 'Contact group not found' });
    }

    const members = await storage.getGroupMembers(req.params.id);
    res.json({ group, members });
  } catch (error) {
    console.error('Error fetching contact group:', error);
    res.status(500).json({ message: 'Failed to fetch contact group' });
  }
});

router.patch('/contact-groups/:id', async (req: any, res) => {
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

    const group = await storage.updateContactGroup(req.params.id, user.tenantId, req.body);
    res.json({ group });
  } catch (error) {
    console.error('Error updating contact group:', error);
    res.status(500).json({ message: 'Failed to update contact group' });
  }
});

router.delete('/contact-groups/:id', async (req: any, res) => {
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

    await storage.deleteContactGroup(req.params.id, user.tenantId);
    res.json({ message: 'Contact group deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact group:', error);
    res.status(500).json({ message: 'Failed to delete contact group' });
  }
});

router.post('/contact-groups/:id/members', async (req: any, res) => {
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

    const { userId: memberUserId } = req.body;
    if (!memberUserId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    const member = await storage.addGroupMember(req.params.id, memberUserId, userId);
    res.status(201).json({ member });
  } catch (error) {
    console.error('Error adding group member:', error);
    res.status(500).json({ message: 'Failed to add group member' });
  }
});

router.delete('/contact-groups/:id/members/:userId', async (req: any, res) => {
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

    await storage.removeGroupMember(req.params.id, req.params.userId);
    res.json({ message: 'Member removed from group successfully' });
  } catch (error) {
    console.error('Error removing group member:', error);
    res.status(500).json({ message: 'Failed to remove group member' });
  }
});

router.get('/contact-groups/:id/members', async (req: any, res) => {
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

    const group = await storage.getContactGroupById(req.params.id, user.tenantId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const members = await storage.getGroupMembers(req.params.id);
    res.json({ members });
  } catch (error) {
    console.error('Error fetching group members:', error);
    res.status(500).json({ error: 'Failed to fetch group members' });
  }
});

router.post('/contact-groups/:id/members/bulk', async (req: any, res) => {
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

    const { userIds } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'userIds array is required' });
    }

    const group = await storage.getContactGroupById(req.params.id, user.tenantId);
    if (!group) {
      return res.status(404).json({ message: 'Contact group not found' });
    }

    const addedMembers = [];
    const errors = [];

    for (const memberUserId of userIds) {
      try {
        const member = await storage.addGroupMember(req.params.id, memberUserId, userId);
        addedMembers.push(member);
      } catch (error: any) {
        errors.push({ userId: memberUserId, error: error.message });
      }
    }

    res.json({ 
      added: addedMembers.length,
      members: addedMembers,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error bulk adding group members:', error);
    res.status(500).json({ message: 'Failed to bulk add group members' });
  }
});

// GET /api/users - Get all parents/users for contact group selection
router.get('/users', async (req: any, res) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await storage.getUser(userId);
    if (!user?.tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    if (!user.isAdmin && !user.isSuperAdmin && !user.isAssistant) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Get all users (parents) for the tenant
    const allUsers = await storage.getUsersByTenant(user.tenantId);
    
    const users = allUsers.map(u => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      role: 'parent'
    }));

    res.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// GET /api/players - Get all players for contact group selection
router.get('/players', async (req: any, res) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await storage.getUser(userId);
    if (!user?.tenantId) {
      return res.status(400).json({ message: 'Tenant ID required' });
    }

    if (!user.isAdmin && !user.isSuperAdmin && !user.isAssistant) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Get all players for the tenant
    const allPlayers = await db
      .select()
      .from(players)
      .where(eq(players.tenantId, user.tenantId));
    
    // Filter for players 13+ and include age group and club info
    const currentYear = new Date().getFullYear();
    const eligiblePlayers = allPlayers
      .filter((p: any) => {
        const age = currentYear - (p.birthYear || 0);
        return age >= 13;
      })
      .map((p: any) => {
        const age = currentYear - (p.birthYear || 0);
        let ageGroup = '';
        
        // Calculate age group
        if (age >= 13 && age <= 15) ageGroup = 'U13-U15';
        else if (age >= 16 && age <= 17) ageGroup = 'U16-U17';
        else if (age >= 18) ageGroup = 'Adult';
        
        return {
          id: p.id,
          firstName: p.firstName,
          lastName: p.lastName,
          email: p.email || '',
          birthYear: p.birthYear,
          ageGroup,
          gender: p.gender,
          club: p.soccerClub || '',
          role: 'player'
        };
      });

    res.json(eligiblePlayers);
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ message: 'Failed to fetch players' });
  }
});

export default router;
