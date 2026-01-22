import express, { type Request, type Response } from 'express';
import { NewsUpdate } from '../models/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

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

router.post('/upload-image', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    return res.json({ 
      image_url: 'https://via.placeholder.com/800x600?text=Service+Image',
      message: 'Image upload placeholder - implement file storage in production'
    });
  } catch (error) {
    console.error('Upload image error:', error);
    return res.status(500).json({ error: 'Failed to upload image' });
  }
});

export default router;
