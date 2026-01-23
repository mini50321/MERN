import express, { type Request, type Response, type NextFunction } from 'express';
import multer from 'multer';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

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

router.get('/', async (_req: Request, res: Response) => {
  try {
    return res.json([]);
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

router.post('/upload-document', authMiddleware, upload.single('document'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No document file provided' });
    }

    const file = req.file;
    const documentType = req.body.document_type || 'Other';
    const base64File = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    return res.json({
      success: true,
      file_url: base64File,
      file_name: file.originalname,
      document_type: documentType,
      message: 'Document uploaded successfully'
    });
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
      beneficiary_contact: _beneficiary_contact,
      image_url: _image_url,
      end_date: _end_date,
      documents
    } = req.body;

    if (!title || !description || !category || !case_type || !goal_amount || !beneficiary_name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({ error: 'At least one supporting document is required' });
    }

    return res.status(201).json({
      success: true,
      id: `fundraiser_${Date.now()}`,
      message: 'Fundraiser submitted for review'
    });
  } catch (error) {
    console.error('Create fundraiser error:', error);
    return res.status(500).json({ error: 'Failed to create fundraiser' });
  }
});

router.post('/:id/donate', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { amount, message } = req.body;
    const fundraiserId = req.params.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid donation amount' });
    }

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

