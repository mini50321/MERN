import express, { type Request, type Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

type ManualRequestRecord = {
  id: number;
  user_id: string;
  equipment_name: string;
  manufacturer?: string | null;
  model_number?: string | null;
  description?: string | null;
  created_at: Date;
};

type ManualReplyRecord = {
  id: number;
  request_id: number;
  user_id: string;
  message: string;
  created_at: Date;
};

let manualRequests: ManualRequestRecord[] = [];
let manualReplies: ManualReplyRecord[] = [];
let nextRequestId = 1;
let nextReplyId = 1;

router.get('/', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json(manualRequests);
  } catch (error) {
    console.error('Get manual requests error:', error);
    return res.status(500).json({ error: 'Failed to fetch manual requests' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const body = req.body as {
      equipment_name?: string;
      manufacturer?: string;
      model_number?: string;
      description?: string;
    };

    if (!body.equipment_name) {
      return res.status(400).json({ error: 'Equipment name is required' });
    }

    const record: ManualRequestRecord = {
      id: nextRequestId++,
      user_id: req.user!.user_id,
      equipment_name: body.equipment_name,
      manufacturer: body.manufacturer || null,
      model_number: body.model_number || null,
      description: body.description || null,
      created_at: new Date()
    };

    manualRequests.unshift(record);

    return res.status(201).json({ success: true, id: record.id });
  } catch (error) {
    console.error('Create manual request error:', error);
    return res.status(500).json({ error: 'Failed to create manual request' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const beforeCount = manualRequests.length;
    manualRequests = manualRequests.filter(r => r.id !== id || r.user_id !== req.user!.user_id);

    if (manualRequests.length === beforeCount) {
      return res.status(404).json({ error: 'Request not found' });
    }

    manualReplies = manualReplies.filter(r => r.request_id !== id);

    return res.json({ success: true });
  } catch (error) {
    console.error('Delete manual request error:', error);
    return res.status(500).json({ error: 'Failed to delete manual request' });
  }
});

router.post('/:id/reply', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const existing = manualRequests.find(r => r.id === id);

    if (!existing) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const message = (req.body?.message as string) || (req.body?.get?.('message') as string) || '';

    if (!message) {
      return res.status(400).json({ error: 'Reply message is required' });
    }

    const reply: ManualReplyRecord = {
      id: nextReplyId++,
      request_id: id,
      user_id: req.user!.user_id,
      message,
      created_at: new Date()
    };

    manualReplies.push(reply);

    return res.status(201).json({ success: true, id: reply.id });
  } catch (error) {
    console.error('Create manual reply error:', error);
    return res.status(500).json({ error: 'Failed to create manual reply' });
  }
});

router.get('/:id/replies', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const replies = manualReplies
      .filter(r => r.request_id === id)
      .sort((a, b) => a.created_at.getTime() - b.created_at.getTime());

    return res.json(replies);
  } catch (error) {
    console.error('Get manual replies error:', error);
    return res.status(500).json({ error: 'Failed to fetch manual replies' });
  }
});

export default router;


