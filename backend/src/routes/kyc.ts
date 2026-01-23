import express, { Response } from 'express';
import { User } from '../models/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = express.Router();


router.get('/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findOne({ user_id: req.user!.user_id });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

  
    const status = user.is_verified ? 'approved' : 'pending';

    return res.json({
      status,
      is_verified: user.is_verified || false,
      message: status === 'approved' 
        ? 'KYC verification completed' 
        : 'KYC verification pending'
    });
  } catch (error) {
    console.error('Get KYC status error:', error);
    return res.status(500).json({ error: 'Failed to fetch KYC status' });
  }
});


router.post('/upload-document', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
   

    return res.json({
      success: true,
      document_id: `doc_${Date.now()}`,
      message: 'Document uploaded successfully'
    });
  } catch (error) {
    console.error('Upload KYC document error:', error);
    return res.status(500).json({ error: 'Failed to upload document' });
  }
});


router.post('/submit', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
   

    return res.json({
      success: true,
      message: 'KYC verification request submitted successfully',
      status: 'pending'
    });
  } catch (error) {
    console.error('Submit KYC error:', error);
    return res.status(500).json({ error: 'Failed to submit KYC verification' });
  }
});

export default router;

