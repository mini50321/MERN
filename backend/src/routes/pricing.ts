import express, { type Response } from 'express';
import { SubscriptionPlan, AppSetting } from '../models/index.js';

const router = express.Router();

router.get('/physiotherapy-prices', async (_req, res: Response) => {
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
      // Legacy/Alternative names for compatibility
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

router.get('/nursing-prices', async (_req, res: Response) => {
  try {
    return res.json([
      // Task-Based Services
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
      // Care-Based Home Nursing
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
      // Legacy/Alternative names for compatibility
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

router.get('/ambulance-prices', async (_req, res: Response) => {
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

router.get('/subscription-plans', async (_req, res: Response) => {
  try {
    const plans = await SubscriptionPlan.find({ is_active: true })
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
      display_order: plan.display_order
    }));
    
    return res.json(formattedPlans);
  } catch (error) {
    console.error('Get subscription plans error:', error);
    return res.status(500).json({ error: 'Failed to fetch subscription plans' });
  }
});

router.get('/subscription-settings', async (_req, res: Response) => {
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

export default router;

