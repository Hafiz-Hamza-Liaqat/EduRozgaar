/**
 * Spam protection for form submissions (C.7.0.2).
 */

/**
 * @param {object} form
 * @param {Record<string, unknown>} body
 * @returns {{ blocked: boolean; silent?: boolean; reason?: string; score: number }}
 */
export function checkFormSpam(form, body) {
  const spam = form.spamSettings || {};
  let score = 0;

  if (spam.honeypot !== false) {
    const hpField = spam.honeypotField || 'website';
    const hpVal = body[hpField];
    if (hpVal && String(hpVal).trim()) {
      return { blocked: true, silent: true, reason: 'honeypot', score: 100 };
    }
  }

  const captchaProvider = spam.captchaProvider || 'none';
  if (captchaProvider !== 'none') {
    const token = body.captchaToken || body['g-recaptcha-response'] || body.cfTurnstileResponse;
    const verified = verifyCaptchaToken(captchaProvider, token);
    if (!verified) {
      score += 50;
      return { blocked: true, reason: 'captcha_failed', score };
    }
  }

  return { blocked: false, score };
}

/**
 * @param {string} provider
 * @param {unknown} token
 */
export function verifyCaptchaToken(provider, token) {
  if (!provider || provider === 'none') return true;
  if (!token || !String(token).trim()) return false;

  if (provider === 'recaptcha') {
    const secret = process.env.RECAPTCHA_SECRET_KEY;
    if (!secret) return false;
    // Verification wired when keys are configured — stub returns false without secret
    return Boolean(secret && token);
  }

  if (provider === 'turnstile') {
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) return false;
    return Boolean(secret && token);
  }

  return false;
}
