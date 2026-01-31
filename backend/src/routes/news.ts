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
      id: item._id.toString(),
      posted_by_user_id: item.posted_by_user_id
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
    const jwt = await import('jsonwebtoken');
    
    const newsIdNum = typeof req.params.id === 'string' ? parseInt(req.params.id, 10) : req.params.id;
    
    let currentUserId: string | null = null;
    try {
      const token = (req.headers.authorization?.replace('Bearer ', '') || 
                    (req as any).cookies?.mavy_session);
      if (token) {
        const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
        const decoded = jwt.verify(token, jwtSecret) as { user_id: string };
        currentUserId = decoded.user_id;
      }
    } catch {
      currentUserId = null;
    }
    
    const commentsWithUser = await Promise.all(comments.map(async (comment) => {
      const user = await User.findOne({ user_id: comment.user_id }).lean();
      const replyCount = await CommentReply.countDocuments({ comment_id: comment._id.toString() });
      const commentIdNum = parseInt(comment._id.toString().slice(-8), 16) || Date.now();
      
      const likesArray = comment.likes || [];
      const likesCount = likesArray.length;
      const userLiked = currentUserId ? likesArray.includes(currentUserId) : false;
      
      return {
        id: commentIdNum,
        news_id: isNaN(newsIdNum) ? 0 : newsIdNum,
        user_id: comment.user_id,
        comment: comment.comment,
        full_name: (user as any)?.profile?.full_name || 'User',
        profile_picture_url: (user as any)?.profile?.profile_picture_url || null,
        created_at: comment.created_at.toISOString(),
        updated_at: comment.updated_at.toISOString(),
        likes_count: likesCount,
        replies_count: replyCount || 0,
        user_liked: userLiked
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
    const newsId = req.params.id;
    const userId = req.user!.user_id;
    
    const user = await User.findOne({ user_id: userId });
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const isAdminEmail = user.email === 'mavytechsolutions@gmail.com' || 
                         user.patient_email === 'mavytechsolutions@gmail.com';
    const isAdmin = user.is_admin === true || 
                    user.role === 'admin' ||
                    user.account_type === 'admin' ||
                    isAdminEmail;
    
    let news;
    let findQuery: any = {};
    
    if (newsId.match(/^[0-9a-fA-F]{24}$/)) {
      findQuery._id = newsId;
      if (!isAdmin) {
        findQuery.posted_by_user_id = userId;
      }
      news = await NewsUpdate.findOneAndUpdate(
        findQuery,
        { $set: req.body },
        { new: true }
      );
    } else {
      const numericId = parseInt(newsId, 10);
      const allNews = await NewsUpdate.find(isAdmin ? {} : { posted_by_user_id: userId }).lean();
      const found = allNews.find(n => {
        const idNum = parseInt(n._id.toString().slice(-8), 16);
        return idNum === numericId;
      });
      
      if (found) {
        const updateQuery: any = { _id: found._id };
        if (!isAdmin) {
          updateQuery.posted_by_user_id = userId;
        }
        news = await NewsUpdate.findOneAndUpdate(
          updateQuery,
          { $set: req.body },
          { new: true }
        );
      }
    }

    if (!news) {
      return res.status(404).json({ error: 'News post not found or user not authorized' });
    }

    return res.json({ news, success: true });
  } catch (error: any) {
    console.error('Update news error:', error);
    console.error('Error details:', error.message, error.stack);
    return res.status(500).json({ error: 'Failed to update news', details: error.message });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.user_id;
    const user = await User.findOne({ user_id: userId });
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const isAdminEmail = user.email === 'mavytechsolutions@gmail.com' || 
                         user.patient_email === 'mavytechsolutions@gmail.com';
    const isAdmin = user.is_admin === true || 
                    user.role === 'admin' ||
                    user.account_type === 'admin' ||
                    isAdminEmail;
    
    const deleteQuery: any = {};
    
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      deleteQuery._id = req.params.id;
    } else {
      const allNews = await NewsUpdate.find(isAdmin ? {} : { posted_by_user_id: userId }).lean();
      const found = allNews.find(n => {
        const idNum = parseInt(n._id.toString().slice(-8), 16);
        return idNum === parseInt(req.params.id, 10);
      });
      if (found) {
        deleteQuery._id = found._id;
      } else {
        return res.status(404).json({ error: 'News not found' });
      }
    }
    
    if (!isAdmin) {
      deleteQuery.posted_by_user_id = userId;
    }
    
    const news = await NewsUpdate.findOneAndDelete(deleteQuery);

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
