import express, { Response } from 'express';
import { User } from '../models/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const currentUser = await User.findOne({ user_id: req.user!.user_id });
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      followers: 0,
      following: 0,
      pending_requests: 0
    });
  } catch (error) {
    console.error('Get connect stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.get('/users', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { search, profession } = req.query;
    const query: any = {
      user_id: { $ne: req.user!.user_id }
    };

    if (search) {
      query.$or = [
        { full_name: { $regex: search as string, $options: 'i' } },
        { business_name: { $regex: search as string, $options: 'i' } },
        { specialisation: { $regex: search as string, $options: 'i' } }
      ];
    }

    if (profession) {
      query.profession = profession;
    }

    const users = await User.find(query)
      .limit(50)
      .select('user_id full_name last_name business_name specialisation bio location profile_picture_url is_verified profession account_type');

    const formattedUsers = users.map(user => ({
      user_id: user.user_id,
      full_name: user.full_name || user.business_name || 'Unknown',
      last_name: user.last_name || '',
      specialisation: user.specialisation || '',
      bio: user.bio || '',
      location: user.location || '',
      profile_picture_url: user.profile_picture_url || '',
      is_verified: user.is_verified ? 1 : 0,
      followers_count: 0,
      following_count: 0,
      is_following: false,
      follows_me: false,
      profession: user.profession || '',
      account_type: user.account_type || ''
    }));

    return res.json(formattedUsers);
  } catch (error) {
    console.error('Get connect users error:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.get('/followers', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json([]);
  } catch (error) {
    console.error('Get followers error:', error);
    return res.status(500).json({ error: 'Failed to fetch followers' });
  }
});

router.get('/following', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json([]);
  } catch (error) {
    console.error('Get following error:', error);
    return res.status(500).json({ error: 'Failed to fetch following' });
  }
});

router.get('/requests', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json([]);
  } catch (error) {
    console.error('Get requests error:', error);
    return res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

router.get('/blocked', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json([]);
  } catch (error) {
    console.error('Get blocked error:', error);
    return res.status(500).json({ error: 'Failed to fetch blocked users' });
  }
});

router.post('/follow/:userId', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json({ success: true });
  } catch (error) {
    console.error('Follow user error:', error);
    return res.status(500).json({ error: 'Failed to follow user' });
  }
});

router.post('/block/:userId', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json({ success: true });
  } catch (error) {
    console.error('Block user error:', error);
    return res.status(500).json({ error: 'Failed to block user' });
  }
});

router.post('/unblock/:userId', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json({ success: true });
  } catch (error) {
    console.error('Unblock user error:', error);
    return res.status(500).json({ error: 'Failed to unblock user' });
  }
});

router.post('/request/:requestId/accept', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json({ success: true });
  } catch (error) {
    console.error('Accept request error:', error);
    return res.status(500).json({ error: 'Failed to accept request' });
  }
});

router.post('/request/:requestId/reject', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json({ success: true });
  } catch (error) {
    console.error('Reject request error:', error);
    return res.status(500).json({ error: 'Failed to reject request' });
  }
});

export default router;

