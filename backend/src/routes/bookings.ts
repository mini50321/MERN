import express, { Response } from 'express';
import { ServiceOrder, User } from '../models/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

router.post('/submit', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const body = req.body;

    if (!body.patient_name || !body.patient_contact || !body.issue_description) {
      return res.status(400).json({ error: "Patient name, contact, and issue description are required" });
    }

    const locationParts = [
      body.address,
      body.city,
      body.state,
      body.pincode
    ].filter(Boolean);
    const fullLocation = locationParts.join(", ");

    const serviceOrder = await ServiceOrder.create({
      patient_user_id: req.user!.user_id,
      patient_name: body.patient_name,
      patient_contact: body.patient_contact,
      patient_email: body.patient_email || null,
      patient_location: fullLocation || null,
      service_type: body.service_type || "Service",
      service_category: body.service_category || null,
      equipment_name: body.equipment_name || null,
      equipment_model: body.equipment_model || null,
      issue_description: body.issue_description,
      urgency_level: body.urgency || "normal",
      preferred_date: body.preferred_date || null,
      preferred_time: body.preferred_time || null,
      patient_address: body.address || null,
      patient_city: body.city || null,
      patient_state: body.state || null,
      patient_pincode: body.pincode || null,
      patient_latitude: body.latitude || null,
      patient_longitude: body.longitude || null,
      pickup_latitude: body.pickup_latitude || null,
      pickup_longitude: body.pickup_longitude || null,
      pickup_address: body.pickup_address || null,
      dropoff_latitude: body.dropoff_latitude || null,
      dropoff_longitude: body.dropoff_longitude || null,
      dropoff_address: body.dropoff_address || null,
      quoted_price: body.quoted_price || null,
      quoted_currency: body.quoted_currency || "INR",
      engineer_notes: body.engineer_notes || null,
      billing_frequency: body.billing_frequency || "per_visit",
      monthly_visits_count: body.monthly_visits_count || null,
      patient_condition: body.patient_condition || null,
      status: 'pending'
    });

    return res.status(201).json({ 
      success: true, 
      order_id: serviceOrder._id.toString(),
      id: serviceOrder._id.toString(),
      quoted_price: serviceOrder.quoted_price,
      status: serviceOrder.status,
      message: "Booking request submitted successfully."
    });
  } catch (error) {
    console.error("Error processing booking request:", error);
    return res.status(500).json({ 
      error: "Failed to submit booking request",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const orders = await ServiceOrder.find({ patient_user_id: req.user!.user_id })
      .sort({ created_at: -1 });
    
    const formattedOrders = orders.map(order => ({
      ...order.toObject(),
      id: order._id.toString()
    }));
    
    return res.json(formattedOrders);
  } catch (error) {
    console.error('Get bookings error:', error);
    return res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

router.get('/patient', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const orders = await ServiceOrder.find({ patient_user_id: req.user!.user_id })
      .sort({ created_at: -1 });
    
    const formattedOrders = await Promise.all(orders.map(async (order) => {
      const orderObj = order.toObject();
      let partnerInfo = {};
      
      if (order.status === 'accepted' && order.assigned_engineer_id) {
        const partner = await User.findOne({ user_id: order.assigned_engineer_id });
        if (partner) {
          const completedOrders = await ServiceOrder.countDocuments({
            assigned_engineer_id: order.assigned_engineer_id,
            status: 'completed'
          });
          
          const ratings = await ServiceOrder.find({
            assigned_engineer_id: order.assigned_engineer_id,
            status: 'completed',
            partner_rating: { $exists: true, $ne: null }
          });
          
          const avgRating = ratings.length > 0
            ? ratings.reduce((sum, r) => sum + (r.partner_rating || 0), 0) / ratings.length
            : null;
          
          partnerInfo = {
            partner_name: partner.full_name || partner.business_name,
            partner_phone: partner.phone,
            partner_email: partner.patient_email,
            partner_latitude: partner.patient_latitude,
            partner_longitude: partner.patient_longitude,
            partner_location: partner.location,
            partner_city: partner.city,
            partner_state: partner.state,
            partner_avg_rating: avgRating ? Math.round(avgRating * 10) / 10 : null,
            partner_total_ratings: ratings.length,
            partner_completed_orders: completedOrders
          };
        }
      }
      
      return {
        ...orderObj,
        id: order._id.toString(),
        ...partnerInfo
      };
    }));
    
    return res.json(formattedOrders);
  } catch (error) {
    console.error('Get patient bookings error:', error);
    return res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

router.get('/partner/ratings', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.user_id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const ratings = await ServiceOrder.find({
      assigned_engineer_id: userId,
      status: 'completed',
      partner_rating: { $exists: true, $ne: null }
    })
    .sort({ created_at: -1 })
    .lean();
    
    const formattedRatings = ratings.map((order: any) => {
      try {
        return {
          id: parseInt(order._id.toString().slice(-8), 16) || Date.now(),
          patient_name: order.patient_name || 'Anonymous',
          service_type: order.service_type || 'Service',
          equipment_name: order.equipment_name || null,
          partner_rating: order.partner_rating || 0,
          partner_review: order.partner_review || '',
          created_at: order.created_at ? (order.created_at instanceof Date ? order.created_at.toISOString() : new Date(order.created_at).toISOString()) : new Date().toISOString()
        };
      } catch (mapError) {
        console.error('Error formatting rating:', mapError);
        return null;
      }
    }).filter((rating: any) => rating !== null);
    
    const avgRating = formattedRatings.length > 0
      ? formattedRatings.reduce((sum: number, r: any) => sum + (r.partner_rating || 0), 0) / formattedRatings.length
      : 0;
    
    return res.json({
      ratings: formattedRatings,
      average_rating: Math.round(avgRating * 10) / 10
    });
  } catch (error: any) {
    console.error('Get partner ratings error:', error);
    console.error('Error details:', error?.message, error?.stack);
    return res.status(500).json({ 
      error: 'Failed to fetch ratings',
      details: error?.message || 'Unknown error'
    });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const order = await ServiceOrder.findOne({ 
      _id: req.params.id,
      patient_user_id: req.user!.user_id 
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    return res.json(order);
  } catch (error) {
    console.error('Get booking error:', error);
    return res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const order = await ServiceOrder.findOneAndUpdate(
      { 
        _id: req.params.id,
        patient_user_id: req.user!.user_id 
      },
      { $set: req.body },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    return res.json({ order, success: true });
  } catch (error) {
    console.error('Update booking error:', error);
    return res.status(500).json({ error: 'Failed to update booking' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const order = await ServiceOrder.findOneAndDelete({ 
      _id: req.params.id,
      patient_user_id: req.user!.user_id 
    });

    if (!order) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Delete booking error:', error);
    return res.status(500).json({ error: 'Failed to delete booking' });
  }
});

export default router;
