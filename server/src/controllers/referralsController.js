import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ensureReferralCode } from '../utils/referralCode.js';

const SITE_URL = process.env.SITE_URL || 'https://edurozgaar.pk';

export const getMyReferrals = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const user = await User.findById(userId).select('referralCode referralCount totalPoints rewardPoints').lean();
  if (!user) return res.status(404).json({ error: 'User not found' });
  let code = user.referralCode;
  if (!code) {
    const u = await User.findById(userId);
    code = await ensureReferralCode(u);
  }
  const referralLink = `${SITE_URL}/register?ref=${code}`;
  res.json({
    referralCode: code,
    referralLink,
    referralCount: user.referralCount || 0,
    totalPoints: user.totalPoints || 0,
    rewardPoints: user.rewardPoints || 0,
  });
});
