import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { talentApi } from '../../services/talentApi';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { FormField } from '../../components/common/FormField';
import { inputClass } from './TalentProfileForm';

const DOC_TYPES = ['resume', 'cover_letter', 'certificate', 'portfolio', 'transcript', 'other'];

export function DocumentsPanel({ profileLoaded }) {
  const { t } = useTranslation(['talent', 'common']);
  const { toast } = useToast();
  const fileRef = useRef(null);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [label, setLabel] = useState('');
  const [documentType, setDocumentType] = useState('other');

  const load = useCallback(() => {
    if (!profileLoaded) return;
    setLoading(true);
    talentApi
      .listDocuments()
      .then(({ data }) => setDocs(data || []))
      .catch(() => toast.error(t('talent:documents.error')))
      .finally(() => setLoading(false));
  }, [profileLoaded, t, toast]);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('resume', file);
      fd.append('label', label || file.name);
      fd.append('documentType', documentType);
      await talentApi.uploadDocument(fd);
      toast.success(t('talent:documents.uploadSuccess'));
      setLabel('');
      if (fileRef.current) fileRef.current.value = '';
      load();
    } catch {
      toast.error(t('talent:documents.error'));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('talent:documents.deleteConfirm'))) return;
    try {
      await talentApi.deleteDocument(id);
      toast.success(t('talent:documents.deleteSuccess'));
      load();
    } catch {
      toast.error(t('talent:documents.error'));
    }
  };

  const fileUrl = (doc) => doc.metadata?.fileUrl;

  if (loading) {
    return <p className="text-sm text-gray-500">{t('common:loading')}</p>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('talent:documents.title')}</h2>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <FormField label={t('talent:documents.label')} id="doc-label">
            <input id="doc-label" className={inputClass} value={label} onChange={(e) => setLabel(e.target.value)} />
          </FormField>
          <FormField label={t('talent:documents.type')} id="doc-type">
            <select id="doc-type" className={inputClass} value={documentType} onChange={(e) => setDocumentType(e.target.value)}>
              {DOC_TYPES.map((dt) => (
                <option key={dt} value={dt}>{t(`talent:documents.types.${dt}`)}</option>
              ))}
            </select>
          </FormField>
        </div>
        <Button
          type="button"
          disabled={uploading || !profileLoaded}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? t('common:loading') : t('talent:documents.upload')}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="sr-only"
          onChange={handleUpload}
          disabled={uploading || !profileLoaded}
        />
      </div>

      {docs.length === 0 ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">{t('talent:documents.empty')}</p>
      ) : (
        <ul className="space-y-3">
          {docs.map((doc) => (
            <li key={doc._id} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{doc.label}</p>
                <p className="text-xs text-gray-500">{t(`talent:documents.types.${doc.documentType}`)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {fileUrl(doc) && (
                  <a
                    href={fileUrl(doc)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center min-h-[44px] px-4 text-sm font-medium text-primary hover:underline"
                  >
                    {t('talent:documents.download')}
                  </a>
                )}
                <Button type="button" variant="outline" onClick={() => handleDelete(doc._id)}>{t('talent:documents.delete')}</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
