import express, { type Response } from 'express';

const router = express.Router();

router.get('/physiotherapy-prices', async (_req, res: Response) => {
  try {
    return res.json([
      {
        id: 1,
        service_name: 'General Physiotherapy',
        per_session_price: 500,
        monthly_price: 15000,
        description: 'Standard physiotherapy session',
        is_active: true
      },
      {
        id: 2,
        service_name: 'Sports Injury Rehabilitation',
        per_session_price: 800,
        monthly_price: 24000,
        description: 'Specialized sports injury treatment',
        is_active: true
      },
      {
        id: 3,
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
      {
        id: 1,
        service_name: 'General Nursing Care',
        per_visit_price: 600,
        monthly_price: 18000,
        description: 'Standard nursing care visit',
        is_active: true
      },
      {
        id: 2,
        service_name: 'Critical Care Nursing',
        per_visit_price: 1200,
        monthly_price: 36000,
        description: 'Specialized critical care nursing',
        is_active: true
      },
      {
        id: 3,
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

export default router;

