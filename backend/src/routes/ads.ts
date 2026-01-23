import express, { Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

router.get('/banners', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json([]);
  } catch (error) {
    console.error('Get banner ads error:', error);
    return res.status(500).json({ error: 'Failed to fetch banner ads' });
  }
});

export default router;


