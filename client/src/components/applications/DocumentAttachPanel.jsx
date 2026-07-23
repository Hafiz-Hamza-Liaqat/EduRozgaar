import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DocumentPicker } from './DocumentPicker';

export function DocumentAttachPanel({ onAttach, onRemove, documents = [], disabled }) {
  const { t } = useTranslation(['applications']);
  const [documentId, setDocumentId] = useState(null);
  const [role, setRole] = useState('resume');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function attach(e) {
    e.preventDefault();
    if (!documentId) return;
    setBusy(true);
    setError('');
    try {
      await onAttach({ documentId, role });
      setDocumentId(null);
    } catch (err) {
      setError(err.response?.data?.error || t('applications:tracker.attachError'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {documents.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('applications:detail.noDocuments')}</p>
      ) : (
        <ul className="space-y-2" role="list">
          {documents.map((doc) => (
            <li key={doc._id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-gray-800 dark:text-gray-200">
                {doc.label || t(`applications:documentRoles.${doc.role}`, { defaultValue: doc.role })}
              </span>
              <span className="flex gap-3">
                {doc.url ? (
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-primary dark:text-mint hover:underline">
                    {t('applications:detail.openDocument')}
                  </a>
                ) : null}
                {onRemove ? (
                  <button
                    type="button"
                    disabled={disabled || busy}
                    onClick={() => onRemove(doc._id)}
                    className="text-red-600 dark:text-red-400 hover:underline text-xs"
                  >
                    {t('applications:tracker.remove')}
                  </button>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={attach} className="space-y-3 border-t border-gray-100 dark:border-gray-700 pt-4">
        <DocumentPicker value={documentId} onChange={setDocumentId} disabled={disabled || busy} />
        <div>
          <label htmlFor="doc-role" className="block text-sm font-medium mb-1">{t('applications:tracker.documentRole')}</label>
          <select
            id="doc-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm min-h-[44px]"
          >
            {['resume', 'cover_letter', 'transcript', 'portfolio', 'certificate', 'other'].map((r) => (
              <option key={r} value={r}>{t(`applications:documentRoles.${r}`)}</option>
            ))}
          </select>
        </div>
        {error ? <p className="text-sm text-red-600" role="alert">{error}</p> : null}
        <button
          type="submit"
          disabled={disabled || busy || !documentId}
          className="px-3 py-2 rounded-lg border border-primary text-primary dark:text-mint text-sm font-medium min-h-[44px] disabled:opacity-50"
        >
          {t('applications:tracker.attachDocument')}
        </button>
      </form>
    </div>
  );
}
