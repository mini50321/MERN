import express, { Response } from 'express';
import { User, Follow, BlockedUser, ConnectionRequest } from '../models/index.js';
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

    const pendingRequestsCount = await ConnectionRequest.countDocuments({
      receiver_user_id: req.user!.user_id,
      status: 'pending'
    });

    return res.json({
      followers: followersCount,
      following: followingCount,
      pending_requests: pendingRequestsCount
    });
  } catch (error) {
    console.error('Get connect stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.get('/users', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { search, profession } = req.query;
    
    const blockedUsers = await BlockedUser.find({
      $or: [
        { blocker_user_id: req.user!.user_id },
        { blocked_user_id: req.user!.user_id }
      ]
    }).lean();

    const blockedIds = new Set([
      ...blockedUsers.map(b => b.blocker_user_id),
      ...blockedUsers.map(b => b.blocked_user_id)
    ]);
    blockedIds.delete(req.user!.user_id);

    const query: any = {
      user_id: { $ne: req.user!.user_id, $nin: Array.from(blockedIds) },
      account_type: { $ne: 'patient' }
    };

    if (search) {
      query.$or = [
        { full_name: { $regex: search as string, $options: 'i' } },
        { business_name: { $regex: search as string, $options: 'i' } },
        { specialisation: { $regex: search as string, $options: 'i' } },
        { location: { $regex: search as string, $options: 'i' } }
      ];
    }

    if (profession) {
      query.profession = profession;
    }

    const users = await User.find(query)
      .limit(50)
      .select('user_id full_name last_name business_name specialisation bio location profile_picture_url is_verified profession account_type')
      .lean();

    const myFollows = await Follow.find({ follower_user_id: req.user!.user_id })
      .select('following_user_id')
      .lean();
    const myFollowingIds = new Set(myFollows.map(f => f.following_user_id));

    const followersOfMe = await Follow.find({ following_user_id: req.user!.user_id })
      .select('follower_user_id')
      .lean();
    const followersOfMeIds = new Set(followersOfMe.map(f => f.follower_user_id));

    const userIds = users.map(u => u.user_id);
    const sentRequests = await ConnectionRequest.find({
      sender_user_id: req.user!.user_id,
      receiver_user_id: { $in: userIds },
      status: 'pending'
    }).lean();
    const sentRequestIds = new Set(sentRequests.map(r => r.receiver_user_id));

    const receivedRequests = await ConnectionRequest.find({
      receiver_user_id: req.user!.user_id,
      sender_user_id: { $in: userIds },
      status: 'pending'
    }).lean();
    const receivedRequestIds = new Set(receivedRequests.map(r => r.sender_user_id));

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
        request_sent: sentRequestIds.has(user.user_id),
        request_received: receivedRequestIds.has(user.user_id),
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
      .select('follower_user_id')
      .lean();

    const followerIds = follows.map(f => f.follower_user_id);
    
    if (followerIds.length === 0) {
      return res.json([]);
    }

    const users = await User.find({ user_id: { $in: followerIds } })
      .select('user_id full_name last_name business_name specialisation bio location profile_picture_url is_verified profession account_type')
      .lean();

    const myFollowing = await Follow.find({ follower_user_id: req.user!.user_id })
      .select('following_user_id')
      .lean();
    const myFollowingIds = new Set(myFollowing.map(f => f.following_user_id));

    const followersCounts = await Promise.all(
      users.map(async (user) => {
        const count = await Follow.countDocuments({ following_user_id: user.user_id });
        return { user_id: user.user_id, count };
      })
    );
    const followersCountMap = new Map(followersCounts.map(f => [f.user_id, f.count]));

    const formattedUsers = users.map(user => ({
      user_id: user.user_id,
      full_name: user.full_name || user.business_name || 'Unknown',
      last_name: user.last_name || '',
      specialisation: user.specialisation || '',
      bio: user.bio || '',
      location: user.location || '',
      profile_picture_url: user.profile_picture_url || '',
      is_verified: user.is_verified ? 1 : 0,
      followers_count: followersCountMap.get(user.user_id) || 0,
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

router.get('/requests', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const requests = await ConnectionRequest.find({
      receiver_user_id: req.user!.user_id,
      status: 'pending'
    })
      .sort({ created_at: -1 })
      .lean();

    const senderIds = requests.map(r => r.sender_user_id);
    
    if (senderIds.length === 0) {
      return res.json([]);
    }

    const users = await User.find({ user_id: { $in: senderIds } })
      .select('user_id full_name last_name business_name specialisation bio location profile_picture_url is_verified profession account_type')
      .lean();

    const formattedRequests = requests.map(request => {
      const sender = users.find(u => u.user_id === request.sender_user_id);
      return {
        id: request._id.toString(),
        sender_user_id: request.sender_user_id,
        receiver_user_id: request.receiver_user_id,
        status: request.status,
        created_at: request.created_at,
        full_name: sender?.full_name || sender?.business_name || 'Unknown',
        last_name: sender?.last_name || '',
        specialisation: sender?.specialisation || '',
        bio: sender?.bio || '',
        location: sender?.location || '',
        profile_picture_url: sender?.profile_picture_url || '',
        is_verified: sender?.is_verified ? 1 : 0,
        followers_count: 0,
        following_count: 0,
        profession: sender?.profession || '',
        account_type: sender?.account_type || ''
      };
    });

    return res.json(formattedRequests);
  } catch (error) {
    console.error('Get requests error:', error);
    return res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

router.get('/blocked', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const blockedUsers = await BlockedUser.find({ blocker_user_id: req.user!.user_id })
      .select('blocked_user_id')
      .lean();

    const blockedIds = blockedUsers.map(b => b.blocked_user_id);
    
    if (blockedIds.length === 0) {
      return res.json([]);
    }

    const users = await User.find({ user_id: { $in: blockedIds } })
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
      is_following: false,
      follows_me: false,
      profession: user.profession || '',
      account_type: user.account_type || ''
    }));

    return res.json(formattedUsers);
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

router.post('/block/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    if (userId === req.user!.user_id) {
      return res.status(400).json({ error: 'Cannot block yourself' });
    }

    const targetUser = await User.findOne({ user_id: userId });
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const existingBlock = await BlockedUser.findOne({
      blocker_user_id: req.user!.user_id,
      blocked_user_id: userId
    });

    if (existingBlock) {
      return res.status(400).json({ error: 'User already blocked' });
    }

    await BlockedUser.create({
      blocker_user_id: req.user!.user_id,
      blocked_user_id: userId
    });

    await Follow.deleteMany({
      $or: [
        { follower_user_id: req.user!.user_id, following_user_id: userId },
        { follower_user_id: userId, following_user_id: req.user!.user_id }
      ]
    });

    return res.json({ blocked: true, success: true });
  } catch (error) {
    console.error('Block user error:', error);
    return res.status(500).json({ error: 'Failed to block user' });
  }
});

router.post('/unblock/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    const blockedUser = await BlockedUser.findOne({
      blocker_user_id: req.user!.user_id,
      blocked_user_id: userId
    });

    if (!blockedUser) {
      return res.status(404).json({ error: 'User is not blocked' });
    }

    await BlockedUser.deleteOne({ _id: blockedUser._id });

    return res.json({ blocked: false, success: true });
  } catch (error) {
    console.error('Unblock user error:', error);
    return res.status(500).json({ error: 'Failed to unblock user' });
  }
});

router.post('/request/:requestId/accept', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    const mongoose = await import('mongoose');

    let request;
    if (mongoose.default.Types.ObjectId.isValid(requestId)) {
      request = await ConnectionRequest.findOne({
        _id: requestId,
        receiver_user_id: req.user!.user_id,
        status: 'pending'
      });
    } else {
      const requests = await ConnectionRequest.find({
        receiver_user_id: req.user!.user_id,
        status: 'pending'
      }).lean();
      const idNum = parseInt(requestId);
      request = requests.find(r => {
        const idStr = r._id.toString();
        const numId = parseInt(idStr.slice(-8), 16);
        return numId === idNum;
      });
      if (request) {
        request = await ConnectionRequest.findById(request._id);
      }
    }

    if (!request) {
      return res.status(404).json({ error: 'Request not found or already processed' });
    }

    request.status = 'accepted';
    await request.save();

    const existingFollow = await Follow.findOne({
      follower_user_id: request.sender_user_id,
      following_user_id: req.user!.user_id
    });

    if (!existingFollow) {
      await Follow.create({
        follower_user_id: request.sender_user_id,
        following_user_id: req.user!.user_id
      });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Accept request error:', error);
    return res.status(500).json({ error: 'Failed to accept request' });
  }
});

router.post('/request/:requestId/reject', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    const mongoose = await import('mongoose');

    let request;
    if (mongoose.default.Types.ObjectId.isValid(requestId)) {
      request = await ConnectionRequest.findOne({
        _id: requestId,
        receiver_user_id: req.user!.user_id,
        status: 'pending'
      });
    } else {
      const requests = await ConnectionRequest.find({
        receiver_user_id: req.user!.user_id,
        status: 'pending'
      }).lean();
      const idNum = parseInt(requestId);
      request = requests.find(r => {
        const idStr = r._id.toString();
        const numId = parseInt(idStr.slice(-8), 16);
        return numId === idNum;
      });
      if (request) {
        request = await ConnectionRequest.findById(request._id);
      }
    }

    if (!request) {
      return res.status(404).json({ error: 'Request not found or already processed' });
    }

    request.status = 'rejected';
    await request.save();

    return res.json({ success: true });
  } catch (error) {
    console.error('Reject request error:', error);
    return res.status(500).json({ error: 'Failed to reject request' });
  }
});

router.post('/request/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    if (userId === req.user!.user_id) {
      return res.status(400).json({ error: 'Cannot send connection request to yourself' });
    }

    const targetUser = await User.findOne({ user_id: userId });
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const existingRequest = await ConnectionRequest.findOne({
      $or: [
        { sender_user_id: req.user!.user_id, receiver_user_id: userId },
        { sender_user_id: userId, receiver_user_id: req.user!.user_id }
      ]
    });

    if (existingRequest) {
      if (existingRequest.status === 'accepted') {
        return res.status(400).json({ error: 'Already connected with this user' });
      }
      if (existingRequest.status === 'pending' && existingRequest.sender_user_id === req.user!.user_id) {
        return res.status(400).json({ error: 'Connection request already sent' });
      }
    }

    const blocked = await BlockedUser.findOne({
      $or: [
        { blocker_user_id: req.user!.user_id, blocked_user_id: userId },
        { blocker_user_id: userId, blocked_user_id: req.user!.user_id }
      ]
    });

    if (blocked) {
      return res.status(403).json({ error: 'Cannot send request to blocked user' });
    }

    await ConnectionRequest.create({
      sender_user_id: req.user!.user_id,
      receiver_user_id: userId,
      status: 'pending'
    });

    return res.json({ success: true, message: 'Connection request sent' });
  } catch (error) {
    console.error('Send connection request error:', error);
    return res.status(500).json({ error: 'Failed to send connection request' });
  }
});

export default router;

