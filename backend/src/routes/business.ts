import express, { type Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { Territory, Engineer, Dealer } from '../models/index.js';

const router = express.Router();

router.get('/territories', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const territories = await Territory.find({ business_user_id: req.user!.user_id })
      .sort({ created_at: -1 });
    
    const formattedTerritories = territories.map(territory => ({
      id: territory._id.toString(),
      country: territory.country,
      state: territory.state || '',
      city: territory.city || '',
      pincode: territory.pincode || '',
      is_primary: territory.is_primary ? 1 : 0
    }));
    
    return res.json(formattedTerritories);
  } catch (error) {
    console.error('Get territories error:', error);
    return res.status(500).json({ error: 'Failed to fetch territories' });
  }
});

router.post('/territories', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.body.country) {
      return res.status(400).json({ error: 'Country is required' });
    }

    if (req.body.is_primary) {
      await Territory.updateMany(
        { business_user_id: req.user!.user_id },
        { $set: { is_primary: false } }
      );
    }

    const territory = await Territory.create({
      business_user_id: req.user!.user_id,
      country: req.body.country,
      state: req.body.state || null,
      city: req.body.city || null,
      pincode: req.body.pincode || null,
      is_primary: req.body.is_primary === true || req.body.is_primary === 1
    });

    return res.status(201).json({ 
      id: territory._id.toString(), 
      success: true 
    });
  } catch (error: any) {
    console.error('Create territory error:', error);
    return res.status(500).json({ 
      error: 'Failed to create territory',
      details: error?.message 
    });
  }
});

router.delete('/territories/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const territory = await Territory.findOneAndDelete({
      _id: req.params.id,
      business_user_id: req.user!.user_id
    });

    if (!territory) {
      return res.status(404).json({ error: 'Territory not found' });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Delete territory error:', error);
    return res.status(500).json({ error: 'Failed to delete territory' });
  }
});

router.get('/engineers', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const engineers = await Engineer.find({ business_user_id: req.user!.user_id })
      .sort({ created_at: -1 });
    
    const formattedEngineers = engineers.map(engineer => ({
      id: engineer._id.toString(),
      name: engineer.name,
      email: engineer.email,
      phone: engineer.phone || '',
      specialisation: engineer.specialisation || '',
      experience_years: engineer.experience_years || 0,
      certifications: engineer.certifications || '',
      city: engineer.city || '',
      state: engineer.state || '',
      country: engineer.country || ''
    }));
    
    return res.json(formattedEngineers);
  } catch (error) {
    console.error('Get engineers error:', error);
    return res.status(500).json({ error: 'Failed to fetch engineers' });
  }
});

router.post('/engineers', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.body.name || !req.body.email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const engineer = await Engineer.create({
      business_user_id: req.user!.user_id,
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone || null,
      specialisation: req.body.specialisation || null,
      experience_years: req.body.experience_years || null,
      certifications: req.body.certifications || null,
      city: req.body.city || null,
      state: req.body.state || null,
      country: req.body.country || null
    });

    return res.status(201).json({ 
      id: engineer._id.toString(), 
      success: true 
    });
  } catch (error: any) {
    console.error('Create engineer error:', error);
    return res.status(500).json({ 
      error: 'Failed to create engineer',
      details: error?.message 
    });
  }
});

router.put('/engineers/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const engineer = await Engineer.findOneAndUpdate(
      {
        _id: req.params.id,
        business_user_id: req.user!.user_id
      },
      { $set: req.body },
      { new: true }
    );

    if (!engineer) {
      return res.status(404).json({ error: 'Engineer not found' });
    }

    return res.json({ 
      id: engineer._id.toString(), 
      success: true 
    });
  } catch (error: any) {
    console.error('Update engineer error:', error);
    return res.status(500).json({ 
      error: 'Failed to update engineer',
      details: error?.message 
    });
  }
});

router.delete('/engineers/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const engineer = await Engineer.findOneAndDelete({
      _id: req.params.id,
      business_user_id: req.user!.user_id
    });

    if (!engineer) {
      return res.status(404).json({ error: 'Engineer not found' });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Delete engineer error:', error);
    return res.status(500).json({ error: 'Failed to delete engineer' });
  }
});

router.get('/dealers', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const dealers = await Dealer.find({ business_user_id: req.user!.user_id })
      .sort({ created_at: -1 });
    
    const formattedDealers = dealers.map(dealer => ({
      id: dealer._id.toString(),
      name: dealer.name,
      email: dealer.email,
      phone: dealer.phone || '',
      address: dealer.address || '',
      city: dealer.city || '',
      state: dealer.state || '',
      country: dealer.country || '',
      pincode: dealer.pincode || '',
      is_verified: dealer.is_verified ? 1 : 0
    }));
    
    return res.json(formattedDealers);
  } catch (error) {
    console.error('Get dealers error:', error);
    return res.status(500).json({ error: 'Failed to fetch dealers' });
  }
});

router.post('/dealers', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.body.name || !req.body.email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const dealer = await Dealer.create({
      business_user_id: req.user!.user_id,
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone || null,
      address: req.body.address || null,
      city: req.body.city || null,
      state: req.body.state || null,
      country: req.body.country || null,
      pincode: req.body.pincode || null,
      is_verified: req.body.is_verified === true || req.body.is_verified === 1
    });

    return res.status(201).json({ 
      id: dealer._id.toString(), 
      success: true 
    });
  } catch (error: any) {
    console.error('Create dealer error:', error);
    return res.status(500).json({ 
      error: 'Failed to create dealer',
      details: error?.message 
    });
  }
});

router.delete('/dealers/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const dealer = await Dealer.findOneAndDelete({
      _id: req.params.id,
      business_user_id: req.user!.user_id
    });

    if (!dealer) {
      return res.status(404).json({ error: 'Dealer not found' });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Delete dealer error:', error);
    return res.status(500).json({ error: 'Failed to delete dealer' });
  }
});

export default router;

