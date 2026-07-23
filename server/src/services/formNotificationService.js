/**
 * Form notification providers (C.7.0.2) — swappable abstraction.
 */

/** @typedef {Object} FormNotificationPayload
 * @property {object} form
 * @property {object} submission
 * @property {Record<string, unknown>} data
 */

/**
 * @param {FormNotificationPayload} payload
 */
export async function sendFormNotifications(payload) {
  const { form, submission, data } = payload;
  const notifications = form.notifications || {};

  if (notifications.sendAdminEmail !== false) {
    await sendAdminNotification({ form, submission, data, notifications });
  }

  const emailField = findEmailFromData(form, data);
  if (notifications.sendUserConfirmation && emailField) {
    await sendUserConfirmation({ form, submission, email: emailField, notifications });
  }
}

/**
 * @param {object} opts
 */
async function sendAdminNotification(opts) {
  const { form, submission, data, notifications } = opts;
  const { queueEmail } = await import('./automationService.js');
  const { sendFormAdminAlertEmail } = await import('./emailService.js');

  const adminTo = notifications.adminEmail || process.env.FORM_ADMIN_EMAIL || process.env.MAIL_FROM;
  if (!adminTo) return;

  const summary = Object.entries(data)
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
    .join('\n');

  sendFormAdminAlertEmail({
    to: adminTo,
    subject: notifications.adminSubject || `New submission: ${form.name}`,
    formName: form.name,
    submissionId: submission._id,
    summary,
  }).catch(() => {});

  queueEmail({
    to: adminTo,
    templateKey: 'formAdminAlert',
    vars: { formName: form.name, summary },
    dedupKey: `form:admin:${submission._id}`,
  }).catch(() => {});

  const { notifyStaff } = await import('./notificationService.js');
  notifyStaff({
    category: 'forms',
    type: 'form.submission',
    title: `New ${form.name} submission`,
    body: summary.slice(0, 200),
    link: '/admin/forms/submissions',
    metadata: { formId: form._id, submissionId: submission._id },
  }).catch(() => {});
}

/**
 * @param {object} opts
 */
async function sendUserConfirmation(opts) {
  const { form, submission, email, notifications } = opts;
  const { queueEmail } = await import('./automationService.js');
  queueEmail({
    to: email,
    templateKey: 'formConfirmation',
    vars: {
      formName: form.name,
      message: form.successMessage,
    },
    dedupKey: `form:confirm:${submission._id}`,
  }).catch(() => {});

  const { sendEmail } = await import('./emailService.js');
  sendEmail({
    to: email,
    subject: notifications.userSubject || `We received your ${form.name} submission`,
    html: `<p>${form.successMessage || 'Thank you for your submission.'}</p>`,
    text: form.successMessage || 'Thank you for your submission.',
  }).catch(() => {});
}

/**
 * @param {object} form
 * @param {Record<string, unknown>} data
 */
function findEmailFromData(form, data) {
  const emailField = (form.fields || []).find((f) => f.type === 'email');
  if (emailField && data[emailField.name]) return String(data[emailField.name]);
  for (const val of Object.values(data)) {
    if (typeof val === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return val;
  }
  return null;
}
