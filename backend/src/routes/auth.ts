import express, { Request, Response } from 'express';

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

export default router;
