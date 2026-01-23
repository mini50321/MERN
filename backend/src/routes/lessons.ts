import express, { type Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

router.post('/:lessonId/complete', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json({
      success: true,
      is_completed: true
    });
  } catch (error) {
    console.error('Complete lesson error:', error);
    return res.status(500).json({ error: 'Failed to complete lesson' });
  }
});

export default router;


