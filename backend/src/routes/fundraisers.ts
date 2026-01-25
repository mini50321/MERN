import express, { type Request, type Response, type NextFunction } from 'express';
import multer from 'multer';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { Fundraiser } from '../models/index.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    try {
      if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Only image and PDF files are allowed'));
      }
    } catch (error) {
      cb(error as Error);
    }
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, case_type } = req.query;
    const query: any = { 
      $or: [
        { status: 'approved' },
        { status: 'pending' }
      ]
    };
    
    if (category) query.category = category;
    if (case_type) query.case_type = case_type;

    const fundraisers = await Fundraiser.find(query)
      .sort({ created_at: -1 })
      .lean();
    
    const formatted = fundraisers.map(f => ({
      id: f._id.toString(),
      title: f.title,
      description: f.description,
      category: f.category,
      case_type: f.case_type,
      goal_amount: f.goal_amount,
      current_amount: f.current_amount,
      currency: f.currency,
      beneficiary_name: f.beneficiary_name,
      image_url: f.image_url,
      donations_count: f.donations_count,
      progress_percentage: f.goal_amount > 0 ? (f.current_amount / f.goal_amount) * 100 : 0,
      status: f.status,
      created_by_user_id: f.created_by_user_id,
      end_date: f.end_date,
      beneficiary_contact: f.beneficiary_contact,
      documents: f.documents
    }));
    
    return res.json(formatted);
  } catch (error) {
    console.error('Get fundraisers error:', error);
    return res.status(500).json({ error: 'Failed to fetch fundraisers' });
  }
});

const handleMulterError = (err: any, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File is too large. Maximum size is 10MB.' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message || 'File upload error' });
  }
  return next();
};

router.post('/upload-image', authMiddleware, upload.single('image'), handleMulterError, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const file = req.file;
    
    if (!file.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: 'File must be an image' });
    }

    const base64Image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    return res.json({
      success: true,
      image_url: base64Image,
      message: 'Image uploaded successfully'
    });
  } catch (error: any) {
    console.error('Upload fundraiser image error:', error);
    return res.status(500).json({ error: 'Failed to upload image' });
  }
});

router.post('/upload-document', authMiddleware, (req: AuthRequest, res: Response, next: NextFunction) => {
  upload.single('document')(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ error: 'Document file is too large. Maximum size is 10MB.' });
        }
        return res.status(400).json({ error: err.message });
      }
      return res.status(400).json({ error: err.message || 'File upload error' });
    }
    return next();
  });
}, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No document file provided' });
    }

    const file = req.file;
    
    if (!file.mimetype.startsWith('image/') && file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'File must be an image or PDF' });
    }

    const documentType = req.body.document_type || 'Other';
    
    try {
      const base64File = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

      return res.json({
        success: true,
        file_url: base64File,
        file_name: file.originalname,
        document_type: documentType,
        message: 'Document uploaded successfully'
      });
    } catch (conversionError) {
      console.error('Base64 conversion error:', conversionError);
      return res.status(500).json({ error: 'Failed to process document. File may be too large.' });
    }
  } catch (error) {
    console.error('Upload fundraiser document error:', error);
    return res.status(500).json({ error: 'Failed to upload document' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      description,
      category,
      case_type,
      goal_amount,
      beneficiary_name,
      beneficiary_contact,
      image_url,
      end_date,
      documents
    } = req.body;

    if (!title || !description || !category || !case_type || !goal_amount || !beneficiary_name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({ error: 'At least one supporting document is required' });
    }

    const fundraiser = await Fundraiser.create({
      title: String(title),
      description: String(description),
      category: String(category),
      case_type: String(case_type),
      goal_amount: parseFloat(String(goal_amount)),
      current_amount: 0,
      currency: req.body.currency || 'USD',
      beneficiary_name: String(beneficiary_name),
      beneficiary_contact: beneficiary_contact ? String(beneficiary_contact) : null,
      image_url: image_url || null,
      end_date: end_date ? new Date(end_date) : null,
      documents: documents.map((doc: any) => ({
        document_type: String(doc.document_type),
        file_url: String(doc.file_url),
        file_name: String(doc.file_name || 'document')
      })),
      created_by_user_id: req.user!.user_id,
      status: 'pending',
      donations_count: 0
    });

    return res.status(201).json({
      success: true,
      id: fundraiser._id.toString(),
      message: 'Fundraiser submitted for review'
    });
  } catch (error) {
    console.error('Create fundraiser error:', error);
    return res.status(500).json({ error: 'Failed to create fundraiser' });
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const fundraiserId = req.params.id;
    const body = req.body;

    const fundraiser = await Fundraiser.findById(fundraiserId);

    if (!fundraiser) {
      return res.status(404).json({ error: 'Fundraiser not found' });
    }

    if (fundraiser.created_by_user_id !== req.user!.user_id) {
      return res.status(403).json({ error: 'Not authorized to edit this fundraiser' });
    }

    if (body.title) fundraiser.title = String(body.title);
    if (body.description) fundraiser.description = String(body.description);
    if (body.category) fundraiser.category = String(body.category);
    if (body.case_type) fundraiser.case_type = String(body.case_type);
    if (body.goal_amount !== undefined) fundraiser.goal_amount = parseFloat(String(body.goal_amount));
    if (body.currency) fundraiser.currency = String(body.currency);
    if (body.beneficiary_name) fundraiser.beneficiary_name = String(body.beneficiary_name);
    if (body.beneficiary_contact !== undefined) fundraiser.beneficiary_contact = body.beneficiary_contact ? String(body.beneficiary_contact) : null;
    if (body.image_url !== undefined) fundraiser.image_url = body.image_url || null;
    if (body.end_date !== undefined) fundraiser.end_date = body.end_date ? new Date(body.end_date) : null;
    if (body.documents && Array.isArray(body.documents)) {
      fundraiser.documents = body.documents.map((doc: any) => ({
        document_type: String(doc.document_type),
        file_url: String(doc.file_url),
        file_name: String(doc.file_name || 'document')
      }));
    }

    await fundraiser.save();

    return res.json({ success: true, fundraiser });
  } catch (error) {
    console.error('Update fundraiser error:', error);
    return res.status(500).json({ error: 'Failed to update fundraiser' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const fundraiserId = req.params.id;

    const fundraiser = await Fundraiser.findById(fundraiserId);

    if (!fundraiser) {
      return res.status(404).json({ error: 'Fundraiser not found' });
    }

    if (fundraiser.created_by_user_id !== req.user!.user_id) {
      return res.status(403).json({ error: 'Not authorized to delete this fundraiser' });
    }

    await Fundraiser.findByIdAndDelete(fundraiserId);

    return res.json({ success: true });
  } catch (error) {
    console.error('Delete fundraiser error:', error);
    return res.status(500).json({ error: 'Failed to delete fundraiser' });
  }
});

router.post('/:id/donate', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { amount, message } = req.body;
    const fundraiserId = req.params.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid donation amount' });
    }

    const fundraiser = await Fundraiser.findById(fundraiserId);
    if (!fundraiser) {
      return res.status(404).json({ error: 'Fundraiser not found' });
    }

    fundraiser.current_amount += parseFloat(amount);
    fundraiser.donations_count += 1;
    await fundraiser.save();

    return res.json({
      success: true,
      donation_id: `donation_${Date.now()}`,
      fundraiser_id: fundraiserId,
      amount: parseFloat(amount),
      message: message || null
    });
  } catch (error) {
    console.error('Donate to fundraiser error:', error);
    return res.status(500).json({ error: 'Failed to process donation' });
  }
});

export default router;

