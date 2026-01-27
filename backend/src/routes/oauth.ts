import express, { type Request, type Response } from 'express';
import { User } from '../models/index.js';
import jwt from 'jsonwebtoken';

type GoogleTokenResponse = {
  access_token: string;
  [key: string]: unknown;
};

type GoogleErrorResponse = {
  error?: string;
  error_description?: string;
  [key: string]: unknown;
};

type GoogleUserInfo = {
  email?: string;
  id?: string;
  name?: string;
  picture?: string;
  [key: string]: unknown;
};

const router = express.Router();

router.get('/google/redirect_url', async (_req: Request, res: Response) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
    
    if (!clientId) {
      return res.status(500).json({ 
        error: 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID in your environment variables.',
        redirectUrl: `${frontendUrl}/auth/callback`
      });
    }
    
    const redirectUri = `${frontendUrl}/auth/callback`;
    const scope = 'openid email profile';
    const responseType = 'code';
    const accessType = 'offline';
    const prompt = 'consent';
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=${responseType}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `access_type=${accessType}&` +
      `prompt=${prompt}`;
    
    return res.json({ redirectUrl: authUrl });
  } catch (error) {
    console.error('OAuth redirect URL error:', error);
    const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
    return res.status(500).json({ 
      error: 'Failed to get OAuth redirect URL',
      redirectUrl: `${frontendUrl}/auth/callback`
    });
  }
});

router.get('/google/redirect', async (_req: Request, res: Response) => {
  try {
    const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
    return res.json({ 
      redirectUrl: `${frontendUrl}/auth/callback`
    });
  } catch (error) {
    console.error('OAuth redirect URL error:', error);
    return res.status(500).json({ error: 'Failed to get OAuth redirect URL' });
  }
});

router.post('/google/callback', async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
    
    if (!code) {
      return res.status(400).json({ error: 'No authorization code provided' });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      return res.status(500).json({ 
        error: 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment variables.'
      });
    }

    const redirectUri = `${frontendUrl}/auth/callback`;
    
    console.log('OAuth Debug:', {
      clientId: clientId?.substring(0, 20) + '...',
      clientSecret: clientSecret?.substring(0, 15) + '...',
      redirectUri,
      frontendUrl
    });
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code: code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!tokenResponse.ok) {
        const errorData = (await tokenResponse.json()) as GoogleErrorResponse;
        console.error('Google token exchange error:', errorData);
        console.error('Request details:', {
          redirectUri,
          clientId: clientId?.substring(0, 20) + '...',
          codeLength: code?.length
        });
        return res.status(400).json({ 
          error: 'Failed to exchange authorization code',
          details: errorData.error_description || errorData.error,
          hint: errorData.error === 'invalid_client' ? 'Check that your Client ID and Client Secret are correct, and that the redirect URI matches exactly in Google Cloud Console' : undefined
        });
      }

      const tokens = (await tokenResponse.json()) as GoogleTokenResponse;
      const accessToken = tokens.access_token;

      const userInfoController = new AbortController();
      const userInfoTimeoutId = setTimeout(() => userInfoController.abort(), 30000);
      
      try {
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          signal: userInfoController.signal,
        });
        
        clearTimeout(userInfoTimeoutId);

        if (!userInfoResponse.ok) {
          return res.status(400).json({ error: 'Failed to fetch user information' });
        }

        const googleUser = (await userInfoResponse.json()) as GoogleUserInfo;
    
        if (!googleUser.email) {
          return res.status(400).json({ error: 'Email is required but not provided by Google' });
        }

        let user = await User.findOne({ 
          $or: [
            { email: googleUser.email },
            { patient_email: googleUser.email }
          ]
        });
        
        if (!user) {
          const userId = `google_${googleUser.id || Date.now()}`;
          const nameParts = (googleUser.name || '').split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          
          user = await User.create({
            user_id: userId,
            full_name: firstName,
            last_name: lastName,
            email: googleUser.email,
            patient_email: googleUser.email,
            profile_picture_url: googleUser.picture || null,
            is_verified: true,
            onboarding_completed: false,
            subscription_tier: 'free',
            referral_code: '',
            is_open_to_work: false,
          });
        } else {
          if (!user.email) {
            user.email = googleUser.email;
          }
          if (!user.patient_email) {
            user.patient_email = googleUser.email;
          }
          if (googleUser.picture && !user.profile_picture_url) {
            user.profile_picture_url = googleUser.picture;
          }
          await user.save();
        }

        const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
        const sessionToken = jwt.sign(
          { user_id: user.user_id },
          jwtSecret,
          { expiresIn: '30d' }
        );

        res.cookie('mavy_session', sessionToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60 * 1000
        });

        return res.json({ 
          success: true,
          user: {
            user_id: user.user_id,
            email: user.patient_email,
            name: user.full_name,
            onboarding_completed: user.onboarding_completed
          }
        });
      } catch (userInfoError: any) {
        clearTimeout(userInfoTimeoutId);
        if (userInfoError.name === 'AbortError') {
          console.error('Timeout fetching user info from Google');
          return res.status(504).json({ 
            error: 'Connection timeout',
            details: 'Unable to connect to Google servers. Please check your internet connection or VPN settings.'
          });
        }
        throw userInfoError;
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('Timeout connecting to Google OAuth');
        return res.status(504).json({ 
          error: 'Connection timeout',
          details: 'Unable to connect to Google OAuth servers. Please check your internet connection or VPN settings. If using a VPN, try disabling it temporarily.'
        });
      }
      throw fetchError;
    }
  } catch (error: any) {
    console.error('Google OAuth callback error:', error);
    return res.status(500).json({ 
      error: 'Failed to process Google OAuth',
      details: error?.message || 'Unknown error'
    });
  }
});

export default router;

