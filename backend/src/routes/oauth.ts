import express, { type Request, type Response } from 'express';
import https from 'https';
import dns from 'dns';
import { User } from '../models/index.js';
import jwt from 'jsonwebtoken';

dns.setDefaultResultOrder('ipv4first');

function getHttpsAgent() {
  return new https.Agent({
    keepAlive: false,
    timeout: 30000,
    maxSockets: 1,
    rejectUnauthorized: true,
    family: 4
  });
}

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

router.get('/google/test-connectivity', async (_req: Request, res: Response) => {
  try {
    const testResponse = await new Promise<{ success: boolean; error?: string }>((resolve) => {
      const options = {
        hostname: 'oauth2.googleapis.com',
        port: 443,
        path: '/',
        method: 'GET',
        timeout: 10000,
        agent: new https.Agent({
          keepAlive: false,
          timeout: 10000
        })
      };

      const req = https.request(options, (res) => {
        resolve({ success: true });
        res.on('data', () => {});
        res.on('end', () => {});
      });

      req.on('error', (error: any) => {
        resolve({ success: false, error: error.message || error.code });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ success: false, error: 'Connection timeout' });
      });

      req.end();
    });

    return res.json(testResponse);
  } catch (error: any) {
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Unknown error' 
    });
  }
});

router.get('/google/redirect_url', async (_req: Request, res: Response) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.OAUTH_REDIRECT_URI || process.env.CORS_ORIGIN 
      ? `${process.env.CORS_ORIGIN}/auth/callback` 
      : 'https://themavy.com/auth/callback';
    
    if (!clientId) {
      return res.status(500).json({ 
        error: 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID in your environment variables.',
        redirectUrl: redirectUri
      });
    }
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

    const redirectUri = process.env.OAUTH_REDIRECT_URI || process.env.CORS_ORIGIN 
      ? `${process.env.CORS_ORIGIN}/auth/callback` 
      : 'https://themavy.com/auth/callback';
    
    console.log('OAuth Debug:', {
      clientId: clientId?.substring(0, 20) + '...',
      clientSecret: clientSecret?.substring(0, 15) + '...',
      redirectUri,
      frontendUrl
    });
    
    try {
      const tokenData = new URLSearchParams({
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      });

      console.log('========================================');
      console.log('📤 SENDING TO GOOGLE OAUTH TOKEN ENDPOINT');
      console.log('========================================');
      console.log('URL: https://oauth2.googleapis.com/token');
      console.log('Method: POST');
      console.log('Headers:', {
        'Content-Type': 'application/x-www-form-urlencoded'
      });
      console.log('Body (tokenData):', {
        code: code.substring(0, 20) + '...',
        client_id: clientId?.substring(0, 20) + '...',
        client_secret: '***HIDDEN***',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      });
      console.log('Full redirect_uri:', redirectUri);
      console.log('Code length:', code.length);
      console.log('');

      const agent = getHttpsAgent();

      const tokenResponse = await new Promise<{ statusCode: number; data: any }>((resolve, reject) => {

        const options = {
          hostname: 'oauth2.googleapis.com',
          port: 443,
          path: '/token',
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(tokenData.toString()),
            'Connection': 'close'
          },
          timeout: 30000,
          agent: agent
        };

        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              console.log('========================================');
              console.log('📥 RESPONSE FROM GOOGLE TOKEN ENDPOINT');
              console.log('========================================');
              console.log('Status Code:', res.statusCode);
              console.log('Response Headers:', res.headers);
              console.log('Response Body:', {
                ...parsed,
                access_token: parsed.access_token ? parsed.access_token.substring(0, 20) + '...' : undefined,
                refresh_token: parsed.refresh_token ? parsed.refresh_token.substring(0, 20) + '...' : undefined
              });
              console.log('');
              resolve({ statusCode: res.statusCode || 200, data: parsed });
            } catch (e) {
              console.error('Failed to parse token response:', data);
              reject(new Error('Failed to parse response'));
            }
          });
        });

        req.on('error', (error: any) => {
          reject(error);
        });

        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });

        req.setTimeout(30000);

        req.write(tokenData.toString());
        req.end();
      });

      if (tokenResponse.statusCode !== 200) {
        const errorData = tokenResponse.data as GoogleErrorResponse;
        console.error('========================================');
        console.error('❌ GOOGLE TOKEN EXCHANGE ERROR');
        console.error('========================================');
        console.error('Error Response:', errorData);
        console.error('Request details:', {
          redirectUri,
          clientId: clientId?.substring(0, 20) + '...',
          codeLength: code?.length
        });
        console.error('');
        return res.status(400).json({ 
          error: 'Failed to exchange authorization code',
          details: errorData.error_description || errorData.error,
          hint: errorData.error === 'invalid_client' ? 'Check that your Client ID and Client Secret are correct, and that the redirect URI matches exactly in Google Cloud Console' : undefined
        });
      }

      const tokens = tokenResponse.data as GoogleTokenResponse;
      const accessToken = tokens.access_token;
      
      console.log('✅ Token exchange successful');
      console.log('Access token received:', accessToken ? accessToken.substring(0, 20) + '...' : 'none');
      console.log('Token type:', tokens.token_type);
      console.log('Expires in:', tokens.expires_in, 'seconds');
      console.log('');

      const userInfoAgent = getHttpsAgent();

      console.log('========================================');
      console.log('📤 SENDING TO GOOGLE USERINFO ENDPOINT');
      console.log('========================================');
      console.log('URL: https://www.googleapis.com/oauth2/v2/userinfo');
      console.log('Method: GET');
      console.log('Headers:', {
        'Authorization': `Bearer ${accessToken.substring(0, 20)}...`,
        'Connection': 'close'
      });
      console.log('');

      const userInfoResponse = await new Promise<{ statusCode: number; data: any }>((resolve, reject) => {
        const options = {
          hostname: 'www.googleapis.com',
          port: 443,
          path: '/oauth2/v2/userinfo',
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Connection': 'close'
          },
          timeout: 30000,
          agent: userInfoAgent
        };

        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              console.log('========================================');
              console.log('📥 RESPONSE FROM GOOGLE USERINFO ENDPOINT');
              console.log('========================================');
              console.log('Status Code:', res.statusCode);
              console.log('Response Headers:', res.headers);
              console.log('User Info:', parsed);
              console.log('');
              resolve({ statusCode: res.statusCode || 200, data: parsed });
            } catch (e) {
              console.error('Failed to parse userinfo response:', data);
              reject(new Error('Failed to parse user info response'));
            }
          });
        });

        req.on('error', (error: any) => {
          reject(error);
        });

        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });

        req.setTimeout(30000);
        req.end();
      });

      if (userInfoResponse.statusCode !== 200) {
        console.error('❌ UserInfo request failed with status:', userInfoResponse.statusCode);
        console.error('Response data:', userInfoResponse.data);
        return res.status(400).json({ error: 'Failed to fetch user information' });
      }

      const googleUser = userInfoResponse.data as GoogleUserInfo;
      
      console.log('✅ UserInfo fetched successfully');
      console.log('Google User Data:', {
        id: googleUser.id,
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture ? googleUser.picture.substring(0, 50) + '...' : 'none'
      });
      console.log('');
    
      if (!googleUser.email) {
        console.error('❌ No email in Google user response');
        return res.status(400).json({ error: 'Email is required but not provided by Google' });
      }

      const isAdminEmail = googleUser.email === 'mavytechsolutions@gmail.com';
      
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
        
        // Generate a unique referral code
        const generateReferralCode = () => {
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
          let code = '';
          for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          return code;
        };
        
        let referralCode = generateReferralCode();
        // Ensure uniqueness by checking if code exists
        let existingUser = await User.findOne({ referral_code: referralCode });
        while (existingUser) {
          referralCode = generateReferralCode();
          existingUser = await User.findOne({ referral_code: referralCode });
        }
        
        user = await User.create({
          user_id: userId,
          full_name: firstName,
          last_name: lastName,
          email: googleUser.email,
          patient_email: googleUser.email,
          profile_picture_url: googleUser.picture || null,
          is_verified: isAdminEmail ? true : false,
          onboarding_completed: isAdminEmail ? true : false,
          subscription_tier: 'free',
          referral_code: referralCode,
          is_open_to_work: false,
          is_admin: isAdminEmail ? true : false,
          role: isAdminEmail ? 'admin' : undefined,
          account_type: isAdminEmail ? 'admin' : undefined,
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
        if (isAdminEmail && !user.is_admin) {
          user.is_admin = true;
          user.role = 'admin';
          user.account_type = 'admin';
          user.onboarding_completed = true;
          console.log('✅ Auto-promoted user to admin:', googleUser.email);
        }
        await user.save();
      }

      const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
      const sessionToken = jwt.sign(
        { user_id: user.user_id },
        jwtSecret,
        { expiresIn: '30d' }
      );

      console.log('========================================');
      console.log('✅ OAUTH FLOW COMPLETED SUCCESSFULLY');
      console.log('========================================');
      console.log('User ID:', user.user_id);
      console.log('User Email:', user.patient_email || user.email);
      console.log('User Name:', user.full_name);
      console.log('Onboarding Completed:', user.onboarding_completed);
      console.log('Session Token Created:', sessionToken.substring(0, 20) + '...');
      console.log('========================================');
      console.log('');

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
    } catch (fetchError: any) {
      console.error('Google OAuth request error:', fetchError);
      if (fetchError.code === 'ETIMEDOUT' || fetchError.code === 'ECONNREFUSED' || fetchError.message === 'Request timeout') {
        return res.status(504).json({ 
          error: 'Connection timeout',
          details: 'Unable to connect to Google OAuth servers. This could be due to: 1) VPN or proxy blocking the connection, 2) Firewall restrictions, 3) Network connectivity issues. Please check your network settings or contact your system administrator.',
          code: fetchError.code || 'ETIMEDOUT'
        });
      }
      if (fetchError.code === 'ENOTFOUND') {
        return res.status(502).json({ 
          error: 'DNS resolution failed',
          details: 'Unable to resolve Google OAuth server hostname. Please check your DNS settings and internet connection.'
        });
      }
      return res.status(500).json({ 
        error: 'Failed to process Google OAuth',
        details: fetchError.message || 'Unknown error',
        code: fetchError.code
      });
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

