const DANGEROUS_EXTENSIONS = new Set([
  'exe', 'bat', 'cmd', 'com', 'msi', 'scr', 'ps1', 'vbs', 'js', 'mjs', 'cjs',
  'php', 'phtml', 'asp', 'aspx', 'jsp', 'sh', 'bash', 'html', 'htm', 'svg', 'xml',
]);

/** Map detected MIME to safe file extension (never trust user extension). */
const MIME_TO_EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/x-icon': '.ico',
  'image/vnd.microsoft.icon': '.ico',
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
};

/** Magic-byte MIME sniffing (no external dependency). */
export function sniffMime(buffer) {
  if (!buffer?.length) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'image/png';
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return 'image/gif';
  if (buffer.length >= 12 && buffer.slice(0, 4).toString('ascii') === 'RIFF' && buffer.slice(8, 12).toString('ascii') === 'WEBP') {
    return 'image/webp';
  }
  if (buffer.slice(0, 4).toString('ascii') === '%PDF') return 'application/pdf';
  if (buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  if (buffer.length >= 4 && buffer[0] === 0x00 && buffer[1] === 0x00 && buffer[2] === 0x01 && buffer[3] === 0x00) {
    return 'image/x-icon';
  }
  return null;
}

export function rejectDangerousFilename(originalname) {
  if (!originalname || typeof originalname !== 'string') return;
  const normalized = originalname.replace(/\\/g, '/');
  if (normalized.includes('..') || normalized.includes('\0')) {
    const err = new Error('Invalid filename');
    err.status = 400;
    throw err;
  }
  const parts = normalized.toLowerCase().split('.');
  if (parts.length > 2) {
    for (const part of parts.slice(1)) {
      if (DANGEROUS_EXTENSIONS.has(part)) {
        const err = new Error('File type not allowed');
        err.status = 400;
        throw err;
      }
    }
  }
  const ext = parts.length > 1 ? parts[parts.length - 1] : '';
  if (DANGEROUS_EXTENSIONS.has(ext)) {
    const err = new Error('File type not allowed');
    err.status = 400;
    throw err;
  }
}

export function extensionFromMime(mimetype) {
  return MIME_TO_EXT[mimetype] || null;
}

/**
 * Validate image buffer: magic bytes must match declared MIME; SVG rejected.
 */
export async function validateImageBuffer(buffer, declaredMime) {
  rejectDangerousFilename('upload');
  if (!buffer?.length) {
    const err = new Error('Empty file');
    err.status = 400;
    throw err;
  }
  if (buffer.length > 5 * 1024 * 1024) {
    const err = new Error('File too large (max 5MB)');
    err.status = 400;
    throw err;
  }

  const detected = sniffMime(buffer);
  const allowed = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon']);

  if (declaredMime === 'image/svg+xml' || detected === 'image/svg+xml') {
    const err = new Error('SVG uploads are not allowed');
    err.status = 400;
    throw err;
  }

  const mime = detected || declaredMime;
  if (!mime || !allowed.has(mime)) {
    const err = new Error('Invalid image file');
    err.status = 400;
    throw err;
  }
  if (detected && declaredMime && detected !== declaredMime) {
    const err = new Error('File content does not match declared type');
    err.status = 400;
    throw err;
  }
  return mime;
}

/**
 * Validate resume buffer: PDF or DOCX only, magic-byte verified.
 */
export async function validateResumeBuffer(buffer, declaredMime) {
  rejectDangerousFilename('upload');
  if (!buffer?.length) {
    const err = new Error('Empty file');
    err.status = 400;
    throw err;
  }
  if (buffer.length > 5 * 1024 * 1024) {
    const err = new Error('File too large (max 5MB)');
    err.status = 400;
    throw err;
  }

  const detected = sniffMime(buffer);
  const allowed = new Set([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]);

  const mime = detected || declaredMime;
  if (!mime || !allowed.has(mime)) {
    const err = new Error('Only PDF and DOCX files are allowed');
    err.status = 400;
    throw err;
  }
  if (detected && declaredMime && detected !== declaredMime) {
    const err = new Error('File content does not match declared type');
    err.status = 400;
    throw err;
  }
  return mime;
}
