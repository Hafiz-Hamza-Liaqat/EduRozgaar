import { asyncHandler } from '../../utils/asyncHandler.js';
import { ResumeVersionService } from '../../services/career/ResumeVersionService.js';

function actorFromReq(req) {
  return { type: 'talent', id: String(req.user.userId) };
}

export const listMyResumeVersions = asyncHandler(async (req, res) => {
  const versions = await ResumeVersionService.listForUser(req.user.userId);
  res.json(versions);
});

export const getResumeVersion = asyncHandler(async (req, res) => {
  const version = await ResumeVersionService.getById(req.user.userId, req.params.id);
  res.json(version);
});

export const createResumeVersion = asyncHandler(async (req, res) => {
  const version = await ResumeVersionService.create(req.user.userId, req.body, actorFromReq(req));
  res.status(201).json(version);
});

export const updateResumeVersion = asyncHandler(async (req, res) => {
  const version = await ResumeVersionService.update(req.user.userId, req.params.id, req.body, actorFromReq(req));
  res.json(version);
});

export const deleteResumeVersion = asyncHandler(async (req, res) => {
  const result = await ResumeVersionService.delete(req.user.userId, req.params.id);
  res.json(result);
});

export const publishResumeVersion = asyncHandler(async (req, res) => {
  const version = await ResumeVersionService.publish(req.user.userId, req.params.id, actorFromReq(req));
  res.json(version);
});
