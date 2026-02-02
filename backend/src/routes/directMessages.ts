import express, { Response } from 'express';
import { DirectMessage, User } from '../models/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

router.get('/direct-messages/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user!.user_id;

    const messages = await DirectMessage.find({
      $or: [
        { sender_user_id: currentUserId, receiver_user_id: userId },
        { sender_user_id: userId, receiver_user_id: currentUserId }
      ]
    })
      .sort({ created_at: 1 })
      .lean();

    const formattedMessages = messages.map(msg => ({
      id: parseInt(msg._id.toString().slice(-8), 16) || Date.now(),
      sender_user_id: msg.sender_user_id,
      receiver_user_id: msg.receiver_user_id,
      message: msg.message,
      created_at: msg.created_at,
      is_read: msg.is_read
    }));

    await DirectMessage.updateMany(
      {
        sender_user_id: userId,
        receiver_user_id: currentUserId,
        is_read: false
      },
      {
        $set: { is_read: true }
      }
    );

    return res.json(formattedMessages);
  } catch (error) {
    console.error('Get direct messages error:', error);
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.post('/direct-messages/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user!.user_id;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const receiver = await User.findOne({ user_id: userId });
    if (!receiver) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newMessage = await DirectMessage.create({
      sender_user_id: currentUserId,
      receiver_user_id: userId,
      message: message.trim()
    });

    const idStr = newMessage._id.toString();
    const idNum = parseInt(idStr.slice(-8), 16) || Date.now();

    return res.status(201).json({
      id: idNum,
      sender_user_id: newMessage.sender_user_id,
      receiver_user_id: newMessage.receiver_user_id,
      message: newMessage.message,
      is_read: newMessage.is_read,
      created_at: newMessage.created_at,
      success: true
    });
  } catch (error) {
    console.error('Send direct message error:', error);
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;

