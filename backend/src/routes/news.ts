import express, { type Request, type Response } from 'express';
import multer from 'multer';
import { NewsUpdate } from '../models/index.js';
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
      .sort({ created_at: -1 });
    
    return res.json(news);
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

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const news = await NewsUpdate.findById(req.params.id);
    
    if (!news) {
      return res.status(404).json({ error: 'News not found' });
    }

    return res.json(news);
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

router.get('/saved', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json([]);
  } catch (error) {
    console.error('Get saved news error:', error);
    return res.status(500).json({ error: 'Failed to fetch saved news' });
  }
});

export default router;
