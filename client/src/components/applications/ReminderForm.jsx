import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export function ReminderForm({ onAdd, disabled }) {
  const { t } = useTranslation(['applications']);
  const [title, setTitle] = useState('');
  const [remindAt, setRemindAt] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    if (!title.trim() || !remindAt) return;
    setBusy(true);
    setError('');
    try {
      await onAdd({ title: title.trim(), remindAt: new Date(remindAt).toISOString() });
      setTitle('');
      setRemindAt('');
    } catch (err) {
      setError(err.response?.data?.error || t('applications:tracker.reminderError'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid sm:grid-cols-2 gap-3 mt-4">
      <div className="sm:col-span-2">
        <label htmlFor="reminder-title" className="block text-sm font-medium mb-1">{t('applications:tracker.reminderTitle')}</label>
        <input
          id="reminder-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={disabled || busy}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm min-h-[44px]"
          required
        />
      </div>
      <div>
        <label htmlFor="reminder-at" className="block text-sm font-medium mb-1">{t('applications:tracker.remindAt')}</label>
        <input
          id="reminder-at"
          type="datetime-local"
          value={remindAt}
          onChange={(e) => setRemindAt(e.target.value)}
          disabled={disabled || busy}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm min-h-[44px]"
          required
        />
      </div>
      <div className="flex items-end">
        <button
          type="submit"
          disabled={disabled || busy}
          className="px-3 py-2 rounded-lg border border-primary text-primary dark:text-mint text-sm font-medium min-h-[44px] disabled:opacity-50"
        >
          {t('applications:tracker.addReminder')}
        </button>
      </div>
      {error ? <p className="sm:col-span-2 text-sm text-red-600" role="alert">{error}</p> : null}
    </form>
  );
}
