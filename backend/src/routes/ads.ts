import express, { Response } from 'express';
import multer from 'multer';
import { BannerAd } from '../models/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'));
    }
  }
});

router.get('/banners', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const banners = await BannerAd.find()
      .sort({ display_order: 1, created_at: -1 })
      .lean();
    
    const formattedBanners = banners.map(banner => ({
      id: parseInt(banner._id.toString().slice(-8), 16) || Date.now(),
      title: banner.title,
      image_url: banner.image_url,
      target_url: banner.target_url || null,
      ad_type: banner.ad_type,
      display_mode: banner.display_mode,
      is_active: banner.is_active ? 1 : 0,
      display_order: banner.display_order,
      created_at: banner.created_at.toISOString(),
      updated_at: banner.updated_at.toISOString()
    }));
    
    return res.json(formattedBanners);
  } catch (error) {
    console.error('Get banner ads error:', error);
    return res.status(500).json({ error: 'Failed to fetch banner ads' });
  }
});

router.post('/upload-media', authMiddleware, upload.single('media'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No media file provided' });
    }

    const file = req.file;
    const mediaUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    return res.json({
      success: true,
      media_url: mediaUrl,
      message: 'Media uploaded successfully'
    });
  } catch (error) {
    console.error('Upload media error:', error);
    return res.status(500).json({ error: 'Failed to upload media' });
  }
});

router.post('/banners', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const banner = await BannerAd.create({
      title: req.body.title,
      image_url: req.body.image_url,
      target_url: req.body.target_url || null,
      ad_type: req.body.ad_type || 'image',
      display_mode: req.body.display_mode || 'banner',
      is_active: req.body.is_active === 1 || req.body.is_active === true,
      display_order: req.body.display_order || 0
    });

    const formattedBanner = {
      id: parseInt(banner._id.toString().slice(-8), 16) || Date.now(),
      title: banner.title,
      image_url: banner.image_url,
      target_url: banner.target_url || null,
      ad_type: banner.ad_type,
      display_mode: banner.display_mode,
      is_active: banner.is_active ? 1 : 0,
      display_order: banner.display_order,
      created_at: banner.created_at.toISOString(),
      updated_at: banner.updated_at.toISOString()
    };

    return res.status(201).json({ banner: formattedBanner, success: true });
  } catch (error) {
    console.error('Create banner ad error:', error);
    return res.status(500).json({ error: 'Failed to create banner ad' });
  }
});

router.put('/banners/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const bannerId = req.params.id;
    let banner;
    let actualBannerId: string | null = null;
    
    if (bannerId.match(/^[0-9a-fA-F]{24}$/)) {
      actualBannerId = bannerId;
    } else {
      const allBanners = await BannerAd.find().lean();
      const found = allBanners.find(b => {
        const idNum = parseInt(b._id.toString().slice(-8), 16);
        return idNum === parseInt(bannerId, 10);
      });
      if (found) {
        actualBannerId = found._id.toString();
      }
    }

    if (!actualBannerId) {
      return res.status(404).json({ error: 'Banner ad not found' });
    }

    const updateData: any = {};
    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.image_url !== undefined) updateData.image_url = req.body.image_url;
    if (req.body.target_url !== undefined) updateData.target_url = req.body.target_url || null;
    if (req.body.ad_type !== undefined) updateData.ad_type = req.body.ad_type;
    if (req.body.display_mode !== undefined) updateData.display_mode = req.body.display_mode;
    if (req.body.is_active !== undefined) updateData.is_active = req.body.is_active === 1 || req.body.is_active === true;
    if (req.body.display_order !== undefined) updateData.display_order = req.body.display_order;

    banner = await BannerAd.findByIdAndUpdate(
      actualBannerId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!banner) {
      return res.status(404).json({ error: 'Banner ad not found' });
    }

    const formattedBanner = {
      id: parseInt(banner._id.toString().slice(-8), 16) || Date.now(),
      title: banner.title,
      image_url: banner.image_url,
      target_url: banner.target_url || null,
      ad_type: banner.ad_type,
      display_mode: banner.display_mode,
      is_active: banner.is_active ? 1 : 0,
      display_order: banner.display_order,
      created_at: banner.created_at.toISOString(),
      updated_at: banner.updated_at.toISOString()
    };

    return res.json({ banner: formattedBanner, success: true });
  } catch (error) {
    console.error('Update banner ad error:', error);
    return res.status(500).json({ error: 'Failed to update banner ad' });
  }
});

router.delete('/banners/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const bannerId = req.params.id;
    let banner;
    let actualBannerId: string | null = null;
    
    if (bannerId.match(/^[0-9a-fA-F]{24}$/)) {
      actualBannerId = bannerId;
    } else {
      const allBanners = await BannerAd.find().lean();
      const found = allBanners.find(b => {
        const idNum = parseInt(b._id.toString().slice(-8), 16);
        return idNum === parseInt(bannerId, 10);
      });
      if (found) {
        actualBannerId = found._id.toString();
      }
    }

    if (!actualBannerId) {
      return res.status(404).json({ error: 'Banner ad not found' });
    }

    banner = await BannerAd.findById(actualBannerId);

    if (!banner) {
      return res.status(404).json({ error: 'Banner ad not found' });
    }

    await BannerAd.findByIdAndDelete(banner._id);
    return res.json({ success: true });
  } catch (error) {
    console.error('Delete banner ad error:', error);
    return res.status(500).json({ error: 'Failed to delete banner ad' });
  }
});

export default router;


