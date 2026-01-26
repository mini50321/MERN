import express, { type Request, type Response } from 'express';

const router = express.Router();

router.get('/google/redirect_url', async (_req: Request, res: Response) => {
  try {
    const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
    return res.json({ 
      redirectUrl: `${frontendUrl}/login?method=phone`
    });
  } catch (error) {
    console.error('OAuth redirect URL error:', error);
    return res.status(500).json({ error: 'Failed to get OAuth redirect URL' });
  }
});

router.get('/google/redirect', async (_req: Request, res: Response) => {
  try {
    const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
    return res.json({ 
      redirectUrl: `${frontendUrl}/login?method=phone`
    });
  } catch (error) {
    console.error('OAuth redirect URL error:', error);
    return res.status(500).json({ error: 'Failed to get OAuth redirect URL' });
  }
});

router.post('/sessions', async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'No authorization code provided' });
    }

    return res.status(501).json({ 
      error: 'OAuth sessions not configured. Please use phone number login instead.',
      message: 'Google OAuth is not set up. Please use the phone number login option.'
    });
  } catch (error) {
    console.error('Session creation error:', error);
    return res.status(500).json({ error: 'Failed to create session' });
  }
});

export default router;

