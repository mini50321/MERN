import express, { type Request, type Response } from 'express';
import { Service, User } from '../models/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    const query: any = {};
    
    if (type) {
      query.service_type = type;
    }

    const services = await Service.find(query)
      .sort({ created_at: -1 })
      .limit(100);

    const servicesWithProvider = await Promise.all(services.map(async (service) => {
      const serviceObj = service.toObject();
      
      if (service.posted_by_user_id) {
        const provider = await User.findOne({ user_id: service.posted_by_user_id });
        if (provider) {
          serviceObj.provider_name = provider.full_name || provider.business_name || 'Unknown';
          serviceObj.provider_picture = provider.profile_picture_url || null;
        }
      }

      return {
        id: service._id.toString(),
        ...serviceObj
      };
    }));

    return res.json(servicesWithProvider);
  } catch (error) {
    console.error('Get services error:', error);
    return res.status(500).json({ error: 'Failed to fetch services' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findOne({ user_id: req.user!.user_id });
    
    const service = await Service.create({
      title: req.body.title,
      description: req.body.description || null,
      service_type: req.body.service_type || null,
      price_range: req.body.price_range || null,
      location: req.body.location || null,
      availability: req.body.availability || null,
      contact_email: req.body.contact_email || null,
      contact_phone: req.body.contact_phone || null,
      image_url: req.body.image_url || null,
      provider_name: user?.full_name || user?.business_name || null,
      provider_picture: user?.profile_picture_url || null,
      posted_by_user_id: req.user!.user_id
    });

    return res.status(201).json({ id: service._id.toString(), success: true });
  } catch (error) {
    console.error('Create service error:', error);
    return res.status(500).json({ error: 'Failed to create service' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const serviceObj = service.toObject();
    
    if (service.posted_by_user_id) {
      const provider = await User.findOne({ user_id: service.posted_by_user_id });
      if (provider) {
        serviceObj.provider_name = provider.full_name || provider.business_name || 'Unknown';
        serviceObj.provider_picture = provider.profile_picture_url || null;
      }
    }

    return res.json({ id: service._id.toString(), ...serviceObj });
  } catch (error) {
    console.error('Get service error:', error);
    return res.status(500).json({ error: 'Failed to fetch service' });
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const service = await Service.findOneAndUpdate(
      { 
        _id: req.params.id,
        posted_by_user_id: req.user!.user_id 
      },
      { $set: req.body },
      { new: true }
    );

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    return res.json({ service, success: true });
  } catch (error) {
    console.error('Update service error:', error);
    return res.status(500).json({ error: 'Failed to update service' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const service = await Service.findOneAndDelete({ 
      _id: req.params.id,
      posted_by_user_id: req.user!.user_id 
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Delete service error:', error);
    return res.status(500).json({ error: 'Failed to delete service' });
  }
});

export default router;

