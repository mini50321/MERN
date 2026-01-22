import express, { Response } from 'express';
import { SupportTicket } from '../models/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const tickets = await SupportTicket.find({ user_id: req.user!.user_id })
      .sort({ created_at: -1 });
    
    return res.json(tickets);
  } catch (error) {
    console.error('Get support tickets error:', error);
    return res.status(500).json({ error: 'Failed to fetch support tickets' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.body.subject || !req.body.message) {
      return res.status(400).json({ error: 'Subject and message are required' });
    }

    const ticket = await SupportTicket.create({
      user_id: req.user!.user_id,
      subject: req.body.subject,
      message: req.body.message,
      status: 'open'
    });

    return res.status(201).json({ id: ticket._id, success: true });
  } catch (error) {
    console.error('Create support ticket error:', error);
    return res.status(500).json({ error: 'Failed to create support ticket' });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const ticket = await SupportTicket.findOne({ 
      _id: req.params.id,
      user_id: req.user!.user_id 
    });
    
    if (!ticket) {
      return res.status(404).json({ error: 'Support ticket not found' });
    }

    return res.json(ticket);
  } catch (error) {
    console.error('Get support ticket error:', error);
    return res.status(500).json({ error: 'Failed to fetch support ticket' });
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const ticket = await SupportTicket.findOneAndUpdate(
      { 
        _id: req.params.id,
        user_id: req.user!.user_id 
      },
      { $set: req.body },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({ error: 'Support ticket not found' });
    }

    return res.json({ ticket, success: true });
  } catch (error) {
    console.error('Update support ticket error:', error);
    return res.status(500).json({ error: 'Failed to update support ticket' });
  }
});

export default router;
