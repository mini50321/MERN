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
          serviceObj.provider_picture = provider.profile_picture_url ?? undefined;
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
        serviceObj.provider_picture = provider.profile_picture_url ?? undefined;
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
    const serviceId = req.params.id;
    const userId = req.user!.user_id;
    const user = await User.findOne({ user_id: userId });
    const isAdmin = user?.is_admin === true || 
                    user?.role === 'admin' || 
                    user?.role === 'super_admin' ||
                    user?.email === 'mavytechsolutions@gmail.com' ||
                    user?.patient_email === 'mavytechsolutions@gmail.com';
    
    let service;
    let actualServiceId: string | null = null;
    
    if (serviceId.match(/^[0-9a-fA-F]{24}$/)) {
      actualServiceId = serviceId;
    } else {
      const allServices = await Service.find().lean();
      const found = allServices.find(s => {
        const idNum = parseInt(s._id.toString().slice(-8), 16);
        return idNum === parseInt(serviceId, 10);
      });
      if (found) {
        actualServiceId = found._id.toString();
      }
    }

    if (!actualServiceId) {
      return res.status(404).json({ error: 'Service not found' });
    }

    if (isAdmin) {
      service = await Service.findByIdAndUpdate(
        actualServiceId,
        { $set: req.body },
        { new: true, runValidators: true }
      );
    } else {
      service = await Service.findOneAndUpdate(
        { 
          _id: actualServiceId,
          posted_by_user_id: userId 
        },
        { $set: req.body },
        { new: true, runValidators: true }
      );
    }

    if (!service) {
      return res.status(404).json({ error: 'Service not found or user not authorized' });
    }

    return res.json({ service, success: true });
  } catch (error) {
    console.error('Update service error:', error);
    return res.status(500).json({ error: 'Failed to update service' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const serviceId = req.params.id;
    const userId = req.user!.user_id;
    const user = await User.findOne({ user_id: userId });
    const isAdmin = user?.is_admin === true || 
                    user?.role === 'admin' || 
                    user?.role === 'super_admin' ||
                    user?.email === 'mavytechsolutions@gmail.com' ||
                    user?.patient_email === 'mavytechsolutions@gmail.com';
    
    let service;
    let actualServiceId: string | null = null;
    
    if (serviceId.match(/^[0-9a-fA-F]{24}$/)) {
      actualServiceId = serviceId;
    } else {
      const allServices = await Service.find().lean();
      const found = allServices.find(s => {
        const idNum = parseInt(s._id.toString().slice(-8), 16);
        return idNum === parseInt(serviceId, 10);
      });
      if (found) {
        actualServiceId = found._id.toString();
      }
    }

    if (!actualServiceId) {
      return res.status(404).json({ error: 'Service not found' });
    }

    if (isAdmin) {
      service = await Service.findById(actualServiceId);
    } else {
      service = await Service.findOne({ 
        _id: actualServiceId,
        posted_by_user_id: userId 
      });
    }

    if (!service) {
      return res.status(404).json({ error: 'Service not found or user not authorized' });
    }

    await Service.findByIdAndDelete(service._id);
    return res.json({ success: true });
  } catch (error) {
    console.error('Delete service error:', error);
    return res.status(500).json({ error: 'Failed to delete service' });
  }
});

export default router;

