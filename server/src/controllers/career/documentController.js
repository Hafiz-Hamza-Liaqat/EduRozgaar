import { asyncHandler } from '../../utils/asyncHandler.js';
import { isDocumentsPlatformEnabled } from '../../config/careerFeatureFlags.js';
import { DocumentService } from '../../services/career/DocumentService.js';

function requireDocumentsPlatformEnabled(_req, res, next) {
  if (!isDocumentsPlatformEnabled()) {
    return res.status(503).json({ error: 'Documents platform is disabled' });
  }
  next();
}

function actorFromReq(req) {
  return { type: 'talent', id: String(req.user.userId) };
}

export const listDocuments = asyncHandler(async (req, res) => {
  const data = await DocumentService.listForUser(req.user.userId, req.query);
  res.json({ data });
});

export const getDocument = asyncHandler(async (req, res) => {
  const doc = await DocumentService.getById(req.user.userId, req.params.id);
  res.json(doc);
});

export const createDocument = asyncHandler(async (req, res) => {
  const doc = await DocumentService.create(req.user.userId, req.body, actorFromReq(req));
  res.status(201).json(doc);
});

export const updateDocument = asyncHandler(async (req, res) => {
  const doc = await DocumentService.update(req.user.userId, req.params.id, req.body, actorFromReq(req));
  res.json(doc);
});

export const archiveDocument = asyncHandler(async (req, res) => {
  const doc = await DocumentService.archive(req.user.userId, req.params.id, actorFromReq(req));
  res.json(doc);
});

export const deleteDocument = asyncHandler(async (req, res) => {
  const result = await DocumentService.delete(req.user.userId, req.params.id, actorFromReq(req));
  res.json(result);
});

export const listDocumentVersions = asyncHandler(async (req, res) => {
  const data = await DocumentService.listVersions(req.user.userId, req.params.id);
  res.json({ data });
});

export const createDocumentVersion = asyncHandler(async (req, res) => {
  const doc = await DocumentService.createVersion(req.user.userId, req.params.id, req.body, actorFromReq(req));
  res.status(201).json(doc);
});

export { requireDocumentsPlatformEnabled };
