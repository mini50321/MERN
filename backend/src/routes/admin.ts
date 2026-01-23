import express, { Request, Response } from 'express';
import { User } from '../models/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

router.get('/check-admin', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findOne({ user_id: req.user!.user_id });
    
    if (!user) {
      return res.json({ is_admin: false });
    }

    const isAdmin = user.is_admin === true || 
                    user.role === 'admin' ||
                    user.account_type === 'admin';

    const defaultPermissions: Record<string, string> = isAdmin ? {
      posts: 'edit',
      exhibitions: 'edit',
      jobs: 'edit',
      learning: 'edit',
      services: 'edit',
      manuals: 'edit',
      users: 'edit',
      patients: 'edit',
      bookings: 'edit',
      support: 'edit',
      kyc: 'edit',
      fundraising: 'edit',
      reports: 'edit',
      advertising: 'edit',
      subscriptions: 'edit',
      admins: 'view'
    } : {};

    return res.json({ 
      is_admin: isAdmin,
      role: user.role || (isAdmin ? 'admin' : null),
      permissions: defaultPermissions
    });
  } catch (error) {
    console.error('Check admin error:', error);
    return res.json({ is_admin: false });
  }
});

router.post('/make-admin', async (req: Request, res: Response) => {
  try {
    const { phone_number } = req.body;
    
    if (!phone_number) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const user = await User.findOneAndUpdate(
      { phone: phone_number },
      { 
        $set: { 
          is_admin: true,
          role: 'admin',
          onboarding_completed: true
        } 
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ 
      success: true, 
      message: `User ${phone_number} is now an admin`,
      user: {
        user_id: user.user_id,
        phone: user.phone,
        is_admin: user.is_admin
      }
    });
  } catch (error) {
    console.error('Make admin error:', error);
    return res.status(500).json({ error: 'Failed to make user admin' });
  }
});

router.get('/notification-counts', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json({
      posts: 0,
      exhibitions: 0,
      jobs: 0,
      fundraisers: 0,
      reports: 0,
      courses: 0,
      services: 0,
      manuals: 0,
      patients: 0,
      kyc: 0,
      bookings: 0,
      support: 0
    });
  } catch (error) {
    console.error('Get notification counts error:', error);
    return res.json({
      posts: 0,
      exhibitions: 0,
      jobs: 0,
      fundraisers: 0,
      reports: 0,
      courses: 0,
      services: 0,
      manuals: 0,
      patients: 0,
      kyc: 0,
      bookings: 0,
      support: 0
    });
  }
});

export default router;

