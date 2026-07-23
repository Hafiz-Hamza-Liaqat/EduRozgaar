import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { talentApi } from '../../services/talentApi';
import { shouldUseTalentProfileApi } from '../../config/careerFeatureFlags';

/**
 * Select a ProfileDocument from TalentProfile for application attach (C.8.0.3B).
 */
export function DocumentPicker({ value, onChange, disabled = false, id = 'application-document-picker' }) {
  const { t } = useTranslation(['applications', 'common']);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!shouldUseTalentProfileApi()) return;
    setLoading(true);
    talentApi
      .listDocuments()
      .then(({ data }) => setDocuments(Array.isArray(data) ? data : []))
      .catch(() => setDocuments([]))
      .finally(() => setLoading(false));
  }, []);

  if (!shouldUseTalentProfileApi()) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400" id={id}>
        {t('applications:create.talentProfileDisabled')}
      </p>
    );
  }

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {t('applications:create.selectDocument')}
      </label>
      <select
        id={id}
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={disabled || loading}
        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
        aria-describedby={`${id}-hint`}
      >
        <option value="">{loading ? t('common:loading') : t('applications:create.noDocument')}</option>
        {documents.map((doc) => (
          <option key={doc._id} value={doc._id}>
            {doc.label || doc.documentType}
          </option>
        ))}
      </select>
      <p id={`${id}-hint`} className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        {t('applications:create.documentHint')}
      </p>
    </div>
  );
}
