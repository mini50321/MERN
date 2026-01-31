import express, { Request, Response } from 'express';
import { User, NewsUpdate, Exhibition, Job, Service, ServiceManual, ServiceOrder, SupportTicket } from '../models/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

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

router.get('/content/pending-exhibitions', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const exhibitions = await Exhibition.find({ is_user_post: true })
      .sort({ created_at: -1 })
      .lean();
    
    return res.json(exhibitions);
  } catch (error) {
    console.error('Get pending exhibitions error:', error);
    return res.status(500).json({ error: 'Failed to fetch pending exhibitions' });
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

