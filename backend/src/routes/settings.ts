import express, { Response } from 'express';
import { User, Transaction, ReferralTracking, AppSetting } from '../models/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

router.get('/subscription', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findOne({ user_id: req.user!.user_id });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({ tier: user.subscription_tier || 'free' });
  } catch (error) {
    console.error('Get subscription error:', error);
    return res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

router.put('/subscription', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { tier, amount, payment_method } = req.body;
    const user = await User.findOneAndUpdate(
      { user_id: req.user!.user_id },
      { $set: { subscription_tier: tier || 'free' } },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (amount && amount > 0) {
      await Transaction.create({
        user_id: req.user!.user_id,
        amount: amount,
        currency: 'USD',
        transaction_type: 'subscription',
        description: `Upgraded to ${tier} tier`,
        status: 'completed',
        payment_method: payment_method || 'card'
      });
    }
    
    return res.json({ success: true, tier: user.subscription_tier });
  } catch (error) {
    console.error('Update subscription error:', error);
    return res.status(500).json({ error: 'Failed to update subscription' });
  }
});

router.get('/referrals/dashboard', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findOne({ user_id: req.user!.user_id });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const referrals = await ReferralTracking.find({ referrer_user_id: req.user!.user_id })
      .sort({ created_at: -1 })
      .lean();
    
    const stats = {
      total_referrals: referrals.length,
      successful: referrals.filter((r: any) => r.referral_stage === 'completed' || r.reward_status === 'paid').length,
      pending: referrals.filter((r: any) => r.referral_stage === 'registered' || r.referral_stage === 'verified').length,
      fraud_flagged: 0
    };
    
    const referralsWithNames = await Promise.all(
      referrals.map(async (ref: any) => {
        const referredUser = await User.findOne({ user_id: ref.referred_user_id });
        return {
          ...ref,
          referred_name: referredUser ? (referredUser.full_name || referredUser.business_name || 'Unknown') : 'Unknown'
        };
      })
    );
    
    return res.json({
      referral_code: user.referral_code || '',
      wallet: {
        balance: 0,
        total_earned: 0,
        total_redeemed: 0,
        currency: 'INR'
      },
      referrals: referralsWithNames,
      stats: stats,
      config: {
        referred_reward: 50,
        referrer_reward: 25
      }
    });
  } catch (error) {
    console.error('Get referrals dashboard error:', error);
    return res.status(500).json({ error: 'Failed to fetch referrals' });
  }
});

router.get('/wallet', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const transactions = await Transaction.find({ 
      user_id: req.user!.user_id,
      transaction_type: { $in: ['referral', 'reward', 'payout', 'refund'] }
    }).sort({ created_at: -1 }).lean();
    
    const totalEarned = transactions
      .filter(t => t.transaction_type === 'referral' || t.transaction_type === 'reward')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const totalRedeemed = transactions
      .filter(t => t.transaction_type === 'payout' || t.transaction_type === 'refund')
      .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
    
    const balance = totalEarned - totalRedeemed;
    
    return res.json({
      balance: balance,
      total_earned: totalEarned,
      total_redeemed: totalRedeemed,
      currency: 'INR',
      transactions: transactions.map(t => ({
        id: t._id.toString(),
        amount: t.amount,
        type: t.transaction_type,
        description: t.description,
        date: t.created_at,
        status: t.status
      }))
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    return res.status(500).json({ error: 'Failed to fetch wallet' });
  }
});

router.get('/subscription-settings', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const setting = await AppSetting.findOne({ setting_key: 'yearly_discount_percentage' });
    
    return res.json({
      yearly_discount_percentage: setting ? parseInt(setting.setting_value) : 17
    });
  } catch (error) {
    console.error('Get subscription settings error:', error);
    return res.status(500).json({ error: 'Failed to fetch subscription settings' });
  }
});

export default router;

