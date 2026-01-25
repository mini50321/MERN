import express, { type Response } from 'express';
import multer from 'multer';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

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

router.post('/:id/reply', authMiddleware, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const existing = manualRequests.find(r => r.id === id);

    if (!existing) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const file = req.file;
    const manualTitle = req.body.manual_title as string;
    const message = (req.body.message as string) || '';

    if (!file) {
      return res.status(400).json({ error: 'PDF file is required' });
    }

    if (!manualTitle || !manualTitle.trim()) {
      return res.status(400).json({ error: 'Manual title is required' });
    }

    if (file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Only PDF files are allowed' });
    }

    const base64File = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    const reply: ManualReplyRecord = {
      id: nextReplyId++,
      request_id: id,
      user_id: req.user!.user_id,
      message: message || `Shared manual: ${manualTitle}`,
      created_at: new Date()
    };

    manualReplies.push(reply);

    return res.status(201).json({ 
      success: true, 
      id: reply.id,
      file_url: base64File,
      manual_title: manualTitle
    });
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

export default router;


