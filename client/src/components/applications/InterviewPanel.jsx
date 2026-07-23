import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const MODES = ['video', 'phone', 'in_person', 'other'];

function toLocalInput(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function InterviewPanel({ interview = {}, onSave, disabled }) {
  const { t } = useTranslation(['applications']);
  const [scheduledAt, setScheduledAt] = useState(toLocalInput(interview.scheduledAt));
  const [mode, setMode] = useState(interview.mode || 'video');
  const [location, setLocation] = useState(interview.location || '');
  const [meetingUrl, setMeetingUrl] = useState(interview.meetingUrl || '');
  const [notes, setNotes] = useState(interview.notes || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setScheduledAt(toLocalInput(interview.scheduledAt));
    setMode(interview.mode || 'video');
    setLocation(interview.location || '');
    setMeetingUrl(interview.meetingUrl || '');
    setNotes(interview.notes || '');
  }, [interview]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      await onSave({
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        mode,
        location,
        meetingUrl,
        notes,
      });
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.error || t('applications:tracker.interviewError'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid sm:grid-cols-2 gap-3">
      <div>
        <label htmlFor="interview-at" className="block text-sm font-medium mb-1">{t('applications:tracker.interviewAt')}</label>
        <input id="interview-at" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)}
          disabled={disabled || busy} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm min-h-[44px]" />
      </div>
      <div>
        <label htmlFor="interview-mode" className="block text-sm font-medium mb-1">{t('applications:tracker.interviewMode')}</label>
        <select id="interview-mode" value={mode} onChange={(e) => setMode(e.target.value)} disabled={disabled || busy}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm min-h-[44px]">
          {MODES.map((m) => <option key={m} value={m}>{t(`applications:interviewModes.${m}`)}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="interview-location" className="block text-sm font-medium mb-1">{t('applications:tracker.interviewLocation')}</label>
        <input id="interview-location" value={location} onChange={(e) => setLocation(e.target.value)} disabled={disabled || busy}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm min-h-[44px]" />
      </div>
      <div>
        <label htmlFor="interview-url" className="block text-sm font-medium mb-1">{t('applications:tracker.meetingUrl')}</label>
        <input id="interview-url" type="url" value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} disabled={disabled || busy}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm min-h-[44px]" />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="interview-notes" className="block text-sm font-medium mb-1">{t('applications:tracker.interviewNotes')}</label>
        <textarea id="interview-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} disabled={disabled || busy}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm" />
      </div>
      {error ? <p className="sm:col-span-2 text-sm text-red-600" role="alert">{error}</p> : null}
      {saved ? <p className="sm:col-span-2 text-sm text-emerald-600" role="status">{t('applications:tracker.interviewSaved')}</p> : null}
      <div className="sm:col-span-2">
        <button type="submit" disabled={disabled || busy}
          className="px-3 py-2 rounded-lg bg-primary text-white text-sm font-medium min-h-[44px] disabled:opacity-50">
          {t('applications:tracker.saveInterview')}
        </button>
      </div>
    </form>
  );
}
