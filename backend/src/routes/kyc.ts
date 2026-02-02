import express, { Response, NextFunction } from 'express';
import multer from 'multer';
import { User, KYCSubmission } from '../models/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed'));
    }
  }
});

const handleMulterError = (err: any, _req: express.Request, res: Response, next: express.NextFunction) => {
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

router.get('/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findOne({ user_id: req.user!.user_id });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const latestSubmission = await KYCSubmission.findOne({ user_id: req.user!.user_id })
      .sort({ submitted_at: -1 })
      .lean();

    let status: string;
    if (user.is_verified) {
      status = 'approved';
    } else if (latestSubmission) {
      status = latestSubmission.status;
    } else {
      status = 'not_submitted';
    }

    return res.json({
      status,
      is_verified: user.is_verified || false,
      kyc_submission: latestSubmission ? {
        status: latestSubmission.status,
        rejection_reason: latestSubmission.rejection_reason,
        submitted_at: latestSubmission.submitted_at,
        reviewed_at: latestSubmission.reviewed_at
      } : null,
      message: status === 'approved' 
        ? 'KYC verification completed' 
        : status === 'rejected'
        ? 'KYC verification rejected'
        : status === 'pending'
        ? 'KYC verification pending'
        : 'KYC verification required'
    });
  } catch (error) {
    console.error('Get KYC status error:', error);
    return res.status(500).json({ error: 'Failed to fetch KYC status' });
  }
});

router.post('/upload-document', authMiddleware, (req: AuthRequest, res: Response, next: express.NextFunction) => {
  upload.single('document')(req, res, (err: any) => {
    if (err) {
      return handleMulterError(err, req, res, next);
    }
    next();
  });
}, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const file = req.file;
    
    if (file.size > 10 * 1024 * 1024) {
      return res.status(413).json({ error: 'File is too large. Maximum size is 10MB.' });
    }

    const fileUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    return res.json({
      success: true,
      file_url: fileUrl,
      message: 'Document uploaded successfully'
    });
  } catch (error: any) {
    console.error('Upload KYC document error:', error);
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File is too large. Maximum size is 10MB.' });
      }
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to upload document' });
  }
});

router.post('/submit', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { full_name, id_proof_url, pan_card_url, experience_certificate_url } = req.body;

    if (!full_name || !id_proof_url || !pan_card_url || !experience_certificate_url) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingSubmission = await KYCSubmission.findOne({
      user_id: req.user!.user_id,
      status: { $in: ['pending', 'approved'] }
    });

    if (existingSubmission) {
      if (existingSubmission.status === 'approved') {
        return res.status(400).json({ error: 'KYC already approved' });
      }
      return res.status(400).json({ error: 'You already have a pending KYC submission' });
    }

    const submission = await KYCSubmission.create({
      user_id: req.user!.user_id,
      full_name,
      id_proof_url,
      pan_card_url,
      experience_certificate_url,
      status: 'pending'
    });

    return res.status(201).json({
      success: true,
      id: submission._id.toString(),
      message: 'KYC verification request submitted successfully',
      status: 'pending'
    });
  } catch (error) {
    console.error('Submit KYC error:', error);
    return res.status(500).json({ error: 'Failed to submit KYC verification' });
  }
});

export default router;

