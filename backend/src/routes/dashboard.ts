import express, { type Request, type Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json({
      connections: 0,
      certificates: 0,
      xp: 0,
      badges: 0
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

export default router;

