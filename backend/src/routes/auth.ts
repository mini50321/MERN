import express, { Request, Response } from 'express';
import { generateOTP, sendOTP, storeOTP, verifyOTP } from '../utils/otp.js';

const router = express.Router();

router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('mavy_session', {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
  return res.json({ success: true, message: 'Logged out successfully' });
});

router.post('/otp/send', async (req: Request, res: Response) => {
  try {
    const { phone_number } = req.body;

    if (!phone_number) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone_number)) {
      return res.status(400).json({ success: false, message: 'Invalid phone number format' });
    }

    const otp = await generateOTP();

    const apiKey = process.env.FAST2SMS_API_KEY || '';
    if (!apiKey) {
      return res.status(500).json({ 
        success: false, 
        message: 'SMS service not configured. Please contact support.' 
      });
    }
    
    const result = await sendOTP(phone_number, otp, apiKey);

    if (result.success) {
      await storeOTP(phone_number, otp);
      
      return res.json({ 
        success: true, 
        message: 'OTP sent successfully to your mobile number' 
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        message: result.message 
      });
    }
  } catch (error) {
    console.error('Send OTP error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to send OTP. Please try again.' 
    });
  }
});

router.post('/otp/verify', async (req: Request, res: Response) => {
  try {
    const { phone_number, otp } = req.body;

    if (!phone_number || !otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number and OTP are required' 
      });
    }

    const result = await verifyOTP(phone_number, otp);

    if (result.valid) {
      return res.json({ 
        success: true, 
        message: result.message 
      });
    } else {
      return res.status(400).json({ 
        success: false, 
        message: result.message 
      });
    }
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to verify OTP. Please try again.' 
    });
  }
});

export default router;
