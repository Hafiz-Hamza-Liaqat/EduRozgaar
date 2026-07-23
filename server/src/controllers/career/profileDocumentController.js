import { asyncHandler } from '../../utils/asyncHandler.js';
import { ProfileDocumentService, CredentialService } from '../../services/career/ProfileDocumentService.js';

export const listMyProfileDocuments = asyncHandler(async (req, res) => {
  const docs = await ProfileDocumentService.listForUser(req.user.userId);
  res.json(docs);
});

export const createProfileDocument = asyncHandler(async (req, res) => {
  const doc = await ProfileDocumentService.create(req.user.userId, req.body);
  res.status(201).json(doc);
});

export const updateProfileDocument = asyncHandler(async (req, res) => {
  const doc = await ProfileDocumentService.update(req.user.userId, req.params.id, req.body);
  res.json(doc);
});

export const deleteProfileDocument = asyncHandler(async (req, res) => {
  const result = await ProfileDocumentService.delete(req.user.userId, req.params.id);
  res.json(result);
});

export const listMyCredentials = asyncHandler(async (req, res) => {
  const creds = await CredentialService.listForUser(req.user.userId);
  res.json(creds);
});

export const getCredential = asyncHandler(async (req, res) => {
  const cred = await CredentialService.getById(req.user.userId, req.params.id);
  res.json(cred);
});
