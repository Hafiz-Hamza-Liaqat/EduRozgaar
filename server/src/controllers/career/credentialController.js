import { asyncHandler } from '../../utils/asyncHandler.js';
import { isDocumentsPlatformEnabled } from '../../config/careerFeatureFlags.js';
import { CredentialPlatformService } from '../../services/career/CredentialPlatformService.js';

function requireDocumentsPlatformEnabled(_req, res, next) {
  if (!isDocumentsPlatformEnabled()) {
    return res.status(503).json({ error: 'Credentials platform is disabled' });
  }
  next();
}

function actorFromReq(req) {
  return { type: 'talent', id: String(req.user.userId) };
}

export const listCredentials = asyncHandler(async (req, res) => {
  const data = await CredentialPlatformService.listForUser(req.user.userId);
  res.json({ data });
});

export const getCredential = asyncHandler(async (req, res) => {
  const cred = await CredentialPlatformService.getById(req.user.userId, req.params.id);
  res.json(cred);
});

export const issueCredential = asyncHandler(async (req, res) => {
  const cred = await CredentialPlatformService.issue(req.user.userId, req.body, actorFromReq(req));
  res.status(201).json(cred);
});

export const updateCredential = asyncHandler(async (req, res) => {
  const cred = await CredentialPlatformService.update(req.user.userId, req.params.id, req.body, actorFromReq(req));
  res.json(cred);
});

export const verifyCredential = asyncHandler(async (req, res) => {
  const cred = await CredentialPlatformService.verify(req.user.userId, req.params.id, actorFromReq(req));
  res.json(cred);
});

export const revokeCredential = asyncHandler(async (req, res) => {
  const cred = await CredentialPlatformService.revoke(req.user.userId, req.params.id, actorFromReq(req));
  res.json(cred);
});

export { requireDocumentsPlatformEnabled };
