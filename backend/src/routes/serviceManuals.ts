import express, { type Request, type Response } from 'express';
import multer from 'multer';
import { ServiceManual } from '../models/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const { equipment_type, manufacturer } = req.query;
    const query: any = {};
    
    if (equipment_type) query.equipment_type = equipment_type;
    if (manufacturer) query.manufacturer = manufacturer;

    const manuals = await ServiceManual.find(query)
      .sort({ created_at: -1 });
    
    return res.json(manuals);
  } catch (error) {
    console.error('Get service manuals error:', error);
    return res.status(500).json({ error: 'Failed to fetch service manuals' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const manual = await ServiceManual.create({
      title: req.body.title,
      manufacturer: req.body.manufacturer || null,
      model_number: req.body.model_number || null,
      equipment_type: req.body.equipment_type || null,
      description: req.body.description || null,
      file_url: req.body.file_url || null,
      thumbnail_url: req.body.thumbnail_url || null,
      uploaded_by_user_id: req.user!.user_id,
      is_verified: false,
      download_count: 0,
      tags: req.body.tags || null
    });

    return res.status(201).json({ id: manual._id, success: true });
  } catch (error) {
    console.error('Create service manual error:', error);
    return res.status(500).json({ error: 'Failed to create service manual' });
  }
});

router.post('/upload', authMiddleware, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const file = req.file;
    const fileUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    const manual = await ServiceManual.create({
      title: req.body.title,
      manufacturer: req.body.manufacturer || null,
      model_number: req.body.model_number || null,
      equipment_type: req.body.equipment_type || null,
      description: req.body.description || null,
      file_url: fileUrl,
      thumbnail_url: null,
      uploaded_by_user_id: req.user!.user_id,
      is_verified: false,
      download_count: 0,
      tags: null
    });

    return res.status(201).json({ id: manual._id, success: true });
  } catch (error) {
    console.error('Upload service manual error:', error);
    return res.status(500).json({ error: 'Failed to upload service manual' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const manual = await ServiceManual.findById(req.params.id);
    
    if (!manual) {
      return res.status(404).json({ error: 'Service manual not found' });
    }

    manual.download_count += 1;
    await manual.save();

    return res.json(manual);
  } catch (error) {
    console.error('Get service manual error:', error);
    return res.status(500).json({ error: 'Failed to fetch service manual' });
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const manual = await ServiceManual.findOneAndUpdate(
      { 
        _id: req.params.id,
        uploaded_by_user_id: req.user!.user_id 
      },
      { $set: req.body },
      { new: true }
    );

    if (!manual) {
      return res.status(404).json({ error: 'Service manual not found' });
    }

    return res.json({ manual, success: true });
  } catch (error) {
    console.error('Update service manual error:', error);
    return res.status(500).json({ error: 'Failed to update service manual' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const manual = await ServiceManual.findOneAndDelete({ 
      _id: req.params.id,
      uploaded_by_user_id: req.user!.user_id 
    });

    if (!manual) {
      return res.status(404).json({ error: 'Service manual not found' });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Delete service manual error:', error);
    return res.status(500).json({ error: 'Failed to delete service manual' });
  }
});

export default router;
