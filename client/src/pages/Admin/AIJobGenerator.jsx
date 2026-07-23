import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SeoHead } from '../../components/seo';
import { aiJobApi } from '../../services/listingsService';
import { useToast } from '../../context/ToastContext';
import { AdminErrorBoundary, normalizeGenerateResult } from '../../components/admin/AdminErrorBoundary';
import { AdminRouteGuard } from '../../components/admin/AdminRouteGuard';
import { PERMISSIONS } from '../../config/rbac';

function AIJobGeneratorForm() {
  const { t } = useTranslation(['admin', 'common', 'employer']);
  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [location, setLocation] = useState('');
  const [skills, setSkills] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error(t('admin:titleRequired'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await aiJobApi.generate({
        title: title.trim(),
        organization: organization.trim() || undefined,
        location: location.trim() || undefined,
        skills: skills.trim() ? skills.split(/[,;]/).map((s) => s.trim()).filter(Boolean) : undefined,
      });
      const normalized = normalizeGenerateResult(data);
      if (!normalized || !normalized.description) {
        setError(t('admin:generationFailed'));
        toast.error(t('admin:generationFailed'));
        return;
      }
      setResult(normalized);
      toast.success(t('admin:generationSuccess'));
    } catch (err) {
      const msg = err.response?.data?.error || t('admin:generationFailed');
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SeoHead title={t('admin:aiJobGenerator')} description={t('admin:aiJobSeoDesc')} noindex />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('admin:aiJobHeading')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{t('admin:aiJobIntro')}</p>

        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleGenerate} className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('admin:jobTitleRequired')}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('admin:jobTitlePlaceholder')}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('admin:organizationCompany')}</label>
            <input
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder={t('admin:organizationPlaceholder')}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('admin:locationProvince')}</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t('admin:locationPlaceholder')}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('employer:skillsCommaSeparated')}</label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder={t('admin:skillsPlaceholder')}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-primary hover:bg-primary-hover text-white btn-theme px-4 py-2 font-medium disabled:opacity-50"
          >
            {loading ? t('admin:generating') : t('admin:generateDescription')}
          </button>
        </form>

        {loading && (
          <p className="text-gray-500 dark:text-gray-400 animate-pulse mb-4">{t('admin:generating')}</p>
        )}

        {result && !loading && (
          <div className="space-y-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('admin:generatedEditable')}</h2>
            {result.summary && (
              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">{t('admin:summary')}</label>
                <p className="text-gray-700 dark:text-gray-300">{result.summary}</p>
              </div>
            )}
            <div>
              <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">{t('common:description')}</label>
              <textarea
                readOnly
                value={result.description}
                rows={14}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2 text-sm font-mono"
              />
            </div>
            {result.suggested && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin:suggestedFields')}</p>
                <pre className="text-xs mt-1 text-gray-600 dark:text-gray-300 overflow-auto">{JSON.stringify(result.suggested, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default function AIJobGenerator() {
  return (
    <AdminRouteGuard permission={PERMISSIONS.CONTENT_JOBS}>
      <AdminErrorBoundary>
        <AIJobGeneratorForm />
      </AdminErrorBoundary>
    </AdminRouteGuard>
  );
}
