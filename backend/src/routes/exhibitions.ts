import express, { type Request, type Response } from 'express';
import multer from 'multer';
import { Exhibition, ExhibitionComment, ExhibitionCommentReply, ExhibitionResponse, User } from '../models/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, city, state, country } = req.query;
    const query: any = {};
    
    if (category) query.category = category;
    if (city) query.city = city;
    if (state) query.state = state;
    if (country) query.country = country;

    const exhibitions = await Exhibition.find(query)
      .sort({ created_at: -1 })
      .limit(50)
      .lean();
    
    const jwt = await import('jsonwebtoken');
    
    let currentUserId: string | null = null;
    try {
      const token = (req.headers.authorization?.replace('Bearer ', '') || 
                    (req as any).cookies?.mavy_session);
      if (token) {
        const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
        const decoded = jwt.verify(token, jwtSecret) as { user_id: string };
        currentUserId = decoded.user_id;
      }
    } catch {
      currentUserId = null;
    }
    
    const formattedExhibitions = await Promise.all(exhibitions.map(async (exhibition) => {
      const exhibitionId = exhibition._id.toString();
      const numericId = parseInt(exhibitionId.slice(-8), 16) || Date.now();
      
      const goingCount = await ExhibitionResponse.countDocuments({
        exhibition_id: exhibitionId,
        response_type: 'going'
      });
      
      const notGoingCount = await ExhibitionResponse.countDocuments({
        exhibition_id: exhibitionId,
        response_type: 'not_going'
      });
      
      let userResponse: 'going' | 'not_going' | null = null;
      if (currentUserId) {
        const userResponseDoc = await ExhibitionResponse.findOne({
          exhibition_id: exhibitionId,
          user_id: currentUserId
        }).lean();
        if (userResponseDoc) {
          userResponse = userResponseDoc.response_type as 'going' | 'not_going';
        }
      }
      
      return {
        ...exhibition,
        id: numericId,
        going_count: goingCount,
        not_going_count: notGoingCount,
        user_response: userResponse
      };
    }));
    
    return res.json(formattedExhibitions);
  } catch (error) {
    console.error('Get exhibitions error:', error);
    return res.status(500).json({ error: 'Failed to fetch exhibitions' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const exhibition = await Exhibition.create({
      title: req.body.title,
      description: req.body.description || null,
      category: req.body.category || null,
      image_url: req.body.image_url || null,
      location: req.body.location || null,
      venue_name: req.body.venue_name || null,
      city: req.body.city || null,
      state: req.body.state || null,
      country: req.body.country || null,
      event_start_date: req.body.event_start_date || null,
      event_end_date: req.body.event_end_date || null,
      organizer_name: req.body.organizer_name || null,
      contact_number: req.body.contact_number || null,
      website_url: req.body.website_url || null,
      registration_url: req.body.registration_url || null,
      google_maps_url: req.body.google_maps_url || null,
      posted_by_user_id: req.user!.user_id,
      is_user_post: true,
      hashtags: req.body.hashtags || null
    });

    return res.status(201).json({ id: exhibition._id, success: true });
  } catch (error) {
    console.error('Create exhibition error:', error);
    return res.status(500).json({ error: 'Failed to create exhibition' });
  }
});

router.get('/my-exhibitions', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const exhibitions = await Exhibition.find({ posted_by_user_id: req.user!.user_id })
      .sort({ created_at: -1 })
      .lean();
    
    const formattedExhibitions = exhibitions.map(exhibition => ({
      ...exhibition,
      id: exhibition._id.toString()
    }));
    
    return res.json(formattedExhibitions);
  } catch (error) {
    console.error('Get my exhibitions error:', error);
    return res.status(500).json({ error: 'Failed to fetch my exhibitions' });
  }
});

router.get('/saved', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json([]);
  } catch (error) {
    console.error('Get saved exhibitions error:', error);
    return res.status(500).json({ error: 'Failed to fetch saved exhibitions' });
  }
});

router.post('/upload-image', authMiddleware, upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const file = req.file;
    const base64Image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    return res.json({
      success: true,
      image_url: base64Image,
      message: 'Image uploaded successfully'
    });
  } catch (error) {
    console.error('Upload exhibition image error:', error);
    return res.status(500).json({ error: 'Failed to upload image' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const exhibition = await Exhibition.findById(req.params.id).lean();
    
    if (!exhibition) {
      return res.status(404).json({ error: 'Exhibition not found' });
    }

    return res.json({ ...exhibition, id: exhibition._id.toString() });
  } catch (error) {
    console.error('Get exhibition error:', error);
    return res.status(500).json({ error: 'Failed to fetch exhibition' });
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const exhibitionId = req.params.id;
    let exhibition;
    
    if (exhibitionId.match(/^[0-9a-fA-F]{24}$/)) {
      exhibition = await Exhibition.findOneAndUpdate(
        { 
          _id: exhibitionId,
          posted_by_user_id: req.user!.user_id 
        },
        { $set: req.body },
        { new: true }
      );
    } else {
      const allExhibitions = await Exhibition.find({ posted_by_user_id: req.user!.user_id }).lean();
      const found = allExhibitions.find(e => {
        const idNum = parseInt(e._id.toString().slice(-8), 16);
        return idNum === parseInt(exhibitionId, 10);
      });
      if (found) {
        exhibition = await Exhibition.findOneAndUpdate(
          { 
            _id: found._id,
            posted_by_user_id: req.user!.user_id 
          },
          { $set: req.body },
          { new: true }
        );
      }
    }

    if (!exhibition) {
      return res.status(404).json({ error: 'Exhibition not found' });
    }

    return res.json({ exhibition, success: true });
  } catch (error) {
    console.error('Update exhibition error:', error);
    return res.status(500).json({ error: 'Failed to update exhibition' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const exhibitionId = req.params.id;
    let exhibition;
    
    if (exhibitionId.match(/^[0-9a-fA-F]{24}$/)) {
      exhibition = await Exhibition.findOne({ 
        _id: exhibitionId,
        posted_by_user_id: req.user!.user_id 
      });
    } else {
      const allExhibitions = await Exhibition.find({ posted_by_user_id: req.user!.user_id }).lean();
      const found = allExhibitions.find(e => {
        const idNum = parseInt(e._id.toString().slice(-8), 16);
        return idNum === parseInt(exhibitionId, 10);
      });
      if (found) {
        exhibition = await Exhibition.findOne({ 
          _id: found._id,
          posted_by_user_id: req.user!.user_id 
        });
      }
    }

    if (!exhibition) {
      return res.status(404).json({ error: 'Exhibition not found' });
    }

    await Exhibition.findByIdAndDelete(exhibition._id);
    return res.json({ success: true });
  } catch (error) {
    console.error('Delete exhibition error:', error);
    return res.status(500).json({ error: 'Failed to delete exhibition' });
  }
});

router.post('/:id/like', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const exhibitionId = req.params.id;
    let exhibition;
    
    if (exhibitionId.match(/^[0-9a-fA-F]{24}$/)) {
      exhibition = await Exhibition.findById(exhibitionId);
    } else {
      const allExhibitions = await Exhibition.find().lean();
      const found = allExhibitions.find(e => {
        const idNum = parseInt(e._id.toString().slice(-8), 16);
        return idNum === parseInt(exhibitionId, 10);
      });
      if (found) {
        exhibition = await Exhibition.findById(found._id);
      }
    }
    
    if (!exhibition) {
      return res.status(404).json({ error: 'Exhibition not found' });
    }
    return res.json({ success: true, message: 'Like status updated' });
  } catch (error) {
    console.error('Like exhibition error:', error);
    return res.status(500).json({ error: 'Failed to like exhibition' });
  }
});

router.post('/:id/save', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const exhibition = await Exhibition.findById(req.params.id);
    if (!exhibition) {
      return res.status(404).json({ error: 'Exhibition not found' });
    }
    return res.json({ success: true, saved: true, message: 'Save status updated' });
  } catch (error) {
    console.error('Save exhibition error:', error);
    return res.status(500).json({ error: 'Failed to save exhibition' });
  }
});

router.post('/:id/response', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { response_type } = req.body;
    const exhibitionId = req.params.id;
    const userId = req.user!.user_id;
    
    if (!response_type || (response_type !== 'going' && response_type !== 'not_going')) {
      return res.status(400).json({ error: 'Invalid response_type. Must be "going" or "not_going"' });
    }
    
    let exhibition;
    let actualExhibitionId: string | null = null;
    
    if (exhibitionId.match(/^[0-9a-fA-F]{24}$/)) {
      exhibition = await Exhibition.findById(exhibitionId);
      if (exhibition) {
        actualExhibitionId = exhibition._id.toString();
      }
    } else {
      const allExhibitions = await Exhibition.find().lean();
      const found = allExhibitions.find(e => {
        const idNum = parseInt(e._id.toString().slice(-8), 16);
        return idNum === parseInt(exhibitionId, 10);
      });
      if (found) {
        actualExhibitionId = found._id.toString();
        exhibition = await Exhibition.findById(found._id);
      }
    }
    
    if (!exhibition || !actualExhibitionId) {
      return res.status(404).json({ error: 'Exhibition not found' });
    }
    
    const existingResponse = await ExhibitionResponse.findOne({
      exhibition_id: actualExhibitionId,
      user_id: userId
    });
    
    if (existingResponse) {
      if (existingResponse.response_type === response_type) {
        await ExhibitionResponse.findByIdAndDelete(existingResponse._id);
        return res.json({ 
          success: true, 
          message: 'Response removed',
          response_type: null
        });
      } else {
        existingResponse.response_type = response_type;
        await existingResponse.save();
        return res.json({ 
          success: true, 
          message: `Response updated to ${response_type}`,
          response_type: response_type
        });
      }
    } else {
      await ExhibitionResponse.create({
        exhibition_id: actualExhibitionId,
        user_id: userId,
        response_type: response_type
      });
      return res.json({ 
        success: true, 
        message: `Response ${response_type} recorded`,
        response_type: response_type
      });
    }
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Response already exists' });
    }
    console.error('Response exhibition error:', error);
    console.error('Error details:', error.message, error.stack);
    return res.status(500).json({ error: 'Failed to record response', details: error.message });
  }
});

router.post('/:id/view', async (req: Request, res: Response) => {
  try {
    const exhibitionId = req.params.id;
    let exhibition;
    
    if (exhibitionId.match(/^[0-9a-fA-F]{24}$/)) {
      exhibition = await Exhibition.findById(exhibitionId);
    } else {
      const allExhibitions = await Exhibition.find().lean();
      const found = allExhibitions.find(e => {
        const idNum = parseInt(e._id.toString().slice(-8), 16);
        return idNum === parseInt(exhibitionId, 10);
      });
      if (found) {
        exhibition = await Exhibition.findById(found._id);
      }
    }
    
    if (!exhibition) {
      return res.status(404).json({ error: 'Exhibition not found' });
    }
    return res.json({ success: true });
  } catch (error) {
    console.error('View exhibition error:', error);
    return res.status(500).json({ error: 'Failed to track view' });
  }
});

router.post('/:id/share', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const exhibition = await Exhibition.findById(req.params.id);
    if (!exhibition) {
      return res.status(404).json({ error: 'Exhibition not found' });
    }
    return res.json({ success: true, message: 'Share recorded' });
  } catch (error) {
    console.error('Share exhibition error:', error);
    return res.status(500).json({ error: 'Failed to record share' });
  }
});

router.post('/:id/report', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const exhibition = await Exhibition.findById(req.params.id);
    if (!exhibition) {
      return res.status(404).json({ error: 'Exhibition not found' });
    }
    return res.json({ success: true, message: 'Report submitted' });
  } catch (error) {
    console.error('Report exhibition error:', error);
    return res.status(500).json({ error: 'Failed to submit report' });
  }
});

router.get('/:id/comments', async (req: Request, res: Response) => {
  try {
    const exhibitionId = req.params.id;
    
    let exhibition;
    if (exhibitionId.match(/^[0-9a-fA-F]{24}$/)) {
      exhibition = await Exhibition.findById(exhibitionId).lean();
    } else {
      const allExhibitions = await Exhibition.find().lean();
      exhibition = allExhibitions.find(e => {
        const idNum = parseInt(e._id.toString().slice(-8), 16);
        return idNum === parseInt(exhibitionId, 10);
      });
    }
    
    if (!exhibition) {
      return res.json([]);
    }
    
    const actualExhibitionId = (exhibition as any)._id.toString();
    const comments = await ExhibitionComment.find({ exhibition_id: actualExhibitionId })
      .sort({ created_at: -1 })
      .lean();

    const jwt = await import('jsonwebtoken');
    
    let currentUserId: string | null = null;
    try {
      const token = (req.headers.authorization?.replace('Bearer ', '') || 
                    (req as any).cookies?.mavy_session);
      if (token) {
        const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
        const decoded = jwt.verify(token, jwtSecret) as { user_id: string };
        currentUserId = decoded.user_id;
      }
    } catch {
      currentUserId = null;
    }

    const commentsWithUser = await Promise.all(comments.map(async (comment) => {
      const user = await User.findOne({ user_id: comment.user_id }).lean();
      const replyCount = await ExhibitionCommentReply.countDocuments({ comment_id: comment._id.toString() });
      const commentIdNum = parseInt(comment._id.toString().slice(-8), 16) || Date.now();
      
      const likesArray = comment.likes || [];
      const likesCount = likesArray.length;
      const userLiked = currentUserId ? likesArray.includes(currentUserId) : false;
      
      return {
        id: commentIdNum,
        exhibition_id: parseInt(exhibitionId) || 0,
        user_id: comment.user_id,
        comment: comment.comment,
        full_name: (user as any)?.profile?.full_name || 'User',
        profile_picture_url: (user as any)?.profile?.profile_picture_url || null,
        created_at: comment.created_at.toISOString(),
        updated_at: comment.updated_at.toISOString(),
        likes_count: likesCount,
        replies_count: replyCount || 0,
        user_liked: userLiked
      };
    }));

    return res.json(commentsWithUser);
  } catch (error) {
    console.error('Get exhibition comments error:', error);
    return res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

router.post('/:id/comment', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const exhibitionId = req.params.id;
    
    let exhibition;
    if (exhibitionId.match(/^[0-9a-fA-F]{24}$/)) {
      exhibition = await Exhibition.findById(exhibitionId);
    } else {
      const allExhibitions = await Exhibition.find().lean();
      const found = allExhibitions.find(e => {
        const idNum = parseInt(e._id.toString().slice(-8), 16);
        return idNum === parseInt(exhibitionId, 10);
      });
      if (found) {
        exhibition = await Exhibition.findById(found._id);
      }
    }
    
    if (!exhibition) {
      return res.status(404).json({ error: 'Exhibition not found' });
    }

    const actualExhibitionId = exhibition._id.toString();
    const user = await User.findOne({ user_id: req.user!.user_id }).lean();
    
    const savedComment = await ExhibitionComment.create({
      exhibition_id: actualExhibitionId,
      user_id: req.user!.user_id,
      comment: req.body.comment
    });

    const comment = {
      id: parseInt(savedComment._id.toString().slice(-8), 16) || Date.now(),
      exhibition_id: parseInt(exhibitionId) || 0,
      user_id: req.user!.user_id,
      comment: savedComment.comment,
      full_name: (user as any)?.profile?.full_name || 'User',
      profile_picture_url: (user as any)?.profile?.profile_picture_url || null,
      created_at: savedComment.created_at.toISOString(),
      updated_at: savedComment.updated_at.toISOString(),
      likes_count: 0,
      replies_count: 0,
      user_liked: false
    };

    return res.status(201).json({ 
      success: true, 
      message: 'Comment posted successfully',
      comment: comment
    });
  } catch (error) {
    console.error('Comment exhibition error:', error);
    return res.status(500).json({ error: 'Failed to post comment' });
  }
});

router.post('/comments/:id/like', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const commentId = req.params.id;
    const userId = req.user!.user_id;

    const numericCommentId = typeof commentId === 'string' ? parseInt(commentId, 10) : commentId;
    const allComments = await ExhibitionComment.find().lean();
    const matchingComment = allComments.find(c => {
      const commentIdNum = parseInt(c._id.toString().slice(-8), 16);
      return commentIdNum === numericCommentId;
    });

    if (!matchingComment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const comment = await ExhibitionComment.findById(matchingComment._id);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const likesArray = comment.likes || [];
    const likedIndex = likesArray.indexOf(userId);

    if (likedIndex === -1) {
      likesArray.push(userId);
    } else {
      likesArray.splice(likedIndex, 1);
    }

    comment.likes = likesArray;
    await comment.save();

    return res.json({ 
      success: true, 
      liked: likedIndex === -1,
      likes_count: likesArray.length
    });
  } catch (error) {
    console.error('Like comment error:', error);
    return res.status(500).json({ error: 'Failed to like comment' });
  }
});

router.get('/comments/:id/replies', async (req: Request, res: Response) => {
  try {
    const numericCommentId = typeof req.params.id === 'string' ? parseInt(req.params.id, 10) : req.params.id;
    
    const allComments = await ExhibitionComment.find().lean();
    const matchingComment = allComments.find(c => {
      const commentIdNum = parseInt(c._id.toString().slice(-8), 16);
      return commentIdNum === numericCommentId;
    });
    
    if (!matchingComment) {
      return res.json([]);
    }
    
    const replies = await ExhibitionCommentReply.find({ comment_id: matchingComment._id.toString() })
      .sort({ created_at: 1 })
      .lean();

    const repliesWithUser = await Promise.all(replies.map(async (reply) => {
      const user = await User.findOne({ user_id: reply.user_id }).lean();
      
      return {
        id: parseInt(reply._id.toString().slice(-8), 16) || Date.now(),
        comment_id: numericCommentId,
        user_id: reply.user_id,
        reply: reply.reply,
        full_name: (user as any)?.profile?.full_name || 'User',
        profile_picture_url: (user as any)?.profile?.profile_picture_url || null,
        created_at: reply.created_at.toISOString(),
        updated_at: reply.updated_at.toISOString()
      };
    }));

    return res.json(repliesWithUser);
  } catch (error) {
    console.error('Get comment replies error:', error);
    return res.status(500).json({ error: 'Failed to fetch replies' });
  }
});

router.post('/comments/:id/reply', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { reply } = req.body;
    
    if (!reply || !reply.trim()) {
      return res.status(400).json({ error: 'Reply text is required' });
    }

    const numericCommentId = typeof req.params.id === 'string' ? parseInt(req.params.id, 10) : req.params.id;
    const allComments = await ExhibitionComment.find().lean();
    const matchingComment = allComments.find(c => {
      const commentIdNum = parseInt(c._id.toString().slice(-8), 16);
      return commentIdNum === numericCommentId;
    });
    
    if (!matchingComment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const user = await User.findOne({ user_id: req.user!.user_id }).lean();
    
    const savedReply = await ExhibitionCommentReply.create({
      comment_id: matchingComment._id.toString(),
      user_id: req.user!.user_id,
      reply: reply.trim()
    });

    const replyObj = {
      id: parseInt(savedReply._id.toString().slice(-8), 16) || Date.now(),
      comment_id: numericCommentId,
      user_id: req.user!.user_id,
      reply: savedReply.reply,
      full_name: (user as any)?.profile?.full_name || 'User',
      profile_picture_url: (user as any)?.profile?.profile_picture_url || null,
      created_at: savedReply.created_at.toISOString(),
      updated_at: savedReply.updated_at.toISOString()
    };

    return res.status(201).json({ 
      success: true, 
      message: 'Reply posted successfully',
      reply: replyObj
    });
  } catch (error) {
    console.error('Reply comment error:', error);
    return res.status(500).json({ error: 'Failed to post reply' });
  }
});

export default router;