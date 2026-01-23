import express, { Request, Response } from 'express';
import { User, NewsUpdate, Exhibition, Job, Service, ServiceManual } from '../models/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

router.get('/check-admin', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findOne({ user_id: req.user!.user_id });
    
    if (!user) {
      return res.json({ is_admin: false });
    }

    const isAdmin = user.is_admin === true || 
                    user.role === 'admin' ||
                    user.account_type === 'admin';

    const defaultPermissions: Record<string, string> = isAdmin ? {
      posts: 'edit',
      exhibitions: 'edit',
      jobs: 'edit',
      learning: 'edit',
      services: 'edit',
      manuals: 'edit',
      users: 'edit',
      patients: 'edit',
      bookings: 'edit',
      support: 'edit',
      kyc: 'edit',
      fundraising: 'edit',
      reports: 'edit',
      advertising: 'edit',
      subscriptions: 'edit',
      admins: 'view'
    } : {};

    return res.json({ 
      is_admin: isAdmin,
      role: user.role || (isAdmin ? 'admin' : null),
      permissions: defaultPermissions
    });
  } catch (error) {
    console.error('Check admin error:', error);
    return res.json({ is_admin: false });
  }
});

router.post('/make-admin', async (req: Request, res: Response) => {
  try {
    const { phone_number } = req.body;
    
    if (!phone_number) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const user = await User.findOneAndUpdate(
      { phone: phone_number },
      { 
        $set: { 
          is_admin: true,
          role: 'admin',
          onboarding_completed: true
        } 
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ 
      success: true, 
      message: `User ${phone_number} is now an admin`,
      user: {
        user_id: user.user_id,
        phone: user.phone,
        is_admin: user.is_admin
      }
    });
  } catch (error) {
    console.error('Make admin error:', error);
    return res.status(500).json({ error: 'Failed to make user admin' });
  }
});

router.get('/notification-counts', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json({
      posts: 0,
      exhibitions: 0,
      jobs: 0,
      fundraisers: 0,
      reports: 0,
      courses: 0,
      services: 0,
      manuals: 0,
      patients: 0,
      kyc: 0,
      bookings: 0,
      support: 0
    });
  } catch (error) {
    console.error('Get notification counts error:', error);
    return res.json({
      posts: 0,
      exhibitions: 0,
      jobs: 0,
      fundraisers: 0,
      reports: 0,
      courses: 0,
      services: 0,
      manuals: 0,
      patients: 0,
      kyc: 0,
      bookings: 0,
      support: 0
    });
  }
});

router.get('/posts', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const posts = await NewsUpdate.find().sort({ created_at: -1 });
    return res.json(posts.map(post => ({
      id: post._id.toString(),
      ...post.toObject()
    })));
  } catch (error) {
    console.error('Get admin posts error:', error);
    return res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

router.get('/exhibitions', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const exhibitions = await Exhibition.find().sort({ created_at: -1 });
    return res.json(exhibitions.map(ex => ({
      id: ex._id.toString(),
      ...ex.toObject()
    })));
  } catch (error) {
    console.error('Get admin exhibitions error:', error);
    return res.status(500).json({ error: 'Failed to fetch exhibitions' });
  }
});

router.get('/jobs', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const jobs = await Job.find().sort({ created_at: -1 });
    return res.json(jobs.map(job => ({
      id: job._id.toString(),
      ...job.toObject()
    })));
  } catch (error) {
    console.error('Get admin jobs error:', error);
    return res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

router.get('/services', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const services = await Service.find().sort({ created_at: -1 });
    return res.json(services.map(service => ({
      id: service._id.toString(),
      ...service.toObject()
    })));
  } catch (error) {
    console.error('Get admin services error:', error);
    return res.status(500).json({ error: 'Failed to fetch services' });
  }
});

router.get('/manuals', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const manuals = await ServiceManual.find().sort({ created_at: -1 });
    return res.json(manuals.map(manual => ({
      id: manual._id.toString(),
      ...manual.toObject()
    })));
  } catch (error) {
    console.error('Get admin manuals error:', error);
    return res.status(500).json({ error: 'Failed to fetch manuals' });
  }
});

router.get('/patients', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const patients = await User.find({ account_type: 'patient' }).sort({ created_at: -1 });
    return res.json(patients.map(patient => ({
      id: patient._id.toString(),
      ...patient.toObject()
    })));
  } catch (error) {
    console.error('Get admin patients error:', error);
    return res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

router.get('/admins', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const admins = await User.find({
      $or: [
        { is_admin: true },
        { role: 'admin' },
        { role: 'super_admin' },
        { account_type: 'admin' }
      ]
    }).sort({ created_at: -1 });
    return res.json(admins.map(admin => ({
      id: admin._id.toString(),
      ...admin.toObject()
    })));
  } catch (error) {
    console.error('Get admin users error:', error);
    return res.status(500).json({ error: 'Failed to fetch admins' });
  }
});

router.get('/fundraisers', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json([]);
  } catch (error) {
    console.error('Get admin fundraisers error:', error);
    return res.status(500).json({ error: 'Failed to fetch fundraisers' });
  }
});

router.get('/reports', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json([]);
  } catch (error) {
    console.error('Get admin reports error:', error);
    return res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

router.get('/courses', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json([]);
  } catch (error) {
    console.error('Get admin courses error:', error);
    return res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

router.get('/subscription-plans', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json([]);
  } catch (error) {
    console.error('Get admin subscription plans error:', error);
    return res.status(500).json({ error: 'Failed to fetch subscription plans' });
  }
});

router.get('/kyc', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json([]);
  } catch (error) {
    console.error('Get admin KYC error:', error);
    return res.status(500).json({ error: 'Failed to fetch KYC submissions' });
  }
});

router.delete('/posts/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const post = await NewsUpdate.findByIdAndDelete(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    return res.json({ success: true });
  } catch (error) {
    console.error('Delete admin post error:', error);
    return res.status(500).json({ error: 'Failed to delete post' });
  }
});

router.delete('/exhibitions/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const exhibition = await Exhibition.findByIdAndDelete(req.params.id);
    if (!exhibition) {
      return res.status(404).json({ error: 'Exhibition not found' });
    }
    return res.json({ success: true });
  } catch (error) {
    console.error('Delete admin exhibition error:', error);
    return res.status(500).json({ error: 'Failed to delete exhibition' });
  }
});

router.delete('/jobs/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    return res.json({ success: true });
  } catch (error) {
    console.error('Delete admin job error:', error);
    return res.status(500).json({ error: 'Failed to delete job' });
  }
});

router.get('/content/pending-news', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json([]);
  } catch (error) {
    console.error('Get pending news error:', error);
    return res.status(500).json({ error: 'Failed to fetch pending news' });
  }
});

router.post('/content/fetch', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json({
      success: true,
      items_fetched: 0,
      message: 'News fetching feature not yet implemented'
    });
  } catch (error) {
    console.error('Fetch news error:', error);
    return res.status(500).json({ error: 'Failed to fetch news' });
  }
});

router.post('/content/fetch-exhibitions', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json({
      success: true,
      items_fetched: 0,
      message: 'Exhibition fetching feature not yet implemented'
    });
  } catch (error) {
    console.error('Fetch exhibitions error:', error);
    return res.status(500).json({ error: 'Failed to fetch exhibitions' });
  }
});

router.put('/content/:id/approve', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json({ success: true, message: 'Content approved' });
  } catch (error) {
    console.error('Approve content error:', error);
    return res.status(500).json({ error: 'Failed to approve content' });
  }
});

router.put('/content/:id/reject', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json({ success: true, message: 'Content rejected' });
  } catch (error) {
    console.error('Reject content error:', error);
    return res.status(500).json({ error: 'Failed to reject content' });
  }
});

export default router;

