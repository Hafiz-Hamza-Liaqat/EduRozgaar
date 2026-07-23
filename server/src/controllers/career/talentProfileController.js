import { asyncHandler } from '../../utils/asyncHandler.js';
import { isTalentProfileEnabled } from '../../config/careerFeatureFlags.js';
import { TalentProfileService } from '../../services/career/TalentProfileService.js';

function requireTalentProfileEnabled(_req, res, next) {
  if (!isTalentProfileEnabled()) {
    return res.status(503).json({ error: 'Talent profile API is disabled' });
  }
  next();
}

function actorFromReq(req) {
  return { type: 'talent', id: String(req.user.userId) };
}

export const getMyTalentProfile = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  let profile = await TalentProfileService.getByUserId(userId);
  if (!profile) {
    profile = await TalentProfileService.getOrCreateForUser(userId, actorFromReq(req));
  }
  res.json(profile);
});

export const createMyTalentProfile = asyncHandler(async (req, res) => {
  const profile = await TalentProfileService.create(req.user.userId, req.body, actorFromReq(req));
  res.status(201).json(profile);
});

export const updateMyTalentProfile = asyncHandler(async (req, res) => {
  const profile = await TalentProfileService.update(req.user.userId, req.body, actorFromReq(req));
  res.json(profile);
});

export const deleteMyTalentProfile = asyncHandler(async (req, res) => {
  const profile = await TalentProfileService.archive(req.user.userId, actorFromReq(req));
  res.json(profile);
});

export { requireTalentProfileEnabled };
