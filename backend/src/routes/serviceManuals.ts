import express, { type Request, type Response } from 'express';
import multer from 'multer';
import { ServiceManual, User } from '../models/index.js';
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
      .sort({ created_at: -1 })
      .lean();
    
    const formattedManuals = manuals.map(manual => ({
      ...manual,
      id: manual._id.toString(),
      uploaded_by_user_id: manual.uploaded_by_user_id
    }));
    
    return res.json(formattedManuals);
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
    const manualId = req.params.id;
    const userId = req.user!.user_id;
    const user = await User.findOne({ user_id: userId });
    const isAdmin = user?.is_admin === true || 
                    user?.role === 'admin' || 
                    user?.role === 'super_admin' ||
                    user?.email === 'mavytechsolutions@gmail.com' ||
                    user?.patient_email === 'mavytechsolutions@gmail.com';
    
    let manual;
    let actualManualId: string | null = null;
    
    if (manualId.match(/^[0-9a-fA-F]{24}$/)) {
      actualManualId = manualId;
    } else {
      const allManuals = await ServiceManual.find().lean();
      const found = allManuals.find(m => {
        const idNum = parseInt(m._id.toString().slice(-8), 16);
        return idNum === parseInt(manualId, 10);
      });
      if (found) {
        actualManualId = found._id.toString();
      }
    }

    if (!actualManualId) {
      return res.status(404).json({ error: 'Service manual not found' });
    }

    if (isAdmin) {
      manual = await ServiceManual.findByIdAndUpdate(
        actualManualId,
        { $set: req.body },
        { new: true, runValidators: true }
      );
    } else {
      manual = await ServiceManual.findOneAndUpdate(
        { 
          _id: actualManualId,
          uploaded_by_user_id: userId 
        },
        { $set: req.body },
        { new: true, runValidators: true }
      );
    }

    if (!manual) {
      return res.status(404).json({ error: 'Service manual not found or user not authorized' });
    }

    return res.json({ manual, success: true });
  } catch (error) {
    console.error('Update service manual error:', error);
    return res.status(500).json({ error: 'Failed to update service manual' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const manualId = req.params.id;
    const userId = req.user!.user_id;
    const user = await User.findOne({ user_id: userId });
    const isAdmin = user?.is_admin === true || 
                    user?.role === 'admin' || 
                    user?.role === 'super_admin' ||
                    user?.email === 'mavytechsolutions@gmail.com' ||
                    user?.patient_email === 'mavytechsolutions@gmail.com';
    
    let manual;
    let actualManualId: string | null = null;
    
    if (manualId.match(/^[0-9a-fA-F]{24}$/)) {
      actualManualId = manualId;
    } else {
      const allManuals = await ServiceManual.find().lean();
      const found = allManuals.find(m => {
        const idNum = parseInt(m._id.toString().slice(-8), 16);
        return idNum === parseInt(manualId, 10);
      });
      if (found) {
        actualManualId = found._id.toString();
      }
    }

    if (!actualManualId) {
      return res.status(404).json({ error: 'Service manual not found' });
    }

    if (isAdmin) {
      manual = await ServiceManual.findById(actualManualId);
    } else {
      manual = await ServiceManual.findOne({ 
        _id: actualManualId,
        uploaded_by_user_id: userId 
      });
    }

    if (!manual) {
      return res.status(404).json({ error: 'Service manual not found or user not authorized' });
    }

    await ServiceManual.findByIdAndDelete(manual._id);
    return res.json({ success: true });
  } catch (error) {
    console.error('Delete service manual error:', error);
    return res.status(500).json({ error: 'Failed to delete service manual' });
  }
});

export default router;
