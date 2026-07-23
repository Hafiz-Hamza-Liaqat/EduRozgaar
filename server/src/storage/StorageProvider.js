/**
 * Storage provider interface (C.7.0.1).
 * @typedef {Object} StorageUploadResult
 * @property {string} url Public URL
 * @property {string} key Storage key/path
 * @property {string} [provider]
 */

/**
 * @typedef {Object} StorageProvider
 * @property {string} name
 * @property {(opts: { buffer: Buffer; filename: string; folder: string; mimetype: string }) => Promise<StorageUploadResult>} upload
 * @property {(opts: { key: string }) => Promise<void>} delete
 * @property {() => boolean} isConfigured
 */

export class StorageProviderError extends Error {
  constructor(message, code = 'STORAGE_ERROR') {
    super(message);
    this.code = code;
  }
}
