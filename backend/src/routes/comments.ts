import express, { type Request, type Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { CommentReply, User, NewsComment } from '../models/index.js';

const router = express.Router();

router.post('/:id/like', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const commentId = req.params.id;
    const userId = req.user!.user_id;

    const numericCommentId = typeof commentId === 'string' ? parseInt(commentId, 10) : commentId;
    const allComments = await NewsComment.find().lean();
    const matchingComment = allComments.find(c => {
      const commentIdNum = parseInt(c._id.toString().slice(-8), 16);
      return commentIdNum === numericCommentId;
    });

    if (!matchingComment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const comment = await NewsComment.findById(matchingComment._id);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const likesArray = comment.likes || [];
    const likedIndex = likesArray.indexOf(userId);

    if (likedIndex === -1) {
      likesArray.push(userId);
    } else {
      likesArray.splice(likedIndex, 1);
    }

    comment.likes = likesArray;
    await comment.save();

    return res.json({ 
      success: true, 
      liked: likedIndex === -1,
      likes_count: likesArray.length
    });
  } catch (error) {
    console.error('Like comment error:', error);
    return res.status(500).json({ error: 'Failed to like comment' });
  }
});

router.get('/:id/replies', async (req: Request, res: Response) => {
  try {
    const numericCommentId = typeof req.params.id === 'string' ? parseInt(req.params.id, 10) : req.params.id;
    
    const { NewsComment } = await import('../models/index.js');
    const allComments = await NewsComment.find().lean();
    const matchingComment = allComments.find(c => {
      const commentIdNum = parseInt(c._id.toString().slice(-8), 16);
      return commentIdNum === numericCommentId;
    });
    
    if (!matchingComment) {
      return res.json([]);
    }
    
    const replies = await CommentReply.find({ comment_id: matchingComment._id.toString() })
      .sort({ created_at: 1 })
      .lean();

    const repliesWithUser = await Promise.all(replies.map(async (reply) => {
      const user = await User.findOne({ user_id: reply.user_id }).lean();
      
      return {
        id: parseInt(reply._id.toString().slice(-8), 16) || Date.now(),
        comment_id: numericCommentId,
        user_id: reply.user_id,
        reply: reply.reply,
        full_name: (user as any)?.profile?.full_name || 'User',
        profile_picture_url: (user as any)?.profile?.profile_picture_url || null,
        created_at: reply.created_at.toISOString(),
        updated_at: reply.updated_at.toISOString()
      };
    }));

    return res.json(repliesWithUser);
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

    const numericCommentId = typeof req.params.id === 'string' ? parseInt(req.params.id, 10) : req.params.id;
    const { NewsComment } = await import('../models/index.js');
    const allComments = await NewsComment.find().lean();
    const matchingComment = allComments.find(c => {
      const commentIdNum = parseInt(c._id.toString().slice(-8), 16);
      return commentIdNum === numericCommentId;
    });
    
    if (!matchingComment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const savedReply = await CommentReply.create({
      comment_id: matchingComment._id.toString(),
      user_id: req.user!.user_id,
      reply: reply.trim()
    });

    const user = await User.findOne({ user_id: req.user!.user_id }).lean();
    
    const replyObj = {
      id: parseInt(savedReply._id.toString().slice(-8), 16) || Date.now(),
      comment_id: numericCommentId,
      user_id: req.user!.user_id,
      reply: savedReply.reply,
      full_name: (user as any)?.profile?.full_name || 'User',
      profile_picture_url: (user as any)?.profile?.profile_picture_url || null,
      created_at: savedReply.created_at.toISOString(),
      updated_at: savedReply.updated_at.toISOString()
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

