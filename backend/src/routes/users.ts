import express, { Response } from 'express';
import { User } from '../models/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findOne({ user_id: req.user!.user_id });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ profile: user });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ error: 'Failed to fetch user profile' });
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
    
    const updateData: any = {
      onboarding_completed: true
    };
    
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

export default router;
