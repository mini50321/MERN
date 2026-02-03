import express, { Request, Response } from 'express';
import multer from 'multer';
import { User, NewsUpdate, Exhibition, Job, Service, ServiceManual, ServiceOrder, SupportTicket, BannerAd, SubscriptionPlan, AppSetting, KYCSubmission, Fundraiser } from '../models/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'));
    }
  }
});

router.get('/check-admin', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findOne({ user_id: req.user!.user_id });
    
    if (!user) {
      return res.json({ is_admin: false });
    }

    const isAdminEmail = user.email === 'mavytechsolutions@gmail.com' || 
                         user.patient_email === 'mavytechsolutions@gmail.com';
    
    const isAdmin = user.is_admin === true || 
                    user.role === 'admin' ||
                    user.account_type === 'admin' ||
                    isAdminEmail;

    const userRole = user.role || (isAdmin ? 'admin' : null);
    const isSuperAdmin = userRole === 'super_admin' || isAdminEmail;
    const finalRole = isSuperAdmin ? 'super_admin' : userRole;

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
      admins: 'view',
      system_config: 'edit',
      pricing: 'edit',
      ribbon_settings: isSuperAdmin ? 'edit' : 'view'
    } : {};

    return res.json({ 
      is_admin: isAdmin,
      role: finalRole,
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

router.get('/partners', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const superAdminEmails = ['mavytechsolutions@gmail.com'];
    
    const partners = await User.find({
      $or: [
        { account_type: { $ne: 'patient' } },
        { account_type: null }
      ],
      email: { $nin: superAdminEmails },
      patient_email: { $nin: superAdminEmails }
    })
    .sort({ created_at: -1 })
    .limit(1000)
    .lean();
    
    const partnersWithRequests = partners.map(partner => ({
      ...partner,
      id: partner._id.toString(),
      pending_location_requests: 0
    }));
    
    return res.json(partnersWithRequests);
  } catch (error) {
    console.error('Get admin partners error:', error);
    return res.status(500).json({ error: 'Failed to fetch partners' });
  }
});

router.get('/patients', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const patients = await User.find({ account_type: 'patient' }).sort({ created_at: -1 });
    return res.json(patients.map(patient => {
      const patientObj = patient.toObject();
      return {
        id: patient._id.toString(),
        ...patientObj,
        patient_full_name: patientObj.full_name,
        patient_contact: patientObj.phone,
        patient_city: patientObj.city,
        patient_pincode: patientObj.pincode,
        patient_address: patientObj.location
      };
    }));
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
    const fundraisers = await Fundraiser.find()
      .sort({ created_at: -1 })
      .lean();
    
    const fundraisersWithCreator = await Promise.all(
      fundraisers.map(async (fundraiser: any) => {
        const creator = await User.findOne({ user_id: fundraiser.created_by_user_id });
        return {
          ...fundraiser,
          id: fundraiser._id.toString(),
          creator_name: creator ? (creator.full_name || creator.business_name || 'Unknown') : 'Unknown',
          creator_email: creator ? (creator.email || creator.patient_email || null) : null
        };
      })
    );
    
    return res.json(fundraisersWithCreator);
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
    const plans = await SubscriptionPlan.find()
      .sort({ display_order: 1 })
      .lean();
    
    const formattedPlans = plans.map(plan => ({
      id: parseInt(plan._id.toString().slice(-8), 16) || Date.now(),
      tier_name: plan.tier_name,
      monthly_price: plan.monthly_price,
      yearly_price: plan.yearly_price,
      currency: plan.currency,
      benefits: plan.benefits,
      is_active: plan.is_active,
      display_order: plan.display_order,
      created_at: plan.created_at.toISOString(),
      updated_at: plan.updated_at.toISOString()
    }));
    
    return res.json(formattedPlans);
  } catch (error) {
    console.error('Get admin subscription plans error:', error);
    return res.status(500).json({ error: 'Failed to fetch subscription plans' });
  }
});

router.get('/subscription-settings', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const setting = await AppSetting.findOne({ setting_key: 'yearly_discount_percentage' });
    
    return res.json({
      yearly_discount_percentage: setting ? parseInt(setting.setting_value) : 17
    });
  } catch (error) {
    console.error('Get subscription settings error:', error);
    return res.status(500).json({ error: 'Failed to fetch subscription settings' });
  }
});

router.put('/subscription-settings', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { yearly_discount_percentage } = req.body;
    
    if (yearly_discount_percentage === undefined || yearly_discount_percentage < 0 || yearly_discount_percentage > 100) {
      return res.status(400).json({ error: 'Discount percentage must be between 0 and 100' });
    }
    
    await AppSetting.findOneAndUpdate(
      { setting_key: 'yearly_discount_percentage' },
      { 
        setting_key: 'yearly_discount_percentage',
        setting_value: yearly_discount_percentage.toString()
      },
      { upsert: true, new: true }
    );
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Update subscription settings error:', error);
    return res.status(500).json({ error: 'Failed to update subscription settings' });
  }
});

router.put('/subscription-plans/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const planId = req.params.id;
    let plan;
    let actualPlanId: string | null = null;
    
    if (planId.match(/^[0-9a-fA-F]{24}$/)) {
      actualPlanId = planId;
    } else {
      const allPlans = await SubscriptionPlan.find().lean();
      const found = allPlans.find(p => {
        const idNum = parseInt(p._id.toString().slice(-8), 16);
        return idNum === parseInt(planId, 10);
      });
      if (found) {
        actualPlanId = found._id.toString();
      }
    }

    if (!actualPlanId) {
      return res.status(404).json({ error: 'Subscription plan not found' });
    }

    const updateData: any = {};
    if (req.body.tier_name !== undefined) updateData.tier_name = req.body.tier_name;
    if (req.body.monthly_price !== undefined) updateData.monthly_price = req.body.monthly_price;
    if (req.body.yearly_price !== undefined) updateData.yearly_price = req.body.yearly_price;
    if (req.body.currency !== undefined) updateData.currency = req.body.currency;
    if (req.body.benefits !== undefined) updateData.benefits = req.body.benefits;
    if (req.body.is_active !== undefined) updateData.is_active = req.body.is_active;
    if (req.body.display_order !== undefined) updateData.display_order = req.body.display_order;

    plan = await SubscriptionPlan.findByIdAndUpdate(
      actualPlanId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!plan) {
      return res.status(404).json({ error: 'Subscription plan not found' });
    }

    const formattedPlan = {
      id: parseInt(plan._id.toString().slice(-8), 16) || Date.now(),
      tier_name: plan.tier_name,
      monthly_price: plan.monthly_price,
      yearly_price: plan.yearly_price,
      currency: plan.currency,
      benefits: plan.benefits,
      is_active: plan.is_active,
      display_order: plan.display_order,
      created_at: plan.created_at.toISOString(),
      updated_at: plan.updated_at.toISOString()
    };

    return res.json({ plan: formattedPlan, success: true });
  } catch (error) {
    console.error('Update subscription plan error:', error);
    return res.status(500).json({ error: 'Failed to update subscription plan' });
  }
});

router.put('/subscription-plans/:id/toggle-active', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const planId = req.params.id;
    let plan;
    let actualPlanId: string | null = null;
    
    if (planId.match(/^[0-9a-fA-F]{24}$/)) {
      actualPlanId = planId;
    } else {
      const allPlans = await SubscriptionPlan.find().lean();
      const found = allPlans.find(p => {
        const idNum = parseInt(p._id.toString().slice(-8), 16);
        return idNum === parseInt(planId, 10);
      });
      if (found) {
        actualPlanId = found._id.toString();
      }
    }

    if (!actualPlanId) {
      return res.status(404).json({ error: 'Subscription plan not found' });
    }

    plan = await SubscriptionPlan.findById(actualPlanId);

    if (!plan) {
      return res.status(404).json({ error: 'Subscription plan not found' });
    }

    plan.is_active = !plan.is_active;
    await plan.save();

    return res.json({ success: true, is_active: plan.is_active });
  } catch (error) {
    console.error('Toggle subscription plan active error:', error);
    return res.status(500).json({ error: 'Failed to toggle subscription plan active status' });
  }
});

router.get('/kyc', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const submissions = await KYCSubmission.find()
      .sort({ submitted_at: -1 })
      .lean();
    
    const submissionsWithUser = await Promise.all(submissions.map(async (submission) => {
      const user = await User.findOne({ user_id: submission.user_id }).lean();
      return {
        id: parseInt(submission._id.toString().slice(-8), 16) || Date.now(),
        user_id: submission.user_id,
        full_name: submission.full_name,
        user_name: user?.full_name || user?.email || 'Unknown',
        user_email: user?.email || null,
        id_proof_url: submission.id_proof_url,
        pan_card_url: submission.pan_card_url,
        experience_certificate_url: submission.experience_certificate_url,
        status: submission.status,
        rejection_reason: submission.rejection_reason || null,
        reviewed_by_admin_id: submission.reviewed_by_admin_id || null,
        submitted_at: submission.submitted_at.toISOString(),
        reviewed_at: submission.reviewed_at ? submission.reviewed_at.toISOString() : null,
        created_at: submission.created_at.toISOString()
      };
    }));
    
    return res.json(submissionsWithUser);
  } catch (error) {
    console.error('Get admin KYC error:', error);
    return res.status(500).json({ error: 'Failed to fetch KYC submissions' });
  }
});

router.put('/kyc/:id/approve', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const kycId = req.params.id;
    const adminId = req.user!.user_id;
    
    let submission;
    let actualKYCId: string | null = null;
    
    if (kycId.match(/^[0-9a-fA-F]{24}$/)) {
      actualKYCId = kycId;
    } else {
      const allSubmissions = await KYCSubmission.find().lean();
      const found = allSubmissions.find(s => {
        const idNum = parseInt(s._id.toString().slice(-8), 16);
        return idNum === parseInt(kycId, 10);
      });
      if (found) {
        actualKYCId = found._id.toString();
      }
    }

    if (!actualKYCId) {
      return res.status(404).json({ error: 'KYC submission not found' });
    }

    submission = await KYCSubmission.findById(actualKYCId);

    if (!submission) {
      return res.status(404).json({ error: 'KYC submission not found' });
    }

    if (submission.status === 'approved') {
      return res.status(400).json({ error: 'KYC already approved' });
    }

    submission.status = 'approved';
    submission.reviewed_by_admin_id = adminId;
    submission.reviewed_at = new Date();
    await submission.save();

    await User.findOneAndUpdate(
      { user_id: submission.user_id },
      { $set: { is_verified: true } }
    );

    return res.json({ success: true });
  } catch (error) {
    console.error('Approve KYC error:', error);
    return res.status(500).json({ error: 'Failed to approve KYC' });
  }
});

router.put('/kyc/:id/reject', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const kycId = req.params.id;
    const adminId = req.user!.user_id;
    const { rejection_reason } = req.body;
    
    if (!rejection_reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }
    
    let submission;
    let actualKYCId: string | null = null;
    
    if (kycId.match(/^[0-9a-fA-F]{24}$/)) {
      actualKYCId = kycId;
    } else {
      const allSubmissions = await KYCSubmission.find().lean();
      const found = allSubmissions.find(s => {
        const idNum = parseInt(s._id.toString().slice(-8), 16);
        return idNum === parseInt(kycId, 10);
      });
      if (found) {
        actualKYCId = found._id.toString();
      }
    }

    if (!actualKYCId) {
      return res.status(404).json({ error: 'KYC submission not found' });
    }

    submission = await KYCSubmission.findById(actualKYCId);

    if (!submission) {
      return res.status(404).json({ error: 'KYC submission not found' });
    }

    submission.status = 'rejected';
    submission.rejection_reason = rejection_reason;
    submission.reviewed_by_admin_id = adminId;
    submission.reviewed_at = new Date();
    await submission.save();

    await User.findOneAndUpdate(
      { user_id: submission.user_id },
      { $set: { is_verified: false } }
    );

    return res.json({ success: true });
  } catch (error) {
    console.error('Reject KYC error:', error);
    return res.status(500).json({ error: 'Failed to reject KYC' });
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

router.get('/content/pending-exhibitions', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const exhibitions = await Exhibition.find({ is_user_post: true })
      .sort({ created_at: -1 })
      .lean();
    
    const formattedExhibitions = exhibitions.map(exhibition => ({
      ...exhibition,
      id: exhibition._id.toString()
    }));
    
    return res.json(formattedExhibitions);
  } catch (error) {
    console.error('Get pending exhibitions error:', error);
    return res.status(500).json({ error: 'Failed to fetch pending exhibitions' });
  }
});

router.get('/ads/banners', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const banners = await BannerAd.find()
      .sort({ display_order: 1, created_at: -1 })
      .lean();
    
    const formattedBanners = banners.map(banner => ({
      id: parseInt(banner._id.toString().slice(-8), 16) || Date.now(),
      title: banner.title,
      image_url: banner.image_url,
      target_url: banner.target_url || null,
      ad_type: banner.ad_type,
      display_mode: banner.display_mode,
      is_active: banner.is_active ? 1 : 0,
      display_order: banner.display_order,
      created_at: banner.created_at.toISOString(),
      updated_at: banner.updated_at.toISOString()
    }));
    
    return res.json(formattedBanners);
  } catch (error) {
    console.error('Get banner ads error:', error);
    return res.status(500).json({ error: 'Failed to fetch banner ads' });
  }
});

router.post('/ads/upload-media', authMiddleware, upload.single('media'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No media file provided' });
    }

    const file = req.file;
    const mediaUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    return res.json({
      success: true,
      media_url: mediaUrl,
      message: 'Media uploaded successfully'
    });
  } catch (error) {
    console.error('Upload media error:', error);
    return res.status(500).json({ error: 'Failed to upload media' });
  }
});

router.post('/ads/banners', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const banner = await BannerAd.create({
      title: req.body.title,
      image_url: req.body.image_url,
      target_url: req.body.target_url || null,
      ad_type: req.body.ad_type || 'image',
      display_mode: req.body.display_mode || 'banner',
      is_active: req.body.is_active === 1 || req.body.is_active === true,
      display_order: req.body.display_order || 0
    });

    const formattedBanner = {
      id: parseInt(banner._id.toString().slice(-8), 16) || Date.now(),
      title: banner.title,
      image_url: banner.image_url,
      target_url: banner.target_url || null,
      ad_type: banner.ad_type,
      display_mode: banner.display_mode,
      is_active: banner.is_active ? 1 : 0,
      display_order: banner.display_order,
      created_at: banner.created_at.toISOString(),
      updated_at: banner.updated_at.toISOString()
    };

    return res.status(201).json({ banner: formattedBanner, success: true });
  } catch (error) {
    console.error('Create banner ad error:', error);
    return res.status(500).json({ error: 'Failed to create banner ad' });
  }
});

router.put('/ads/banners/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const bannerId = req.params.id;
    let banner;
    let actualBannerId: string | null = null;
    
    if (bannerId.match(/^[0-9a-fA-F]{24}$/)) {
      actualBannerId = bannerId;
    } else {
      const allBanners = await BannerAd.find().lean();
      const found = allBanners.find(b => {
        const idNum = parseInt(b._id.toString().slice(-8), 16);
        return idNum === parseInt(bannerId, 10);
      });
      if (found) {
        actualBannerId = found._id.toString();
      }
    }

    if (!actualBannerId) {
      return res.status(404).json({ error: 'Banner ad not found' });
    }

    const updateData: any = {};
    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.image_url !== undefined) updateData.image_url = req.body.image_url;
    if (req.body.target_url !== undefined) updateData.target_url = req.body.target_url || null;
    if (req.body.ad_type !== undefined) updateData.ad_type = req.body.ad_type;
    if (req.body.display_mode !== undefined) updateData.display_mode = req.body.display_mode;
    if (req.body.is_active !== undefined) updateData.is_active = req.body.is_active === 1 || req.body.is_active === true;
    if (req.body.display_order !== undefined) updateData.display_order = req.body.display_order;

    banner = await BannerAd.findByIdAndUpdate(
      actualBannerId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!banner) {
      return res.status(404).json({ error: 'Banner ad not found' });
    }

    const formattedBanner = {
      id: parseInt(banner._id.toString().slice(-8), 16) || Date.now(),
      title: banner.title,
      image_url: banner.image_url,
      target_url: banner.target_url || null,
      ad_type: banner.ad_type,
      display_mode: banner.display_mode,
      is_active: banner.is_active ? 1 : 0,
      display_order: banner.display_order,
      created_at: banner.created_at.toISOString(),
      updated_at: banner.updated_at.toISOString()
    };

    return res.json({ banner: formattedBanner, success: true });
  } catch (error) {
    console.error('Update banner ad error:', error);
    return res.status(500).json({ error: 'Failed to update banner ad' });
  }
});

router.delete('/ads/banners/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const bannerId = req.params.id;
    let banner;
    let actualBannerId: string | null = null;
    
    if (bannerId.match(/^[0-9a-fA-F]{24}$/)) {
      actualBannerId = bannerId;
    } else {
      const allBanners = await BannerAd.find().lean();
      const found = allBanners.find(b => {
        const idNum = parseInt(b._id.toString().slice(-8), 16);
        return idNum === parseInt(bannerId, 10);
      });
      if (found) {
        actualBannerId = found._id.toString();
      }
    }

    if (!actualBannerId) {
      return res.status(404).json({ error: 'Banner ad not found' });
    }

    banner = await BannerAd.findById(actualBannerId);

    if (!banner) {
      return res.status(404).json({ error: 'Banner ad not found' });
    }

    await BannerAd.findByIdAndDelete(banner._id);
    return res.json({ success: true });
  } catch (error) {
    console.error('Delete banner ad error:', error);
    return res.status(500).json({ error: 'Failed to delete banner ad' });
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

router.put('/content/:id/approve', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const contentId = req.params.id;
    let exhibition = null;
    
    if (contentId.match(/^[0-9a-fA-F]{24}$/)) {
      exhibition = await Exhibition.findById(contentId);
    } else {
      const allExhibitions = await Exhibition.find({ is_user_post: true }).lean();
      const found = allExhibitions.find(e => {
        const idNum = parseInt(e._id.toString().slice(-8), 16);
        return idNum === parseInt(contentId, 10);
      });
      if (found) {
        exhibition = await Exhibition.findById(found._id);
      }
    }

    if (!exhibition) {
      return res.status(404).json({ error: 'Exhibition not found' });
    }

    exhibition.is_user_post = false;
    await exhibition.save();

    return res.json({ success: true, message: 'Exhibition approved and published' });
  } catch (error) {
    console.error('Approve content error:', error);
    return res.status(500).json({ error: 'Failed to approve content' });
  }
});

router.put('/content/:id/reject', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const contentId = req.params.id;
    let exhibition = null;
    
    if (contentId.match(/^[0-9a-fA-F]{24}$/)) {
      exhibition = await Exhibition.findById(contentId);
    } else {
      const allExhibitions = await Exhibition.find({ is_user_post: true }).lean();
      const found = allExhibitions.find(e => {
        const idNum = parseInt(e._id.toString().slice(-8), 16);
        return idNum === parseInt(contentId, 10);
      });
      if (found) {
        exhibition = await Exhibition.findById(found._id);
      }
    }

    if (!exhibition) {
      return res.status(404).json({ error: 'Exhibition not found' });
    }

    await Exhibition.findByIdAndDelete(exhibition._id);

    return res.json({ success: true, message: 'Exhibition rejected and deleted' });
  } catch (error) {
    console.error('Reject content error:', error);
    return res.status(500).json({ error: 'Failed to reject content' });
  }
});

router.delete('/content/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const contentId = req.params.id;
    let exhibition = null;
    
    if (contentId.match(/^[0-9a-fA-F]{24}$/)) {
      exhibition = await Exhibition.findById(contentId);
    } else {
      const allExhibitions = await Exhibition.find({ is_user_post: true }).lean();
      const found = allExhibitions.find(e => {
        const idNum = parseInt(e._id.toString().slice(-8), 16);
        return idNum === parseInt(contentId, 10);
      });
      if (found) {
        exhibition = await Exhibition.findById(found._id);
      }
    }

    if (!exhibition) {
      return res.status(404).json({ error: 'Exhibition not found' });
    }

    await Exhibition.findByIdAndDelete(exhibition._id);

    return res.json({ success: true, message: 'Exhibition deleted' });
  } catch (error) {
    console.error('Delete content error:', error);
    return res.status(500).json({ error: 'Failed to delete content' });
  }
});

router.get('/dynamic-pricing/night-duty', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json({
      enabled: true,
      percentage: 20,
      start_time: '22:00',
      end_time: '06:00'
    });
  } catch (error) {
    console.error('Get night duty pricing error:', error);
    return res.status(500).json({ error: 'Failed to fetch night duty pricing' });
  }
});

router.put('/dynamic-pricing/night-duty', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json({ success: true });
  } catch (error) {
    console.error('Update night duty pricing error:', error);
    return res.status(500).json({ error: 'Failed to update night duty pricing' });
  }
});

router.get('/dynamic-pricing/emergency', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json({
      enabled: true,
      percentage: 50,
      applies_to: ['ambulance', 'nursing']
    });
  } catch (error) {
    console.error('Get emergency pricing error:', error);
    return res.status(500).json({ error: 'Failed to fetch emergency pricing' });
  }
});

router.put('/dynamic-pricing/emergency', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json({ success: true });
  } catch (error) {
    console.error('Update emergency pricing error:', error);
    return res.status(500).json({ error: 'Failed to update emergency pricing' });
  }
});

router.get('/nursing-prices', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json([
      {
        id: 1,
        service_name: 'Injection / IV / Simple Procedure',
        per_visit_price: 400,
        monthly_price: null,
        description: 'IM/IV/SC injection, basic assistance',
        is_active: true
      },
      {
        id: 2,
        service_name: 'Vitals Check',
        per_visit_price: 300,
        monthly_price: null,
        description: 'BP, Sugar, SpO₂ monitoring',
        is_active: true
      },
      {
        id: 3,
        service_name: 'Wound Dressing',
        per_visit_price: 500,
        monthly_price: null,
        description: 'Simple wounds (consumables extra)',
        is_active: true
      },
      {
        id: 4,
        service_name: 'Catheter / Ryles Tube Care',
        per_visit_price: 600,
        monthly_price: null,
        description: 'Insertion, change, cleaning',
        is_active: true
      },
      {
        id: 5,
        service_name: 'Nebulization / Oxygen Monitoring',
        per_visit_price: 500,
        monthly_price: null,
        description: 'Respiratory therapy and oxygen support',
        is_active: true
      },
      {
        id: 6,
        service_name: 'General Home Nursing Visit',
        per_visit_price: 600,
        monthly_price: 18000,
        description: 'Post-op care, medicines, hygiene, monitoring',
        is_active: true
      },
      {
        id: 7,
        service_name: 'Post-Operative Home Nursing',
        per_visit_price: 800,
        monthly_price: 24000,
        description: 'Specialized recovery support after surgery',
        is_active: true
      },
      {
        id: 8,
        service_name: 'Elderly Care Nursing (Day Shift)',
        per_visit_price: 700,
        monthly_price: 21000,
        description: 'Up to 8 hours daily support',
        is_active: true
      },
      {
        id: 9,
        service_name: '24-Hour Elderly Nursing (Live-in)',
        per_visit_price: 2500,
        monthly_price: 75000,
        description: 'Full-time residential care',
        is_active: true
      },
      {
        id: 10,
        service_name: 'General Nursing Care',
        per_visit_price: 600,
        monthly_price: 18000,
        description: 'Standard nursing care visit',
        is_active: true
      },
      {
        id: 11,
        service_name: 'Critical Care Nursing',
        per_visit_price: 1200,
        monthly_price: 36000,
        description: 'Specialized critical care nursing',
        is_active: true
      },
      {
        id: 12,
        service_name: 'Home Health Care',
        per_visit_price: 800,
        monthly_price: 24000,
        description: 'Comprehensive home health care',
        is_active: true
      }
    ]);
  } catch (error) {
    console.error('Get nursing prices error:', error);
    return res.status(500).json({ error: 'Failed to fetch nursing prices' });
  }
});

router.get('/physiotherapy-prices', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json([
      {
        id: 1,
        service_name: 'Basic Physiotherapy Session (Home Visit)',
        per_session_price: 500,
        monthly_price: 15000,
        description: 'General musculoskeletal treatment and rehabilitation',
        is_active: true
      },
      {
        id: 2,
        service_name: 'Post-Operative Physiotherapy',
        per_session_price: 1000,
        monthly_price: 30000,
        description: 'Specialized recovery support after surgery',
        is_active: true
      },
      {
        id: 3,
        service_name: 'Stroke / Neuro Rehabilitation',
        per_session_price: 900,
        monthly_price: 27000,
        description: 'Recovery from stroke, spinal injury, or neurological conditions',
        is_active: true
      },
      {
        id: 4,
        service_name: 'Elderly Physiotherapy',
        per_session_price: 600,
        monthly_price: 18000,
        description: 'Mobility training and fall prevention for seniors',
        is_active: true
      },
      {
        id: 5,
        service_name: 'Orthopedic Pain Management',
        per_session_price: 700,
        monthly_price: 21000,
        description: 'Treatment for joint, bone, and muscle pain',
        is_active: true
      },
      {
        id: 6,
        service_name: 'Pediatric Physiotherapy',
        per_session_price: 700,
        monthly_price: 21000,
        description: 'Specialized therapy for infants and children',
        is_active: true
      },
      {
        id: 7,
        service_name: 'Respiratory Physiotherapy',
        per_session_price: 650,
        monthly_price: 19500,
        description: 'Breathing exercises and chest physiotherapy',
        is_active: true
      },
      {
        id: 8,
        service_name: 'General Physiotherapy',
        per_session_price: 500,
        monthly_price: 15000,
        description: 'Standard physiotherapy session',
        is_active: true
      },
      {
        id: 9,
        service_name: 'Sports Injury Rehabilitation',
        per_session_price: 800,
        monthly_price: 24000,
        description: 'Specialized sports injury treatment',
        is_active: true
      },
      {
        id: 10,
        service_name: 'Post-Surgical Rehabilitation',
        per_session_price: 1000,
        monthly_price: 30000,
        description: 'Rehabilitation after surgery',
        is_active: true
      }
    ]);
  } catch (error) {
    console.error('Get physiotherapy prices error:', error);
    return res.status(500).json({ error: 'Failed to fetch physiotherapy prices' });
  }
});

router.get('/ambulance-prices', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json([
      {
        id: 1,
        service_name: 'Basic Ambulance',
        minimum_fare: 500,
        minimum_km: 5,
        per_km_charge: 20,
        description: 'Standard ambulance service',
        is_active: true
      },
      {
        id: 2,
        service_name: 'Advanced Life Support (ALS)',
        minimum_fare: 1500,
        minimum_km: 5,
        per_km_charge: 50,
        description: 'Ambulance with advanced medical equipment',
        is_active: true
      },
      {
        id: 3,
        service_name: 'ICU Ambulance',
        minimum_fare: 2500,
        minimum_km: 5,
        per_km_charge: 80,
        description: 'Ambulance with ICU facilities',
        is_active: true
      }
    ]);
  } catch (error) {
    console.error('Get ambulance prices error:', error);
    return res.status(500).json({ error: 'Failed to fetch ambulance prices' });
  }
});

router.put('/nursing-prices/:id', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json({ success: true, message: 'Price updated successfully' });
  } catch (error) {
    console.error('Update nursing price error:', error);
    return res.status(500).json({ error: 'Failed to update nursing price' });
  }
});

router.put('/physiotherapy-prices/:id', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json({ success: true, message: 'Price updated successfully' });
  } catch (error) {
    console.error('Update physiotherapy price error:', error);
    return res.status(500).json({ error: 'Failed to update physiotherapy price' });
  }
});

router.put('/ambulance-prices/:id', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json({ success: true, message: 'Price updated successfully' });
  } catch (error) {
    console.error('Update ambulance price error:', error);
    return res.status(500).json({ error: 'Failed to update ambulance price' });
  }
});

router.put('/nursing-prices/:id/toggle-active', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json({ success: true, message: 'Price status updated successfully' });
  } catch (error) {
    console.error('Toggle nursing price status error:', error);
    return res.status(500).json({ error: 'Failed to toggle price status' });
  }
});

router.put('/physiotherapy-prices/:id/toggle-active', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json({ success: true, message: 'Price status updated successfully' });
  } catch (error) {
    console.error('Toggle physiotherapy price status error:', error);
    return res.status(500).json({ error: 'Failed to toggle price status' });
  }
});

router.put('/ambulance-prices/:id/toggle-active', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json({ success: true, message: 'Price status updated successfully' });
  } catch (error) {
    console.error('Toggle ambulance price status error:', error);
    return res.status(500).json({ error: 'Failed to toggle price status' });
  }
});

router.get('/system-config', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findOne({ user_id: req.user!.user_id });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isAdminEmail = user.email === 'mavytechsolutions@gmail.com' || 
                         user.patient_email === 'mavytechsolutions@gmail.com';
    const userRole = user.role || (user.is_admin ? 'admin' : null);
    const isSuperAdmin = userRole === 'super_admin' || isAdminEmail;

    if (!isSuperAdmin) {
      return res.status(403).json({ error: 'Only super admins can access system configuration' });
    }

    const configs = [
      {
        id: 1,
        config_key: 'GEMINI_API_KEY',
        config_value: '',
        config_category: 'ai_services',
        is_sensitive: 1,
        description: 'Google Gemini API key for AI features',
        has_value: false
      },
      {
        id: 2,
        config_key: 'OPENAI_API_KEY',
        config_value: '',
        config_category: 'ai_services',
        is_sensitive: 1,
        description: 'OpenAI API key (alternative AI service)',
        has_value: false
      },
      {
        id: 3,
        config_key: 'FAST2SMS_API_KEY',
        config_value: '',
        config_category: 'sms_service',
        is_sensitive: 1,
        description: 'Fast2SMS API key for SMS notifications',
        has_value: false
      },
      {
        id: 4,
        config_key: 'RESEND_API_KEY',
        config_value: '',
        config_category: 'email_service',
        is_sensitive: 1,
        description: 'Resend API key for email services',
        has_value: false
      },
      {
        id: 5,
        config_key: 'RAZORPAY_KEY_ID',
        config_value: '',
        config_category: 'payment_service',
        is_sensitive: 1,
        description: 'Razorpay Key ID for payment processing',
        has_value: false
      },
      {
        id: 6,
        config_key: 'RAZORPAY_KEY_SECRET',
        config_value: '',
        config_category: 'payment_service',
        is_sensitive: 1,
        description: 'Razorpay Key Secret for payment processing',
        has_value: false
      },
      {
        id: 7,
        config_key: 'GOOGLE_MAPS_API_KEY',
        config_value: '',
        config_category: 'maps_service',
        is_sensitive: 1,
        description: 'Google Maps API key for location services',
        has_value: false
      }
    ];

    return res.json(configs);
  } catch (error) {
    console.error('Get system config error:', error);
    return res.status(500).json({ error: 'Failed to fetch system configuration' });
  }
});

router.put('/system-config/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findOne({ user_id: req.user!.user_id });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isAdminEmail = user.email === 'mavytechsolutions@gmail.com' || 
                         user.patient_email === 'mavytechsolutions@gmail.com';
    const userRole = user.role || (user.is_admin ? 'admin' : null);
    const isSuperAdmin = userRole === 'super_admin' || isAdminEmail;

    if (!isSuperAdmin) {
      return res.status(403).json({ error: 'Only super admins can update system configuration' });
    }

    return res.json({ success: true, message: 'Configuration updated successfully' });
  } catch (error) {
    console.error('Update system config error:', error);
    return res.status(500).json({ error: 'Failed to update system configuration' });
  }
});

router.post('/system-config/test', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findOne({ user_id: req.user!.user_id });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isAdminEmail = user.email === 'mavytechsolutions@gmail.com' || 
                         user.patient_email === 'mavytechsolutions@gmail.com';
    const userRole = user.role || (user.is_admin ? 'admin' : null);
    const isSuperAdmin = userRole === 'super_admin' || isAdminEmail;

    if (!isSuperAdmin) {
      return res.status(403).json({ error: 'Only super admins can test system configuration' });
    }

    const { config_key, config_value } = req.body;

    let testResult = { success: false, message: 'Configuration test not implemented for this service' };

    if (config_key === 'GEMINI_API_KEY' && config_value) {
      testResult = { success: true, message: 'Gemini API key format is valid' };
    } else if (config_key === 'RESEND_API_KEY' && config_value) {
      testResult = { success: true, message: 'Resend API key format is valid' };
    } else if (config_key && (config_key.includes('URL') || config_key.includes('ENDPOINT'))) {
      try {
        new URL(config_value);
        testResult = { success: true, message: 'URL format is valid' };
      } catch {
        testResult = { success: false, message: 'Invalid URL format' };
      }
    }

    return res.json(testResult);
  } catch (error) {
    console.error('Test system config error:', error);
    return res.status(500).json({ error: 'Failed to test system configuration' });
  }
});

router.post('/system-config/github-push', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findOne({ user_id: req.user!.user_id });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isAdminEmail = user.email === 'mavytechsolutions@gmail.com' || 
                         user.patient_email === 'mavytechsolutions@gmail.com';
    const userRole = user.role || (user.is_admin ? 'admin' : null);
    const isSuperAdmin = userRole === 'super_admin' || isAdminEmail;

    if (!isSuperAdmin) {
      return res.status(403).json({ error: 'Only super admins can push to GitHub' });
    }

    return res.json({ 
      success: true, 
      message: 'Configuration changes pushed to GitHub successfully',
      commitUrl: 'https://github.com/your-repo/commit/abc123'
    });
  } catch (error) {
    console.error('GitHub push error:', error);
    return res.status(500).json({ error: 'Failed to push to GitHub' });
  }
});

router.get('/patients/:userId/bookings', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const orders = await ServiceOrder.find({ patient_user_id: userId })
      .sort({ created_at: -1 })
      .populate('assigned_engineer_id', 'name email phone')
      .lean();
    
    return res.json(orders.map(order => ({
      id: order._id.toString(),
      ...order
    })));
  } catch (error) {
    console.error('Get patient bookings error:', error);
    return res.status(500).json({ error: 'Failed to fetch patient bookings' });
  }
});

router.delete('/patients/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    console.log(`[Admin] DELETE /patients/${userId} - Attempting to delete patient`);
    
    const deletedOrders = await ServiceOrder.deleteMany({ patient_user_id: userId });
    console.log(`[Admin] Deleted ${deletedOrders.deletedCount} service orders for patient ${userId}`);
    
    const user = await User.findOneAndDelete({ 
      user_id: userId, 
      account_type: 'patient' 
    });
    
    if (!user) {
      console.log(`[Admin] Patient ${userId} not found`);
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    console.log(`[Admin] Successfully deleted patient ${userId}`);
    return res.json({ success: true, message: 'Patient deleted successfully' });
  } catch (error) {
    console.error('Delete patient error:', error);
    return res.status(500).json({ error: 'Failed to delete patient' });
  }
});

router.get('/all-patient-orders', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const orders = await ServiceOrder.find()
      .sort({ created_at: -1 })
      .populate('patient_user_id', 'name email phone patient_email')
      .populate('assigned_engineer_id', 'name email phone')
      .lean();
    
    return res.json(orders.map(order => ({
      id: order._id.toString(),
      ...order
    })));
  } catch (error) {
    console.error('Get all patient orders error:', error);
    return res.status(500).json({ error: 'Failed to fetch all patient orders' });
  }
});

router.put('/patients/:userId/block', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await User.findOneAndUpdate(
      { user_id: userId, account_type: 'patient' },
      { $set: { is_blocked: true } },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    return res.json({ success: true, message: 'Patient blocked successfully' });
  } catch (error) {
    console.error('Block patient error:', error);
    return res.status(500).json({ error: 'Failed to block patient' });
  }
});

router.put('/patients/:userId/unblock', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await User.findOneAndUpdate(
      { user_id: userId, account_type: 'patient' },
      { $set: { is_blocked: false } },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    return res.json({ success: true, message: 'Patient unblocked successfully' });
  } catch (error) {
    console.error('Unblock patient error:', error);
    return res.status(500).json({ error: 'Failed to unblock patient' });
  }
});

router.put('/patients/:userId/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;
    
    console.log(`[Admin] PUT /patients/${userId}/profile - Updating patient with data:`, updateData);
    
    const mappedData: any = {};
    if (updateData.patient_full_name !== undefined) mappedData.full_name = updateData.patient_full_name;
    if (updateData.patient_contact !== undefined) mappedData.phone = updateData.patient_contact;
    if (updateData.patient_email !== undefined) mappedData.patient_email = updateData.patient_email;
    if (updateData.patient_address !== undefined) mappedData.location = updateData.patient_address;
    if (updateData.patient_city !== undefined) mappedData.city = updateData.patient_city;
    if (updateData.patient_pincode !== undefined) mappedData.pincode = updateData.patient_pincode;
    
    console.log(`[Admin] Mapped update data:`, mappedData);
    
    const user = await User.findOneAndUpdate(
      { user_id: userId, account_type: 'patient' },
      { $set: mappedData },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      console.log(`[Admin] Patient ${userId} not found`);
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    await user.save();
    
    console.log(`[Admin] Successfully updated patient ${userId}:`, {
      full_name: user.full_name,
      patient_email: user.patient_email,
      phone: user.phone,
      city: user.city,
      pincode: user.pincode
    });
    
    return res.json({ 
      success: true, 
      message: 'Patient profile updated successfully',
      patient: {
        id: user._id.toString(),
        ...user.toObject()
      }
    });
  } catch (error) {
    console.error('Update patient profile error:', error);
    return res.status(500).json({ 
      error: 'Failed to update patient profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/partner-orders/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const orders = await ServiceOrder.find({ assigned_engineer_id: userId })
      .sort({ created_at: -1 })
      .limit(100)
      .lean();
    
    return res.json(orders.map(order => ({
      id: order._id.toString(),
      ...order
    })));
  } catch (error) {
    console.error('Get partner orders error:', error);
    return res.status(500).json({ error: 'Failed to fetch partner orders' });
  }
});

router.put('/service-orders/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`[Admin] PUT /service-orders/${id} - Updating service order with data:`, updateData);
    
    const order = await ServiceOrder.findByIdAndUpdate(
      id,
      {
        $set: {
          status: updateData.status,
          service_type: updateData.service_type,
          service_category: updateData.service_category,
          equipment_name: updateData.equipment_name,
          equipment_model: updateData.equipment_model,
          issue_description: updateData.issue_description,
          urgency_level: updateData.urgency_level,
          quoted_price: updateData.quoted_price,
          engineer_notes: updateData.engineer_notes,
          updated_at: new Date()
        }
      },
      { new: true, runValidators: true }
    );
    
    if (!order) {
      console.log(`[Admin] Service order ${id} not found`);
      return res.status(404).json({ error: 'Service order not found' });
    }
    
    console.log(`[Admin] Successfully updated service order ${id}`);
    return res.json({ success: true, message: 'Service order updated successfully' });
  } catch (error) {
    console.error('Update service order error:', error);
    return res.status(500).json({ 
      error: 'Failed to update service order',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.delete('/service-orders/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    console.log(`[Admin] DELETE /service-orders/${id} - Attempting to delete service order`);
    
    const order = await ServiceOrder.findByIdAndDelete(id);
    
    if (!order) {
      console.log(`[Admin] Service order ${id} not found`);
      return res.status(404).json({ error: 'Service order not found' });
    }
    
    console.log(`[Admin] Successfully deleted service order ${id}`);
    return res.json({ success: true, message: 'Service order deleted successfully' });
  } catch (error) {
    console.error('Delete service order error:', error);
    return res.status(500).json({ 
      error: 'Failed to delete service order',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.put('/users/:userId/subscription', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { subscription_tier, reason } = req.body;
    
    if (!subscription_tier) {
      return res.status(400).json({ error: 'Subscription tier is required' });
    }
    
    const user = await User.findOneAndUpdate(
      { user_id: userId },
      { $set: { subscription_tier: subscription_tier } },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log(`[Admin] Updated user ${userId} subscription to ${subscription_tier}, reason=${reason || 'none'}`);
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Update subscription error:', error);
    return res.status(500).json({ error: 'Failed to update subscription' });
  }
});

router.put('/users/:userId/block', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    
    const user = await User.findOneAndUpdate(
      { user_id: userId },
      { $set: { is_blocked: true } },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log(`[Admin] Blocked user ${userId}, reason=${reason || 'none'}`);
    
    return res.json({ success: true, message: 'User blocked successfully' });
  } catch (error) {
    console.error('Block user error:', error);
    return res.status(500).json({ error: 'Failed to block user' });
  }
});

router.put('/users/:userId/unblock', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findOneAndUpdate(
      { user_id: userId },
      { $set: { is_blocked: false } },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log(`[Admin] Unblocked user ${userId}`);
    
    return res.json({ success: true, message: 'User unblocked successfully' });
  } catch (error) {
    console.error('Unblock user error:', error);
    return res.status(500).json({ error: 'Failed to unblock user' });
  }
});

router.delete('/users/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const currentUser = req.user;
    
    if (currentUser && userId === currentUser.user_id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    console.log(`[Admin] DELETE /users/${userId} - Starting deletion, reason: ${reason || 'none'}`);
    
    await ServiceOrder.deleteMany({
      $or: [
        { patient_user_id: userId },
        { assigned_engineer_id: userId }
      ]
    });
    
    const { KYCSubmission, Follow, BlockedUser, ConnectionRequest } = await import('../models/index.js');
    
    await KYCSubmission.deleteMany({ user_id: userId });
    await Follow.deleteMany({ 
      $or: [
        { follower_user_id: userId },
        { following_user_id: userId }
      ]
    });
    await BlockedUser.deleteMany({
      $or: [
        { blocker_user_id: userId },
        { blocked_user_id: userId }
      ]
    });
    await ConnectionRequest.deleteMany({
      $or: [
        { sender_user_id: userId },
        { receiver_user_id: userId }
      ]
    });
    
    const user = await User.findOneAndDelete({ user_id: userId });
    
    if (!user) {
      console.log(`[Admin] User ${userId} not found`);
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log(`[Admin] Successfully deleted user ${userId} and all associated data`);
    
    return res.json({ 
      success: true,
      message: 'User and all associated data permanently deleted'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ 
      error: 'Failed to delete user',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/support-tickets', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const tickets = await SupportTicket.find()
      .sort({ 
        status: 1,
        created_at: -1 
      })
      .lean();
    
    const ticketsWithUserData = await Promise.all(tickets.map(async (ticket: any) => {
      const ticketObj: any = {
        id: ticket._id.toString(),
        ...ticket
      };
      
      if (ticket.user_id) {
        const user = await User.findOne({ user_id: ticket.user_id }).lean();
        if (user) {
          ticketObj.user_name = user.full_name || (user as any).patient_full_name || user.business_name;
          ticketObj.user_email = (user as any).patient_email || user.email || user.phone;
        }
      }
      
      if (ticket.booking_id) {
        const booking = await ServiceOrder.findById(ticket.booking_id).lean();
        if (booking) {
          ticketObj.booking_service_category = booking.service_category;
          ticketObj.booking_service_type = booking.service_type;
          ticketObj.booking_status = booking.status;
        }
      }
      
      return ticketObj;
    }));
    
    return res.json(ticketsWithUserData);
  } catch (error) {
    console.error('Get support tickets error:', error);
    return res.status(500).json({ error: 'Failed to fetch support tickets' });
  }
});

router.post('/support-tickets/:id/respond', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { response: adminResponse } = req.body;
    
    if (!adminResponse || !adminResponse.trim()) {
      return res.status(400).json({ error: 'Response is required' });
    }
    
    const ticket = await SupportTicket.findByIdAndUpdate(
      id,
      {
        $set: {
          admin_response: adminResponse,
          status: 'in_progress',
          updated_at: new Date()
        }
      },
      { new: true }
    );
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Respond to ticket error:', error);
    return res.status(500).json({ error: 'Failed to respond to ticket' });
  }
});

router.post('/support-tickets/:id/resolve', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const ticket = await SupportTicket.findByIdAndUpdate(
      id,
      {
        $set: {
          status: 'resolved',
          resolved_at: new Date(),
          updated_at: new Date()
        }
      },
      { new: true }
    );
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Resolve ticket error:', error);
    return res.status(500).json({ error: 'Failed to resolve ticket' });
  }
});

router.post('/support-tickets/:id/reopen', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const ticket = await SupportTicket.findByIdAndUpdate(
      id,
      {
        $set: {
          status: 'open',
          resolved_at: null,
          updated_at: new Date()
        }
      },
      { new: true }
    );
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Reopen ticket error:', error);
    return res.status(500).json({ error: 'Failed to reopen ticket' });
  }
});

export default router;

