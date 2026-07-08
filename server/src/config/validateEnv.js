const INSECURE_JWT_SECRETS = new Set([
  'change-me-in-production',
  'your-super-secret-jwt-key-change-in-production',
  'dev-only-jwt-secret-min-32-characters-long',
]);

export function validateProductionEnv() {
  if (process.env.NODE_ENV !== 'production') return;

  const secret = process.env.JWT_SECRET;
  if (!secret || INSECURE_JWT_SECRETS.has(secret) || secret.length < 32) {
    console.error('\n❌ FATAL: Set JWT_SECRET to a random string of at least 32 characters in production.');
    console.error('   Generate one: openssl rand -hex 32\n');
    process.exit(1);
  }

  if (!process.env.SITE_URL) {
    console.error('\n❌ FATAL: Set SITE_URL in production (e.g. https://yourdomain.com).\n');
    process.exit(1);
  }
}
