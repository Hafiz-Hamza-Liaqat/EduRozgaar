import { asyncHandler } from '../../utils/asyncHandler.js';
import { ProfileHydrationService } from '../../services/career/ProfileHydrationService.js';

export const runTalentHydration = asyncHandler(async (req, res) => {
  const dryRun = req.query.dryRun === '1' || req.body?.dryRun === true;
  const result = await ProfileHydrationService.hydrateAll({ dryRun });
  res.json({ ok: true, dryRun, ...result });
});

export const hydrateSingleUser = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  const result = await ProfileHydrationService.hydrateUser(userId, {
    actor: { type: 'staff', id: String(req.user.userId) },
  });
  res.json({ ok: true, ...result });
});
