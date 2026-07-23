import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SeoHead } from '../../components/seo';
import { ROUTES } from '../../constants';
import { supportApi } from '../../services/listingsService';
import { useAuth } from '../../context/AuthContext';
import { Alert } from '../../components/ui/Alerts';

export default function SupportTickets() {
  const { t } = useTranslation(['static', 'common']);
  const { isAuthenticated } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '', category: 'other', website: '' });
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);
    try {
      const res = await supportApi.submit(form);
      setStatus('success');
      setForm({ name: '', email: '', subject: '', message: '', category: 'other', website: '' });
      if (res.data?.ticketNumber) setStatus(`success:${res.data.ticketNumber}`);
    } catch {
      setStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  const ticketNumber = status?.startsWith('success:') ? status.split(':')[1] : null;

  return (
    <>
      <SeoHead title={t('static:supportTicketTitle')} description={t('static:supportTicketIntro')} noindex />
      <div className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('static:supportTicketTitle')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{t('static:supportTicketIntro')}</p>

        {ticketNumber && <Alert variant="success" className="mb-4">{t('static:supportTicketSuccess', { number: ticketNumber })}</Alert>}
        {status === 'error' && <Alert variant="error" className="mb-4">{t('static:supportTicketError')}</Alert>}

        <form onSubmit={submit} className="space-y-4 p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <input type="text" name="website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="hidden" tabIndex={-1} autoComplete="off" />
          {!isAuthenticated && (
            <>
              <input required className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-900" placeholder={t('static:contactFormName')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input required type="email" className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-900" placeholder={t('static:contactFormEmail')} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </>
          )}
          <input required className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-900" placeholder={t('static:contactFormSubject')} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          <select className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-800" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="account">Account</option>
            <option value="jobs">Jobs</option>
            <option value="payments">Payments</option>
            <option value="technical">Technical</option>
            <option value="other">Other</option>
          </select>
          <textarea required minLength={10} rows={5} className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-900" placeholder={t('static:contactFormMessage')} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-lg bg-primary text-white font-medium disabled:opacity-50">
            {submitting ? t('common:loading') : t('static:supportTicketSubmit')}
          </button>
        </form>
        <p className="mt-6 text-sm">
          <Link to={ROUTES.SUPPORT} className="text-primary dark:text-mint hover:underline">{t('static:supportBack')}</Link>
        </p>
      </div>
    </>
  );
}
