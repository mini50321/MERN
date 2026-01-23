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


    const orders = await ServiceOrder.find({
      $or: [
        { status: 'pending' },
        { assigned_engineer_id: req.user!.user_id }
      ]
    })
    .sort({ created_at: -1 });

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

// Decline a service order
router.post('/:id/decline', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const order = await ServiceOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Only allow declining if order is pending or assigned to this partner
    if (order.status === 'pending' || order.assigned_engineer_id === req.user!.user_id) {
      if (order.status === 'accepted') {
        // Release the order back to pending
        order.status = 'pending';
        order.assigned_engineer_id = undefined;
      } else {
        // Mark as declined
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

// Mark order as completed
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

// Rate the user (patient)
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

    // Update order with rating (using $set for fields that may not exist in schema)
    await ServiceOrder.findByIdAndUpdate(req.params.id, {
      $set: {
        user_rating: rating,
        user_review: review || null
      }
    });
    await order.save();

    return res.json({ success: true });
  } catch (error) {
    console.error('Rate user error:', error);
    return res.status(500).json({ error: 'Failed to submit rating' });
  }
});

// Release an order (make it available for other partners)
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

