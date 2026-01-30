import express, { Response } from 'express';
import { ServiceOrder, User } from '../models/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = express.Router();


router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findOne({ user_id: req.user!.user_id });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profession = (user.profession || '').toLowerCase();
    
    // Build service category filter based on partner's profession
    let pendingOrdersCondition: any = {
      status: 'pending'
    };
    
    if (profession.includes('nursing') || profession.includes('nurse')) {
      // Nursing partners only see nursing service requests
      pendingOrdersCondition.service_category = { $regex: /nursing/i };
    } else if (profession.includes('physio') || profession.includes('therapy')) {
      // Physiotherapy partners only see physiotherapy service requests
      pendingOrdersCondition.service_category = { $regex: /physio/i };
    } else if (profession.includes('ambulance') || profession.includes('emergency') || profession.includes('ems')) {
      // Ambulance providers only see ambulance service requests
      pendingOrdersCondition.service_category = { $regex: /ambulance/i };
    } else {
      // Biomedical engineers see biomedical and equipment orders (not nursing/physio/ambulance)
      pendingOrdersCondition.$or = [
        { service_category: { $regex: /biomedical/i } },
        { service_category: { $regex: /equipment/i } },
        { service_category: { $regex: /repair/i } },
        { service_category: { $regex: /maintenance/i } },
        { service_category: { $regex: /rental/i } },
        { service_category: { $exists: false } },
        { service_category: null },
        {
          $and: [
            { service_category: { $not: { $regex: /nursing/i } } },
            { service_category: { $not: { $regex: /physio/i } } },
            { service_category: { $not: { $regex: /ambulance/i } } }
          ]
        }
      ];
    }

    // Build the main query: pending orders matching partner's category OR orders assigned to this partner
    const query: any = {
      $or: [
        // Pending orders that match partner's service category
        pendingOrdersCondition,
        // Orders already assigned to this partner (regardless of category)
        { assigned_engineer_id: req.user!.user_id }
      ]
    };

    const orders = await ServiceOrder.find(query)
      .sort({ created_at: -1 });

    console.log(`[Service Orders] Partner profession: ${profession}, Found ${orders.length} orders matching service category filter`);

    const formattedOrders = orders.map(order => ({
      ...order.toObject(),
      id: order._id.toString()
    }));

    return res.json(formattedOrders);
  } catch (error) {
    console.error('Get service orders error:', error);
    return res.status(500).json({ error: 'Failed to fetch service orders' });
  }
});

router.post('/:id/accept', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findOne({ user_id: req.user!.user_id });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('KYC Check - User ID:', req.user!.user_id);
    console.log('KYC Check - is_verified:', user.is_verified);
    console.log('KYC Check - User email:', user.email);

    if (!user.is_verified) {
      console.log('KYC Check - Blocking request: User not verified');
      return res.status(403).json({ 
        error: 'KYC verification required',
        message: 'Please complete your KYC verification before accepting service orders. You can submit your KYC documents from your profile settings.',
        requires_kyc: true
      });
    }

    console.log('KYC Check - Allowing request: User is verified');

    const order = await ServiceOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Order is not available for acceptance' });
    }

    order.status = 'accepted';
    order.assigned_engineer_id = req.user!.user_id;
    order.responded_at = new Date();
    
    if (req.body.service_type) {
      order.service_type = req.body.service_type;
    }

    await order.save();

    return res.json({ success: true, order });
  } catch (error) {
    console.error('Accept order error:', error);
    return res.status(500).json({ error: 'Failed to accept order' });
  }
});

router.post('/:id/decline', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findOne({ user_id: req.user!.user_id });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('KYC Check (Decline) - User ID:', req.user!.user_id);
    console.log('KYC Check (Decline) - is_verified:', user.is_verified);

    if (!user.is_verified) {
      console.log('KYC Check (Decline) - Blocking request: User not verified');
      return res.status(403).json({ 
        error: 'KYC verification required',
        message: 'Please complete your KYC verification before declining service orders. You can submit your KYC documents from your profile settings.',
        requires_kyc: true
      });
    }

    console.log('KYC Check (Decline) - Allowing request: User is verified');

    const order = await ServiceOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status === 'pending' || order.assigned_engineer_id === req.user!.user_id) {
      if (order.status === 'accepted') {
        order.status = 'pending';
        order.assigned_engineer_id = undefined;
      } else {
        order.status = 'declined';
      }
      await order.save();
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Decline order error:', error);
    return res.status(500).json({ error: 'Failed to decline order' });
  }
});

router.post('/:id/complete', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const order = await ServiceOrder.findOne({
      _id: req.params.id,
      assigned_engineer_id: req.user!.user_id
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found or not assigned to you' });
    }

    if (order.status !== 'accepted') {
      return res.status(400).json({ error: 'Order must be accepted before completion' });
    }

    order.status = 'completed';
    order.completed_at = new Date();
    await order.save();

    return res.json({ success: true, order });
  } catch (error) {
    console.error('Complete order error:', error);
    return res.status(500).json({ error: 'Failed to complete order' });
  }
});

router.post('/:id/rate-user', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { rating, review } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const order = await ServiceOrder.findOne({
      _id: req.params.id,
      assigned_engineer_id: req.user!.user_id
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found or not assigned to you' });
    }

    order.user_rating = rating;
    order.user_review = review || null;
    await order.save();

    return res.json({ success: true });
  } catch (error) {
    console.error('Rate user error:', error);
    return res.status(500).json({ error: 'Failed to submit rating' });
  }
});

router.post('/:id/release', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const order = await ServiceOrder.findOne({
      _id: req.params.id,
      assigned_engineer_id: req.user!.user_id
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found or not assigned to you' });
    }

    if (order.status !== 'accepted') {
      return res.status(400).json({ error: 'Only accepted orders can be released' });
    }

    order.status = 'pending';
    order.assigned_engineer_id = undefined;
    await order.save();

    return res.json({ success: true });
  } catch (error) {
    console.error('Release order error:', error);
    return res.status(500).json({ error: 'Failed to release order' });
  }
});

export default router;

