import express, { type Request, type Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const settings: Record<string, string> = {
      ribbon_cutting_enabled: "true",
      ribbon_heading: "Grand Opening",
      ribbon_subheading: "Welcome to the Future of Healthcare",
      ribbon_instruction: "Cut the ribbon to enter",
      ribbon_button_text: "CUT",
      ribbon_badge_text: "VIP Launch",
      ribbon_version: "1"
    };

    return res.json(settings);
  } catch (error) {
    console.error("Error fetching ribbon settings:", error);
    return res.json({
      ribbon_cutting_enabled: "true",
      ribbon_heading: "Grand Opening",
      ribbon_subheading: "Welcome to the Future of Healthcare",
      ribbon_instruction: "Cut the ribbon to enter",
      ribbon_button_text: "CUT",
      ribbon_badge_text: "VIP Launch",
      ribbon_version: "1"
    });
  }
});

router.put('/admin', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    return res.json({ success: true });
  } catch (error) {
    console.error("Error updating ribbon settings:", error);
    return res.status(500).json({ error: "Failed to update ribbon settings" });
  }
});

router.post('/admin/reset', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const newVersion = Date.now().toString();
    return res.json({ success: true, version: newVersion });
  } catch (error) {
    console.error("Error resetting ribbon:", error);
    return res.status(500).json({ error: "Failed to reset ribbon" });
  }
});

export default router;

