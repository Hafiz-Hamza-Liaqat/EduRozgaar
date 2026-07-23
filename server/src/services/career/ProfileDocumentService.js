import { DocumentService } from './DocumentService.js';
import { CredentialPlatformService } from './CredentialPlatformService.js';

/** Talent-scoped façade over canonical DocumentService (C.8.0.5). */
export const ProfileDocumentService = {
  listForUser(userId) {
    return DocumentService.listForUser(userId, { parentType: 'talent_profile' });
  },

  create(userId, body, actor) {
    return DocumentService.create(userId, { ...body, parentType: 'talent_profile' }, actor);
  },

  update(userId, documentId, body, actor) {
    return DocumentService.update(userId, documentId, body, actor);
  },

  delete(userId, documentId, actor) {
    return DocumentService.delete(userId, documentId, actor);
  },
};

/** Backward-compatible export — delegates to CredentialPlatformService. */
export const CredentialService = {
  listForUser: (userId) => CredentialPlatformService.listForUser(userId),
  getById: (userId, id) => CredentialPlatformService.getById(userId, id),
};
