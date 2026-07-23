import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export function NoteComposer({ onAdd, disabled }) {
  const { t } = useTranslation(['applications']);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    setError('');
    try {
      await onAdd({ body: body.trim() });
      setBody('');
    } catch (err) {
      setError(err.response?.data?.error || t('applications:tracker.noteError'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2 mt-4">
      <label htmlFor="note-body" className="sr-only">{t('applications:tracker.addNote')}</label>
      <textarea
        id="note-body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        disabled={disabled || busy}
        placeholder={t('applications:tracker.notePlaceholder')}
        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
      />
      {error ? <p className="text-sm text-red-600" role="alert">{error}</p> : null}
      <button
        type="submit"
        disabled={disabled || busy || !body.trim()}
        className="px-3 py-2 rounded-lg border border-primary text-primary dark:text-mint text-sm font-medium min-h-[44px] disabled:opacity-50"
      >
        {t('applications:tracker.addNote')}
      </button>
    </form>
  );
}
