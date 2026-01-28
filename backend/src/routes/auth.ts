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
    
    // If no API key, use development mode (log OTP to console)
    if (!apiKey) {
      console.log(`\n🔐 DEVELOPMENT MODE - OTP for ${phone_number}: ${otp}\n`);
      console.log(`⚠️  SMS service not configured. Add FAST2SMS_API_KEY to .env for production\n`);
      
      await storeOTP(phone_number, otp);
      
      return res.json({ 
        success: true, 
        message: `OTP sent (check console): ${otp}`,
        development_otp: otp
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
      console.log(`[Auth] OTP verification failed: ${verification.message}`);
      return res.status(400).json({ success: false, message: verification.message });
    }

    console.log(`[Auth] OTP verified successfully. Looking up user: ${phone_number}`);
    let user = await User.findOne({ phone: phone_number });

    if (!user) {
      console.log(`[Auth] User not found, creating new user for ${phone_number}`);
      const referralCode = `BIO${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      try {
        user = await User.create({
          user_id: userId,
          phone: phone_number,
          referral_code: referralCode,
          onboarding_completed: false
        });
        console.log(`[Auth] User created successfully: ${user.user_id}`);
      } catch (createError) {
        console.error(`[Auth] Error creating user:`, createError);
        throw createError;
      }
    } else {
      console.log(`[Auth] Existing user found: ${user.user_id}`);
    }

    if (!user) {
      console.error(`[Auth] User is null after creation/lookup`);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to create user account. Please try again." 
      });
    }

    console.log(`[Auth] Generating JWT token for user: ${user.user_id}`);
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(
      { user_id: user.user_id },
      jwtSecret,
      { expiresIn: '60d' }
    );

    
    const isHTTPS = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https';
    const isProduction = process.env.NODE_ENV === 'production';
    
    console.log(`[Auth] Setting cookie. Production: ${isProduction}, HTTPS: ${isHTTPS}`);
    res.cookie('mavy_session', token, {
      httpOnly: true,
      path: '/',
      sameSite: isHTTPS ? (isProduction ? 'none' : 'lax') : 'lax',
      secure: isHTTPS, 
      maxAge: 60 * 24 * 60 * 60 * 1000
    });

    console.log(`[Auth] Login successful for user: ${user.user_id}`);
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

router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('mavy_session', {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
  return res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
