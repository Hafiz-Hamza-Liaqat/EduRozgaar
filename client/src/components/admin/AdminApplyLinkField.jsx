import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const inputClass =
  'w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm';

export function AdminApplyLinkField({ label, hint, value, onChange, id, required = false }) {
  const { t } = useTranslation(['admin', 'common']);

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label || t('admin:applyLinkLabel')}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        id={id}
        type="url"
        inputMode="url"
        placeholder={t('admin:applyLinkPlaceholder')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
      {hint && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

export function AdminApplyLinkEditor({ value, onSave, saving }) {
  const { t } = useTranslation(['admin', 'common']);
  const [link, setLink] = useState(value || '');

  useEffect(() => {
    setLink(value || '');
  }, [value]);

  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full">
      <input
        type="url"
        inputMode="url"
        placeholder={t('admin:applyLinkPlaceholder')}
        value={link}
        onChange={(e) => setLink(e.target.value)}
        className={`${inputClass} sm:flex-1 min-w-0`}
      />
      <button
        type="button"
        onClick={() => onSave(link.trim())}
        disabled={saving}
        className="px-3 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover disabled:opacity-50 shrink-0"
      >
        {saving ? t('common:saving') : t('admin:saveApplyLink')}
      </button>
    </div>
  );
}
