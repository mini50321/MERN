import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

export interface AuthRequest extends Request {
  user?: {
    user_id: string;
    phone?: string;
    [key: string]: any;
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                  req.cookies?.mavy_session;

    if (!token) {
      res.status(401).json({ error: 'Unauthorized - No token provided' });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    
    try {
      const decoded = jwt.verify(token, jwtSecret) as { user_id: string };
      
      if (!decoded || !decoded.user_id) {
        res.status(401).json({ error: 'Unauthorized - Invalid token payload' });
        return;
      }

      const user = await User.findOne({ user_id: decoded.user_id });

      if (!user) {
        res.status(401).json({ error: 'Unauthorized - User not found' });
        return;
      }

      req.user = {
        user_id: user.user_id,
        phone: user.phone,
      };
      next();
    } catch (jwtError: any) {
      console.error('JWT verification error:', jwtError?.message);
      res.status(401).json({ error: 'Unauthorized - Invalid token' });
      return;
    }
  } catch (error: any) {
    console.error('Authentication middleware error:', error?.message);
    console.error('Stack trace:', error?.stack);
    res.status(500).json({ 
      error: 'Authentication error',
      details: error?.message || 'Unknown error'
    });
    return;
  }
};
