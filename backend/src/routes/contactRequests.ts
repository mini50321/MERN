import express, { type Response } from 'express';
import { ContactRequest, ContactReply, User } from '../models/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const scope = (req.query.scope as string) || 'global';
    const userId = req.user!.user_id;

    const user = await User.findOne({ user_id: userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profile = (user as any).profile || {};
    const userState = profile.state || null;
    const userCountry = profile.country || null;

    let query: any = {
      chat_scope: scope
    };

    if (scope === 'state' && userState) {
      query.scope_value = userState;
    } else if (scope === 'country' && userCountry) {
      query.scope_value = userCountry;
    }

    const requests = await ContactRequest.find(query)
      .sort({ created_at: -1 })
      .limit(100)
      .lean();

    const requestsWithMetadata = await Promise.all(
      requests.map(async (req: any) => {
        const requestUser = await User.findOne({ user_id: req.user_id });
        const profile = (requestUser as any)?.profile || {};
        
        const repliesCount = await ContactReply.countDocuments({
          request_id: req._id.toString()
        });

        return {
          id: req._id.toString(),
          user_id: req.user_id,
          company_name: req.company_name,
          hospital_name: req.hospital_name || null,
          location: req.location || null,
          description: req.description || null,
          status: req.status,
          full_name: profile.full_name || null,
          profile_picture_url: profile.profile_picture_url || null,
          replies_count: repliesCount,
          created_at: req.created_at
        };
      })
    );

    return res.json(requestsWithMetadata);
  } catch (error: any) {
    console.error('Get contact requests error:', error);
    return res.status(500).json({ error: 'Failed to fetch contact requests' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.user_id;
    const { company_name, hospital_name, location, description, chat_scope } = req.body;

    const user = await User.findOne({ user_id: userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profile = (user as any).profile || {};
    const state = profile.state || null;
    const country = profile.country || null;

    let scope_value = null;
    if (chat_scope === 'state' && state) {
      scope_value = state;
    } else if (chat_scope === 'country' && country) {
      scope_value = country;
    }

    const contactRequest = await ContactRequest.create({
      user_id: userId,
      company_name,
      hospital_name: hospital_name || null,
      location: location || null,
      description: description || null,
      status: 'pending',
      chat_scope: chat_scope || 'global',
      scope_value
    });

    return res.status(201).json({
      id: contactRequest._id.toString(),
      success: true
    });
  } catch (error: any) {
    console.error('Create contact request error:', error);
    return res.status(500).json({ error: 'Failed to create contact request' });
  }
});

router.get('/:requestId/replies', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const requestId = req.params.requestId;

    const replies = await ContactReply.find({ request_id: requestId })
      .sort({ created_at: 1 })
      .lean();

    const repliesWithMetadata = await Promise.all(
      replies.map(async (reply: any) => {
        const replyUser = await User.findOne({ user_id: reply.user_id });
        const profile = (replyUser as any)?.profile || {};

        return {
          id: reply._id.toString(),
          request_id: reply.request_id,
          user_id: reply.user_id,
          contact_name: reply.contact_name,
          contact_phone: reply.contact_phone || null,
          contact_email: reply.contact_email || null,
          contact_designation: reply.contact_designation || null,
          additional_notes: reply.additional_notes || null,
          full_name: profile.full_name || null,
          profile_picture_url: profile.profile_picture_url || null,
          created_at: reply.created_at
        };
      })
    );

    return res.json(repliesWithMetadata);
  } catch (error: any) {
    console.error('Get contact replies error:', error);
    return res.status(500).json({ error: 'Failed to fetch contact replies' });
  }
});

router.post('/:requestId/reply', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const requestId = req.params.requestId;
    const userId = req.user!.user_id;
    const { contact_name, contact_phone, contact_email, contact_designation, additional_notes } = req.body;

    const contactReply = await ContactReply.create({
      request_id: requestId,
      user_id: userId,
      contact_name,
      contact_phone: contact_phone || null,
      contact_email: contact_email || null,
      contact_designation: contact_designation || null,
      additional_notes: additional_notes || null
    });

    return res.status(201).json({
      id: contactReply._id.toString(),
      success: true
    });
  } catch (error: any) {
    console.error('Create contact reply error:', error);
    return res.status(500).json({ error: 'Failed to create contact reply' });
  }
});

router.put('/:requestId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const requestId = req.params.requestId;
    const userId = req.user!.user_id;
    const { company_name, hospital_name, location, description } = req.body;

    const request = await ContactRequest.findOne({
      _id: requestId,
      user_id: userId
    });

    if (!request) {
      return res.status(404).json({ error: 'Contact request not found' });
    }

    const updatedRequest = await ContactRequest.findOneAndUpdate(
      { _id: requestId, user_id: userId },
      {
        company_name,
        hospital_name: hospital_name || null,
        location: location || null,
        description: description || null
      },
      { new: true }
    );

    return res.json({
      id: updatedRequest!._id.toString(),
      success: true
    });
  } catch (error: any) {
    console.error('Update contact request error:', error);
    return res.status(500).json({ error: 'Failed to update contact request' });
  }
});

router.delete('/:requestId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const requestId = req.params.requestId;
    const userId = req.user!.user_id;

    const request = await ContactRequest.findOne({
      _id: requestId,
      user_id: userId
    });

    if (!request) {
      return res.status(404).json({ error: 'Contact request not found' });
    }

    await ContactRequest.deleteOne({ _id: requestId });
    await ContactReply.deleteMany({ request_id: requestId });

    return res.json({ success: true });
  } catch (error: any) {
    console.error('Delete contact request error:', error);
    return res.status(500).json({ error: 'Failed to delete contact request' });
  }
});

export default router;

