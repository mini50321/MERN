import express, { Response } from 'express';
import { User } from '../models/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findOne({ user_id: req.user!.user_id });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ profile: user });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

const updateUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const updateData = req.body;
    const user = await User.findOneAndUpdate(
      { user_id: req.user!.user_id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ profile: user, success: true });
  } catch (error: any) {
    console.error('Update user error:', error);
    console.error('Error details:', error?.message, error?.stack);
    return res.status(500).json({ 
      error: 'Failed to update user profile',
      details: error?.message || 'Unknown error'
    });
  }
};

router.put('/me', authMiddleware, updateUserProfile);
router.put('/', authMiddleware, updateUserProfile);

export default router;
