import express, { Response } from 'express';
import mongoose from 'mongoose';
import { ServiceOrder, User, KYCSubmission } from '../models/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = express.Router();


router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findOne({ user_id: req.user!.user_id });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profession = (user.profession || '').toLowerCase();
    
    let serviceCategoryFilter: any = {};
    
    if (profession.includes('nursing') || profession.includes('nurse')) {
      serviceCategoryFilter = { service_category: { $regex: /nursing/i } };
    } else if (profession.includes('physio') || profession.includes('therapy')) {
      serviceCategoryFilter = { service_category: { $regex: /physio/i } };
    } else if (profession.includes('ambulance') || profession.includes('emergency') || profession.includes('ems')) {
      serviceCategoryFilter = { service_category: { $regex: /ambulance/i } };
    } else {
      serviceCategoryFilter = {
        $or: [
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
        ]
      };
    }

    const query: any = {
      $and: [
        {
          $or: [
            { status: 'pending' },
            { assigned_engineer_id: req.user!.user_id }
          ]
        },
        serviceCategoryFilter
      ]
    };

    const orders = await ServiceOrder.find(query)
      .sort({ created_at: -1 });

    console.log(`[Service Orders] Partner profession: ${profession}, Found ${orders.length} orders matching service category filter`);

    const nursingPrices = [
      { service_name: 'Injection / IV / Simple Procedure', per_visit_price: 400 },
      { service_name: 'Vitals Check', per_visit_price: 300 },
      { service_name: 'Wound Dressing', per_visit_price: 500 },
      { service_name: 'Catheter / Ryles Tube Care', per_visit_price: 600 },
      { service_name: 'Nebulization / Oxygen Monitoring', per_visit_price: 500 },
      { service_name: 'General Home Nursing Visit', per_visit_price: 600 },
      { service_name: 'Post-Operative Home Nursing', per_visit_price: 800 },
      { service_name: 'Elderly Care Nursing (Day Shift)', per_visit_price: 700 },
      { service_name: '24-Hour Elderly Nursing (Live-in)', per_visit_price: 2500 },
      { service_name: 'General Nursing Care', per_visit_price: 600 }
    ];
    
    const physioPrices = [
      { service_name: 'Basic Physiotherapy Session (Home Visit)', per_session_price: 500 },
      { service_name: 'Post-Operative Physiotherapy', per_session_price: 1000 },
      { service_name: 'Stroke / Neuro Rehabilitation', per_session_price: 900 },
      { service_name: 'Elderly Physiotherapy', per_session_price: 600 },
      { service_name: 'Orthopedic Pain Management', per_session_price: 700 },
      { service_name: 'Pediatric Physiotherapy', per_session_price: 700 },
      { service_name: 'Respiratory Physiotherapy', per_session_price: 650 },
      { service_name: 'General Physiotherapy', per_session_price: 500 },
      { service_name: 'Sports Injury Rehabilitation', per_session_price: 800 },
      { service_name: 'Post-Surgical Rehabilitation', per_session_price: 1000 }
    ];

    const formattedOrders = await Promise.all(orders.map(async (order) => {
      const orderObj = order.toObject();
      
      if (!orderObj.quoted_price && orderObj.service_category) {
        const category = (orderObj.service_category || "").toLowerCase();
        const isNursing = category.includes("nursing");
        const isPhysio = category.includes("physio");
        
        if (isNursing || isPhysio) {
          const prices = isNursing ? nursingPrices : physioPrices;
          const serviceType = (orderObj.service_type || "").toLowerCase();
          
          const priceData = prices.find((p: any) => {
            const name = (p.service_name || "").toLowerCase();
            return name.includes(serviceType) || serviceType.includes(name) ||
                   serviceType.split(' ').some((word: string) => name.includes(word));
          });
          
          if (priceData) {
            const calculatedPrice = isNursing 
              ? (priceData as any).per_visit_price 
              : (priceData as any).per_session_price;
            
            if (calculatedPrice) {
              orderObj.quoted_price = calculatedPrice;
              
              await ServiceOrder.findByIdAndUpdate(order._id, {
                quoted_price: calculatedPrice
              });
            }
          }
        }
      }
      
      return {
        ...orderObj,
        id: order._id.toString()
      };
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

    const hasKYCSubmission = await KYCSubmission.findOne({ user_id: req.user!.user_id });
    
    if (!user.is_verified || !hasKYCSubmission) {
      console.log('KYC Check - Blocking request: User not verified or no KYC submission');
      return res.status(403).json({ 
        error: 'KYC verification required',
        message: 'Please complete your KYC verification before accepting service orders. You can submit your KYC documents from the Earn page.',
        requires_kyc: true
      });
    }

    console.log('KYC Check - Allowing request: User is verified');
    console.log('Accept order - Order ID:', req.params.id);

    let order;
    try {
      if (mongoose.Types.ObjectId.isValid(req.params.id)) {
        order = await ServiceOrder.findById(new mongoose.Types.ObjectId(req.params.id));
      }
      if (!order && mongoose.Types.ObjectId.isValid(req.params.id)) {
        order = await ServiceOrder.findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
      }
      if (!order && !isNaN(parseInt(req.params.id))) {
        order = await ServiceOrder.findOne({ order_number: parseInt(req.params.id) });
      }
    } catch (idError: any) {
      console.error('Error finding order by ID:', idError);
      return res.status(400).json({ 
        error: 'Invalid order ID',
        details: idError?.message || 'The provided order ID is not valid'
      });
    }

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
  } catch (error: any) {
    console.error('Accept order error:', error);
    console.error('Error details:', error?.message, error?.stack);
    return res.status(500).json({ 
      error: 'Failed to accept order',
      details: error?.message || 'Unknown error'
    });
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

    const hasKYCSubmission = await KYCSubmission.findOne({ user_id: req.user!.user_id });
    
    if (!user.is_verified || !hasKYCSubmission) {
      console.log('KYC Check (Decline) - Blocking request: User not verified or no KYC submission');
      return res.status(403).json({ 
        error: 'KYC verification required',
        message: 'Please complete your KYC verification before declining service orders. You can submit your KYC documents from the Earn page.',
        requires_kyc: true
      });
    }

    console.log('KYC Check (Decline) - Allowing request: User is verified');
    console.log('Decline order - Order ID:', req.params.id);

    let order;
    try {
      if (mongoose.Types.ObjectId.isValid(req.params.id)) {
        order = await ServiceOrder.findById(new mongoose.Types.ObjectId(req.params.id));
      }
      if (!order && mongoose.Types.ObjectId.isValid(req.params.id)) {
        order = await ServiceOrder.findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
      }
      if (!order && !isNaN(parseInt(req.params.id))) {
        order = await ServiceOrder.findOne({ order_number: parseInt(req.params.id) });
      }
    } catch (idError: any) {
      console.error('Error finding order by ID:', idError);
      return res.status(400).json({ 
        error: 'Invalid order ID',
        details: idError?.message || 'The provided order ID is not valid'
      });
    }

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

