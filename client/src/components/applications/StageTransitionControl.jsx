import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export function StageTransitionControl({ currentStage, allowedTransitions = [], onTransition, disabled }) {
  const { t } = useTranslation(['applications']);
  const [toStage, setToStage] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!toStage) return;
    setBusy(true);
    setError('');
    try {
      await onTransition({ toStage, reason });
      setToStage('');
      setReason('');
    } catch (err) {
      setError(err.response?.data?.error || t('applications:tracker.stageError'));
    } finally {
      setBusy(false);
    }
  }

  if (!allowedTransitions.length) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t('applications:tracker.noTransitions')}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {t('applications:tracker.current')}:{' '}
        <strong className="text-gray-900 dark:text-white">
          {t(`applications:stages.${currentStage}`, { defaultValue: currentStage })}
        </strong>
      </p>
      <div>
        <label htmlFor="stage-to" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('applications:tracker.moveTo')}
        </label>
        <select
          id="stage-to"
          value={toStage}
          onChange={(e) => setToStage(e.target.value)}
          disabled={disabled || busy}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm min-h-[44px]"
          required
        >
          <option value="">{t('applications:tracker.selectStage')}</option>
          {allowedTransitions.map((s) => (
            <option key={s} value={s}>{t(`applications:stages.${s}`)}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="stage-reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('applications:tracker.reason')}
        </label>
        <input
          id="stage-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={disabled || busy}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm min-h-[44px]"
          maxLength={500}
        />
      </div>
      {error ? <p className="text-sm text-red-600 dark:text-red-400" role="alert">{error}</p> : null}
      <button
        type="submit"
        disabled={disabled || busy || !toStage}
        className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium min-h-[44px] disabled:opacity-50"
      >
        {busy ? t('applications:tracker.saving') : t('applications:tracker.updateStage')}
      </button>
    </form>
  );
}
