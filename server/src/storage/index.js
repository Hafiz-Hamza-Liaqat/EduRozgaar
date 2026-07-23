import { localStorageProvider } from './LocalStorageProvider.js';
import { supabaseStorageProvider } from './SupabaseStorageProvider.js';
import { s3StorageProvider } from './S3StorageProvider.js';

const providers = {
  local: localStorageProvider,
  supabase: supabaseStorageProvider,
  s3: s3StorageProvider,
};

/**
 * @param {string} [override]
 * @returns {import('./StorageProvider.js').StorageProvider}
 */
export function getStorageProvider(override) {
  const name = (override || process.env.MEDIA_STORAGE_PROVIDER || 'local').toLowerCase();
  const provider = providers[name];
  if (!provider) return localStorageProvider;
  if (!override && !provider.isConfigured() && name !== 'local') {
    return localStorageProvider;
  }
  return provider;
}

export { localStorageProvider, supabaseStorageProvider, s3StorageProvider };
