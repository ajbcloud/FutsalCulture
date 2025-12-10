import express from 'express';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { db } from '../db';
import { users } from '../../shared/schema';
import { getAuth } from '@clerk/express';

const router = express.Router();

// Middleware to check if user is authenticated
const requireAuth = (req: any, res: express.Response, next: express.NextFunction) => {
  if (!req.session?.userId && !req.user?.id) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
};

// GET /api/user - Get current user info (supports both Clerk and session auth)
router.get('/', async (req: any, res) => {
  try {
    let user = null;
    
    // Try Clerk auth first
    const auth = getAuth(req);
    if (auth?.userId) {
      const [foundUser] = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, auth.userId));
      user = foundUser;
    }
    
    // Fall back to session auth
    if (!user && (req.session?.userId || req.user?.id)) {
      const userId = req.session?.userId || req.user?.id;
      const [foundUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));
      user = foundUser;
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      isApproved: user.isApproved,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// PUT /api/user/profile - Update user profile
router.put('/profile', requireAuth, async (req: any, res) => {
  try {
    const userId = req.session?.userId || req.user?.id;
    const { firstName, lastName, email } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if email is already in use by another user
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()));

    if (existingUser.length > 0 && existingUser[0].id !== userId) {
      return res.status(400).json({ message: 'Email is already in use' });
    }

    // Update user profile
    const [updatedUser] = await db
      .update(users)
      .set({
        firstName,
        lastName,
        email: email.toLowerCase(),
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// POST /api/user/change-password - Change user password
router.post('/change-password', requireAuth, async (req: any, res) => {
  try {
    const userId = req.session?.userId || req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    // Get current user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user || !user.passwordHash) {
      return res.status(400).json({ message: 'User not found or no password set' });
    }

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!validPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await db
      .update(users)
      .set({
        passwordHash: newPasswordHash,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
});

// GET /api/user/me - Get current user info
router.get('/me', requireAuth, async (req: any, res) => {
  try {
    const userId = req.session?.userId || req.user?.id;
    
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        tenantId: users.tenantId,
        isAdmin: users.isAdmin,
        isAssistant: users.isAssistant,
        isSuperAdmin: users.isSuperAdmin,
        role: users.role,
        profileImageUrl: users.profileImageUrl,
        avatarColor: users.avatarColor,
        avatarTextColor: users.avatarTextColor,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error getting user info:', error);
    res.status(500).json({ message: 'Failed to get user info' });
  }
});

export default router;