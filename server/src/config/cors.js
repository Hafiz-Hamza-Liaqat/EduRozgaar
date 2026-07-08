/**
 * CORS configuration — restrict origins in production to SITE_URL / FRONTEND_URL.
 */
function normalizeOrigin(url) {
  if (!url || typeof url !== 'string') return null;
  return url.replace(/\/$/, '');
}

export function getCorsOptions() {
  const production = process.env.NODE_ENV === 'production';
  const allowed = [
    normalizeOrigin(process.env.SITE_URL),
    normalizeOrigin(process.env.FRONTEND_URL),
    normalizeOrigin(process.env.APP_URL),
    !production ? 'http://localhost:5173' : null,
    !production ? 'http://127.0.0.1:5173' : null,
    !production ? 'http://localhost' : null,
  ].filter(Boolean);

  const unique = [...new Set(allowed)];

  return {
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      const normalized = normalizeOrigin(origin);
      if (unique.includes(normalized)) return callback(null, true);
      if (!production) return callback(null, true);
      callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  };
}
