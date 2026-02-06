import express, { type Response } from 'express';
import multer from 'multer';
import { ChatMessage, ChatReply, User } from '../models/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.get('/messages', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const scope = (req.query.scope as string) || 'global';
    const userId = req.user!.user_id;

    const user = await User.findOne({ user_id: userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profile = (user as any).profile || {};
    const userProfession = profile.profession || 'biomedical_engineer';
    const userState = profile.state || null;
    const userCountry = profile.country || null;

    let query: any = {
      chat_scope: scope,
      $or: [
        { profession: userProfession },
        { profession: null }
      ]
    };

    if (scope === 'state' && userState) {
      query.scope_value = userState;
    } else if (scope === 'country' && userCountry) {
      query.scope_value = userCountry;
    }

    const messages = await ChatMessage.find(query)
      .sort({ created_at: -1 })
      .limit(100)
      .lean();

    const messagesWithMetadata = await Promise.all(
      messages.map(async (msg: any) => {
        const messageUser = await User.findOne({ user_id: msg.user_id });
        const profile = (messageUser as any)?.profile || {};
        
        const repliesCount = await ChatReply.countDocuments({
          parent_message_id: msg._id.toString()
        });

        return {
          id: msg._id.toString(),
          user_id: msg.user_id,
          message: msg.message,
          chat_scope: msg.chat_scope,
          scope_value: msg.scope_value,
          created_at: msg.created_at,
          full_name: profile.full_name || messageUser?.full_name || null,
          profile_picture_url: profile.profile_picture_url || messageUser?.profile_picture_url || null,
          country: profile.country || messageUser?.country || null,
          state: profile.state || messageUser?.state || null,
          email: messageUser?.email || messageUser?.patient_email || null,
          attachment_url: msg.attachment_url || null,
          attachment_type: msg.attachment_type || null,
          attachment_name: msg.attachment_name || null,
          reactions: [],
          user_reactions: [],
          replies_count: repliesCount
        };
      })
    );

    return res.json(messagesWithMetadata);
  } catch (error: any) {
    console.error('Get chat messages error:', error);
    return res.status(500).json({ error: 'Failed to fetch chat messages' });
  }
});

router.post('/messages', authMiddleware, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.user_id;
    const { message, chat_scope } = req.body;

    const user = await User.findOne({ user_id: userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profile = (user as any).profile || {};
    const profession = profile.profession || 'biomedical_engineer';
    const state = profile.state || null;
    const country = profile.country || null;

    let scope_value = null;
    if (chat_scope === 'state' && state) {
      scope_value = state;
    } else if (chat_scope === 'country' && country) {
      scope_value = country;
    }

    let attachment_url = null;
    let attachment_type = null;
    let attachment_name = null;

    if (req.file) {
      const base64 = req.file.buffer.toString('base64');
      const dataUrl = `data:${req.file.mimetype};base64,${base64}`;
      attachment_url = dataUrl;
      attachment_type = req.file.mimetype;
      attachment_name = req.file.originalname;
    }

    const chatMessage = await ChatMessage.create({
      user_id: userId,
      message: message || ' ',
      chat_scope: chat_scope || 'global',
      scope_value,
      profession,
      attachment_url,
      attachment_type,
      attachment_name
    });

    return res.status(201).json({
      id: chatMessage._id.toString(),
      success: true
    });
  } catch (error: any) {
    console.error('Create chat message error:', error);
    return res.status(500).json({ error: 'Failed to create chat message' });
  }
});

router.delete('/messages/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const messageId = req.params.id;
    const userId = req.user!.user_id;

    const message = await ChatMessage.findOne({
      _id: messageId,
      user_id: userId
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    await ChatMessage.deleteOne({ _id: messageId });
    await ChatReply.deleteMany({ parent_message_id: messageId });

    return res.json({ success: true });
  } catch (error: any) {
    console.error('Delete chat message error:', error);
    return res.status(500).json({ error: 'Failed to delete chat message' });
  }
});

router.get('/messages/:id/replies', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const messageId = req.params.id;

    const replies = await ChatReply.find({ parent_message_id: messageId })
      .sort({ created_at: 1 })
      .lean();

    const repliesWithMetadata = await Promise.all(
      replies.map(async (reply: any) => {
        const replyUser = await User.findOne({ user_id: reply.user_id });
        const profile = (replyUser as any)?.profile || {};

        return {
          id: reply._id.toString(),
          parent_message_id: reply.parent_message_id,
          user_id: reply.user_id,
          message: reply.message,
          created_at: reply.created_at,
          full_name: profile.full_name || null,
          profile_picture_url: profile.profile_picture_url || null
        };
      })
    );

    return res.json(repliesWithMetadata);
  } catch (error: any) {
    console.error('Get chat replies error:', error);
    return res.status(500).json({ error: 'Failed to fetch chat replies' });
  }
});

router.post('/messages/:id/reply', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const messageId = req.params.id;
    const userId = req.user!.user_id;
    const { message } = req.body;

    const chatReply = await ChatReply.create({
      parent_message_id: messageId,
      user_id: userId,
      message
    });

    return res.status(201).json({
      id: chatReply._id.toString(),
      success: true
    });
  } catch (error: any) {
    console.error('Create chat reply error:', error);
    return res.status(500).json({ error: 'Failed to create chat reply' });
  }
});

router.post('/messages/:id/react', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json({ success: true, message: 'Reaction feature not yet implemented' });
  } catch (error: any) {
    console.error('React to chat message error:', error);
    return res.status(500).json({ error: 'Failed to react to chat message' });
  }
});

export default router;

