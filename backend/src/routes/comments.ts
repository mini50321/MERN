import express, { type Request, type Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

router.post('/:id/like', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json({ success: true, liked: true });
  } catch (error) {
    console.error('Like comment error:', error);
    return res.status(500).json({ error: 'Failed to like comment' });
  }
});

router.get('/:id/replies', async (_req: Request, res: Response) => {
  try {
    return res.json([]);
  } catch (error) {
    console.error('Get comment replies error:', error);
    return res.status(500).json({ error: 'Failed to fetch replies' });
  }
});

router.post('/:id/reply', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { reply } = req.body;
    
    if (!reply || !reply.trim()) {
      return res.status(400).json({ error: 'Reply text is required' });
    }

    const { User } = await import('../models/index.js');
    const user = await User.findOne({ user_id: req.user!.user_id }).lean();
    
    const replyId = Date.now();
    const commentId = typeof req.params.id === 'string' ? parseInt(req.params.id, 10) : req.params.id;
    
    const replyObj = {
      id: replyId,
      comment_id: isNaN(commentId) ? 0 : commentId,
      user_id: req.user!.user_id,
      reply: reply.trim(),
      full_name: (user as any)?.profile?.full_name || 'User',
      profile_picture_url: (user as any)?.profile?.profile_picture_url || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return res.json({ 
      success: true, 
      message: 'Reply posted successfully',
      reply: replyObj
    });
  } catch (error) {
    console.error('Post reply error:', error);
    return res.status(500).json({ error: 'Failed to post reply' });
  }
});

export default router;

