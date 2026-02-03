import express, { Response } from 'express';
import { ServiceOrder, User, Transaction } from '../models/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

router.post('/submit', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const body = req.body;

    if (!body.patient_name || !body.patient_contact || !body.issue_description) {
      return res.status(400).json({ error: "Patient name, contact, and issue description are required" });
    }

    const userId = req.user!.user_id;
    const user = await User.findOne({ user_id: userId });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userEmail = (user as any).email || (user as any).patient_email || body.patient_email;
    
    if (!userEmail) {
      return res.status(400).json({ 
        error: "Email is required to book services. Please update your profile with an email address or provide an email in the booking form.",
        requires_email: true
      });
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
      patient_email: userEmail,
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
    const user = await User.findOne({ user_id: req.user!.user_id });
    if (!user) {
      return res.json([]);
    }
    
    const orders = await ServiceOrder.find({ patient_user_id: req.user!.user_id })
      .sort({ created_at: -1 });
    
    const formattedOrders = orders.map(order => {
      const orderObj = order.toObject();
      if (!orderObj.order_number) {
        const objIdStr = order._id.toString();
        const lastDigits = objIdStr.slice(-8);
        orderObj.order_number = parseInt(lastDigits, 16) % 1000000;
      }
      return {
        ...orderObj,
        id: order._id.toString()
      };
    });
    
    return res.json(formattedOrders);
  } catch (error) {
    console.error('Get bookings error:', error);
    return res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

router.get('/patient', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findOne({ user_id: req.user!.user_id });
    if (!user) {
      return res.json([]);
    }
    
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
      
      if (!orderObj.order_number) {
        const objIdStr = order._id.toString();
        const lastDigits = objIdStr.slice(-8);
        orderObj.order_number = parseInt(lastDigits, 16) % 1000000;
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

router.get('/ratings', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.user_id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    try {
      const ratings = await ServiceOrder.find({
        assigned_engineer_id: userId,
        status: 'completed',
        partner_rating: { $exists: true, $ne: null }
      })
      .sort({ created_at: -1 })
      .lean();
      
      const formattedRatings = (ratings || []).map((order: any) => {
        try {
          let id: number = Date.now();
          try {
            if (order._id) {
              const idStr = String(order._id);
              if (idStr.length >= 8) {
                const parsed = parseInt(idStr.slice(-8), 16);
                if (!isNaN(parsed)) {
                  id = parsed;
                }
              }
            }
          } catch {
            id = Date.now();
          }
          
          let created_at: string = new Date().toISOString();
          try {
            if (order.created_at) {
              if (order.created_at instanceof Date) {
                created_at = order.created_at.toISOString();
              } else {
                const date = new Date(order.created_at);
                if (!isNaN(date.getTime())) {
                  created_at = date.toISOString();
                }
              }
            }
          } catch {
            created_at = new Date().toISOString();
          }
          
          return {
            id: id,
            patient_name: String(order.patient_name || 'Anonymous'),
            service_type: String(order.service_type || 'Service'),
            equipment_name: order.equipment_name ? String(order.equipment_name) : null,
            partner_rating: Number(order.partner_rating) || 0,
            partner_review: String(order.partner_review || ''),
            created_at: created_at
          };
        } catch (mapError: any) {
          console.error('Error formatting rating:', mapError?.message);
          return null;
        }
      }).filter((rating: any) => rating !== null);
      
      const avgRating = formattedRatings.length > 0
        ? formattedRatings.reduce((sum: number, r: any) => sum + (Number(r.partner_rating) || 0), 0) / formattedRatings.length
        : 0;
      
      return res.json({
        ratings: formattedRatings,
        average_rating: Math.round(avgRating * 10) / 10
      });
    } catch (dbError: any) {
      console.error('Database error fetching ratings:', dbError?.message);
      return res.json({
        ratings: [],
        average_rating: 0
      });
    }
  } catch (error: any) {
    console.error('Get partner ratings error:', error?.message);
    console.error('Error stack:', error?.stack);
    return res.status(500).json({ 
      error: 'Failed to fetch ratings',
      details: error?.message || 'Unknown error'
    });
  }
});

router.get('/transactions', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.user_id;
    
    const transactions = await Transaction.find({ 
      user_id: userId,
      transaction_type: { $in: ['payment', 'debit', 'service_payment'] }
    })
      .sort({ created_at: -1 })
      .limit(100);
    
    const formattedTransactions = transactions.map(transaction => {
      const transObj = transaction.toObject();
      return {
        id: transObj._id?.toString() || '',
        amount: transObj.amount,
        currency: transObj.currency || 'INR',
        description: transObj.description || 'Service Payment',
        status: transObj.status || 'completed',
        payment_method: transObj.payment_method || 'online',
        created_at: transObj.created_at,
        transaction_type: transObj.transaction_type
      };
    });
    
    return res.json(formattedTransactions);
  } catch (error: any) {
    console.error('Get patient transactions error:', error);
    console.error('Error details:', error?.message);
    return res.status(500).json({ 
      error: 'Failed to fetch transactions',
      details: error?.message || 'Unknown error'
    });
  }
});

router.get('/notification-settings', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findOne({ user_id: req.user!.user_id });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      push_notifications: user.push_notifications ?? true,
      email_alerts: user.email_notifications ?? true,
      sms_alerts: user.sms_notifications ?? false
    });
  } catch (error) {
    console.error('Get notification settings error:', error);
    return res.status(500).json({ error: 'Failed to fetch notification settings' });
  }
});

router.put('/notification-settings', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const updateData: any = {};
    
    if (req.body.push_notifications !== undefined) {
      updateData.push_notifications = Boolean(req.body.push_notifications);
    }
    
    if (req.body.email_alerts !== undefined) {
      updateData.email_notifications = Boolean(req.body.email_alerts);
    }
    
    if (req.body.sms_alerts !== undefined) {
      updateData.sms_notifications = Boolean(req.body.sms_alerts);
    }

    const user = await User.findOneAndUpdate(
      { user_id: req.user!.user_id },
      { $set: updateData },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      success: true,
      push_notifications: user.push_notifications ?? true,
      email_alerts: user.email_notifications ?? true,
      sms_alerts: user.sms_notifications ?? false
    });
  } catch (error) {
    console.error('Update notification settings error:', error);
    return res.status(500).json({ error: 'Failed to update notification settings' });
  }
});

router.get('/:id/search-status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const orderId = req.params.id;
    const userId = req.user!.user_id;
    
    console.log('Search status request - orderId:', orderId, 'userId:', userId);
    
    let order;
    const mongoose = await import('mongoose');
    
    if (mongoose.default.Types.ObjectId.isValid(orderId)) {
      order = await ServiceOrder.findOne({ 
        _id: new mongoose.default.Types.ObjectId(orderId),
        patient_user_id: userId 
      });
    } else {
      console.log('Invalid ObjectId format, trying numeric ID matching');
      const numericId = parseInt(orderId);
      
      if (!isNaN(numericId)) {
        order = await ServiceOrder.findOne({ 
          order_number: numericId,
          patient_user_id: userId 
        });
      }
      
      if (!order) {
        console.log('Not found by order_number, searching all orders');
        const allOrders = await ServiceOrder.find({ patient_user_id: userId }).sort({ created_at: -1 });
        
        if (!isNaN(numericId)) {
          order = allOrders.find((o: any) => {
            const objIdStr = o._id.toString();
            return objIdStr.includes(orderId) || (o.order_number && o.order_number === numericId);
          });
        }
        
        if (!order) {
          order = allOrders.find((o: any) => {
            const objIdStr = o._id.toString();
            return objIdStr.includes(orderId) || objIdStr.endsWith(orderId);
          });
        }
      }
    }
    
    if (!order) {
      console.log('Order not found for orderId:', orderId);
      return res.status(404).json({ error: 'Booking not found' });
    }

    console.log('Order found:', order._id.toString(), 'status:', order.status);

    const orderObj = order.toObject();
    
    let partner = null;
    if (order.assigned_engineer_id) {
      try {
        partner = await User.findOne({ user_id: order.assigned_engineer_id });
        console.log('Partner found:', partner ? partner.user_id : 'null');
      } catch (partnerError: any) {
        console.error('Error fetching partner:', partnerError?.message);
      }
    }

    let status = 'not_found';
    if (order.status === 'accepted' || order.status === 'in_progress' || order.status === 'confirmed') {
      status = 'found';
    } else if (order.status === 'pending' || order.status === 'searching') {
      status = 'searching';
    }

    const response = {
      status,
      booking: {
        ...orderObj,
        id: orderObj._id?.toString() || orderId
      },
      partner: partner ? {
        id: partner.user_id,
        name: partner.full_name || partner.business_name || 'Unknown',
        phone: partner.phone || null,
        picture: partner.profile_picture_url || null,
        rating: 0
      } : null
    };

    console.log('Returning response with status:', status);
    return res.json(response);
  } catch (error: any) {
    console.error('Get search status error:', error);
    console.error('Error details:', error?.message);
    console.error('Stack trace:', error?.stack);
    console.error('OrderId received:', req.params.id);
    return res.status(500).json({ 
      error: 'Failed to fetch search status',
      details: error?.message || 'Unknown error'
    });
  }
});

router.post('/:id/accept', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const order = await ServiceOrder.findOneAndUpdate(
      { 
        _id: req.params.id,
        patient_user_id: req.user!.user_id 
      },
      { 
        $set: { 
          status: 'accepted',
          accepted_at: new Date()
        }
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    return res.json({ success: true, order });
  } catch (error) {
    console.error('Accept booking error:', error);
    return res.status(500).json({ error: 'Failed to accept booking' });
  }
});

router.post('/:id/decline', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const order = await ServiceOrder.findOneAndUpdate(
      { 
        _id: req.params.id,
        patient_user_id: req.user!.user_id 
      },
      { 
        $set: { 
          status: 'declined',
          declined_at: new Date()
        }
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    return res.json({ success: true, order });
  } catch (error) {
    console.error('Decline booking error:', error);
    return res.status(500).json({ error: 'Failed to decline booking' });
  }
});

router.post('/:id/cancel', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const order = await ServiceOrder.findOneAndUpdate(
      { 
        _id: req.params.id,
        patient_user_id: req.user!.user_id 
      },
      { 
        $set: { 
          status: 'cancelled',
          cancelled_at: new Date()
        }
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    return res.json({ success: true, order });
  } catch (error) {
    console.error('Cancel booking error:', error);
    return res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

router.put('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.user_id;
    const updateData: any = {};

    if (req.body.patient_full_name) {
      updateData.full_name = String(req.body.patient_full_name);
    }

    if (req.body.patient_contact) {
      updateData.phone = String(req.body.patient_contact);
    }

    if (req.body.patient_email) {
      updateData.patient_email = String(req.body.patient_email);
      if (!updateData.email) {
        updateData.email = String(req.body.patient_email);
      }
    }

    if (req.body.patient_address) {
      updateData.location = String(req.body.patient_address);
    }

    if (req.body.patient_city) {
      updateData.city = String(req.body.patient_city);
    }

    if (req.body.patient_pincode) {
      updateData.pincode = String(req.body.patient_pincode);
    }

    if (req.body.patient_latitude !== null && req.body.patient_latitude !== undefined) {
      updateData.patient_latitude = Number(req.body.patient_latitude);
    }

    if (req.body.patient_longitude !== null && req.body.patient_longitude !== undefined) {
      updateData.patient_longitude = Number(req.body.patient_longitude);
    }

    if (req.body.state) {
      updateData.state = String(req.body.state);
    }

    const user = await User.findOneAndUpdate(
      { user_id: userId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ 
      success: true, 
      profile: user,
      message: 'Profile updated successfully'
    });
  } catch (error: any) {
    console.error('Update patient profile error:', error);
    return res.status(500).json({ 
      error: 'Failed to update profile',
      details: error?.message || 'Unknown error'
    });
  }
});

router.post('/:id/rate', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { rating, review } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const order = await ServiceOrder.findOneAndUpdate(
      { 
        _id: req.params.id,
        patient_user_id: req.user!.user_id 
      },
      { 
        $set: { 
          user_rating: Number(rating),
          user_review: review || null
        }
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    return res.json({ success: true, order });
  } catch (error) {
    console.error('Rate booking error:', error);
    return res.status(500).json({ error: 'Failed to rate booking' });
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
