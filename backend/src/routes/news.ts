import express, { type Request, type Response } from 'express';
import multer from 'multer';
import { NewsUpdate, NewsComment, User } from '../models/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const query: any = {};
    
    if (category) query.category = category;

    const news = await NewsUpdate.find(query)
      .sort({ created_at: -1 })
      .lean();
    
    const formatted = news.map(item => ({
      ...item,
      id: item._id.toString()
    }));
    
    return res.json(formatted);
  } catch (error) {
    console.error('Get news error:', error);
    return res.status(500).json({ error: 'Failed to fetch news' });
  }
});

router.get('/my-posts', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const news = await NewsUpdate.find({ posted_by_user_id: req.user!.user_id })
      .sort({ created_at: -1 });

    const formatted = news.map(item => {
      const obj = item.toObject() as any;
      return {
        ...obj,
        id: item._id.toString()
      };
    });

    return res.json(formatted);
  } catch (error) {
    console.error('Get my posts error:', error);
    return res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const news = await NewsUpdate.create({
      title: req.body.title,
      content: req.body.content || null,
      category: req.body.category || null,
      image_url: req.body.image_url || null,
      source_url: req.body.source_url || null,
      published_date: req.body.published_date || null,
      posted_by_user_id: req.user!.user_id,
      is_user_post: true,
      hashtags: req.body.hashtags || null
    });

    return res.status(201).json({ id: news._id, success: true });
  } catch (error) {
    console.error('Create news error:', error);
    return res.status(500).json({ error: 'Failed to create news' });
  }
});

router.get('/saved', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json([]);
  } catch (error) {
    console.error('Get saved news error:', error);
    return res.status(500).json({ error: 'Failed to fetch saved news' });
  }
});

router.get('/:id/comments', async (req: Request, res: Response) => {
  try {
    const comments = await NewsComment.find({ news_id: req.params.id })
      .sort({ created_at: -1 })
      .lean();

    const { CommentReply } = await import('../models/index.js');
    
    const newsIdNum = typeof req.params.id === 'string' ? parseInt(req.params.id, 10) : req.params.id;
    
    const commentsWithUser = await Promise.all(comments.map(async (comment) => {
      const user = await User.findOne({ user_id: comment.user_id }).lean();
      const replyCount = await CommentReply.countDocuments({ comment_id: comment._id.toString() });
      const commentIdNum = parseInt(comment._id.toString().slice(-8), 16) || Date.now();
      
      return {
        id: commentIdNum,
        news_id: isNaN(newsIdNum) ? 0 : newsIdNum,
        user_id: comment.user_id,
        comment: comment.comment,
        full_name: (user as any)?.profile?.full_name || 'User',
        profile_picture_url: (user as any)?.profile?.profile_picture_url || null,
        created_at: comment.created_at.toISOString(),
        updated_at: comment.updated_at.toISOString(),
        likes_count: 0,
        replies_count: replyCount || 0,
        user_liked: false
      };
    }));

    return res.json(commentsWithUser);
  } catch (error) {
    console.error('Get news comments error:', error);
    return res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

router.post('/:id/comment', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const news = await NewsUpdate.findById(req.params.id);
    
    if (!news) {
      return res.status(404).json({ error: 'News not found' });
    }

    if (!req.body.comment || !req.body.comment.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const savedComment = await NewsComment.create({
      news_id: req.params.id,
      user_id: req.user!.user_id,
      comment: req.body.comment.trim()
    });

    const user = await User.findOne({ user_id: req.user!.user_id }).lean();
    const newsIdNum = typeof req.params.id === 'string' ? parseInt(req.params.id, 10) : req.params.id;
    
    const comment = {
      id: parseInt(savedComment._id.toString().slice(-8), 16) || Date.now(),
      news_id: isNaN(newsIdNum) ? 0 : newsIdNum,
      user_id: req.user!.user_id,
      comment: savedComment.comment,
      full_name: (user as any)?.profile?.full_name || 'User',
      profile_picture_url: (user as any)?.profile?.profile_picture_url || null,
      created_at: savedComment.created_at.toISOString(),
      updated_at: savedComment.updated_at.toISOString(),
      likes_count: 0,
      replies_count: 0,
      user_liked: false
    };

    return res.json({ 
      success: true, 
      message: 'Comment posted successfully',
      comment: comment
    });
  } catch (error) {
    console.error('Post comment error:', error);
    return res.status(500).json({ error: 'Failed to post comment' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const news = await NewsUpdate.findById(req.params.id).lean();

    if (!news) {
      return res.status(404).json({ error: 'News not found' });
    }

    return res.json({
      ...news,
      id: news._id.toString()
    });
  } catch (error) {
    console.error('Get news error:', error);
    return res.status(500).json({ error: 'Failed to fetch news' });
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const news = await NewsUpdate.findOneAndUpdate(
      { 
        _id: req.params.id,
        posted_by_user_id: req.user!.user_id 
      },
      { $set: req.body },
      { new: true }
    );

    if (!news) {
      return res.status(404).json({ error: 'News not found' });
    }

    return res.json({ news, success: true });
  } catch (error) {
    console.error('Update news error:', error);
    return res.status(500).json({ error: 'Failed to update news' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const news = await NewsUpdate.findOneAndDelete({ 
      _id: req.params.id,
      posted_by_user_id: req.user!.user_id 
    });

    if (!news) {
      return res.status(404).json({ error: 'News not found' });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Delete news error:', error);
    return res.status(500).json({ error: 'Failed to delete news' });
  }
});

router.post('/upload-image', authMiddleware, upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const file = req.file;
    const base64Image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    return res.json({ 
      success: true,
      image_url: base64Image,
      message: 'Image uploaded successfully (stored as base64 data URL)'
    });
  } catch (error) {
    console.error('Upload image error:', error);
    return res.status(500).json({ error: 'Failed to upload image' });
  }
});

router.post('/:id/like', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const news = await NewsUpdate.findById(req.params.id);
    
    if (!news) {
      return res.status(404).json({ error: 'News not found' });
    }

    return res.json({ success: true, liked: true });
  } catch (error) {
    console.error('Like news error:', error);
    return res.status(500).json({ error: 'Failed to like news' });
  }
});

router.post('/:id/save', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const news = await NewsUpdate.findById(req.params.id);
    
    if (!news) {
      return res.status(404).json({ error: 'News not found' });
    }

    return res.json({ success: true, saved: true });
  } catch (error) {
    console.error('Save news error:', error);
    return res.status(500).json({ error: 'Failed to save news' });
  }
});

export default router;
