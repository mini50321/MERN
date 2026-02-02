import express, { Response } from 'express';
import multer from 'multer';
import { User } from '../models/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.user_id) {
      return res.status(401).json({ error: 'Unauthorized - Invalid user data' });
    }

    const user = await User.findOne({ user_id: req.user.user_id });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ profile: user });
  } catch (error: any) {
    console.error('Get user error:', error);
    console.error('Error details:', error?.message);
    console.error('Stack trace:', error?.stack);
    return res.status(500).json({ 
      error: 'Failed to fetch user profile',
      details: error?.message || 'Unknown error'
    });
  }
});

const updateUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const updateData = req.body;
    const user = await User.findOneAndUpdate(
      { user_id: req.user!.user_id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ profile: user, success: true });
  } catch (error: any) {
    console.error('Update user error:', error);
    console.error('Error details:', error?.message, error?.stack);
    return res.status(500).json({ 
      error: 'Failed to update user profile',
      details: error?.message || 'Unknown error'
    });
  }
};

router.get('/completion-status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findOne({ user_id: req.user!.user_id });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profile = user.toObject();
    const completedFields: string[] = [];
    const totalFields = 10;

    if (profile.full_name) completedFields.push('name');
    if (profile.phone) completedFields.push('phone');
    if (profile.location || profile.city) completedFields.push('location');
    if (profile.bio) completedFields.push('bio');
    if (profile.skills) completedFields.push('skills');
    if (profile.experience) completedFields.push('experience');
    if (profile.education) completedFields.push('education');
    if (profile.profile_picture_url) completedFields.push('profile_picture');
    if (profile.resume_url) completedFields.push('resume');
    if ((profile as any).specialities_json || (profile as any).products_json) {
      completedFields.push('specialities');
    }

    const completionPercentage = Math.round((completedFields.length / totalFields) * 100);

    return res.json({
      completed: completedFields.length,
      total: totalFields,
      percentage: completionPercentage,
      fields: completedFields
    });
  } catch (error: any) {
    console.error('Get completion status error:', error);
    return res.json({
      completed: 0,
      total: 10,
      percentage: 0,
      fields: []
    });
  }
});

router.put('/onboarding-details', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.user_id;
    const updateData: any = {};

    if (req.body.business_name) {
      updateData.business_name = String(req.body.business_name);
    }

    if (req.body.country) {
      updateData.country = String(req.body.country);
    }

    if (req.body.state) {
      updateData.state = String(req.body.state);
    }

    if (req.body.city) {
      updateData.city = String(req.body.city);
    }

    if (req.body.pincode) {
      updateData.pincode = String(req.body.pincode);
    }

    if (req.body.gst_number) {
      updateData.gst_number = String(req.body.gst_number);
    }

    if (req.body.gst_document_url) {
      updateData.gst_document_url = String(req.body.gst_document_url);
    }

    if (req.body.phone) {
      updateData.phone = String(req.body.phone);
    }

    if (req.body.email) {
      updateData.patient_email = String(req.body.email);
    }

    if (req.body.speciality_ids && Array.isArray(req.body.speciality_ids)) {
      updateData.specialities_json = JSON.stringify(req.body.speciality_ids.map((id: number) => ({ speciality_id: id })));
    }

    if (req.body.products && Array.isArray(req.body.products)) {
      updateData.products_json = JSON.stringify(req.body.products);
    }

    if (req.body.bio) {
      updateData.bio = String(req.body.bio);
    }

    if (req.body.skills) {
      updateData.skills = String(req.body.skills);
    }

    if (req.body.experience_json && Array.isArray(req.body.experience_json)) {
      updateData.experience = JSON.stringify(req.body.experience_json);
    }

    if (req.body.education_json && Array.isArray(req.body.education_json)) {
      updateData.education = JSON.stringify(req.body.education_json);
    }

    const updatedUser = await User.findOneAndUpdate(
      { user_id: userId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ 
      success: true, 
      profile: updatedUser,
      xp_awarded: 0
    });
  } catch (error: any) {
    console.error('Update onboarding details error:', error);
    console.error('Error details:', error?.message, error?.stack);
    return res.status(500).json({ 
      error: 'Failed to update onboarding details',
      details: error?.message || 'Unknown error'
    });
  }
});

router.put('/me', authMiddleware, updateUserProfile);
router.put('/', authMiddleware, updateUserProfile);

router.post('/complete', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.user_id;
    const onboardingData = req.body;
    
    if (!onboardingData) {
      return res.status(400).json({ error: 'Onboarding data is required' });
    }
    
    const user = await User.findOne({ user_id: userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.onboarding_completed) {
      return res.status(400).json({ error: 'Onboarding has already been completed' });
    }
    
    const updateData: any = {
      onboarding_completed: true
    };
    
    if (!updateData.email && user.email) {
      updateData.email = user.email;
    }
    
    if (!updateData.patient_email && user.patient_email) {
      updateData.patient_email = user.patient_email;
    }
    
    if (onboardingData.account_type) {
      updateData.account_type = String(onboardingData.account_type);
    }
    
    if (onboardingData.profession) {
      updateData.profession = String(onboardingData.profession);
    }
    
    if (onboardingData.full_name) {
      updateData.full_name = String(onboardingData.full_name);
    }
    
    if (onboardingData.last_name) {
      updateData.last_name = String(onboardingData.last_name);
    }
    
    if (onboardingData.patient_full_name) {
      updateData.full_name = String(onboardingData.patient_full_name);
    }
    
    if (onboardingData.patient_contact) {
      updateData.phone = String(onboardingData.patient_contact);
    }
    
    if (onboardingData.patient_email) {
      updateData.patient_email = String(onboardingData.patient_email);
    }
    
    if (onboardingData.patient_address) {
      updateData.location = String(onboardingData.patient_address);
    }
    
    if (onboardingData.patient_city) {
      updateData.city = String(onboardingData.patient_city);
    }
    
    if (onboardingData.patient_pincode) {
      updateData.pincode = String(onboardingData.patient_pincode);
    }
    
    if (onboardingData.patient_latitude !== null && onboardingData.patient_latitude !== undefined) {
      updateData.patient_latitude = Number(onboardingData.patient_latitude);
    }
    
    if (onboardingData.patient_longitude !== null && onboardingData.patient_longitude !== undefined) {
      updateData.patient_longitude = Number(onboardingData.patient_longitude);
    }
    
    if (onboardingData.country) {
      updateData.country = String(onboardingData.country);
    }
    
    if (onboardingData.state) {
      updateData.state = String(onboardingData.state);
    }
    
    if (onboardingData.city) {
      updateData.city = String(onboardingData.city);
    }
    
    if (onboardingData.phone) {
      updateData.phone = String(onboardingData.phone);
    }
    
    if (onboardingData.email) {
      updateData.email = String(onboardingData.email);
      updateData.patient_email = String(onboardingData.email);
    }
    
    if (onboardingData.business_name) {
      updateData.business_name = String(onboardingData.business_name);
    }
    
    if (onboardingData.specialisation) {
      updateData.specialisation = String(onboardingData.specialisation);
    }
    
    if (onboardingData.bio) {
      updateData.bio = String(onboardingData.bio);
    }
    
    if (onboardingData.skills) {
      updateData.skills = String(onboardingData.skills);
    }
    
    if (onboardingData.referral_code) {
      updateData.referral_code = String(onboardingData.referral_code).toUpperCase();
    }
    
    if (onboardingData.experience_json) {
      updateData.experience = JSON.stringify(onboardingData.experience_json);
    }
    
    if (onboardingData.education_json) {
      updateData.education = JSON.stringify(onboardingData.education_json);
    }
    
    const updatedUser = await User.findOneAndUpdate(
      { user_id: userId },
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'Failed to update user' });
    }
    
    return res.json({ 
      success: true, 
      message: 'Onboarding completed successfully',
      user: updatedUser
    });
  } catch (error: any) {
    console.error('Complete onboarding error:', error);
    console.error('Error details:', error?.message, error?.stack);
    return res.status(500).json({ 
      error: 'Failed to complete onboarding',
      details: error?.message || 'Unknown error'
    });
  }
});

router.post('/location-change-request', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { requested_state, requested_country, reason } = req.body;
    const userId = req.user!.user_id;
    
    if (!requested_state || !requested_country) {
      return res.status(400).json({ error: 'State and country are required' });
    }
    
    const user = await User.findOne({ user_id: userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    await User.findOneAndUpdate(
      { user_id: userId },
      { 
        $set: {
          location_change_requested_state: requested_state,
          location_change_requested_country: requested_country,
          location_change_reason: reason || null,
          location_change_requested_at: new Date()
        }
      }
    );
    
    return res.json({ 
      success: true, 
      message: 'Location change request submitted successfully' 
    });
  } catch (error: any) {
    console.error('Location change request error:', error);
    return res.status(500).json({ 
      error: 'Failed to submit location change request',
      details: error?.message || 'Unknown error'
    });
  }
});

router.post('/upload-logo', authMiddleware, upload.single('logo'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No logo file provided' });
    }

    const file = req.file;
    
    if (!file.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: 'File must be an image' });
    }

    const base64Image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    return res.json({
      success: true,
      logo_url: base64Image,
      message: 'Logo uploaded successfully'
    });
  } catch (error: any) {
    console.error('Upload logo error:', error);
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'Logo file is too large. Maximum size is 5MB.' });
      }
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to upload logo' });
  }
});

const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed'));
    }
  }
});

router.post('/upload-gst', authMiddleware, documentUpload.single('document'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No document file provided' });
    }

    const file = req.file;
    
    if (!file.mimetype.startsWith('image/') && file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'File must be an image or PDF' });
    }

    const base64File = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    return res.json({
      success: true,
      document_url: base64File,
      message: 'GST document uploaded successfully'
    });
  } catch (error: any) {
    console.error('Upload GST document error:', error);
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'Document file is too large. Maximum size is 10MB.' });
      }
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to upload GST document' });
  }
});

const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed for resumes'));
    }
  }
});

router.post('/resume', authMiddleware, resumeUpload.single('resume'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No resume file provided' });
    }

    const file = req.file;
    
    if (file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Resume must be a PDF file' });
    }

    const base64File = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    const user = await User.findOneAndUpdate(
      { user_id: req.user!.user_id },
      { $set: { resume_url: base64File } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      success: true,
      resume_url: base64File,
      message: 'Resume uploaded successfully'
    });
  } catch (error: any) {
    console.error('Upload resume error:', error);
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'Resume file is too large. Maximum size is 5MB.' });
      }
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to upload resume' });
  }
});

router.get('/resume', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findOne({ user_id: req.user!.user_id });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.resume_url) {
      return res.status(404).json({ error: 'No resume found' });
    }

    return res.json({
      success: true,
      resume_url: user.resume_url
    });
  } catch (error: any) {
    console.error('Get resume error:', error);
    return res.status(500).json({ error: 'Failed to fetch resume' });
  }
});

router.delete('/resume', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findOneAndUpdate(
      { user_id: req.user!.user_id },
      { $set: { resume_url: null } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      success: true,
      message: 'Resume deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete resume error:', error);
    return res.status(500).json({ error: 'Failed to delete resume' });
  }
});

router.get('/specialities', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findOne({ user_id: req.user!.user_id });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    try {
      const specialitiesJson = (user as any).specialities_json;
      if (specialitiesJson && typeof specialitiesJson === 'string') {
        const specialities = JSON.parse(specialitiesJson);
        return res.json(Array.isArray(specialities) ? specialities : []);
      }
      if (Array.isArray(specialitiesJson)) {
        return res.json(specialitiesJson);
      }
    } catch (parseError) {
      console.error('Error parsing specialities_json:', parseError);
    }
    
    return res.json([]);
  } catch (error: any) {
    console.error('Get user specialities error:', error);
    return res.json([]);
  }
});

router.get('/products', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findOne({ user_id: req.user!.user_id });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    try {
      const productsJson = (user as any).products_json;
      if (productsJson && typeof productsJson === 'string') {
        const products = JSON.parse(productsJson);
        return res.json(Array.isArray(products) ? products : []);
      }
      if (Array.isArray(productsJson)) {
        return res.json(productsJson);
      }
    } catch (parseError) {
      console.error('Error parsing products_json:', parseError);
    }
    
    return res.json([]);
  } catch (error: any) {
    console.error('Get user products error:', error);
    return res.json([]);
  }
});

router.get('/products/:id/brands', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json([]);
  } catch (error: any) {
    console.error('Get product brands error:', error);
    return res.json([]);
  }
});

router.delete('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.user_id;
    
    const user = await User.findOne({ user_id: userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await User.deleteOne({ user_id: userId });

    res.clearCookie('mavy_session', {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });

    return res.json({ 
      success: true, 
      message: 'Account deleted successfully' 
    });
  } catch (error: any) {
    console.error('Delete account error:', error);
    return res.status(500).json({ 
      error: 'Failed to delete account',
      details: error?.message || 'Unknown error'
    });
  }
});

router.get('/:userId/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findOne({ user_id: userId })
      .select('user_id full_name last_name business_name specialisation bio location profile_picture_url is_verified profession account_type')
      .lean();
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      user_id: user.user_id,
      full_name: user.full_name || user.business_name || 'Unknown',
      last_name: user.last_name || '',
      specialisation: user.specialisation || '',
      profile_picture_url: user.profile_picture_url || ''
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

export default router;
