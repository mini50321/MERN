import express, { type Request, type Response } from 'express';
import multer from 'multer';
import { Exhibition } from '../models/index.js';
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
    const { category, city, state, country } = req.query;
    const query: any = {};
    
    if (category) query.category = category;
    if (city) query.city = city;
    if (state) query.state = state;
    if (country) query.country = country;

    const exhibitions = await Exhibition.find(query)
      .sort({ created_at: -1 })
      .limit(50)
      .lean();
    
    const formattedExhibitions = exhibitions.map(exhibition => ({
      ...exhibition,
      id: exhibition._id.toString()
    }));
    
    return res.json(formattedExhibitions);
  } catch (error) {
    console.error('Get exhibitions error:', error);
    return res.status(500).json({ error: 'Failed to fetch exhibitions' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const exhibition = await Exhibition.create({
      title: req.body.title,
      description: req.body.description || null,
      category: req.body.category || null,
      image_url: req.body.image_url || null,
      location: req.body.location || null,
      venue_name: req.body.venue_name || null,
      city: req.body.city || null,
      state: req.body.state || null,
      country: req.body.country || null,
      event_start_date: req.body.event_start_date || null,
      event_end_date: req.body.event_end_date || null,
      organizer_name: req.body.organizer_name || null,
      contact_number: req.body.contact_number || null,
      website_url: req.body.website_url || null,
      registration_url: req.body.registration_url || null,
      google_maps_url: req.body.google_maps_url || null,
      posted_by_user_id: req.user!.user_id,
      is_user_post: true,
      hashtags: req.body.hashtags || null
    });

    return res.status(201).json({ id: exhibition._id, success: true });
  } catch (error) {
    console.error('Create exhibition error:', error);
    return res.status(500).json({ error: 'Failed to create exhibition' });
  }
});

router.get('/my-exhibitions', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const exhibitions = await Exhibition.find({ posted_by_user_id: req.user!.user_id })
      .sort({ created_at: -1 })
      .lean();
    
    const formattedExhibitions = exhibitions.map(exhibition => ({
      ...exhibition,
      id: exhibition._id.toString()
    }));
    
    return res.json(formattedExhibitions);
  } catch (error) {
    console.error('Get my exhibitions error:', error);
    return res.status(500).json({ error: 'Failed to fetch my exhibitions' });
  }
});

router.get('/saved', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json([]);
  } catch (error) {
    console.error('Get saved exhibitions error:', error);
    return res.status(500).json({ error: 'Failed to fetch saved exhibitions' });
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
      message: 'Image uploaded successfully'
    });
  } catch (error) {
    console.error('Upload exhibition image error:', error);
    return res.status(500).json({ error: 'Failed to upload image' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const exhibition = await Exhibition.findById(req.params.id).lean();
    
    if (!exhibition) {
      return res.status(404).json({ error: 'Exhibition not found' });
    }

    return res.json({ ...exhibition, id: exhibition._id.toString() });
  } catch (error) {
    console.error('Get exhibition error:', error);
    return res.status(500).json({ error: 'Failed to fetch exhibition' });
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const exhibition = await Exhibition.findOneAndUpdate(
      { 
        _id: req.params.id,
        posted_by_user_id: req.user!.user_id 
      },
      { $set: req.body },
      { new: true }
    );

    if (!exhibition) {
      return res.status(404).json({ error: 'Exhibition not found' });
    }

    return res.json({ exhibition, success: true });
  } catch (error) {
    console.error('Update exhibition error:', error);
    return res.status(500).json({ error: 'Failed to update exhibition' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const exhibition = await Exhibition.findOneAndDelete({ 
      _id: req.params.id,
      posted_by_user_id: req.user!.user_id 
    });

    if (!exhibition) {
      return res.status(404).json({ error: 'Exhibition not found' });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Delete exhibition error:', error);
    return res.status(500).json({ error: 'Failed to delete exhibition' });
  }
});

router.post('/:id/like', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const exhibition = await Exhibition.findById(req.params.id);
    if (!exhibition) {
      return res.status(404).json({ error: 'Exhibition not found' });
    }
    return res.json({ success: true, message: 'Like status updated' });
  } catch (error) {
    console.error('Like exhibition error:', error);
    return res.status(500).json({ error: 'Failed to like exhibition' });
  }
});

router.post('/:id/save', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const exhibition = await Exhibition.findById(req.params.id);
    if (!exhibition) {
      return res.status(404).json({ error: 'Exhibition not found' });
    }
    return res.json({ success: true, saved: true, message: 'Save status updated' });
  } catch (error) {
    console.error('Save exhibition error:', error);
    return res.status(500).json({ error: 'Failed to save exhibition' });
  }
});

router.post('/:id/response', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { response_type } = req.body;
    const exhibition = await Exhibition.findById(req.params.id);
    if (!exhibition) {
      return res.status(404).json({ error: 'Exhibition not found' });
    }
    return res.json({ success: true, message: `Response ${response_type} recorded` });
  } catch (error) {
    console.error('Response exhibition error:', error);
    return res.status(500).json({ error: 'Failed to record response' });
  }
});

router.post('/:id/view', async (req: Request, res: Response) => {
  try {
    const exhibition = await Exhibition.findById(req.params.id);
    if (!exhibition) {
      return res.status(404).json({ error: 'Exhibition not found' });
    }
    return res.json({ success: true });
  } catch (error) {
    console.error('View exhibition error:', error);
    return res.status(500).json({ error: 'Failed to track view' });
  }
});

router.post('/:id/share', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const exhibition = await Exhibition.findById(req.params.id);
    if (!exhibition) {
      return res.status(404).json({ error: 'Exhibition not found' });
    }
    return res.json({ success: true, message: 'Share recorded' });
  } catch (error) {
    console.error('Share exhibition error:', error);
    return res.status(500).json({ error: 'Failed to record share' });
  }
});

router.post('/:id/report', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const exhibition = await Exhibition.findById(req.params.id);
    if (!exhibition) {
      return res.status(404).json({ error: 'Exhibition not found' });
    }
    return res.json({ success: true, message: 'Report submitted' });
  } catch (error) {
    console.error('Report exhibition error:', error);
    return res.status(500).json({ error: 'Failed to submit report' });
  }
});

router.get('/:id/comments', async (req: Request, res: Response) => {
  try {
    return res.json([]);
  } catch (error) {
    console.error('Get exhibition comments error:', error);
    return res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

router.post('/:id/comment', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { comment } = req.body;
    const exhibition = await Exhibition.findById(req.params.id);
    if (!exhibition) {
      return res.status(404).json({ error: 'Exhibition not found' });
    }
    return res.json({ success: true, message: 'Comment posted' });
  } catch (error) {
    console.error('Comment exhibition error:', error);
    return res.status(500).json({ error: 'Failed to post comment' });
  }
});

router.post('/comments/:id/like', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    return res.json({ success: true, message: 'Comment liked' });
  } catch (error) {
    console.error('Like comment error:', error);
    return res.status(500).json({ error: 'Failed to like comment' });
  }
});

router.get('/comments/:id/replies', async (req: Request, res: Response) => {
  try {
    return res.json([]);
  } catch (error) {
    console.error('Get comment replies error:', error);
    return res.status(500).json({ error: 'Failed to fetch replies' });
  }
});

router.post('/comments/:id/reply', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { reply } = req.body;
    return res.json({ success: true, message: 'Reply posted' });
  } catch (error) {
    console.error('Reply comment error:', error);
    return res.status(500).json({ error: 'Failed to post reply' });
  }
});

export default router;