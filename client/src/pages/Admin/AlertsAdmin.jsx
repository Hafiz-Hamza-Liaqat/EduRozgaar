import { useState } from 'react';
import { AdminSelectBare } from '../../components/admin/AdminFormFields';
import { useTranslation } from 'react-i18next';
import { SeoHead } from '../../components/seo';
import { v1Api } from '../../services/listingsService';
import { PROVINCES } from '../../constants/profileOptions';
import { JOB_CATEGORIES } from '../../constants/listings';
import { AdminRouteGuard } from '../../components/admin/AdminRouteGuard';
import { PERMISSIONS } from '../../config/rbac';

export default function AlertsAdmin() {
  const { t } = useTranslation(['admin', 'common']);
  const [province, setProvince] = useState('');
  const [interest, setInterest] = useState('');
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [channel, setChannel] = useState('telegram');

  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const body = { province: province || undefined, interest: interest || undefined, message, title };
      const res = channel === 'telegram'
        ? await v1Api.alertsTelegram(body)
        : await v1Api.alertsWhatsApp(body);
      setResult(res.data);
    } catch (err) {
      setResult({ error: err.response?.data?.error || err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminRouteGuard permission={PERMISSIONS.NOTIFICATIONS_SEND}>
      <SeoHead title={t('admin:alerts')} description={t('admin:alertsSeoDesc')} noindex />
      <div className="max-w-xl">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('admin:multiChannelAlerts')}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('admin:alertsIntro')}</p>
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('admin:channel')}</label>
            <AdminSelectBare
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2"
            >
              <option value="telegram">{t('admin:channelTelegram')}</option>
              <option value="whatsapp">{t('admin:channelWhatsApp')}</option>
            </AdminSelectBare>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('admin:provinceOptional')}</label>
            <AdminSelectBare
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2"
            >
              <option value="">{t('common:all')}</option>
              {PROVINCES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </AdminSelectBare>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('admin:interestOptional')}</label>
            <AdminSelectBare
              value={interest}
              onChange={(e) => setInterest(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2"
            >
              <option value="">{t('common:all')}</option>
              {JOB_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </AdminSelectBare>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common:title')}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2"
              placeholder={t('admin:alertTitlePlaceholder')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common:description')}</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2"
              placeholder={t('admin:alertMessagePlaceholder')}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover btn-theme disabled:opacity-50"
          >
            {loading ? t('admin:sending') : (channel === 'telegram' ? t('admin:sendTelegramAlert') : t('admin:sendWhatsAppAlert'))}
          </button>
        </form>
        {result && (
          <div className={`mt-6 p-4 rounded-lg ${result.error ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'}`}>
            <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>
    </AdminRouteGuard>
  );
}
