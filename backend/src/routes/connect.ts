import express, { Response } from 'express';
import { User, Follow } from '../models/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const currentUser = await User.findOne({ user_id: req.user!.user_id });
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const followersCount = await Follow.countDocuments({ following_user_id: req.user!.user_id });
    const followingCount = await Follow.countDocuments({ follower_user_id: req.user!.user_id });

    return res.json({
      followers: followersCount,
      following: followingCount,
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

    const myFollows = await Follow.find({ follower_user_id: req.user!.user_id })
      .select('following_user_id')
      .lean();
    const myFollowingIds = new Set(myFollows.map(f => f.following_user_id));

    const followersOfMe = await Follow.find({ following_user_id: req.user!.user_id })
      .select('follower_user_id')
      .lean();
    const followersOfMeIds = new Set(followersOfMe.map(f => f.follower_user_id));

    const formattedUsers = users.map(user => {
      const followersCount = 0;
      const followingCount = 0;

      return {
        user_id: user.user_id,
        full_name: user.full_name || user.business_name || 'Unknown',
        last_name: user.last_name || '',
        specialisation: user.specialisation || '',
        bio: user.bio || '',
        location: user.location || '',
        profile_picture_url: user.profile_picture_url || '',
        is_verified: user.is_verified ? 1 : 0,
        followers_count: followersCount,
        following_count: followingCount,
        is_following: myFollowingIds.has(user.user_id),
        follows_me: followersOfMeIds.has(user.user_id),
        profession: user.profession || '',
        account_type: user.account_type || ''
      };
    });

    return res.json(formattedUsers);
  } catch (error) {
    console.error('Get connect users error:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.get('/followers', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const follows = await Follow.find({ following_user_id: req.user!.user_id })
      .populate('follower_user_id', 'user_id full_name last_name business_name specialisation bio location profile_picture_url is_verified profession account_type')
      .lean();

    const followerIds = follows.map(f => f.follower_user_id);
    const users = await User.find({ user_id: { $in: followerIds } })
      .select('user_id full_name last_name business_name specialisation bio location profile_picture_url is_verified profession account_type')
      .lean();

    const myFollowing = await Follow.find({ follower_user_id: req.user!.user_id })
      .select('following_user_id')
      .lean();
    const myFollowingIds = new Set(myFollowing.map(f => f.following_user_id));

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
      is_following: myFollowingIds.has(user.user_id),
      follows_me: true,
      profession: user.profession || '',
      account_type: user.account_type || ''
    }));

    return res.json(formattedUsers);
  } catch (error) {
    console.error('Get followers error:', error);
    return res.status(500).json({ error: 'Failed to fetch followers' });
  }
});

router.get('/following', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const follows = await Follow.find({ follower_user_id: req.user!.user_id })
      .select('following_user_id')
      .lean();

    const followingIds = follows.map(f => f.following_user_id);
    const users = await User.find({ user_id: { $in: followingIds } })
      .select('user_id full_name last_name business_name specialisation bio location profile_picture_url is_verified profession account_type')
      .lean();

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
      is_following: true,
      follows_me: false,
      profession: user.profession || '',
      account_type: user.account_type || ''
    }));

    return res.json(formattedUsers);
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

router.post('/follow/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    if (userId === req.user!.user_id) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const targetUser = await User.findOne({ user_id: userId });
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const existingFollow = await Follow.findOne({
      follower_user_id: req.user!.user_id,
      following_user_id: userId
    });

    if (existingFollow) {
      await Follow.deleteOne({ _id: existingFollow._id });
      return res.json({ following: false, success: true });
    } else {
      await Follow.create({
        follower_user_id: req.user!.user_id,
        following_user_id: userId
      });
      return res.json({ following: true, success: true });
    }
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

