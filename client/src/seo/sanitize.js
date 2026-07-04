/**
 * Sanitize strings for safe JSON-LD embedding (prevents script breakout via </script>).
 */
export function sanitizeJsonLdString(value, maxLength = 5000) {
  if (value == null) return undefined;
  const str = typeof value === 'object' ? (value.name || value.email || String(value)) : String(value);
  const cleaned = str
    .replace(/<\/script/gi, '<\\/script')
    .split('')
    .filter((ch) => {
      const code = ch.charCodeAt(0);
      return (code >= 32 && code !== 127) || code === 10 || code === 13;
    })
    .join('')
    .trim()
    .slice(0, maxLength);
  return cleaned || undefined;
}

export function safeJsonLd(data) {
  return JSON.stringify(data)
    .replace(/<\/script/gi, '<\\/script')
    .replace(/\u2028|\u2029/g, '');
}
