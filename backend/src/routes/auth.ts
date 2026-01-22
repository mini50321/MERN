import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { generateOTP, sendOTP, storeOTP, verifyOTP } from '../utils/otp.js';

const router = express.Router();

router.post('/otp/send', async (req: Request, res: Response) => {
  try {
    const { phone_number } = req.body;

    if (!phone_number) {
      return res.status(400).json({ success: false, message: "Phone number is required" });
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone_number)) {
      return res.status(400).json({ success: false, message: "Invalid phone number format" });
    }

    const otp = await generateOTP();

    const apiKey = process.env.FAST2SMS_API_KEY || "";
    if (!apiKey) {
      return res.status(500).json({ 
        success: false, 
        message: "SMS service not configured. Please contact support." 
      });
    }
    
    const result = await sendOTP(phone_number, otp, apiKey);

    if (result.success) {
      await storeOTP(phone_number, otp);
      
      return res.json({ 
        success: true, 
        message: "OTP sent successfully to your mobile number" 
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        message: result.message 
      });
    }
  } catch (error) {
    console.error("Send OTP error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to send OTP. Please try again." 
    });
  }
});

router.post('/otp/verify', async (req: Request, res: Response) => {
  try {
    const { phone_number, otp } = req.body;

    if (!phone_number || !otp) {
      return res.status(400).json({ success: false, message: "Phone number and OTP are required" });
    }

    const verification = await verifyOTP(phone_number, otp);

    if (!verification.valid) {
      return res.status(400).json({ success: false, message: verification.message });
    }

    let user = await User.findOne({ phone: phone_number });

    if (!user) {
      const referralCode = `BIO${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      user = await User.create({
        user_id: userId,
        phone: phone_number,
        referral_code: referralCode,
        onboarding_completed: false
      });
    }

    if (!user) {
      return res.status(500).json({ 
        success: false, 
        message: "Failed to create user account. Please try again." 
      });
    }

    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(
      { user_id: user.user_id },
      jwtSecret,
      { expiresIn: '60d' }
    );

    res.cookie('mavy_session', token, {
      httpOnly: true,
      path: '/',
      sameSite: 'none',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 24 * 60 * 60 * 1000
    });

    return res.json({ 
      success: true, 
      message: "Login successful",
      token,
      user: {
        id: user.user_id,
        phone: user.phone,
        onboarding_completed: user.onboarding_completed
      }
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to verify OTP. Please try again." 
    });
  }
});

router.post('/otp/verify-phone', async (req: Request, res: Response) => {
  try {
    const { phone_number, otp } = req.body;

    if (!phone_number || !otp) {
      return res.status(400).json({ success: false, message: "Phone number and OTP are required" });
    }

    const verification = await verifyOTP(phone_number, otp);

    if (!verification.valid) {
      return res.status(400).json({ success: false, message: verification.message });
    }

    return res.json({ 
      success: true, 
      message: "Phone number verified successfully"
    });
  } catch (error) {
    console.error("Verify phone OTP error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to verify OTP. Please try again." 
    });
  }
});

router.get('/logout', (_req: Request, res: Response) => {
  res.clearCookie('mavy_session');
  return res.json({ success: true });
});

export default router;
