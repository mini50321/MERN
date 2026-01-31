import express, { Response } from 'express';
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

router.get('/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findOne({ user_id: req.user!.user_id });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const latestSubmission = await KYCSubmission.findOne({ user_id: req.user!.user_id })
      .sort({ submitted_at: -1 })
      .lean();

    const status = user.is_verified ? 'approved' : (latestSubmission?.status || 'pending');

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
        : 'KYC verification pending'
    });
  } catch (error) {
    console.error('Get KYC status error:', error);
    return res.status(500).json({ error: 'Failed to fetch KYC status' });
  }
});

router.post('/upload-document', authMiddleware, upload.single('document'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const file = req.file;
    const fileUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    return res.json({
      success: true,
      file_url: fileUrl,
      message: 'Document uploaded successfully'
    });
  } catch (error) {
    console.error('Upload KYC document error:', error);
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

